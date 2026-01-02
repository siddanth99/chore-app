'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Wallet, TrendingUp, AlertTriangle, Filter, Calendar } from "lucide-react";
import { PaymentsShell } from "@/components/payments/PaymentsShell";
import { PageHeader } from "@/components/payments/PageHeader";
import { CustomerPaymentList } from "@/components/payments/customer/CustomerPaymentList";
import { ChorePaymentSummaryCard } from "@/components/payments/customer/PaymentTimeline";
import { EmptyState } from "@/components/payments/EmptyState";
interface CustomerPaymentsPageProps {
  summary: {
    totalSpent: number;
    activeChoresCount: number;
    refundedAmount: number;
    disputesCount: number;
  };
  payments: Array<{
    id: string;
    choreTitle: string;
    worker: string;
    workerId: string;
    amount: number;
    status: 'funded' | 'pending' | 'success' | 'refunded';
    method: string;
    date: string;
    choreId: string;
    createdAt: Date;
  }>;
}

export default function CustomerPaymentsPage({ summary, payments }: CustomerPaymentsPageProps) {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const summaryCards = [
    { id: "spent", label: "Total Spent", amount: summary.totalSpent, icon: <Wallet className="h-5 w-5" />, color: "primary" },
    { id: "active", label: "Active Chores", amount: summary.activeChoresCount, icon: <TrendingUp className="h-5 w-5" />, color: "cyan" },
    { id: "refunds", label: "Refunds", amount: summary.refundedAmount, icon: <CreditCard className="h-5 w-5" />, color: "violet" },
    { id: "disputes", label: "Disputes", amount: summary.disputesCount, icon: <AlertTriangle className="h-5 w-5" />, color: "amber" },
  ];

  return (
    <PaymentsShell>
      <PageHeader
        title="Payments & Chores"
        subtitle="See everything you've paid for on Chore App."
        breadcrumbs={[{ label: "Dashboard" }, { label: "Payments" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
              <Filter className="h-4 w-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
              <Calendar className="h-4 w-4" /> Date Range
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-5 rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 shadow-lg"
          >
            <div className={`inline-flex p-2 rounded-lg bg-${card.color}-500/10 text-${card.color}-600 dark:text-${card.color}-400 mb-3`}>
              {card.icon}
            </div>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold text-foreground">
              {card.id === "active" || card.id === "disputes" ? card.amount : `₹${card.amount.toLocaleString()}`}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomerPaymentList payments={payments} onSelectPayment={setSelectedPayment} selectedPaymentId={selectedPayment?.id} />
        </div>
        <div className="lg:col-span-1">
          {selectedPayment ? (
            <ChorePaymentSummaryCard chore={{
              title: selectedPayment.choreTitle,
              worker: selectedPayment.worker,
              amount: selectedPayment.amount,
              status: selectedPayment.status.toUpperCase(),
              paymentId: selectedPayment.id,
              method: selectedPayment.method,
            }} />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">Select a payment to view details</p>
            </div>
          )}
        </div>
      </div>
    </PaymentsShell>
  );
}

