import React from "react";
import { motion } from "framer-motion";
import { StatusBadge } from "../StatusBadge";
import { AmountChip } from "../AmountChip";

interface Payout {
  id: string;
  date: string;
  choreTitle: string;
  amount: number;
  status: "success" | "pending" | "failed";
  upiId: string;
}

const mockPayouts: Payout[] = [
  {
    id: "pout_001",
    date: "Dec 15, 2024",
    choreTitle: "Deep Clean Kitchen",
    amount: 750,
    status: "success",
    upiId: "ravi****@upi",
  },
  {
    id: "pout_002",
    date: "Dec 14, 2024",
    choreTitle: "Garden Maintenance",
    amount: 1200,
    status: "success",
    upiId: "ravi****@upi",
  },
  {
    id: "pout_003",
    date: "Dec 13, 2024",
    choreTitle: "AC Service",
    amount: 2500,
    status: "pending",
    upiId: "ravi****@upi",
  },
  {
    id: "pout_004",
    date: "Dec 12, 2024",
    choreTitle: "Furniture Assembly",
    amount: 800,
    status: "failed",
    upiId: "ravi****@upi",
  },
  {
    id: "pout_005",
    date: "Dec 10, 2024",
    choreTitle: "Grocery Delivery",
    amount: 350,
    status: "success",
    upiId: "ravi****@upi",
  },
];

interface PayoutHistoryTableProps {
  payouts: Payout[];
}

export function PayoutHistoryTable({ payouts }: PayoutHistoryTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Payout History</h3>
        <p className="text-sm text-muted-foreground">Track all your received payments</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chore
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Destination
              </th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout, index) => (
              <motion.tr
                key={payout.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {payout.date}
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-foreground">{payout.choreTitle}</span>
                </td>
                <td className="px-6 py-4">
                  <AmountChip 
                    amount={payout.amount} 
                    variant={payout.status === "success" ? "positive" : "default"}
                  />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={payout.status} size="sm" />
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-muted-foreground">{payout.upiId}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {payouts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No payouts yet</p>
        </div>
      )}
    </div>
  );
}
