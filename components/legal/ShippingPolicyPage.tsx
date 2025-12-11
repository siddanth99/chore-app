"use client";

import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";

const ShippingPolicyPage = () => {
  return (
    <LegalPageLayout
      title="Shipping & Service Delivery Policy"
      subtitle="ChoreBid primarily connects Customers with Workers for services. Here's what you need to know about service delivery."
      lastUpdated="December 2024"
    >
      <div className="space-y-0">
        <LegalSection title="1. Nature of Our Services">
          <p>
            ChoreBid is a service marketplace, not a shipping or e-commerce platform. The vast majority of 
            chores involve:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>In-Person Services:</strong> Cleaning, repairs, moving help, pet care, gardening, etc.
            </li>
            <li>
              <strong>Online Services:</strong> Virtual assistance, data entry, tutoring, design work, etc.
            </li>
          </ul>
          <p className="mt-3">
            No physical products are shipped through our platform. Service delivery depends on the 
            agreement between the Customer and Worker.
          </p>
        </LegalSection>

        <LegalSection title="2. When Physical Items Are Involved">
          <p>
            Some chores may involve physical items, such as:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tools or materials needed for a repair or handyman task</li>
            <li>Keys for property access</li>
            <li>Documents for delivery or pickup</li>
            <li>Groceries or items for errand-type chores</li>
          </ul>
          <p className="mt-3">
            In these cases, the Customer and Worker should agree on logistics before the chore begins. 
            ChoreBid is not responsible for the handling, shipping, or condition of physical items.
          </p>
        </LegalSection>

        <LegalSection title="3. Service Delivery & Timelines">
          <p>
            Services are scheduled at times agreed upon by both Customer and Worker. Delivery timelines 
            depend on several factors:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Scheduling:</strong> Chores are completed at the mutually agreed date and time
            </li>
            <li>
              <strong>Duration:</strong> Service length varies based on the chore type and scope
            </li>
            <li>
              <strong>Confirmation:</strong> Both parties should confirm details before the scheduled time
            </li>
          </ul>
          <p className="mt-3">
            We recommend communicating clearly about expectations, arrival times, and any special requirements.
          </p>
        </LegalSection>

        <LegalSection title="4. Service Areas">
          <p>
            ChoreBid operates in select cities and regions. Service availability depends on:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Active Workers in your area</li>
            <li>The type of chore requested</li>
            <li>Geographic limitations for in-person services</li>
          </ul>
          <p className="mt-3">
            For online chores, location is generally not a limiting factor. For in-person chores, you'll 
            see available Workers based on your specified location.
          </p>
        </LegalSection>

        <LegalSection title="5. Delays & Rescheduling">
          <p>
            Sometimes delays or rescheduling may be necessary due to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Traffic, weather, or other unforeseen circumstances</li>
            <li>Emergency situations affecting either party</li>
            <li>Changes in Customer requirements</li>
            <li>Worker availability issues</li>
          </ul>
          <p className="mt-3">
            We encourage both parties to communicate promptly if delays occur. Most issues can be resolved 
            through mutual understanding and rescheduling.
          </p>
          <p>
            For details on how delays affect refunds, please refer to our Cancellation & Refund Policy.
          </p>
        </LegalSection>

        <LegalSection title="6. Damage or Loss of Items">
          <p>
            When chores involve physical items or property:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Customer Responsibility:</strong> Secure valuables and provide clear instructions for item handling
            </li>
            <li>
              <strong>Worker Responsibility:</strong> Handle items with care and report any issues immediately
            </li>
            <li>
              <strong>Disputes:</strong> If damage or loss occurs, document the issue and contact support
            </li>
          </ul>
          <p className="mt-3">
            ChoreBid facilitates communication and dispute resolution but is not liable for damage or 
            loss caused during service delivery. We strongly recommend clear communication and, for 
            high-value items, appropriate insurance coverage.
          </p>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
};

export default ShippingPolicyPage;
