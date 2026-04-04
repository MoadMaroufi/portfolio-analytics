import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import LegalFooter from "@/components/LegalFooter";
import { LangProvider } from "@/lib/lang";

export const metadata = { title: "Portfolio Analytics" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <LangProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <LegalFooter />
          </div>
        </LangProvider>
        <Analytics />
      </body>
    </html>
  );
}
