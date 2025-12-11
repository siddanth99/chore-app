import { Metadata } from "next";
import ShippingPolicyPage from "@/components/legal/ShippingPolicyPage";

export const metadata: Metadata = {
  title: "Shipping & Service Delivery Policy | ChoreBid",
  description: "ChoreBid primarily connects Customers with Workers for services. Here's what you need to know about service delivery.",
};

export default function Page() {
  return <ShippingPolicyPage />;
}
