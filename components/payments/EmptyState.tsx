import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Wallet, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateType = "payments" | "payouts" | "earnings" | "search";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
}> = {
  payments: {
    icon: <CreditCard className="h-12 w-12" />,
    title: "No payments yet",
    description: "Post your first chore to get started with payments.",
    actionLabel: "Post a Chore",
  },
  payouts: {
    icon: <Wallet className="h-12 w-12" />,
    title: "No payouts yet",
    description: "Complete your first chore to start earning.",
    actionLabel: "Browse Chores",
  },
  earnings: {
    icon: <FileText className="h-12 w-12" />,
    title: "No earnings yet",
    description: "Start completing chores to see your earnings here.",
    actionLabel: "Find Chores",
  },
  search: {
    icon: <Search className="h-12 w-12" />,
    title: "No results found",
    description: "Try adjusting your filters or search terms.",
    actionLabel: "Clear Filters",
  },
};

export function EmptyState({ 
  type = "payments", 
  title, 
  description, 
  actionLabel,
  onAction 
}: EmptyStateProps) {
  const config = emptyStateConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Illustration */}
      <div className="relative mb-6">
        <motion.div
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary"
        >
          {config.icon}
        </motion.div>
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title || config.title}
      </h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {description || config.description}
      </p>

      {/* Action */}
      <Button 
        onClick={onAction}
        className="bg-primary hover:bg-primary/90"
      >
        {actionLabel || config.actionLabel}
      </Button>
    </motion.div>
  );
}
