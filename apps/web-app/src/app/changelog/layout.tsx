import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "View the latest updates and improvements to Ruler.",
  openGraph: {
    title: "Changelog | Ruler",
    description: "View the latest updates and improvements to Ruler.",
  },
  twitter: {
    title: "Changelog | Ruler",
    description: "View the latest updates and improvements to Ruler.",
  }
};

export default function ChangelogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
} 