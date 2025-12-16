import { Metadata } from "next";
import { RazorpayTestButton } from "@/components/payments/RazorpayTestButton";

export const metadata: Metadata = {
  title: "Razorpay Payment | ChoreBid",
};

export default function RazorpayTestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Card Container */}
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Razorpay Payment
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Test the Razorpay payment flow
              </p>
            </div>

            {/* Test Button */}
            <div className="mb-8">
              <RazorpayTestButton />
            </div>

            {/* Info Section */}
            <div className="border-t border-border pt-6 mt-6">
              <h2 className="text-lg font-semibold mb-3">Payment Instructions</h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Complete the payment using any valid payment method supported by Razorpay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

