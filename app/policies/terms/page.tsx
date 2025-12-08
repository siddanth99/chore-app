// app/policies/terms/page.tsx
import React from 'react';

export default function Page() {
  const BUSINESS_NAME = 'ChoreApp';
  const effectiveDate = '2025-12-01';

  return (
    <main className="prose max-w-4xl mx-auto px-6 py-12">
      <h1>Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground">Effective date: {effectiveDate}</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the marketplace
          services provided by {BUSINESS_NAME} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By using our website
          or services you agree to these Terms.
        </p>
      </section>

      <section>
        <h2>2. Services</h2>
        <p>
          {BUSINESS_NAME} provides a platform connecting customers who need chores or tasks completed (&ldquo;Customers&rdquo;)
          with independent workers who provide those services (&ldquo;Workers&rdquo;). We are a technology platform and
          do not directly employ the Workers.
        </p>
      </section>

      <section>
        <h2>3. Booking, Pricing &amp; Payment</h2>
        <ul>
          <li>Customers create a chore listing with details, schedule and price.</li>
          <li>Payment is collected via our payment provider at the time of assignment/booking as indicated in the UI.</li>
          <li>All prices are shown in INR unless otherwise indicated and are exclusive of applicable taxes.</li>
        </ul>
      </section>

      <section>
        <h2>4. Cancellation &amp; Refunds</h2>
        <p>
          Cancellation and refund rules are described on our <a href="/policies/refund">Refund &amp; Cancellation</a> page.
          In short, refunds are issued where appropriate: e.g., payment failures, duplicate charges, or if the service was not
          delivered as described. Final decisions on refunds are at our discretion consistent with these Terms.
        </p>
      </section>

      <section>
        <h2>5. Worker Responsibilities</h2>
        <p>
          Workers are independent contractors responsible for performing services professionally and lawfully.
          Customers should review Worker profiles, ratings and reviews prior to assigning a Worker.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, {BUSINESS_NAME} shall not be liable for indirect, incidental,
          special, consequential or punitive damages arising from the use of the platform. Our total liability in
          connection with any claim shall not exceed the fees paid by you for the relevant chore.
        </p>
      </section>

      <section>
        <h2>7. Governing Law</h2>
        <p>
          These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction
          of the courts in your registered jurisdiction, unless otherwise required by law.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          If you have questions about these Terms, contact us via our <a href="/policies/contact">Contact page</a>.
        </p>
      </section>
    </main>
  );
}