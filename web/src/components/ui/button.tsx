import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border font-body text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-lime bg-lime px-5 py-3 text-black shadow-lime hover:brightness-105",
        ghost: "border-border bg-transparent px-5 py-3 text-foreground hover:border-lime hover:text-lime",
        subtle: "border-transparent bg-elevated px-4 py-2 text-foreground hover:border-lime",
        destructive: "border-red-500/40 bg-red-500/10 px-4 py-2 text-red-200 hover:bg-red-500/20",
      },
      size: {
        default: "h-11",
        lg: "h-14 px-7 text-base",
        sm: "h-9 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
