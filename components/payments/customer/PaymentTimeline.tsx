import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, CreditCard, Wallet, User, ArrowRight } from "lucide-react";

interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  status: "completed" | "current" | "upcoming";
  timestamp?: string;
}

interface PaymentTimelineProps {
  steps?: TimelineStep[];
}

const defaultSteps: TimelineStep[] = [
  {
    id: "requested",
    label: "Chore Requested",
    description: "Customer posted the chore",
    status: "completed",
    timestamp: "Dec 14, 2:30 PM",
  },
  {
    id: "assigned",
    label: "Worker Assigned",
    description: "Worker accepted the job",
    status: "completed",
    timestamp: "Dec 14, 3:15 PM",
  },
  {
    id: "funded",
    label: "Payment Funded",
    description: "Amount held in escrow",
    status: "completed",
    timestamp: "Dec 14, 3:16 PM",
  },
  {
    id: "in_progress",
    label: "Work In Progress",
    description: "Worker is completing the chore",
    status: "current",
  },
  {
    id: "completed",
    label: "Completed & Paid",
    description: "Worker receives payment",
    status: "upcoming",
  },
];

export function PaymentTimeline({ steps = defaultSteps }: PaymentTimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {/* Connector line */}
            {!isLast && (
              <div 
                className={`absolute left-[15px] top-8 w-0.5 h-full -translate-x-1/2 ${
                  step.status === "completed" ? "bg-emerald-500" : "bg-border"
                }`}
              />
            )}
            
            {/* Status icon */}
            <div className="relative z-10 flex-shrink-0">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === "completed" 
                    ? "bg-emerald-500 text-white" 
                    : step.status === "current"
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground border-2 border-border"
                }`}
              >
                {step.status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : step.status === "current" ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Clock className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium ${
                  step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {step.label}
                </h4>
                {step.timestamp && (
                  <span className="text-xs text-muted-foreground">{step.timestamp}</span>
                )}
              </div>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

interface ChorePaymentSummaryCardProps {
  chore: {
    title: string;
    worker: string;
    amount: number;
    status: string;
    paymentId: string;
    method: string;
  };
}

export function ChorePaymentSummaryCard({ chore }: ChorePaymentSummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{chore.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Worker: {chore.worker}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">₹{chore.amount}</div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            chore.status === "FUNDED" 
              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
              : chore.status === "COMPLETED"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            {chore.status}
          </span>
        </div>
      </div>

      {/* Payment details */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <span className="text-xs text-muted-foreground">Payment ID</span>
          <p className="font-mono text-sm text-foreground">{chore.paymentId}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Method</span>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{chore.method}</span>
          </div>
        </div>
      </div>

      {/* Timeline preview */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-4">Payment Timeline</h4>
        <PaymentTimeline />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button 
          className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          // TODO: onClick -> view receipt
        >
          View Receipt
        </button>
        <button 
          className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center justify-center gap-2"
          // TODO: onClick -> view chore detail
        >
          View Chore <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
