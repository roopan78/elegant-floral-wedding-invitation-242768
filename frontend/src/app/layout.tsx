import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P.K. Prabakaran & T. Deepika Wedding Invitation",
  description:
    "Wedding invitation for P.K. Prabakaran and T. Deepika with ceremony details, map link, and calendar actions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
