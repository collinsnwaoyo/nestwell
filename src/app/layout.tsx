import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

// Self-hosted (not next/font/google) so the build never depends on
// reaching Google Fonts over the network.
const manrope = localFont({
  src: "../fonts/manrope-variable.woff2",
  variable: "--font-sans",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nestwell",
  description: "Rent and occupancy manager for a Lagos co-living operator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "rounded-2xl! border! border-border! bg-background! text-foreground! shadow-lg!",
            },
          }}
        />
      </body>
    </html>
  );
}
