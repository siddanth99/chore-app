'use client';

import React from "react";
import { motion } from "framer-motion";
import { Settings, Clock, Shield, Info } from "lucide-react";
import { PaymentsShell } from "@/components/payments/PaymentsShell";
import { PageHeader } from "@/components/payments/PageHeader";
import { PayoutSettingsCard } from "@/components/payments/worker/PayoutSettingsCard";

export default function WorkerPayoutSettingsPage() {
  return (
    <PaymentsShell>
      <PageHeader
        title="Payout Settings"
        subtitle="Add your UPI ID and manage how you get paid."
        breadcrumbs={[{ label: "Dashboard" }, { label: "Payouts" }, { label: "Settings" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PayoutSettingsCard />
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" /> Good to Know
            </h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-cyan-500" />
                <span>Payouts are sent within minutes after chore completion and customer approval.</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="h-4 w-4 mt-0.5 text-emerald-500" />
                <span>All transactions are secured with bank-grade encryption.</span>
              </li>
              <li className="flex items-start gap-3">
                <Settings className="h-4 w-4 mt-0.5 text-amber-500" />
                <span>You can update your UPI ID anytime. Changes take effect immediately.</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </PaymentsShell>
  );
}

