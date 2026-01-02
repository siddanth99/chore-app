'use client';

import React from "react";
import { PaymentsShell, adminPaymentTabs } from "@/components/payments/PaymentsShell";
import { PageHeader } from "@/components/payments/PageHeader";
import { AdminFilterBar } from "@/components/payments/admin/AdminFilterBar";
import { PaymentTable } from "@/components/payments/admin/PaymentTable";
interface AdminPaymentsPageProps {
  summary: {
    totalPayments: number;
    totalVolume: number;
    successfulPayments: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    customer: string;
    customerId: string;
    worker: string | null;
    workerId: string | null;
    choreTitle: string | null;
    choreId: string | null;
    method: string;
    createdAt: Date;
  }>;
}

export default function AdminPaymentsPage({ summary, payments }: AdminPaymentsPageProps) {
  // Transform payments for UI
  const transformedPayments = payments.map((p) => {
    const statusMap: Record<string, 'funded' | 'pending' | 'success' | 'failed' | 'refunded'> = {
      PENDING: 'pending',
      SUCCESS: 'success',
      FAILED: 'failed',
      REFUNDED: 'refunded',
    };

    return {
      id: p.id,
      customer: p.customer,
      worker: p.worker || 'Unassigned',
      choreTitle: p.choreTitle || 'Unknown Chore',
      amount: p.amount,
      status: statusMap[p.status] || 'pending',
      method: p.method,
      createdAt: new Date(p.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  });

  return (
    <PaymentsShell tabs={adminPaymentTabs} activeTab="payments">
      <PageHeader
        title="Platform Payments"
        subtitle="Overview of all customer payments flowing into Chore App."
        breadcrumbs={[{ label: "Admin" }, { label: "Payments" }]}
      />
      <div className="space-y-6">
        <AdminFilterBar />
        <PaymentTable payments={transformedPayments} />
      </div>
    </PaymentsShell>
  );
}

