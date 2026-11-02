import type { Metadata } from "next";
import { Toaster } from "sonner";
import { INTRO_SCRIPT } from "@/lib/intro";
import "./globals.css";

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        <link
          rel="preload"
          href="/fonts/inter-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          duration={4000}
          offset={20}
          mobileOffset={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
          toastOptions={{
            classNames: {
              toast: "rounded-lg! border! border-border! bg-surface! text-foreground! shadow-2! font-sans! text-body!",
              description: "text-muted-foreground!",
              actionButton: "bg-primary! text-primary-foreground! rounded-md! font-medium!",
              success: "[&_[data-icon]]:text-positive!",
              error: "[&_[data-icon]]:text-danger!",
            },
          }}
        />
      </body>
    </html>
  );
}
