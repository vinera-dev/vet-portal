import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vet Portal", template: "%s | Vet Portal" },
  description: "Book appointments and chat with the clinic assistant.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" className="site-main">
          {children}
        </main>
        <footer className="site-footer">
          <p>Demo clinic. All data shown is fictional.</p>
        </footer>
      </body>
    </html>
  );
}
