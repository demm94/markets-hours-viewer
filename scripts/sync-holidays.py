"""
scripts/sync-holidays.py
Automated market holiday and early-close synchronization powered by exchange_calendars,
enriched with Chilean public holidays (api.boostr.cl) and curated overrides/labels.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import exchange_calendars as xcals
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
HOLIDAYS_FILE = ROOT_DIR / "src" / "data" / "holidays.json"
META_FILE = ROOT_DIR / "src" / "data" / "calendar-meta.json"
OVERRIDES_FILE = ROOT_DIR / "scripts" / "holiday-overrides.json"

RETENTION_DAYS = 365

EXCHANGES: list[dict[str, str]] = [
    {
        "marketId": "nyse",
        "mic": "XNYS",
        "timezone": "America/New_York",
        "regularClose": "16:00",
    },
    {
        "marketId": "sse",
        "mic": "XSHG",
        "timezone": "Asia/Shanghai",
        "regularClose": "15:00",
    },
    {
        "marketId": "twse",
        "mic": "XTAI",
        "timezone": "Asia/Taipei",
        "regularClose": "13:30",
    },
    {
        "marketId": "krx",
        "mic": "XKRX",
        "timezone": "Asia/Seoul",
        "regularClose": "15:30",
    },
    {
        "marketId": "nse",
        "mic": "XBOM",
        "timezone": "Asia/Kolkata",
        "regularClose": "15:30",
    },
    {
        "marketId": "chile",
        "mic": "XSGO",
        "timezone": "America/Santiago",
        "regularClose": "16:00",
    },
]

GENERIC_OR_MISLEADING_EARLY_NAMES = {
    "Thanksgiving Day",
    "Christmas",
    "Cierre temprano",
    "Feriado bursátil",
}


def load_json_file(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default


def parse_iso_date(date_str: str) -> date | None:
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        return None


def fetch_boostr_chile_holidays(years: list[int]) -> dict[str, str]:
    """Fetch official Chilean civil holidays as optional Spanish name enrichment."""
    titles_by_date: dict[str, str] = {}
    for year in sorted(set(years)):
        url = f"https://api.boostr.cl/holidays/{year}.json"
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "markets-pwa-holiday-sync/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
                rows = payload.get("data", []) if isinstance(payload, dict) else payload
                if not isinstance(rows, list):
                    continue
                for row in rows:
                    if not isinstance(row, dict):
                        continue
                    d_str = str(row.get("date", "")).strip()
                    title = str(row.get("title") or row.get("name") or "").strip()
                    parsed = parse_iso_date(d_str)
                    if parsed and parsed.weekday() < 5 and title:
                        titles_by_date[d_str] = title
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            print(
                f"Warning: could not fetch Boostr Chile holidays for {year}: {exc}",
                file=sys.stderr,
            )
    return titles_by_date


def resolve_display_name(
    key: str,
    is_early_close: bool,
    name_map: dict[str, str],
    override_name: str | None,
    boostr_name: str | None,
    existing_name: str | None,
) -> str:
    if key in name_map and name_map[key].strip():
        return name_map[key].strip()

    if override_name and override_name.strip():
        return override_name.strip()

    if boostr_name and boostr_name.strip():
        return boostr_name.strip()

    if existing_name and existing_name.strip():
        candidate = existing_name.strip()
        if not (is_early_close and candidate in GENERIC_OR_MISLEADING_EARLY_NAMES):
            if candidate not in {"Cierre temprano", "Feriado bursátil"}:
                return candidate

    return "Cierre temprano" if is_early_close else "Feriado bursátil"


def main() -> int:
    today = date.today()
    for arg in sys.argv[1:]:
        if arg.startswith("--today="):
            parsed_arg = parse_iso_date(arg.split("=", 1)[1])
            if parsed_arg:
                today = parsed_arg

    start_date = max(date(2026, 1, 1), today - timedelta(days=RETENTION_DAYS))
    end_date = date(today.year + 1, 12, 31)

    overrides_payload = load_json_file(OVERRIDES_FILE, {})
    exclusions = set(overrides_payload.get("exclusions", []))
    name_map: dict[str, str] = overrides_payload.get("nameMap", {})
    raw_overrides: list[dict[str, Any]] = overrides_payload.get("overrides", [])

    overrides_by_key: dict[str, dict[str, Any]] = {}
    for ov in raw_overrides:
        if isinstance(ov, dict) and ov.get("marketId") and ov.get("date"):
            overrides_by_key[f"{ov['marketId']}:{ov['date']}"] = ov

    existing_holidays = load_json_file(HOLIDAYS_FILE, [])
    existing_names: dict[str, str] = {}
    for item in existing_holidays:
        if isinstance(item, dict) and item.get("marketId") and item.get("date") and item.get("name"):
            existing_names[f"{item['marketId']}:{item['date']}"] = str(item["name"])

    boostr_chile = fetch_boostr_chile_holidays(list(range(start_date.year, end_date.year + 1)))

    holiday_records: dict[str, dict[str, Any]] = {}
    meta_by_market: dict[str, dict[str, Any]] = {}

    print(
        f"Syncing holidays via exchange_calendars {xcals.__version__} "
        f"({start_date.isoformat()} .. {end_date.isoformat()})"
    )

    for ex in EXCHANGES:
        market_id = ex["marketId"]
        mic = ex["mic"]
        tz = ex["timezone"]
        regular_close = ex["regularClose"]

        cal = xcals.get_calendar(mic)
        cal_first = cal.first_session.date()
        cal_last = cal.last_session.date()

        cal_start = max(start_date, cal_first)
        cal_end = min(end_date, cal_last)

        if cal_start <= cal_end:
            sessions = cal.sessions_in_range(pd.Timestamp(cal_start), pd.Timestamp(cal_end))
            session_dates = {s.date() for s in sessions}

            cursor = cal_start
            while cursor <= cal_end:
                if cursor.weekday() < 5:
                    date_str = cursor.isoformat()
                    key = f"{market_id}:{date_str}"
                    if key not in exclusions:
                        if cursor not in session_dates:
                            holiday_records[key] = {
                                "marketId": market_id,
                                "date": date_str,
                                "name": resolve_display_name(
                                    key=key,
                                    is_early_close=False,
                                    name_map=name_map,
                                    override_name=None,
                                    boostr_name=boostr_chile.get(date_str) if market_id == "chile" else None,
                                    existing_name=existing_names.get(key),
                                ),
                            }
                        else:
                            close_ts = cal.session_close(pd.Timestamp(cursor))
                            if close_ts.tzinfo is None:
                                close_ts = close_ts.tz_localize("UTC")
                            local_close = close_ts.tz_convert(tz).strftime("%H:%M")
                            if local_close < regular_close:
                                holiday_records[key] = {
                                    "marketId": market_id,
                                    "date": date_str,
                                    "name": resolve_display_name(
                                        key=key,
                                        is_early_close=True,
                                        name_map=name_map,
                                        override_name=None,
                                        boostr_name=None,
                                        existing_name=existing_names.get(key),
                                    ),
                                    "isEarlyClose": True,
                                    "closeTime": local_close,
                                }
                cursor += timedelta(days=1)

        meta_by_market[market_id] = {
            "mic": mic,
            "calendarLastSession": cal_last.isoformat(),
            "count": 0,
            "minDate": None,
            "maxDate": None,
        }

    # Apply explicit overrides (fixes statutory rules & fills 2027 dates past calendar bounds)
    for key, ov in overrides_by_key.items():
        if key in exclusions:
            continue
        parsed_d = parse_iso_date(str(ov["date"]))
        if not parsed_d or parsed_d < start_date or parsed_d > end_date or parsed_d.weekday() >= 5:
            continue

        is_early = bool(ov.get("isEarlyClose"))
        close_time = str(ov.get("closeTime", "")).strip() if is_early else None
        record: dict[str, Any] = {
            "marketId": ov["marketId"],
            "date": ov["date"],
            "name": resolve_display_name(
                key=key,
                is_early_close=is_early,
                name_map=name_map,
                override_name=ov.get("name"),
                boostr_name=boostr_chile.get(ov["date"]) if ov["marketId"] == "chile" else None,
                existing_name=existing_names.get(key),
            ),
        }
        if is_early and close_time:
            record["isEarlyClose"] = True
            record["closeTime"] = close_time
        holiday_records[key] = record

    # Enforce exclusions and weekday-only invariant
    final_records: list[dict[str, Any]] = []
    for key, rec in holiday_records.items():
        if key in exclusions:
            continue
        parsed_d = parse_iso_date(rec["date"])
        if not parsed_d or parsed_d.weekday() >= 5:
            continue
        final_records.append(rec)

    final_records.sort(key=lambda r: (r["date"], r["marketId"]))

    for rec in final_records:
        m_meta = meta_by_market[rec["marketId"]]
        m_meta["count"] += 1
        if m_meta["minDate"] is None or rec["date"] < m_meta["minDate"]:
            m_meta["minDate"] = rec["date"]
        if m_meta["maxDate"] is None or rec["date"] > m_meta["maxDate"]:
            m_meta["maxDate"] = rec["date"]

    HOLIDAYS_FILE.write_text(
        json.dumps(final_records, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    existing_meta = load_json_file(META_FILE, {})
    if not isinstance(existing_meta, dict):
        existing_meta = {}
    existing_meta["holidays"] = {
        "generatedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "exchange_calendars+overrides",
        "exchangeCalendarsVersion": xcals.__version__,
        "window": {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
        },
        "totalCount": len(final_records),
        "byMarket": meta_by_market,
    }
    META_FILE.write_text(
        json.dumps(existing_meta, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(final_records)} weekday holiday records to {HOLIDAYS_FILE.relative_to(ROOT_DIR)}")
    for ex in EXCHANGES:
        m_id = ex["marketId"]
        info = meta_by_market[m_id]
        print(
            f"  - {m_id:<5} ({info['mic']}, cal_last={info['calendarLastSession']}): "
            f"{info['count']:>2} entries [{info['minDate']} .. {info['maxDate']}]"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
