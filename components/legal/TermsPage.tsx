"use client";

import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";

const TermsPage = () => {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using ChoreBid. By accessing or using our platform, you agree to be bound by these terms."
      lastUpdated="December 2024"
    >
      <div className="space-y-0">
        <LegalSection title="1. About ChoreBid">
          <p>
            ChoreBid is an online marketplace that connects customers who need help with everyday tasks ("Chores") 
            with independent service providers ("Workers") who can complete those tasks. ChoreBid acts solely as 
            a platform facilitator — we are not the service provider, employer, or agent of any Worker.
          </p>
          <p>
            Our role is to provide the technology and tools to help Customers and Workers connect, communicate, 
            and transact. The actual service relationship exists solely between the Customer and the Worker.
          </p>
        </LegalSection>

        <LegalSection title="2. Eligibility & User Accounts">
          <p>To use ChoreBid, you must:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Be at least 18 years of age (or the legal age of majority in your jurisdiction)</li>
            <li>Provide accurate, complete, and current information during registration</li>
            <li>Maintain the security and confidentiality of your account credentials</li>
            <li>Accept full responsibility for all activities that occur under your account</li>
          </ul>
          <p className="mt-3">
            You agree to notify us immediately of any unauthorized use of your account or any other security breach.
          </p>
        </LegalSection>

        <LegalSection title="3. Use of the Platform">
          <p>When using ChoreBid, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use the platform only for lawful purposes</li>
            <li>Provide honest and accurate information in all interactions</li>
            <li>Respect other users and communicate professionally</li>
            <li>Comply with all applicable local, state, and national laws</li>
            <li>Not interfere with or disrupt the platform's functionality</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Posting and Managing Chores">
          <p>As a Customer posting chores, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide clear, accurate descriptions of the task requirements</li>
            <li>Set fair and reasonable budgets for the work requested</li>
            <li>Not post illegal, harmful, or inappropriate content</li>
            <li>Respond to Worker inquiries and applications in a timely manner</li>
            <li>Honor agreed-upon terms once a Worker is selected</li>
          </ul>
          <p className="mt-3">
            ChoreBid reserves the right to remove any chore posting that violates these terms or our community guidelines.
          </p>
        </LegalSection>

        <LegalSection title="5. Applying to Chores & Providing Services">
          <p>As a Worker offering services, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Only apply for chores you are qualified and able to complete</li>
            <li>Provide services professionally and to the best of your ability</li>
            <li>Communicate clearly with Customers about timelines and expectations</li>
            <li>Complete agreed-upon work in a timely manner</li>
            <li>Maintain any necessary licenses, permits, or insurance for your services</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Payments & Fees">
          <p>
            Payments on ChoreBid are processed through secure third-party payment providers. ChoreBid facilitates 
            transactions but does not directly handle cash or store payment credentials.
          </p>
          <p>
            Service fees may apply to transactions. These fees will be clearly disclosed before you confirm any 
            payment. By using the platform, you agree to pay all applicable fees.
          </p>
        </LegalSection>

        <LegalSection title="7. Cancellations & Disputes">
          <p>
            Cancellations and refunds are subject to our Cancellation & Refund Policy. In the event of a dispute 
            between a Customer and Worker, ChoreBid may, at its discretion, attempt to mediate but is not 
            obligated to resolve disputes.
          </p>
          <p>
            For detailed information on cancellations and refunds, please refer to our Cancellation & Refund Policy.
          </p>
        </LegalSection>

        <LegalSection title="8. Prohibited Activities">
          <p>The following activities are strictly prohibited on ChoreBid:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Spam, unsolicited advertising, or promotional content</li>
            <li>Fraudulent, deceptive, or misleading behavior</li>
            <li>Harassment, abuse, or threatening conduct toward other users</li>
            <li>Posting or sharing illegal, harmful, or offensive content</li>
            <li>Attempting to circumvent platform fees or payment systems</li>
            <li>Creating multiple accounts for deceptive purposes</li>
            <li>Scraping, data mining, or unauthorized automated access</li>
            <li>Any activity that violates applicable laws or regulations</li>
          </ul>
        </LegalSection>

        <LegalSection title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, ChoreBid and its affiliates shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages arising from:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Your use of or inability to use the platform</li>
            <li>Any transaction or relationship between Customers and Workers</li>
            <li>Unauthorized access to your account or data</li>
            <li>The quality, safety, or legality of services provided by Workers</li>
          </ul>
          <p className="mt-3">
            ChoreBid provides the platform "as is" without warranties of any kind, express or implied.
          </p>
        </LegalSection>

        <LegalSection title="10. Changes to These Terms">
          <p>
            We may update these Terms & Conditions from time to time. When we make changes, we will update the 
            "Last updated" date at the top of this page. Your continued use of ChoreBid after any changes 
            constitutes acceptance of the updated terms.
          </p>
          <p>
            We encourage you to review these terms periodically to stay informed about our policies.
          </p>
        </LegalSection>

        <LegalSection title="11. Contact Information">
          <p>
            If you have any questions about these Terms & Conditions, please reach out to us through our 
            Contact page. We're here to help and will respond to your inquiry as soon as possible.
          </p>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
};

export default TermsPage;
