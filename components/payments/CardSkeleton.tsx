import React from "react";
import { motion } from "framer-motion";

interface CardSkeletonProps {
  variant?: "summary" | "table-row" | "detail";
  count?: number;
}

function ShimmerEffect() {
  return (
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ translateX: ["100%", "-100%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function CardSkeleton({ variant = "summary", count = 1 }: CardSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "summary":
        return (
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
            <ShimmerEffect />
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
          </div>
        );

      case "table-row":
        return (
          <div className="relative overflow-hidden flex items-center gap-4 p-4 border-b border-border">
            <ShimmerEffect />
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-muted animate-pulse" />
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        );

      case "detail":
        return (
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 space-y-4">
            <ShimmerEffect />
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 rounded-full bg-muted animate-pulse" />
              <div className="h-8 w-24 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
      ))}
    </>
  );
}

export function AnimatedProgressBar({ 
  progress = 0, 
  showLabel = true,
  variant = "default" 
}: { 
  progress: number;
  showLabel?: boolean;
  variant?: "default" | "success" | "warning";
}) {
  const variantClasses = {
    default: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${variantClasses[variant]}`}
        />
      </div>
    </div>
  );
}
