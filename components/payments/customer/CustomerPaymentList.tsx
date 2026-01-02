import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ExternalLink, Receipt, ChevronRight, Filter, Calendar, User } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { AmountChip, TagPill } from "../AmountChip";

interface Payment {
  id: string;
  choreTitle: string;
  worker: string;
  amount: number;
  status: "funded" | "pending" | "success" | "refunded";
  method: string;
  date: string;
}

const mockPayments: Payment[] = [
  {
    id: "pay_1234567890",
    choreTitle: "Deep Clean Kitchen",
    worker: "Ravi Kumar",
    amount: 750,
    status: "success",
    method: "UPI",
    date: "Dec 15, 2024",
  },
  {
    id: "pay_0987654321",
    choreTitle: "Garden Maintenance",
    worker: "Priya Sharma",
    amount: 1200,
    status: "funded",
    method: "Card",
    date: "Dec 14, 2024",
  },
  {
    id: "pay_5678901234",
    choreTitle: "AC Repair & Service",
    worker: "Amit Patel",
    amount: 2500,
    status: "pending",
    method: "Netbanking",
    date: "Dec 13, 2024",
  },
  {
    id: "pay_3456789012",
    choreTitle: "Grocery Delivery",
    worker: "Sunita Verma",
    amount: 350,
    status: "refunded",
    method: "UPI",
    date: "Dec 12, 2024",
  },
];

interface CustomerPaymentRowProps {
  payment: Payment;
  isSelected: boolean;
  onSelect: () => void;
}

export function CustomerPaymentRow({ payment, isSelected, onSelect }: CustomerPaymentRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
      onClick={onSelect}
      className={`cursor-pointer transition-colors border-b border-border ${
        isSelected ? "bg-primary/5" : ""
      }`}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{payment.choreTitle}</p>
            <p className="text-sm text-muted-foreground">ID: {payment.id.slice(0, 12)}...</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="text-sm text-foreground">{payment.worker}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <AmountChip amount={payment.amount} size="md" />
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={payment.status} />
      </td>
      <td className="px-4 py-4">
        <TagPill>{payment.method}</TagPill>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {payment.date}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="View chore"
            // TODO: onClick -> navigate to chore detail
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="View receipt"
            // TODO: onClick -> view receipt
          >
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

interface CustomerPaymentListProps {
  payments: Payment[];
  selectedPaymentId?: string;
  onSelectPayment?: (payment: Payment) => void;
}

export function CustomerPaymentList({ 
  payments, 
  selectedPaymentId,
  onSelectPayment 
}: CustomerPaymentListProps) {
  const [filter, setFilter] = useState("all");

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filter:</span>
          {["all", "funded", "pending", "success", "refunded"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Calendar className="h-4 w-4" />
          Date Range
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chore
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Worker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Paid
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredPayments.map((payment) => (
                <CustomerPaymentRow
                  key={payment.id}
                  payment={payment}
                  isSelected={selectedPaymentId === payment.id}
                  onSelect={() => onSelectPayment?.(payment)}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filteredPayments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No payments found for this filter.</p>
        </div>
      )}
    </div>
  );
}
