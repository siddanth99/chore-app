"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PaymentsDebugPage() {
  const [result, setResult] = useState<string>("(no request yet)");

  const testCreateOrder = async () => {
    setResult("Loading...");

    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1, notes: { test: "debug" } }),
      });

      const text = await res.text();

      setResult(
        `Status: ${res.status} ${res.statusText}\nBody:\n${text}`
      );
      console.log("DEBUG create-order raw response:", { status: res.status, text });
    } catch (err) {
      console.error("DEBUG create-order fetch error:", err);
      setResult("Fetch error: " + (err as Error).message);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Payments Debug</h1>
      <Button onClick={testCreateOrder}>Test /api/payments/create-order</Button>
      <pre className="mt-4 p-4 bg-muted rounded text-sm whitespace-pre-wrap">
        {result}
      </pre>
    </div>
  );
}

