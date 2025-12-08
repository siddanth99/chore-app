// app/policies/refund/page.tsx
import React from 'react';

export default function Page() {
  const BUSINESS_NAME = 'ChoreApp';
  const supportEmail = 'support@yourdomain.com';

  return (
    <main className="prose max-w-4xl mx-auto px-6 py-12">
      <h1>Cancellation &amp; Refund Policy</h1>

      <section>
        <p>
          This Cancellation &amp; Refund Policy explains when customers are eligible for refunds and how cancellations
          are processed for services booked via {BUSINESS_NAME}.
        </p>
      </section>

      <section>
        <h2>1. Cancellation by Customer</h2>
        <p>
          Customers may cancel a booking up to the time specified in the booking UI. If the customer cancels within
          the allowed window, a full or partial refund may be issued depending on the timing and worker preparations.
        </p>
      </section>

      <section>
        <h2>2. Cancellation by Worker</h2>
        <p>
          If a Worker cancels an assigned job at short notice, the Customer may be eligible for a refund or a rebooking
          at no additional cost. We will attempt to re-assign a Worker.
        </p>
      </section>

      <section>
        <h2>3. Refund Process</h2>
        <ol>
          <li>Refunds are processed to the original payment method where possible.</li>
          <li>Refund requests are reviewed and processed within 7 business days.</li>
          <li>Transaction fees charged by payment processors may not be refundable depending on the processor's policy.</li>
        </ol>
      </section>

      <section>
        <h2>4. Disputes</h2>
        <p>
          If you disagree with a decision regarding a refund, contact us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          We will review the case and respond promptly.
        </p>
      </section>

      <section>
        <h2>5. Contact</h2>
        <p>For support and refund requests contact: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
      </section>
    </main>
  );
}