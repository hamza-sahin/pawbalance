import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { IntlProvider } from "@/components/intl-provider";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PawBalance",
  description: "Your pocket dog nutritionist - PawBalance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-canvas text-txt min-h-screen antialiased">
        <IntlProvider>
          <Providers>{children}</Providers>
        </IntlProvider>
      </body>
    </html>
  );
}
