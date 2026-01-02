import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Eye, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { AmountChip, TagPill } from "../AmountChip";

interface AdminPayment {
  id: string;
  customer: string;
  worker: string;
  choreTitle: string;
  amount: number;
  status: "funded" | "pending" | "success" | "failed" | "refunded";
  method: string;
  createdAt: string;
}

const mockAdminPayments: AdminPayment[] = [
  {
    id: "pay_abc123",
    customer: "Rahul Mehta",
    worker: "Ravi Kumar",
    choreTitle: "Deep Clean Kitchen",
    amount: 750,
    status: "success",
    method: "UPI",
    createdAt: "Dec 15, 10:30 AM",
  },
  {
    id: "pay_def456",
    customer: "Priya Singh",
    worker: "Amit Patel",
    choreTitle: "Garden Maintenance",
    amount: 1200,
    status: "funded",
    method: "Card",
    createdAt: "Dec 15, 9:15 AM",
  },
  {
    id: "pay_ghi789",
    customer: "Ankit Sharma",
    worker: "Sunita Verma",
    choreTitle: "AC Repair",
    amount: 2500,
    status: "pending",
    method: "Netbanking",
    createdAt: "Dec 14, 4:45 PM",
  },
  {
    id: "pay_jkl012",
    customer: "Meera Kapoor",
    worker: "Vijay Reddy",
    choreTitle: "Plumbing Fix",
    amount: 600,
    status: "failed",
    method: "UPI",
    createdAt: "Dec 14, 2:20 PM",
  },
  {
    id: "pay_mno345",
    customer: "Sanjay Gupta",
    worker: "Neha Joshi",
    choreTitle: "Grocery Delivery",
    amount: 350,
    status: "refunded",
    method: "Card",
    createdAt: "Dec 13, 11:00 AM",
  },
];

interface PaymentTableProps {
  payments: AdminPayment[];
  onViewDetails?: (payment: AdminPayment) => void;
}

export function PaymentTable({ payments, onViewDetails }: PaymentTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof AdminPayment>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof AdminPayment) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: keyof AdminPayment }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-1">
                  Payment ID <SortIcon field="id" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Worker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chore
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center gap-1">
                  Amount <SortIcon field="amount" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Method
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-1">
                  Created <SortIcon field="createdAt" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <React.Fragment key={payment.id}>
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setExpandedRow(expandedRow === payment.id ? null : payment.id)}
                  className={`border-b border-border cursor-pointer transition-colors ${
                    expandedRow === payment.id ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-foreground">{payment.id}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">{payment.customer}</td>
                  <td className="px-4 py-4 text-sm text-foreground">{payment.worker}</td>
                  <td className="px-4 py-4 text-sm text-foreground max-w-[150px] truncate">
                    {payment.choreTitle}
                  </td>
                  <td className="px-4 py-4">
                    <AmountChip amount={payment.amount} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={payment.status} size="sm" />
                  </td>
                  <td className="px-4 py-4">
                    <TagPill>{payment.method}</TagPill>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{payment.createdAt}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(payment);
                        }}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="View details"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </motion.tr>

                {/* Expanded row details */}
                <AnimatePresence>
                  {expandedRow === payment.id && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <td colSpan={9} className="px-4 py-4 bg-muted/20">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Full Chore Title:</span>
                            <p className="font-medium text-foreground">{payment.choreTitle}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payout Status:</span>
                            <p className="font-medium text-foreground">
                              {payment.status === "success" ? "Sent to worker" : "Pending completion"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actions:</span>
                            <div className="flex gap-2 mt-1">
                              <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md">
                                View Timeline
                              </button>
                              <button className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md">
                                Export
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
