import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, AlertTriangle, XCircle, RefreshCw, Loader2 } from "lucide-react";

type StatusType = 
  | "success" 
  | "pending" 
  | "failed" 
  | "refunded" 
  | "processing" 
  | "funded"
  | "verified"
  | "unverified"
  | "not_added";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
  animate?: boolean;
}

const statusConfig: Record<StatusType, { 
  bg: string; 
  text: string; 
  border: string;
  icon: React.ReactNode;
  label: string;
  glow?: string;
}> = {
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: <Check className="h-3.5 w-3.5" />,
    label: "Success",
    glow: "shadow-emerald-500/20",
  },
  pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Pending",
    glow: "shadow-amber-500/20",
  },
  failed: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Failed",
    glow: "shadow-red-500/20",
  },
  refunded: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    label: "Refunded",
    glow: "shadow-violet-500/20",
  },
  processing: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    label: "Processing",
    glow: "shadow-blue-500/20",
  },
  funded: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/20",
    icon: <Check className="h-3.5 w-3.5" />,
    label: "Funded",
    glow: "shadow-cyan-500/20",
  },
  verified: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: <Check className="h-3.5 w-3.5" />,
    label: "Verified",
    glow: "shadow-emerald-500/20",
  },
  unverified: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    label: "Unverified",
    glow: "shadow-amber-500/20",
  },
  not_added: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Not Added",
  },
};

export function StatusBadge({ 
  status, 
  label, 
  showIcon = true, 
  size = "md",
  animate = false 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const sizeClasses = size === "sm" 
    ? "px-2 py-0.5 text-xs gap-1" 
    : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <motion.span
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.bg} ${config.text} ${config.border} ${sizeClasses}
        ${animate && config.glow ? `shadow-lg ${config.glow}` : ""}
        transition-all duration-300
      `}
    >
      {showIcon && config.icon}
      {displayLabel}
    </motion.span>
  );
}

export function PaymentStatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_") as StatusType;
  return <StatusBadge status={normalizedStatus} animate />;
}
