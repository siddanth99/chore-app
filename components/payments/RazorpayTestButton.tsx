"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Type declaration for Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayTestButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Check if Razorpay SDK is loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        setMessage("❌ Razorpay SDK not loaded yet. Please wait a moment and try again.");
        setLoading(false);
        return;
      }

      // Step 1: Create order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1, // rupees
          choreId: undefined, // TODO: pass a real choreId when available
          notes: { test: "chorebid-test-payment" },
        }),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error("Failed to create order (RazorpayTestButton v2):", {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          response: errorText,
        });
        setMessage("❌ Failed to create order. Please try again.");
        setLoading(false);
        return;
      }

      const { orderId, amount, currency, paymentId } = await orderResponse.json();
      console.log("Created Razorpay order and DB payment:", {
        orderId,
        paymentId,
        amount,
        currency,
      });

      // Step 2: Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount, // ✅ already in paise from backend
        currency, // "INR"
        order_id: orderId,
        name: "ChoreBid",
        description: "Test Payment",
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9876543210",
        },
        theme: {
          color: "#4F46E5",
        },
        handler: async function (response: any) {
          try {
            // Step 3: Verify payment signature
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errorText = await verifyResponse.text();
              console.error("Failed to verify payment:", {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                response: errorText,
              });
              setMessage("❌ Payment verification failed. Please try again.");
              setLoading(false);
              return;
            }

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setMessage("✅ Test payment success & verified!");
            } else {
              setMessage(`❌ Payment verification failed: ${verifyData.error || "Unknown error"}`);
            }
          } catch (error) {
            console.error("Verification error:", error);
            setMessage("❌ Error verifying payment");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setMessage("ℹ️ Payment popup closed");
            setLoading(false);
          },
        },
      };

      // Step 4: Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      setMessage("❌ An error occurred while processing payment");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={handlePayment}
        disabled={loading}
        size="lg"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </>
        ) : (
          "Test Razorpay Payment (₹1)"
        )}
      </Button>
      {message && (
        <p className="text-sm text-center text-muted-foreground max-w-md">
          {message}
        </p>
      )}
    </div>
  );
}

