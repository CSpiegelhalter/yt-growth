import { Metadata } from "next";
import ChannelProfileClient from "./ChannelProfileClient";

export const metadata: Metadata = {
  title: "Channel Profile | ChannelBoost",
  description:
    "Define your channel's niche, audience, and style to get better recommendations",
  robots: { index: false, follow: false },
};

export default function ChannelProfilePage() {
  return <ChannelProfileClient />;
}
