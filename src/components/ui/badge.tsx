import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none whitespace-nowrap leading-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border border-white/15",
        open: "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.25)] font-sans font-semibold tracking-normal text-xs",
        lunch: "border border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-sans font-semibold tracking-normal text-xs",
        pre: "border border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-sans font-semibold tracking-normal text-xs",
        closed: "border border-slate-700/60 bg-slate-800/60 text-slate-300 font-sans font-medium tracking-normal text-xs"
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
            "h-1.5 w-1.5 rounded-full bg-current",
            variant === "open" && "animate-pulse"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
