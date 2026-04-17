import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FlexMed — Research-Grade Peptide Catalog",
    template: "%s | FlexMed",
  },
  description:
    "Research-grade peptides for verified institutional laboratories. Every batch third-party tested. Every Certificate of Analysis published before procurement.",
  robots: { index: false, follow: false },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230A0B0E'/><text y='24' x='4' font-size='22' fill='%23B8A898'>F</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          background: "#0A0B0E",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          margin: 0,
        }}
      >
        <NavBar />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
