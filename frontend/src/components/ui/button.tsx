import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "scg";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      scg: "bg-scg-red text-white hover:bg-scg-darkRed shadow-sm active:scale-95 transition-transform",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/50",
      ghost: "hover:bg-slate-800 text-slate-300 hover:text-white",
      link: "text-blue-400 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-md px-8 text-base",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
