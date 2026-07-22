import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BayanIA — Assistant Juridique Intelligent",
  description:
    "BayanIA transforme la recherche juridique au Maroc. Accédez instantanément à la jurisprudence, analysez vos contrats et sécurisez vos données avec une précision inégalée.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-surface text-navy-600 font-sans">
        {children}
      </body>
    </html>
  );
}
