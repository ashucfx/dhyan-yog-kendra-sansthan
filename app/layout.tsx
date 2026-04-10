import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./components/cart-provider";
import { CalendlyAssets } from "./components/calendly";

export const metadata: Metadata = {
  title: "Dhyan Yog Kendra Evam Prakratik Chikitsa Shodh Sansthan | Dhyan Yog Kendra Evam Prakratik Chikitsa Shodh Sansthan",
  description:
    "Dhyan Yog Kendra Evam Prakratik Chikitsa Shodh Sansthan offers yoga, meditation, and natural wellness programs designed to help you feel calmer, lighter, stronger, and more balanced. Contact: dhyanvedaglobal@gmail.com",
  icons: {
    icon: "/logo-icon.png",
    shortcut: "/logo-icon.png",
    apple: "/logo-icon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CalendlyAssets />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
