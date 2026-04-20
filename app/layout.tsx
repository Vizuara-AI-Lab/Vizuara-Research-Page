import "./globals.css";
import TopNavbar from "./components/TopNavbar";
import { Figtree } from "next/font/google";
import { ThemeProvider } from "next-themes";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Vizuara Research Bootcamps",
  description: "AI & ML Research Programs · Publications · People",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{localStorage.removeItem('theme');localStorage.removeItem('vizuara-theme')}catch(e){}` }} />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="vizuara-theme">
          <TopNavbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
