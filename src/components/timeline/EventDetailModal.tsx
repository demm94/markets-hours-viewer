import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEventMarkerData } from '../../core/types';
import { MARKETS, CHILE_CONFIG } from '../../core/markets';
import { Flame, AlertCircle, X, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface EventDetailModalProps {
  event: TimelineEventMarkerData | null;
  onClose: () => void;
  onOpenMarketDrawer?: (marketId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = React.memo(({
  event,
  onClose,
  onOpenMarketDrawer
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: Boolean(event),
    onClose,
    initialFocusRef: closeButtonRef
  });

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!event) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [event]);

  if (!event) return null;

  const isHigh = event.importance === 'high';
  const market =
    event.marketId === 'chile'
      ? CHILE_CONFIG
      : MARKETS.find((m) => m.id === event.marketId);

  const marketName = market ? market.name : event.marketId.toUpperCase();
  const marketFlag = market ? market.flag : '🌐';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Card / Bottom Sheet on Mobile */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          aria-describedby={event.description ? 'event-modal-desc' : undefined}
          className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border-strong bg-card/95 backdrop-blur-2xl p-4 sm:p-6 shadow-neon-lg flex flex-col gap-4 text-left max-h-[90dvh] overflow-y-auto"
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden flex justify-center -mt-1 -mb-1">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Header with Impact Badge & Close Button */}
          <div className="flex items-start justify-between gap-3 border-b border-border pb-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
                  isHigh
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                }`}
              >
                {isHigh ? (
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-current animate-pulse" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isHigh ? 'Alto Impacto' : 'Medio Impacto'}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-semibold text-foreground">
                <span aria-hidden="true">{marketFlag}</span>
                <span>{marketName}</span>
              </span>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Cerrar modal de evento"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Title and Description */}
          <div className="flex flex-col gap-1.5">
            <h3 id="event-modal-title" className="text-base sm:text-lg font-bold text-white leading-snug">
              {event.title}
            </h3>
            {event.description && (
              <p id="event-modal-desc" className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Times Breakdown Card */}
          <div className="rounded-xl border border-border bg-muted/50 p-3 sm:p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground/90 uppercase tracking-wider font-mono">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Horarios de publicación</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex flex-col p-2.5 rounded-lg bg-card/70 border border-border/80">
                <span className="text-[11px] text-muted-foreground">🇨🇱 Hora de Chile</span>
                <span className="text-sm font-bold text-sky-400 tabular-nums mt-0.5">
                  {event.chileTimeFormatted}
                </span>
              </div>

              <div className="flex flex-col p-2.5 rounded-lg bg-card/70 border border-border/80">
                <span className="text-[11px] text-muted-foreground">🏛️ Hora local mercado</span>
                <span className="text-sm font-semibold text-foreground tabular-nums mt-0.5">
                  {event.exchangeTimeFormatted}
                </span>
              </div>
            </div>

            {/* Economic Data / Metrics (if present) */}
            {(event.forecast || event.previous) && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70 text-xs font-mono">
                {event.forecast && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Pronóstico</span>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">
                      {event.forecast}
                    </span>
                  </div>
                )}
                {event.previous && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Dato anterior</span>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                      {event.previous}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            {onOpenMarketDrawer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMarketDrawer(event.marketId);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-bold tracking-wide transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <Calendar className="w-4 h-4" />
                <span>Ver panel de eventos</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 active:bg-muted/60 text-muted-foreground hover:text-white text-xs font-bold border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

EventDetailModal.displayName = 'EventDetailModal';
