import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, Clock, Calendar, ArrowUpRight } from "lucide-react";
import { AmountChip } from "../AmountChip";

interface SummaryCard {
  id: string;
  label: string;
  amount: number;
  change?: number;
  icon: React.ReactNode;
  variant: "primary" | "success" | "warning" | "info";
}

const mockSummaryData: SummaryCard[] = [
  {
    id: "total",
    label: "Total Earned",
    amount: 45750,
    change: 12.5,
    icon: <Wallet className="h-5 w-5" />,
    variant: "primary",
  },
  {
    id: "pending",
    label: "Pending Payouts",
    amount: 3200,
    icon: <Clock className="h-5 w-5" />,
    variant: "warning",
  },
  {
    id: "monthly",
    label: "Last 30 Days",
    amount: 8450,
    change: 8.3,
    icon: <Calendar className="h-5 w-5" />,
    variant: "success",
  },
  {
    id: "upcoming",
    label: "Upcoming Payout",
    amount: 1800,
    icon: <TrendingUp className="h-5 w-5" />,
    variant: "info",
  },
];

const variantStyles = {
  primary: {
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    glow: "shadow-primary/10",
  },
  success: {
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  warning: {
    gradient: "from-amber-500/20 to-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    glow: "shadow-amber-500/10",
  },
  info: {
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    glow: "shadow-cyan-500/10",
  },
};

interface EarningsSummaryCardsProps {
  data: SummaryCard[];
}

export function EarningsSummaryCards({ data }: EarningsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((card, index) => {
        const style = variantStyles[card.variant];
        
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              y: -4,
              transition: { duration: 0.2 }
            }}
            className={`
              relative overflow-hidden rounded-xl border border-border
              bg-gradient-to-br ${style.gradient}
              p-5 shadow-lg ${style.glow}
              transition-shadow duration-300
            `}
          >
            {/* Floating animation for primary card */}
            {card.variant === "primary" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                animate={{ 
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            <div className="relative">
              {/* Icon */}
              <div className={`inline-flex p-2.5 rounded-lg ${style.iconBg} ${style.iconColor} mb-3`}>
                {card.icon}
              </div>

              {/* Label */}
              <p className="text-sm text-muted-foreground mb-1">{card.label}</p>

              {/* Amount */}
              <div className="flex items-end justify-between">
                <AmountChip amount={card.amount} size="lg" />
                
                {card.change && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm font-medium">+{card.change}%</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
