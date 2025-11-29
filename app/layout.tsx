// app/layout.tsx
import "./globals.css";
import TopNavbar from "./components/TopNavbar";
import { EB_Garamond } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext"; // ✅

const ebg = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
});

export const metadata = {
  title: "Vizuara AI Labs",
  description: "Research • Publications • People",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ebg.variable}>
      <body className="antialiased pt-16">
        <AuthProvider>
          <TopNavbar />
          <main className="min-h-screen">
            <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 md:py-16">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
