// app/policies/contact/page.tsx
import React from 'react';

export default function Page() {
  const BUSINESS_NAME = 'ChoreApp';
  const supportEmail = 'support@yourdomain.com';
  const phone = '+91-6301527266';
  const address = 'Your Business Address, City, State, PIN';

  return (
    <main className="prose max-w-2xl mx-auto px-6 py-12">
      <h1>Contact Us</h1>

      <p>
        For questions about bookings, refunds, or support, contact {BUSINESS_NAME}:
      </p>

      <ul>
        <li><strong>Email:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a></li>
        <li><strong>Phone:</strong> <a href={`tel:${phone}`}>{phone}</a></li>
        <li><strong>Address:</strong> {address}</li>
      </ul>

      <section>
        <h2>Support hours</h2>
        <p>Monday–Friday, 9:00 AM – 6:00 PM IST (excluding public holidays). For urgent issues outside these hours please contact via email and we'll respond as soon as possible.</p>
      </section>

      <section>
        <h2>Report abuse or safety concerns</h2>
        <p>If you experience harassment, fraud, or a safety issue related to a Worker or Customer, contact us immediately at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
      </section>
    </main>
  );
}