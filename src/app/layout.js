import "./globals.css";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "CRED Split | The Elite Way to Split Group Expenses",
  description: "Seamlessly manage shared expenses with premium clarity and control. Split bills, verify proofs, and settle balances effortlessly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-[#f6f3eb] text-[#0f0f12] font-sans antialiased selection:bg-[#0f0f12] selection:text-[#f6f3eb]">
        {children}
      </body>
    </html>
  );
}
