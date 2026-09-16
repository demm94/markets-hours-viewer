import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none whitespace-nowrap leading-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground font-semibold shadow-[0_0_18px_-4px_rgba(56,189,248,0.65)] hover:bg-primary/90",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border border-destructive/45 bg-destructive/20 text-rose-200 shadow-[0_0_18px_-6px_rgba(251,59,107,0.70)] hover:bg-destructive/30",
        outline: "text-foreground border border-border bg-white/[0.03]",
        open: "border border-emerald-400/45 bg-emerald-500/15 text-emerald-300 font-sans font-semibold tracking-normal text-xs shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_18px_-4px_rgba(16,185,129,0.55)]",
        lunch: "border border-amber-400/45 bg-amber-500/15 text-amber-300 font-sans font-semibold tracking-normal text-xs shadow-[0_0_0_1px_rgba(245,158,11,0.18),0_0_18px_-4px_rgba(245,158,11,0.50)]",
        pre: "border border-cyan-400/45 bg-cyan-500/15 text-cyan-300 font-sans font-semibold tracking-normal text-xs shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_0_18px_-4px_rgba(34,211,238,0.50)]",
        closed: "border border-slate-600/50 bg-slate-800/50 text-slate-300 font-sans font-medium tracking-normal text-xs"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

function Badge({ className, variant, showDot, children, ...props }: BadgeProps) {
  const isStatus = variant === "open" || variant === "lunch" || variant === "pre" || variant === "closed";
  const shouldShowDot = showDot ?? isStatus;

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {shouldShowDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]",
            variant === "open" && "animate-pulse"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
