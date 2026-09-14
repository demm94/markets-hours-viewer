import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none cursor-pointer active:scale-98 transition-transform duration-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive/20 text-rose-300 border border-destructive/40 shadow-sm hover:bg-destructive/30",
        outline:
          "border border-white/10 bg-slate-900/60 shadow-sm hover:bg-slate-800/80 hover:text-white text-slate-200",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground text-slate-300",
        link: "text-primary underline-offset-4 hover:underline",
        now: "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 hover:border-rose-500/60 shadow-[0_0_12px_rgba(225,29,72,0.25)] font-mono font-bold",
        pill: "bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 hover:border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.15)] font-mono font-semibold"
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
