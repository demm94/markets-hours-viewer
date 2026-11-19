import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Bell, BellOff, BellRing, ShieldAlert, X } from 'lucide-react';
import { MarketConfig } from '../core/types';
import { NotificationPermissionState } from '../hooks/useMarketNotifications';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface AlertsPopoverProps {
  markets: MarketConfig[];
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermissionState;
  subscribedMarketIds: string[];
  onToggleNotifications: () => void;
  onToggleMarketAlert: (marketId: string) => void;
}

interface PopoverCoords {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const POPOVER_MAX_WIDTH = 320;
const VIEWPORT_MARGIN = 8;
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const AlertsPopover: React.FC<AlertsPopoverProps> = React.memo(({
  markets,
  notificationsEnabled,
  notificationPermission,
  subscribedMarketIds,
  onToggleNotifications,
  onToggleMarketAlert
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords>({
    top: 56,
    left: VIEWPORT_MARGIN,
    width: POPOVER_MAX_WIDTH,
    maxHeight: 480
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const popoverId = useId();
  const titleId = useId();

  const handleCloseWithFocus = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleCloseWithFocus,
    initialFocusRef: closeButtonRef,
    returnFocus: false
  });

  const setPanelRefs = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      focusTrapRef.current = node;
    },
    [focusTrapRef]
  );

  const isUnsupported = notificationPermission === 'unsupported';
  const isDenied = notificationPermission === 'denied';
  const isActive = notificationsEnabled && notificationPermission === 'granted';

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const width = Math.min(POPOVER_MAX_WIDTH, Math.max(240, viewportW - VIEWPORT_MARGIN * 2));
    const rawLeft = rect.right - width;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rawLeft, viewportW - width - VIEWPORT_MARGIN));
    const top = Math.max(VIEWPORT_MARGIN, Math.min(rect.bottom + 8, Math.max(VIEWPORT_MARGIN, viewportH - 160)));
    const maxHeight = Math.max(160, viewportH - top - VIEWPORT_MARGIN);

    setCoords({ top, left, width, maxHeight });
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleViewportChange = () => {
      updatePosition();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('scroll', handleViewportChange, { passive: true, capture: true });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  const activeSubscribedCount = markets.filter((m) => subscribedMarketIds.includes(m.id)).length;

  const triggerLabel = isActive
    ? 'Alertas activas'
    : isDenied
    ? 'Alertas bloqueadas en el navegador'
    : 'Configurar alertas';

  const popoverPanel =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={setPanelRefs}
            id={popoverId}
            role="dialog"
            aria-labelledby={titleId}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`
            }}
            className="z-[60] rounded-xl border border-border-strong bg-popover text-popover-foreground shadow-neon-lg p-3.5 flex flex-col gap-3 overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
              <h2
                id={titleId}
                className="text-xs font-semibold tracking-wide text-zinc-100 flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5 text-neon-sky shrink-0" aria-hidden="true" />
                <span>Alertas</span>
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseWithFocus}
                aria-label="Cerrar panel de alertas"
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors cursor-pointer before:absolute before:-inset-1.5 before:content-['']"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {isUnsupported ? (
              <div className="rounded-lg border border-border bg-white/[0.03] p-3 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p>Tu navegador no admite notificaciones web.</p>
              </div>
            ) : isDenied ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  Las notificaciones están bloqueadas en tu navegador. Actívalas desde la configuración del sitio para recibir avisos.
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={onToggleNotifications}
                  className="w-full min-h-[44px] flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg border border-border bg-white/[0.02] hover:bg-white/[0.05] hover:border-border-strong transition-colors cursor-pointer text-left"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold text-zinc-100 leading-snug">
                      Alertas de campana (15 min antes)
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
                        isActive ? 'text-emerald-400' : 'text-muted-foreground'
                      }`}
                    >
                      {isActive ? 'Activas' : 'Desactivadas'}
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
                      isActive
                        ? 'bg-emerald-500/80 border-emerald-400/60'
                        : 'bg-white/[0.08] border-border-strong'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        isActive ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Bolsas suscritas
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {activeSubscribedCount}/{markets.length}
                    </span>
                  </div>

                  {!isActive && (
                    <p className="text-[11px] text-muted-foreground px-0.5">
                      Activa el interruptor principal para elegir tus bolsas.
                    </p>
                  )}

                  <div className="flex flex-col gap-1">
                    {markets.map((market) => {
                      const isSubscribed = subscribedMarketIds.includes(market.id);
                      return (
                        <button
                          key={market.id}
                          type="button"
                          role="switch"
                          aria-checked={isSubscribed}
                          disabled={!isActive}
                          onClick={() => onToggleMarketAlert(market.id)}
                          className={`w-full min-h-[40px] flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                            !isActive
                              ? 'border-transparent bg-white/[0.01] opacity-50 cursor-not-allowed'
                              : isSubscribed
                              ? 'border-emerald-500/25 bg-emerald-500/[0.06] hover:bg-emerald-500/10 cursor-pointer'
                              : 'border-transparent bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0" aria-hidden="true">
                              {market.flag}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-zinc-100 truncate leading-tight">
                                {market.name}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground truncate leading-tight">
                                {market.code}
                              </span>
                            </div>
                          </div>

                          <span
                            aria-hidden="true"
                            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors ${
                              isActive && isSubscribed
                                ? 'bg-emerald-500/80 border-emerald-400/60'
                                : 'bg-white/[0.08] border-border-strong'
                            }`}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${
                                isSubscribed ? 'translate-x-3.5' : 'translate-x-0.5'
                              }`}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-2.5">
              Los avisos funcionan mientras la app esté abierta.
            </p>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? popoverId : undefined}
        aria-label={triggerLabel}
        title={triggerLabel}
        className={`relative inline-flex items-center justify-center gap-1.5 min-h-[36px] sm:min-h-[38px] min-w-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
          isActive
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
            : isDenied
            ? 'border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
            : 'border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08] text-zinc-200'
        }`}
      >
        {isActive ? (
          <BellRing className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
        ) : isDenied ? (
          <BellOff className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
        ) : (
          <Bell className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden min-[460px]:inline">Alertas</span>
        {isActive && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
            aria-hidden="true"
          />
        )}
      </button>

      {popoverPanel}
    </div>
  );
});

AlertsPopover.displayName = 'AlertsPopover';
