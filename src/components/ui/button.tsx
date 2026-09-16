import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform,scale] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none cursor-pointer active:scale-98",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold shadow-[0_0_20px_-6px_rgba(56,189,248,0.80)] hover:bg-primary/90 hover:shadow-[0_0_28px_-4px_rgba(56,189,248,0.95)]",
        destructive:
          "bg-destructive/20 text-rose-200 border border-destructive/45 shadow-[0_0_18px_-6px_rgba(251,59,107,0.70)] hover:bg-destructive/30 hover:border-destructive/65",
        outline:
          "border border-border bg-card text-slate-200 shadow-sm hover:border-border-strong hover:bg-white/[0.05] hover:text-white",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground text-slate-300",
        link: "text-primary underline-offset-4 hover:underline",
        now: "bg-rose-500/20 text-rose-200 border border-rose-400/50 font-mono font-bold shadow-[0_0_0_1px_rgba(244,63,94,0.20),0_0_18px_-4px_rgba(244,63,94,0.65)] hover:bg-rose-500/30 hover:border-rose-400/70",
        pill: "bg-sky-500/10 text-sky-300 border border-sky-400/35 font-mono font-semibold shadow-[0_0_0_1px_rgba(56,189,248,0.15),0_0_18px_-6px_rgba(56,189,248,0.60)] hover:bg-sky-500/20 hover:border-sky-400/60"
      },
      size: {
        default: "h-9 px-4 py-2 min-h-[44px]",
        sm: "h-8 rounded-md px-3 text-xs min-h-[44px]",
        lg: "h-10 rounded-md px-8 min-h-[44px]",
        icon: "h-9 w-9 min-h-[44px] min-w-[44px]",
        compact: "h-7 px-2.5 text-xs rounded-md"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
