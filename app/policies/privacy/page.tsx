// app/policies/privacy/page.tsx
import React from 'react';

export default function Page() {
  const BUSINESS_NAME = 'ChoreApp';
  const supportEmail = 'support@yourdomain.com';

  return (
    <main className="prose max-w-4xl mx-auto px-6 py-12">
      <h1>Privacy Policy</h1>

      <section>
        <p>
          {BUSINESS_NAME} ("we", "us", "our") respects your privacy. This Privacy Policy explains what personal data
          we collect, why we collect it, how we use it, and your rights.
        </p>
      </section>

      <section>
        <h2>1. Data We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email, phone number, password hash.</li>
          <li><strong>Profile data:</strong> bio, skills, hourly rate, avatar.</li>
          <li><strong>Payment data:</strong> payment provider tokens and transaction metadata (we do NOT store full card details).</li>
          <li><strong>Usage data:</strong> logs, IP address, device and browser identifiers.</li>
        </ul>
      </section>

      <section>
        <h2>2. How We Use Your Data</h2>
        <p>We use data to:</p>
        <ul>
          <li>Provide and operate the platform (matching, booking, payments).</li>
          <li>Process payments via our payment provider (e.g. Razorpay).</li>
          <li>Communicate important updates, security notices and transactional messages.</li>
          <li>Improve and secure the product, and prevent fraud or abuse.</li>
        </ul>
      </section>

      <section>
        <h2>3. Third Parties</h2>
        <p>
          We share data with service providers who perform services on our behalf: payment processors, analytics,
          hosting, and messaging providers. We only share the minimum data necessary and require those providers
          to protect your data.
        </p>
      </section>

      <section>
        <h2>4. Payment Processing</h2>
        <p>
          Payments are processed by a third-party payment processor (e.g. Razorpay). We do not collect or store full
          card data on our servers. Please review your payment provider's privacy policy for details about their data handling.
        </p>
      </section>

      <section>
        <h2>5. Data Retention &amp; Your Rights</h2>
        <p>
          We retain personal data for as long as necessary to provide the service and comply with legal obligations.
          You may request access, correction, or deletion of your data by contacting us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          We follow industry best practices to secure data (encryption in transit, hashed passwords, limited access).
          However, no system is 100% secure — if you suspect a breach contact us immediately at {supportEmail}.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>To exercise your rights or for privacy inquiries contact: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
      </section>
    </main>
  );
}