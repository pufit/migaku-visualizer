import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: true,
});

export const metadata: Metadata = {
  title: "Migaku Visualizer",
  description: "Visualize your Japanese learning progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={notoSansJP.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4 md:gap-6">
                  <Link href="/" className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Migaku Visualizer
                  </Link>
                  <nav className="flex gap-3 md:gap-6">
                    <Link href="/" className="text-xs md:text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                      Statistics
                    </Link>
                    <Link href="/kanji" className="text-xs md:text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                      Kanji
                    </Link>
                    <Link href="/practice" className="text-xs md:text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                      Practice
                    </Link>
                  </nav>
                </div>
                <ThemeToggle />
              </div>
            </header>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
