import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
export const metadata: Metadata = { title: { default: "LensStories — The stories behind the change", template: "%s — LensStories" }, description: "A visual journal of the people, ideas, and small acts shaping a more thoughtful world.", openGraph: { type: "website", siteName: "LensStories" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>; }
