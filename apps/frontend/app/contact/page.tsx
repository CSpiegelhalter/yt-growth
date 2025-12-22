import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact | YT Growth",
  description: "Get in touch with us",
};

export default async function ContactPage() {
  // Get session to pre-fill email if signed in
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;

  return <ContactClient userEmail={userEmail} />;
}

