import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { UnitsProvider } from "@/lib/units";

const fontBody = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const fontHeading = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "GuardaFit",
  description: "Trainer console for building and tracking client plans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontBody.variable} ${fontHeading.variable}`}>
      <body>
        <LanguageProvider>
          <UnitsProvider>{children}</UnitsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
