import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "draft";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-blue-600/20 text-blue-300 border border-blue-500/30",
    secondary: "border-transparent bg-slate-800 text-slate-300 border border-slate-700",
    destructive: "border-transparent bg-rose-500/20 text-rose-300 border border-rose-500/30",
    outline: "text-slate-300 border border-slate-700",
    success: "border-transparent bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    warning: "border-transparent bg-amber-500/20 text-amber-300 border border-amber-500/30",
    info: "border-transparent bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    draft: "border-transparent bg-slate-700/50 text-slate-400 border border-slate-600/50",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return <Badge variant="success">APPROVED</Badge>;
    case "APPROVED_COMMENTS":
      return <Badge variant="info">APPROVED (COMMENTS)</Badge>;
    case "SUBMITTED":
      return <Badge variant="warning">SUBMITTED</Badge>;
    case "REVIEWED":
      return <Badge variant="info">REVIEWED</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">REJECTED</Badge>;
    case "DRAFT":
    default:
      return <Badge variant="draft">{status || "DRAFT"}</Badge>;
  }
}
