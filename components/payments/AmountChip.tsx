import React from "react";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, TrendingDown } from "lucide-react";

interface AmountChipProps {
  amount: number;
  currency?: string;
  trend?: "up" | "down" | null;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "positive" | "negative" | "neutral";
}

export function AmountChip({ 
  amount, 
  currency = "₹", 
  trend,
  size = "md",
  variant = "default"
}: AmountChipProps) {
  const formatAmount = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num);
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl font-semibold",
  };

  const variantClasses = {
    default: "text-foreground",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
  };

  return (
    <span className={`inline-flex items-center gap-1 font-mono ${sizeClasses[size]} ${variantClasses[variant]}`}>
      <span>{currency}</span>
      <span>{formatAmount(amount)}</span>
      {trend && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={trend === "up" ? "text-emerald-500" : "text-red-500"}
        >
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
        </motion.span>
      )}
    </span>
  );
}

export function TagPill({ children, variant = "default" }: { 
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
}) {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary text-secondary-foreground",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
