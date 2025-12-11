import { Metadata } from "next";
import PrivacyPolicyPage from "@/components/legal/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | ChoreBid",
  description: "How we collect, use, and protect your information on ChoreBid. Your privacy matters to us.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
