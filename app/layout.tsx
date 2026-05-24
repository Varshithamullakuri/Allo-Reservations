import type { Metadata } from "next";

import "./globals.css";
import { AppHeader } from "@/components/layout/app-header";
import { AppProviders } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "Allo Reservations",
  description: "Concurrency-safe ecommerce inventory reservation system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AppHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
