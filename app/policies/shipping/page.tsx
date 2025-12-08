// app/policies/shipping/page.tsx
import React from 'react';

export default function Page() {
  const BUSINESS_NAME = 'ChoreApp';

  return (
    <main className="prose max-w-4xl mx-auto px-6 py-12">
      <h1>Shipping Policy</h1>

      <section>
        <p>
          {BUSINESS_NAME} is a service marketplace for local chores and on-site services. We do not ship physical goods
          as part of our core service offering unless explicitly stated in a specific listing.
        </p>
      </section>

      <section>
        <h2>If a service includes goods</h2>
        <p>
          If a Chore includes delivery of physical items (for example, purchases made on behalf of a customer), the listing
          will clearly state shipment details, estimated delivery timelines, and any charges. In such cases, the Worker or
          a designated logistics partner handles the delivery. Delivery terms for goods differ from our general service terms
          and will be specified in the chore description.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions regarding items or deliveries should be raised via the booking chat or our <a href="/policies/contact">Contact page</a>.
        </p>
      </section>
    </main>
  );
}