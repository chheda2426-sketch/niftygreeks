import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NiftyGreeks — Live Options Greeks Dashboard",
  description: "Real-time NSE NIFTY options Greeks, scenario analyser, and strategy DSS for serious Indian traders.",
  keywords: ["NIFTY options", "options greeks", "NSE option chain", "delta theta vega", "options trading India"],
  openGraph: {
    title: "NiftyGreeks — Live Options Greeks Dashboard",
    description: "Track Delta, Theta, Vega, Gamma live from NSE. Multi-position portfolio with scenario analysis.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#06060F", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
