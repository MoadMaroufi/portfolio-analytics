import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = { title: "Portfolio Analytics" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}