import { Metadata } from "next";
import RefundPolicyPage from "@/components/legal/RefundPolicyPage";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | ChoreBid",
  description: "This policy applies to chores booked through the ChoreBid platform. Please read carefully before booking or accepting a chore.",
};

export default function Page() {
  return <RefundPolicyPage />;
}
