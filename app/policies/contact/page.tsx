import { Metadata } from "next";
import ContactPage from "@/components/legal/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us | ChoreBid",
  description: "We're here to help with any questions about your chores, account, or our platform. Reach out and we'll get back to you soon.",
};

export default function Page() {
  return <ContactPage />;
}
