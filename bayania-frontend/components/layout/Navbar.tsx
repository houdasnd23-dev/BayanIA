import Link from "next/link";
import { Scale, ChevronDown } from "lucide-react";

const navLinks = [
  { label: "Fonctionnalités", href: "/#fonctionnalites" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Tarifs", href: "/#tarifs" },
];

export default function Navbar() {
  return (
    <header className="w-full border-b border-surface-border bg-white/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-600 text-white">
            <Scale size={16} strokeWidth={2} />
          </span>
          <span className="font-serif text-lg font-semibold text-navy-600">
            BayanIA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-navy-500">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-navy-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <button className="flex items-center gap-1 hover:text-navy-600 transition-colors">
            Ressources
            <ChevronDown size={14} />
          </button>
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/connexion"
            className="hidden sm:inline text-sm text-navy-500 hover:text-navy-600 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="inline-flex items-center rounded-md bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 transition-colors"
          >
            Essai Gratuit
          </Link>
        </div>
      </div>
    </header>
  );
}
