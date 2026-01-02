'use client';

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PaymentsShell } from "@/components/payments/PaymentsShell";
import { PageHeader } from "@/components/payments/PageHeader";
import { EarningsSummaryCards } from "@/components/payments/worker/EarningsSummaryCards";
import { EarningsChart } from "@/components/payments/worker/EarningsChart";
import { PayoutHistoryTable } from "@/components/payments/worker/PayoutHistoryTable";
import { Wallet, Clock, Calendar, TrendingUp } from "lucide-react";

interface WorkerEarningsPageProps {
  summary: {
    totalEarned: number;
    pendingPayouts: number;
    last30Days: number;
  };
  payouts: Array<{
    id: string;
    choreTitle: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    date: string;
    errorMessage?: string;
    createdAt: Date;
  }>;
  chartData: Array<{
    week: string;
    earnings: number;
  }>;
}

export default function WorkerEarningsPage({ summary, payouts, chartData }: WorkerEarningsPageProps) {
  // Transform summary to summary cards format
  const summaryCards = [
    {
      id: "total",
      label: "Total Earned",
      amount: summary.totalEarned,
      icon: <Wallet className="h-5 w-5" />,
      variant: "primary" as const,
    },
    {
      id: "pending",
      label: "Pending Payouts",
      amount: summary.pendingPayouts,
      icon: <Clock className="h-5 w-5" />,
      variant: "warning" as const,
    },
    {
      id: "monthly",
      label: "Last 30 Days",
      amount: summary.last30Days,
      icon: <Calendar className="h-5 w-5" />,
      variant: "success" as const,
    },
    {
      id: "upcoming",
      label: "Next Payout",
      amount: payouts.find((p) => p.status === 'pending')?.amount || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: "info" as const,
    },
  ];

  // Transform chart data to match expected format
  const transformedChartData = chartData.map((d) => ({
    month: d.week,
    earnings: d.earnings,
    payouts: d.earnings, // Use same value for simplicity
  }));

  // Transform payouts (remove upiId requirement since we don't need it)
  const transformedPayouts = payouts.map((p) => ({
    id: p.id,
    date: p.date,
    choreTitle: p.choreTitle,
    amount: p.amount,
    status: p.status,
    upiId: '', // Not needed for display
    errorMessage: p.errorMessage,
  }));

  return (
    <PaymentsShell>
      <PageHeader
        title="Earnings"
        subtitle="Track your income from completed chores."
        breadcrumbs={[{ label: "Dashboard" }, { label: "Payouts" }, { label: "Earnings" }]}
        actions={
          <Link href="/dashboard/payout-settings-lovable" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Manage Payout Settings <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-8">
        <EarningsSummaryCards data={summaryCards} />
        <EarningsChart data={transformedChartData} />
        <PayoutHistoryTable payouts={transformedPayouts} />
      </div>
    </PaymentsShell>
  );
}

