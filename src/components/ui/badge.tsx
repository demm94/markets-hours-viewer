import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none whitespace-nowrap leading-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border border-destructive/35 bg-destructive/15 text-rose-300 hover:bg-destructive/25",
        outline: "text-foreground border border-border bg-white/[0.02]",
        open: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-sans font-semibold tracking-normal text-xs",
        lunch: "border border-amber-500/30 bg-amber-500/10 text-amber-400 font-sans font-semibold tracking-normal text-xs",
        pre: "border border-sky-500/30 bg-sky-500/10 text-sky-400 font-sans font-semibold tracking-normal text-xs",
        holiday: "border border-violet-500/30 bg-violet-500/10 text-violet-300 font-sans font-semibold tracking-normal text-xs",
        closed: "border border-white/[0.07] bg-white/[0.03] text-zinc-400 font-sans font-medium tracking-normal text-xs"
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
  const isStatus = variant === "open" || variant === "lunch" || variant === "pre" || variant === "closed" || variant === "holiday";
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
