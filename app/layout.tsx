import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppChrome } from "@/components/AppChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FlexMed — Research-Grade Peptide Catalog",
    template: "%s | FlexMed",
  },
  description:
    "Research-grade peptides and bio regulators with third-party testing, batch transparency, and published certificate-of-analysis documentation.",
  robots: { index: false, follow: false },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230B0C10'/><text y='24' x='4' font-size='22' fill='%236882C4'>F</text></svg>",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasGatewayAcceptance =
    (await cookies()).get("flexmed_research_gateway_v2")?.value === "accepted";

  return (
    <html lang="en" className="dark">
      <body
        style={{
          background: "#071A3D",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          margin: 0,
        }}
      >
        <AppChrome hasGatewayAcceptance={hasGatewayAcceptance}>{children}</AppChrome>
      </body>
    </html>
  );
}
