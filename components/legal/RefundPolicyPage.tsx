"use client";

import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";

const RefundPolicyPage = () => {
  return (
    <LegalPageLayout
      title="Cancellation & Refund Policy"
      subtitle="This policy applies to chores booked through the ChoreBid platform. Please read carefully before booking or accepting a chore."
      lastUpdated="December 2024"
    >
      <div className="space-y-0">
        <LegalSection title="1. General Guidelines">
          <p>
            ChoreBid facilitates connections between Customers and Workers. Cancellations and refunds are 
            handled according to the guidelines below, with the goal of being fair to both parties.
          </p>
          <p>
            We encourage open communication between Customers and Workers to resolve issues before 
            requesting cancellations or refunds through the platform.
          </p>
        </LegalSection>

        <LegalSection title="2. Cancellations by Customers">
          <p>Customers may cancel a booked chore under the following conditions:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>More than 24 hours before scheduled time:</strong> Full refund of any prepaid amount
            </li>
            <li>
              <strong>12–24 hours before scheduled time:</strong> Partial refund (up to 50% may be retained as cancellation fee)
            </li>
            <li>
              <strong>Less than 12 hours before scheduled time:</strong> No refund; Worker may have already prepared or traveled
            </li>
            <li>
              <strong>After the chore has started:</strong> No refund unless there's a valid dispute (see Disputes section)
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Cancellations by Service Providers">
          <p>When a Worker cancels an accepted chore:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Before the scheduled time:</strong> Customer receives a full refund and may be offered priority rebooking
            </li>
            <li>
              <strong>No-show without notice:</strong> Customer receives a full refund; Worker may face account penalties
            </li>
            <li>
              <strong>Emergency cancellations:</strong> Workers should notify Customers as soon as possible; 
              refunds will be processed based on circumstances
            </li>
          </ul>
          <p className="mt-3">
            Repeated cancellations by Workers may result in reduced visibility or account suspension.
          </p>
        </LegalSection>

        <LegalSection title="4. No-Show or Last-Minute Cancellations">
          <p>
            <strong>Worker No-Show:</strong> If the Worker fails to arrive at the agreed time and location 
            without prior notice, the Customer is entitled to a full refund.
          </p>
          <p>
            <strong>Customer Not Present:</strong> If the Customer is not available at the agreed time and 
            location without prior notice, the Worker may be entitled to a waiting fee or partial payment 
            for their time.
          </p>
        </LegalSection>

        <LegalSection title="5. Eligibility for Refunds">
          <p>Refunds may be granted in the following situations:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>The chore was cancelled within the eligible cancellation window</li>
            <li>The Worker did not show up and did not communicate</li>
            <li>The service provided was significantly different from what was agreed upon</li>
            <li>There was a safety issue or violation of platform policies</li>
            <li>Technical issues on the platform prevented the chore from being completed</li>
            <li>Duplicate or accidental payments were made</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Non-Refundable Situations">
          <p>Refunds are generally not available in these scenarios:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>The chore was completed as agreed, regardless of satisfaction (quality disputes have a separate process)</li>
            <li>Cancellation was made after the allowed cancellation window</li>
            <li>The Customer was not present and did not notify the Worker in advance</li>
            <li>Issues arising from factors outside the Worker's control (weather, traffic, etc.)</li>
            <li>Change of mind after the service has been rendered</li>
            <li>Violation of platform terms by the Customer</li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Refund Timelines">
          <p>Once a refund is approved:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Credit/Debit Cards:</strong> 5–10 business days, depending on your bank
            </li>
            <li>
              <strong>UPI/Wallet:</strong> 1–3 business days
            </li>
            <li>
              <strong>Net Banking:</strong> 5–7 business days
            </li>
            <li>
              <strong>Platform Credits:</strong> Instant (if you choose credit instead of cash refund)
            </li>
          </ul>
          <p className="mt-3">
            Please note that refund processing times depend on your payment provider and may vary.
          </p>
        </LegalSection>

        <LegalSection title="8. How to Request a Cancellation or Refund">
          <p>To request a cancellation or refund:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>In-App:</strong> Go to "My Chores" → select the chore → tap "Cancel" or "Request Refund"
            </li>
            <li>
              <strong>Contact Support:</strong> Reach out through our Contact page with your booking details
            </li>
            <li>
              <strong>Include:</strong> Chore ID, reason for cancellation/refund, and any supporting information
            </li>
          </ul>
          <p className="mt-3">
            Our support team will review your request and respond within 24–48 hours.
          </p>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
};

export default RefundPolicyPage;
