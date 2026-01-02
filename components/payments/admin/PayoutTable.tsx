import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { AmountChip } from "../AmountChip";
import { Button } from "@/components/ui/button";

interface AdminPayout {
  id: string;
  worker: string;
  choreTitle: string;
  amount: number;
  status: "success" | "pending" | "failed";
  error?: string;
  upiId: string;
  createdAt: string;
}

const mockAdminPayouts: AdminPayout[] = [
  {
    id: "pout_abc123",
    worker: "Ravi Kumar",
    choreTitle: "Deep Clean Kitchen",
    amount: 712,
    status: "success",
    upiId: "ravi****@upi",
    createdAt: "Dec 15, 10:35 AM",
  },
  {
    id: "pout_def456",
    worker: "Amit Patel",
    choreTitle: "Garden Maintenance",
    amount: 1140,
    status: "pending",
    upiId: "amit****@upi",
    createdAt: "Dec 15, 9:20 AM",
  },
  {
    id: "pout_ghi789",
    worker: "Sunita Verma",
    choreTitle: "AC Repair",
    amount: 2375,
    status: "failed",
    error: "Invalid UPI ID",
    upiId: "sunita****@upi",
    createdAt: "Dec 14, 4:50 PM",
  },
  {
    id: "pout_jkl012",
    worker: "Vijay Reddy",
    choreTitle: "Plumbing Fix",
    amount: 570,
    status: "failed",
    error: "Bank server timeout",
    upiId: "vijay****@upi",
    createdAt: "Dec 14, 2:25 PM",
  },
  {
    id: "pout_mno345",
    worker: "Neha Joshi",
    choreTitle: "Grocery Delivery",
    amount: 332,
    status: "success",
    upiId: "neha****@upi",
    createdAt: "Dec 13, 11:05 AM",
  },
];

interface RetryPayoutButtonProps {
  payoutId: string;
  onRetry?: (id: string) => void;
}

export function RetryPayoutButton({ payoutId, onRetry }: RetryPayoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = () => {
    setIsLoading(true);
    // TODO: onClick -> call /api/payouts/retry
    console.log("Retrying payout:", payoutId);
    setTimeout(() => setIsLoading(false), 2000);
    onRetry?.(payoutId);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRetry}
      disabled={isLoading}
      className="h-8 px-3 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </>
      )}
    </Button>
  );
}

interface PayoutTableProps {
  payouts: AdminPayout[];
}

export function PayoutTable({ payouts }: PayoutTableProps) {
  // Calculate summary stats
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const failedCount = payouts.filter((p) => p.status === "failed").length;
  const lastPayout = payouts.find((p) => p.status === "success")?.createdAt || "N/A";

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <p className="text-sm text-muted-foreground">Total Payouts</p>
          <AmountChip amount={totalPayouts} size="lg" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <p className="text-sm text-muted-foreground">Failed Payouts</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <p className="text-sm text-muted-foreground">Last Successful</p>
          <p className="text-lg font-semibold text-foreground">{lastPayout}</p>
        </motion.div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Payout ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Chore
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Error
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  UPI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout, index) => (
                <motion.tr
                  key={payout.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${
                    payout.status === "failed" ? "bg-red-500/5" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-foreground">{payout.id}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">{payout.worker}</td>
                  <td className="px-4 py-4 text-sm text-foreground max-w-[150px] truncate">
                    {payout.choreTitle}
                  </td>
                  <td className="px-4 py-4">
                    <AmountChip amount={payout.amount} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={payout.status} size="sm" />
                  </td>
                  <td className="px-4 py-4">
                    {payout.error ? (
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{payout.error}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-muted-foreground">{payout.upiId}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{payout.createdAt}</td>
                  <td className="px-4 py-4">
                    {payout.status === "failed" && (
                      <RetryPayoutButton payoutId={payout.id} />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
