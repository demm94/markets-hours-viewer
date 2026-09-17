# Feature: Neon Financial Redesign

**Workflow:** ODD (Organic Driven Development)
**Status:** implemented, all phases green, **committed as `5fefc36`**, and **native review APPROVED + acknowledged** (lineage `review-f4e1f1a75f27ef96`). See "Native review status" below.
**Created:** 2026-09-16

## Goal

Re-skin the whole UI/UX of `markets-pwa` to a **neon financial** visual language:
deep black base, luminous grid, cyan->violet gradient accents, colored (non-black)
shadows, glowing borders and bloom on data marks.

## Frozen decisions (user-owned)

| Decision | Choice |
| --- | --- |
| Visual direction | Neon financial (`#05060a` base, `#38bdf8` -> `#a855f7` accents, glow, bloom) |
| Scope order | Design system first (tokens + primitives), then each component in reviewable increments |
| Layout freedom | **Visual only** — structure, hierarchy and behavior stay as-is |
| Theming | **Dark-only** — single token set, no light mode, no theme toggle |

## Non-goals (all honoured)

- No changes to `src/core/*` logic. The only `core/` change is presentation metadata
  (`pwa-manifest.ts` colors) plus the manifest test assertion described in Phase 2 findings.
- No changes to hook behavior (`useCurrentTime`, `useScrubber`, `usePullToRefresh`).
- No layout restructuring, no new sections.
- No public component API changes.
- No new runtime dependencies.
- No light theme.

## Hard constraints

- **Preserve public component APIs**: `Badge` variants `default|secondary|destructive|outline|open|lunch|pre|closed` + `showDot`; `Card*` forwardRef divs; `Button` variants `default|destructive|outline|secondary|ghost|link|now|pill` + sizes `default|sm|lg|icon|compact` + `asChild`. Call sites compiled untouched.
- **60 FPS timeline scrubbing**: glow only via static `box-shadow` / `text-shadow`; animate `opacity`/`transform`/`scale` only. No `filter: blur()`, no `drop-shadow`, no `.neon-bloom` in the scrubbing path.
- **Touch targets >= 44px** preserved.
- **`prefers-reduced-motion`** global mute preserved.
- **Baseline stays green**: `npm run test` (25 tests) and `npm run build`.

## Tasks

### Phase 1 — Design system (tokens + primitives) — DONE

- [x] 1.1 Rework tokens + add neon utility layer in `src/index.css`
  - New base `#05060a`; cool-tinted borders; neon palette variables; updated `@theme` mapping so Tailwind utilities (`bg-card`, `border-border`, `text-muted-foreground`) pick up neon values.
  - New utilities: `.neon-grid` (brighter grid + cyan/violet radials), `.neon-edge`, `.neon-bloom`, `.neon-text`.
  - Glow delivered through `@theme` shadow tokens (`--shadow-neon`, `--shadow-neon-lg`, `--shadow-neon-violet`), not a `.neon-halo` class: `shadow-neon` etc. are real Tailwind utilities.
  - Keyframes `neon-breathe` (later removed, no consumer) and `neon-sheen` (used in Header).
  - Added neon scrollbar styling and a global `:focus-visible` ring (neither existed before).
  - `color-scheme: dark` added to `:root`; dead `@keyframes pulse-dot` removed (verified 0 references).
- [x] 1.2 `src/components/ui/card.tsx` -> neon surfaces (glass + luminous border + colored shadow)
- [x] 1.3 `src/components/ui/badge.tsx` -> every variant name kept, per-variant halo + dot bloom
- [x] 1.4 `src/components/ui/button.tsx` -> every variant and size kept, glow hover/active
- [x] 1.5 Verify Phase 1: `npm run test` + `npm run build`

### Phase 2 — Shell and Header — DONE

- [x] 2.1 `src/App.tsx` — neon background, pull-to-refresh chip, footer
- [x] 2.2 `src/components/Header.tsx` — neon header surface, gradient title, live clock treatment
- [x] 2.3 `index.html` `theme-color` + `src/core/pwa-manifest.ts` colors -> `#05060a`
- [x] 2.4 Verify Phase 2, then request user visual review before continuing

### Phase 3 — MarketCards — DONE

- [x] 3.1 `src/components/MarketCards.tsx`
  - Mobile condensed strip: per-status neon borders/fills/halos, bloom on status dots, `hover:border-border-strong`.
  - Desktop rich cards: per-status colored halo shadow and cyan/violet gradient tint; closed cards fall back to `Card`'s own `shadow-neon` + `bg-card`.
  - Disposed of the three live tailwind-merge overrides at line 159: `shadow-lg`, `transition-colors`, `rounded-xl`.
- [x] 3.2 Verify Phase 3

### Phase 4 — Timeline — DONE

- [x] 4.1 `src/components/TimelineGrid.tsx` — section to `bg-card` + `border-border` + `shadow-neon` + `neon-edge`; table well to `bg-muted`
- [x] 4.2 `src/components/timeline/TimelineBars.tsx` — grid base `bg-muted`, track `bg-white/[0.02]`, tooltips `bg-popover/95` + `shadow-neon`, emphasis line `border-border-strong`; consolidated the segment shadow to exactly ONE class and made the active glow per-status (see Phase 4 findings)
- [x] 4.3 `TimelineHeader.tsx` (no changes needed), `TimelineLeftColumn.tsx`, `TimelineLegend.tsx`, `TimelineSlider.tsx`
- [x] 4.4 Neon styling for `.timeline-range-slider` in `src/index.css`, including a `:focus-visible` ring (the old `:focus { outline: none }` had removed the keyboard indicator with no replacement) and Firefox `:active` parity
- [x] 4.5 Verify Phase 4

### Phase 5 — EventsDrawer — DONE

- [x] 5.1 `src/components/EventsDrawer.tsx` — panel `bg-popover` + `shadow-neon-lg`, all three chrome bars `bg-popover/90`, rows/chips/wells by role, status elements into the neon register; `divide-white/5` -> `divide-border`
- [x] 5.2 Verify Phase 5

### Close — DONE

- [x] 6.1 Final `npm run test` + `npm run build` + report
- [x] 6.2 Delete any `.neon-*` surface still unreferenced: `neon-breathe` had no consumer and was removed
- [x] 6.3 Exclude `odd/` from Tailwind's content scan (see Phase 4 findings, bundle bloat)

## Blast radius (final)

16 files changed, **+310 / -183**.

| File | LOC |
| --- | --- |
| `src/App.tsx` | 212 |
| `src/index.css` | 302 |
| `src/components/EventsDrawer.tsx` | 296 |
| `src/components/Header.tsx` | 99 |
| `src/components/MarketCards.tsx` | 230 |
| `src/components/TimelineGrid.tsx` | 189 |
| `src/components/timeline/TimelineBars.tsx` | 320 |
| `src/components/timeline/TimelineHeader.tsx` | 38 |
| `src/components/timeline/TimelineLeftColumn.tsx` | 126 |
| `src/components/timeline/TimelineLegend.tsx` | 30 |
| `src/components/timeline/TimelineSlider.tsx` | 48 |
| `src/components/ui/badge.tsx` | 54 |
| `src/components/ui/button.tsx` | 59 |
| `src/components/ui/card.tsx` | 75 |
| `index.html` | 24 |
| `src/core/pwa-manifest.ts` | 23 |

Plus `src/core/timeline-visualizer.test.ts` (assertion upgrade, see Phase 2 findings).

## Rollback

Every phase touches only presentation (plus one test assertion and PWA color metadata).
`git checkout -- <files>` per phase reverts cleanly; no data, no migration, no dependency
change.

Committed as **`5fefc36` — `feat(ui): re-skin the app with a neon financial design system`**
(17 files, +559/-183), on `main`, **not pushed**. Parent commit `3bbaf3a`.

Deliberately excluded from that commit because they were already in the working tree before
this work started and are a separate logical unit: the staged deletions of
`.atl/.skill-registry.cache.json` and `.atl/skill-registry.md`, and the modified `.gitignore`
(which adds `.atl/` and `.pi/`). `.codegraph/` is untracked tool state and is likewise not
committed or ignored.

## Native review status

**APPROVED and acknowledged.** Lineage `review-f4e1f1a75f27ef96`, tier `medium`, 17 changed
files, 784 changed lines, correction budget 200, one consolidated lens
(`review-reliability`). Medium tier gets ONE consolidated review, not four lenses. Authority
was burned with `burn_evidence: gentle-ai.review-acknowledged/v1`, and the envelope reported
`delivery: ordinary-repository-policy` — i.e. the approval does **not** authorise commit, push,
PR or release.

Two advisory findings, both non-blocking. The provider's own words: *"This review is approved
and its receipt stands. Every finding listed here is non-blocking: none opened a correction,
none reopens this review, and no correction transition is offered for this candidate. Treat them
as separate later work, never as a reason to re-run review on this candidate."*

| ID | Severity | Location | Issue |
| --- | --- | --- | --- |
| `R3-1` | WARNING | `src/core/timeline-visualizer.test.ts:42` | `readFileSync('src/index.css')` uses a path relative to the process CWD, so the test breaks if the runner starts from another directory. |
| `R3-2` | SUGGESTION | `src/core/timeline-visualizer.test.ts:43` | The `--background` extraction regex is fragile: it can match a commented-out declaration and breaks if the CSS structure changes. |

Both land on the manifest assertion rewritten in Phase 2, which is a fair hit — that code was
written in this work. **Carried forward as separate work** by explicit user decision: fix later,
and never as a reason to re-run this candidate's review.

### Debt closure — `R3-1` and `R3-2` (CLOSED)

Closed as a separate work unit in `src/core/timeline-visualizer.test.ts` only.

**This section spans two distinct review candidates on the same working tree. Do not read them as
one** — they have opposite outcomes, and an independent reader who lacks the target identities will
glue them into a contradiction (that happened, and it is why the table below exists):

| # | Target identity | Paths at that moment | Outcome |
| --- | --- | --- | --- |
| **A** | `sha256:bb09a4f4…` | `src/core/timeline-visualizer.test.ts` only | **APPROVED** — lineage `review-e919170bbe1e7948`, acknowledged, authority burned (`gentle-ai.review-acknowledged/v1`) |
| **B** | `sha256:17ae82d3…` | the test file **plus this record** | **Declined** — candidate-scoped, `lineage_created: false`, `mutation_performed: false`, `reset_eligible: false` |

Target **A** is the reviewed deliverable of this work unit. Target **B** exists only because writing
this record mutated the working tree again; review consent for it was declined. A decline is
candidate-scoped and is not the kill switch, so it says nothing about target A. Lineage
`review-e919170bbe1e7948` (tier `medium`, 1 changed file, 52 changed lines, correction budget 26,
lens `review-reliability`) is **target A's**.

| Finding | Root cause found | Fix |
| --- | --- | --- |
| `R3-1` (WARNING) | CWD-relative `readFileSync('src/index.css')` at line 42 | `REPO_ROOT` derived from `import.meta.url`, plus `readRepoFile()` / `repoFileExists()` helpers |
| `R3-2` (SUGGESTION) | Regex could match a commented-out declaration; unanchored; no hex boundary | `readRootHexToken()` strips `/* */` comments, scopes the search to the `:root` block, and rejects hex values longer than 6 digits |

**The reported blast radius was too narrow, and the fix is correspondingly wider.** `R3-1` named
one call site, but *every* file access in that test was CWD-relative: `src/index.css`, `index.html`
(twice) and three `existsSync('public/...')` checks — **six** call sites in total (`HEAD` lines 42,
49, 76, 77, 78, 82). Fixing only line 42 would have left the same defect latent in **five** other
places.

**Evidence, both directions.** A test that passes proves nothing about its own strength, so both
new properties were probed:

1. *CWD independence* — the suite was run from a foreign CWD (`Desktop/Cosas`) against the repo
   root. Vitest does **not** `chdir` (the inverted control failed 3 tests with `ENOENT`, the first
   being `Cosas\src\index.css`), so the passing run is real proof rather than an artefact.
2. *Comment immunity* — inserting `/* probe: --background: #ff00ff; */` before the real
   declaration inside `:root` made the **old** regex extract `#ff00ff` (it would have failed), while
   the new code still passed.
3. *Teeth retained* — forcing the real token to `#ff00ff` still fails, naming the diverging value:
   `expected '#05060a' to be '#ff00ff'`.

Every probe was reverted byte-for-byte; `src/index.css` sha256 was verified back to
`bf837a00214193e88b2e340f14502549a0b4c872b241c7fab8823980c5fa2383`. Final: tests 25/25, build green,
CSS unchanged at 83.80 kB / 12.90 kB gzip, one file modified *by this work unit* (the test file;
the working tree holds two modified paths only because this record is the second), no new
dependencies.

**Deliberately not changed:** the `index.html` `theme-color` meta regex
(`/<meta\s+name="theme-color"\s+content="(#[0-9a-fA-F]{6})"/`). This is *not* an exemption on the
grounds of a different failure mode — an independent check showed it is equally **comment-blind**:
prepending a commented-out meta makes it extract the commented `#ffffff`. It is left alone because
it is pre-existing (untouched by this work unit), and `index.html` contains no HTML comment at all
today, so the defect is latent rather than live. The correct disposition is a separate follow-up,
not churn inside this fix.

**Independent verification pass (required because review consent was declined for target B).** The
native review of target B was **declined** (candidate-scoped, `lineage_created: false`,
`mutation_performed: false` — no lineage exists for it and nothing was mutated). Separately, the
provider's **risk assessment** (`assess`) failed with
`native-assess-unavailable: native response is schema incompatible`, so risk was reported as
`unassessable`, which is verified exactly like `high`. The returned plan required
`independentVerifier: true`, so a separate read-only verifier was run. Note that the failed
`assess` is a different provider capability from the review verdict itself — the verdict for target
A was returned normally; it was the risk *assessment* that could not be produced.

The verifier returned PASS on path resolution, comment
immunity, `:root` scoping, test teeth, zero production impact, and no side effects — and **FAIL on
this record's factual accuracy**, catching three real errors in the prose above, all now corrected:

1. the call-site count: it was written as five when the enumeration itself summed to six;
2. the claim that the untouched `index.html` meta regex does not share `R3-2`'s failure mode — false,
   it shares the comment-blindness sub-mode;
3. the line pin for `R3-helper-coverage` below, which named only the comment-stripping branch.

It also confirmed, with the helper extracted verbatim from the real file, that the `R3-root-scope`
defect is genuine (`:root { content: "}"; … }` truncates the captured block) and latent only, and
that the 8-digit / 3-digit / no-`:root` inputs all resolve to `null` and fail loudly.

**Provenance limit on everything provider-side above.** The lineage id, tier, correction budget,
lens, verdict, `burn_evidence`, and the three advisory findings are recorded from the tool envelopes
observed while this work unit ran. **No local artifact stores them**, so they are not corroborable
from the working tree and cannot be re-derived by a later reader; treat them as session-observed, not
independently verified. A second verifier pass confirmed exactly this: it found no artifact
supporting any of it, which is a limitation of the record, not a contradiction of the claims.

**Disambiguation for the pre-existing history below.** The section *"History: why this took so
long"* describes the **neon-redesign** candidate — an earlier, different target (its candidate scope
was 19 paths, neither target A's 1 nor target B's 2) — and its sentence *"Not a declined review"*
refers to that candidate's tooling outage, not to target B's decline. What that section actually
documents as the outage is `native-status-package-binary-missing` followed by a Go runtime fatal
error (`error_code: "empty-output"`, `exit_code: 2`) in the spawn/stdio path between the Pi
extension and the native binary on Windows. The antivirus-instrumentation attribution for that
outage was recorded in session memory, **not** in this repository, and is deliberately not asserted
here as part of the record below.

**Three new advisory findings from target A's review** (all informational, none blocking, no
correction opened — and per the provider, never a reason to re-run this candidate):

| ID | Severity | Location | Reading |
| --- | --- | --- | --- |
| `R3-root-scope` | WARNING | `timeline-visualizer.test.ts:29` (within the helper, 27-35) | The `:root` block is extracted with `[^}]*`, with no brace balancing — a `}` inside a value (e.g. `content: "}"`) truncates the block. Confirmed real by an independent check; latent only. |
| `R3-token-escape` | SUGGESTION | `timeline-visualizer.test.ts:31-32` | The `--${token}` name is interpolated into `new RegExp` without escaping regex metacharacters. Latent: the only caller passes the literal `'background'`. |
| `R3-helper-coverage` | SUGGESTION | `timeline-visualizer.test.ts:28,30` | The helper's own guard paths (the comment-stripping branch at 28, and `return null` when `:root` is unrecognisable at 30) are not asserted anywhere. |

These are recorded, not actioned. Acting on them would create a new candidate and therefore a new
review; that is a separate decision, not a continuation of this one.

### What finally made the review run

The committed-range START cannot pass its `collect` step while any eligible untracked path
exists. `select-intended-untracked` rejects every binding that a `committedOnly` candidate
issues (`intended-untracked-selection-binding-rejected`), and `inspect` with `untrackedScope`
only ever resolves the workspace-view binding — which then makes the next committed-range START
fail with `candidate-target-projection-drift` ("candidate view rejected before native START").
So a committed-range review is unstartable whenever the repo has eligible untracked files. The
provider's own `nextStep` documents the remedy: *"To keep a path out of the inventory
permanently, ignore it through `.gitignore` or `.git/info/exclude`."* The sole blocker here was
the untracked `.codegraph/` tool state; excluding it locally emptied the untracked inventory,
after which a plain `inspect` followed by the committed-range START completed and created the
lineage.

**Working sequence, in this order:** (1) empty the eligible-untracked inventory; (2) plain
`inspect`, never with `untrackedScope`, so the candidate view is not pinned to the workspace
projection; (3) START with `{"mode":"ordinary","baseRef":"<parent sha>","committedOnly":true}`
plus a fresh `idempotencyKey` — all three input keys are mandatory; (4) `status` on the returned
lineage; (5) capture the offered lens slot (forecast, then the same binding with
`reviewerRunAcknowledged: true`); (6) `acknowledge-approved`. Do not issue STATUS after the
burn.

### History: why this took so long

The record below is kept because it documents the environment, not because it is still current.

**The change was UNREVIEWED for a long stretch.** Not a declined review, and not a review that
found nothing — the review tooling could not run.

- `gentle_review` `inspect` initially returned `native-status-package-binary-missing`. The
  package-local native binary was installed on explicit user authorization
  (`installGentleAi()` from `scripts/gentle-ai-installer.mjs` -> `v3.0.1`,
  `go-sumdb-source-build`, integrity verified on a second run).
- The install script entrypoint was deliberately NOT used: it also calls
  `installTuiModeSetting()`, which rewrites `~/.pi/settings.json` to `tuiMode: "fullscreen"`.
  That is an unrelated global Pi preference the user never authorized. The user's settings were
  left untouched.
- After installation, `inspect` and `select-intended-untracked` both failed with
  `error_code: "empty-output"`, `exit_code: 2`, and a Go runtime fatal error
  (`unexpected return pc for runtime.gopark` -> `fatal error: unknown caller pc`, stack in
  `runtime.scanstack` / `markroot` / `gcBgMarkWorker` / `tstart_stdcall`).
- The **same binary invoked directly from a shell works**: `--version` -> `gentle-ai 3.0.1`,
  and `review status` on this repo -> `complete: true, authoritative: true, status: "clean"`,
  `entries: []`, `locks: []`. So the native side is healthy and the failure is in the spawn/stdio
  path between the Pi extension and the Go runtime on Windows.
- One retry after an integrity check produced the same crash. **No further retries** — the
  failure is deterministic enough to be unusable and is not fixable from inside this repo.
- Safety state across all failures: `lineage_created: false`, `mutation_performed: false`,
  `mutation_outcome: "none"`, `reset_eligible: false`, clean inventory with 0 entries and 0 locks.
  **No review authority was ever created and nothing was mutated**, so RESET, RECOVER, ABANDON and
  QUARANTINE would all be the wrong route — there is no invalid lineage to repair.
- One `inspect` did succeed and revealed the candidate scope: 19 paths, of which three were not
  authored by this work (the `.atl/` deletions and the modified `.gitignore`). Worth knowing if the
  review is ever re-run.

Infrastructure finding recorded in Engram (obs 108) for future sessions.

## Verification log

| Date | Check | Result |
| --- | --- | --- |
| 2026-09-16 | `npm run test` (baseline) | 25 passed, 4 files |
| 2026-09-16 | `npm run build` (baseline) | succeeded, 2307 modules, CSS ~86 kB |
| 2026-09-16 | scout `gentle-ai-explore` UI mapping | failed: "assistant reported an error", no detail (15 turns / 62 tool calls); mapped inline instead |
| 2026-09-16 | Phase 1 — writer `gentle-ai-worker` | 4 files changed; test 25/25, build green |
| 2026-09-16 | Phase 1 — independent gate `gentle-ai-verify` | 8 PASS, 1 FAIL, 1 inference-only doubt |
| 2026-09-16 | Phase 1 re-check after fix | `transition-property:color,background-color,border-color,box-shadow,transform,scale` emitted; test 25/25, build green |
| 2026-09-16 | Phase 2 — writer | 5 files changed; build green; **test 1 failed / 24 passed** |
| 2026-09-16 | Phase 2 — writer blocked and stopped | correct behavior: the failure came from an authorized change whose fix lay outside the allowed surfaces |
| 2026-09-16 | Phase 2 — continuation after user decision | assertion upgraded to the spec invariant; probe proved teeth; restored byte-identical (sha256 verified); test 25/25 |
| 2026-09-16 | Phase 2 — parent defect sweep | fixed `Badge` `shadow-md` override in `Header.tsx:47`; 25/25 |
| 2026-09-16 | Phase 3 — writer | test 25/25, build green, 0 layout delta, all new arbitrary classes verified in emitted CSS |
| 2026-09-16 | Phase 4a — writer | test 25/25, build green, 0 layout delta; flagged a double top hairline |
| 2026-09-16 | Phase 4a — parent fix | removed the redundant hairline `<div>`; added `@source not "../odd"` (bundle -1.55 kB) |
| 2026-09-16 | Phase 4b — writer | test 25/25, build green, 0 layout delta; frozen-region hashes proven identical |
| 2026-09-16 | Phase 4b — parent fix | per-status active glow + single-shadow consolidation in `TimelineBars.tsx` |
| 2026-09-16 | Phase 5 — writer | test 25/25, build green, 0 layout delta, structural diff identical after blanking literals |
| 2026-09-16 | Final | test 25/25, build green, CSS 83.80 kB / gzip 12.90 kB, PWA precache 10 entries (597.54 KiB) |

## Findings and dispositions

### Phase 1

1. **FIXED — `Button` box-shadow and press-scale were not transitioned.** The writer left two
   competing `transition-property` utilities in the Button base string; in the emitted CSS
   `transition-transform` won and the neon glow snapped in. Removing it exposed a second,
   worse defect (found by the independent verifier): Tailwind v4 emits `active:scale-98` as
   the standalone `scale` property, so a transition list containing only `transform` left the
   press-scale untransitioned too. Resolution: the base now uses
   `transition-[color,background-color,border-color,box-shadow,transform,scale] duration-150`,
   verified against emitted CSS, not source.
2. **ACCEPTED — staged utility surface.** `.neon-edge`, `.neon-text`, `.neon-bloom` and
   `neon-sheen` had no consumer at Phase 1 exit. All four are consumed now; `neon-breathe` was
   never consumed and was deleted at close.
3. **RESOLVED — `.ambient-grid` was a temporary duplicate** of `.neon-grid`; the alias was
   dropped in Phase 2 together with the `App.tsx` migration, as planned.

### Phase 2

4. **RESOLVED — a test encoded the old palette, and the spec did not.**
   `src/core/timeline-visualizer.test.ts:37-38` asserted the literal hexes `#0f172a` /
   `#090d16`. `openspec/specs/pwa-shell/spec.md:39` only requires that "`theme_color` and
   `background_color` MUST match the dark theme background" — it names no hex. The literal
   assertion over-specified the requirement, so it rotted on every re-skin and left
   `index.html`'s `theme-color` meta uncovered by any test. The assertion now reads the
   `--background` token from `src/index.css` as the single source of truth and requires the
   manifest's two colors plus the HTML meta to agree with it. A self-reverted probe
   (`theme_color` forced to `#ff00ff`) proved the assertion fails on divergence and names the
   diverging value. No palette hex literal remains in the test.
   **Lesson: assert the spec's property, never the palette's current value.**
5. **FIXED — `Badge` halo killed by a call-site shadow override.** `Header.tsx:47` passed
   `shadow-md` into `Badge`. tailwind-merge treats `shadow-*` as ONE conflict group, so it
   replaced the `open` variant's emerald halo with a black drop shadow — the opposite of this
   redesign's "colored shadows, not black" contract. Removed, plus a stray pre-existing
   `shadow-sm` on the events button.
6. **Pre-existing dead code fixed.** `Header.tsx:59` carried `hover:bg-slate-750`, not a valid
   Tailwind class (`slate-750` does not exist), silently dropped. Replaced with a real hover.
7. **AUTHORIZED DOM delta (2 nodes).** The manual 1px hairline `<div>` in `Header.tsx` was
   replaced by `.neon-edge` on the root, and one `aria-hidden` absolutely-positioned sheen
   `<span>` was added. Both out of flow; the token census confirms zero flow-geometry change
   in `App.tsx` and only the two decorative nodes in `Header.tsx`.

### Phase 3

8. **FIXED — the same override family, three instances at one call site.**
   `MarketCards.tsx:159` passed `shadow-lg`, `transition-colors` and `rounded-xl` into `Card`,
   silently replacing the primitive's `shadow-neon`, its transition list, and its `rounded-2xl`.
   All three removed so the primitive's neon surface actually applies.

### Phase 4

9. **FIXED — the active segment glowed the wrong colour (pre-existing bug).**
   `TimelineBars.tsx` already distinguished `seg.type` (`lunch` = amber, `pre_market` = cyan)
   for the segment gradient, but the `isActive` branch hardcoded
   `shadow-[0_0_24px_rgba(16,185,129,0.45)]` — emerald — for EVERY type. Scrubbing over an
   amber lunch block made it glow green. Worse, up to three competing `.shadow-[...]` classes
   were emitted on the same element (the base `className` plus `blockStyle` plus the active
   branch), so which one won depended on their order in the compiled stylesheet — and Phase 4b
   changed that order. The segment shadow is now computed once per element
   (`shadowStyle` / `activeShadowStyle`, selected by a ternary) and the active glow derives
   from the segment's own status colour, so the cue is both deterministic and semantically
   correct.
10. **FIXED — my own documentation was being compiled into the production bundle.**
    Tailwind v4 auto-scans the project root, so the class names quoted as prose in this file
    (`odd/tasks/*.md`) were emitted into `dist` — a stray `.shadow-xl` rule proved it. Added
    `@source not "../odd";` to `src/index.css`. Bundle CSS dropped 87.61 kB -> 86.06 kB.
    This would have grown with every phase, since these docs necessarily quote class names.
11. **FIXED — double top hairline.** Adding `neon-edge` to `TimelineGrid.tsx` put a second 1px
    gradient on the same row as the pre-existing hairline `<div>`, causing violet bleed. The
    redundant div was removed, matching the Header treatment.
12. **ACCEPTED with disclosure — two pre-existing `filter` usages removed.** The Phase 4b
    writer removed `brightness-125` from the active segment and `filter drop-shadow` from the
    flag glyph to satisfy the "zero filter in the scrubbing hot path" constraint. The
    brightness cue is replaced by the neon register's own cue (`ring-2 ring-white` + a static
    status halo) — glow instead of brightness — and `transition-[filter,box-shadow]` became
    `transition-[box-shadow]`, removing a filter animation from the 60 FPS path. Kept
    deliberately.
13. **ACCEPTED — `TimelineBars.tsx:111` bar track is `bg-white/[0.02]`**, not the rule-1
    `bg-muted`. A 2% wash lets the timeline grid lines read through the bar channels, which is
    what a track should do. The writer flagged the apparent inconsistency; the explicit table
    row was intentional.
14. **A11Y FIX — slider keyboard indicator restored.** `.timeline-range-slider:focus { outline: none }`
    removed the focus ring with no replacement. Added a `:focus-visible` ring consistent with
    the global rule, plus `:active::-moz-range-thumb` Firefox parity.

### Phase 5

15. **FIXED — `divide-white/5` was effectively invisible** (a 5% white divider on a 3% white
    row). Changed to `divide-border`.
16. **Two interpretive calls by the writer, both accepted as the better reading.**
    `hover:border-white/10` was mapped to `hover:border-border-strong` rather than the literal
    `hover:border-border` (which would have silently nullified the hover affordance since the
    base was already `border-border`); and status-register rule 8 was applied to every
    status-coloured element in the drawer, not only the one line named in the table.
17. **Process note.** The Phase 5 writer created a zero-byte `/tmp/blank.diff` outside the repo
    while capturing a structural diff, and disclosed it. No repository path outside its allowed
    surface was written. Not a code defect; recorded so the disclosure is not lost.

## Carried forward (not defects, but decisions for a later pass)

- The repo-wide `text-white` convention for display text was preserved alongside the new
  `text-foreground` token. Both are visually near-identical; unifying them is optional churn.
- `bg-white/[0.0x]` neutral washes and `divide-border`/`border-border` now coexist with a few
  remaining white-alpha dividers deeper in the tree. Not visible, not blocking.
- The mobile condensed strip still swaps layouts at `md`. The redesign preserved that
  breakpoint by design (visual-only scope); revisiting it is a layout decision, not this work.
