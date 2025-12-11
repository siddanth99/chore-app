"use client";

import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";

const PrivacyPolicyPage = () => {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information on ChoreBid. Your privacy matters to us."
      lastUpdated="December 2024"
    >
      <div className="space-y-0">
        <LegalSection title="1. Information We Collect">
          <p>We collect information to provide and improve our services. This includes:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Account Information:</strong> Name, email address, phone number, and profile details 
              you provide during registration
            </li>
            <li>
              <strong>Usage Data:</strong> How you interact with the platform, pages visited, features used, 
              and time spent on the app
            </li>
            <li>
              <strong>Location Data:</strong> Approximate location to show relevant chores nearby (with your permission)
            </li>
            <li>
              <strong>Communication Data:</strong> Messages exchanged between Customers and Workers through our platform
            </li>
            <li>
              <strong>Payment Information:</strong> Processed securely by third-party payment providers; 
              we do not store full payment credentials
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide, maintain, and improve our platform and services</li>
            <li>Match Customers with suitable Workers based on location and preferences</li>
            <li>Process transactions and send related notifications</li>
            <li>Communicate important updates, security alerts, and support messages</li>
            <li>Personalize your experience and show relevant content</li>
            <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
            <li>Comply with legal obligations and enforce our terms</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Cookies & Tracking">
          <p>
            We use cookies and similar tracking technologies to enhance your experience on ChoreBid. 
            These technologies help us:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Remember your preferences and login status</li>
            <li>Understand how you use our platform</li>
            <li>Measure the effectiveness of our features</li>
            <li>Provide targeted and relevant content</li>
          </ul>
          <p className="mt-3">
            You can manage cookie preferences through your browser settings. However, disabling cookies 
            may affect some platform functionality.
          </p>
        </LegalSection>

        <LegalSection title="4. Third-Party Services">
          <p>
            We work with trusted third-party service providers to operate our platform. These may include:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Payment Processors:</strong> Such as Razorpay or Stripe, to securely handle transactions
            </li>
            <li>
              <strong>Analytics Providers:</strong> To help us understand usage patterns and improve our services
            </li>
            <li>
              <strong>Email & Communication Services:</strong> To send notifications and updates
            </li>
            <li>
              <strong>Cloud Infrastructure:</strong> To host and secure our platform
            </li>
          </ul>
          <p className="mt-3">
            These providers have access only to the information necessary to perform their functions and 
            are obligated to protect your data.
          </p>
        </LegalSection>

        <LegalSection title="5. Data Retention">
          <p>
            We retain your personal information for as long as necessary to provide our services, comply 
            with legal obligations, resolve disputes, and enforce our agreements.
          </p>
          <p>
            When you delete your account, we will remove or anonymize your personal data within a reasonable 
            timeframe, except where retention is required by law.
          </p>
        </LegalSection>

        <LegalSection title="6. Data Security">
          <p>
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction.
          </p>
          <p>
            These measures include encryption, secure server infrastructure, access controls, and regular 
            security assessments. However, no method of transmission over the internet is 100% secure, 
            and we cannot guarantee absolute security.
          </p>
        </LegalSection>

        <LegalSection title="7. Your Rights & Choices">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate or incomplete data</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Withdraw consent where processing is based on consent</li>
            <li>Request data portability in a structured format</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us through our Contact page. We will respond to 
            your request within a reasonable timeframe.
          </p>
        </LegalSection>

        <LegalSection title="8. Children's Privacy">
          <p>
            ChoreBid is not intended for users under the age of 18. We do not knowingly collect personal 
            information from children. If we become aware that a child has provided us with personal data, 
            we will take steps to delete such information promptly.
          </p>
          <p>
            If you believe a child has provided us with personal information, please contact us immediately.
          </p>
        </LegalSection>

        <LegalSection title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or 
            applicable laws. When we make significant changes, we will notify you through the platform 
            or via email.
          </p>
          <p>
            We encourage you to review this policy periodically. The "Last updated" date at the top 
            indicates when the policy was last revised.
          </p>
        </LegalSection>

        <LegalSection title="10. Contact Information">
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
            please reach out to us through our Contact page. We take your privacy seriously and will address 
            your inquiry promptly.
          </p>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
};

export default PrivacyPolicyPage;
