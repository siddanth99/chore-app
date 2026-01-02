'use client';

import React from "react";
import { PaymentsShell, adminPaymentTabs } from "@/components/payments/PaymentsShell";
import { PageHeader } from "@/components/payments/PageHeader";
import { AdminFilterBar } from "@/components/payments/admin/AdminFilterBar";
import { PayoutTable } from "@/components/payments/admin/PayoutTable";
interface AdminPayoutsPageProps {
  summary: {
    totalPayouts: number;
    totalAmount: number;
    failedCount: number;
    pendingCount: number;
  };
  payouts: Array<{
    id: string;
    worker: string;
    workerId: string;
    choreTitle: string;
    choreId: string;
    amount: number;
    status: string;
    errorMessage: string | null;
    createdAt: Date;
  }>;
}

export default function AdminPayoutsPage({ summary, payouts }: AdminPayoutsPageProps) {
  // Transform payouts for UI
  const transformedPayouts = payouts.map((p) => {
    const statusMap: Record<string, 'success' | 'pending' | 'failed'> = {
      PENDING: 'pending',
      SUCCESS: 'success',
      FAILED: 'failed',
    };

    return {
      id: p.id,
      worker: p.worker,
      choreTitle: p.choreTitle,
      amount: p.amount,
      status: statusMap[p.status] || 'pending',
      error: p.errorMessage || undefined,
      upiId: '', // Not needed for admin display
      createdAt: new Date(p.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  });

  return (
    <PaymentsShell tabs={adminPaymentTabs} activeTab="payouts">
      <PageHeader
        title="Worker Payouts"
        subtitle="Monitor payouts sent to workers and handle failures."
        breadcrumbs={[{ label: "Admin" }, { label: "Payouts" }]}
      />
      <div className="space-y-6">
        <AdminFilterBar statusOptions={["All", "Pending", "Success", "Failed"]} />
        <PayoutTable payouts={transformedPayouts} />
      </div>
    </PaymentsShell>
  );
}

