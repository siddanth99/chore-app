import { Metadata } from "next";
import TermsPage from "@/components/legal/TermsPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | ChoreBid",
  description: "Please read these terms carefully before using ChoreBid. By accessing or using our platform, you agree to be bound by these terms.",
};

export default function Page() {
  return <TermsPage />;
}
