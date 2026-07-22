import Link from "next/link";
import { Scale, Globe } from "lucide-react";

// lucide-react a retiré les icônes de marque (Linkedin, Twitter) ; on reproduit
// des traits fins équivalents pour rester fidèle au pied de page des maquettes.
function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 8.5v9M6.5 5.5v.01M11 17.5v-5.2c0-1.8 1.2-3.3 3-3.3s3 1.3 3 3.3v5.2M11 9.2v8.3" />
    </svg>
  );
}
function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5.5c-.7.4-1.5.6-2.3.8a3.3 3.3 0 0 0-5.6 3v.7A9.3 9.3 0 0 1 4.7 6.4s-3 6.8 4 9.9a10 10 0 0 1-6 1.6c7 4 15.4 0 15.4-8.9 0-.3 0-.5-.1-.8A6.5 6.5 0 0 0 20 5.5Z" />
    </svg>
  );
}

const columns = [
  {
    title: "Plateforme",
    links: ["Accueil", "Fonctionnalités", "Tarifs", "Blog"],
  },
  {
    title: "Légal",
    links: [
      "Mentions légales",
      "Conditions générales",
      "Politique de confidentialité",
      "Sécurité des données",
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-surface-muted border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-600 text-white">
              <Scale size={14} />
            </span>
            <span className="font-serif text-base font-semibold text-navy-600">
              BayanIA
            </span>
          </div>
          <p className="text-sm text-navy-400 leading-relaxed">
            L&apos;assistant juridique IA premium conçu pour le droit
            marocain. Accélérez vos recherches, vérifiez la jurisprudence et
            optimisez votre efficacité professionnelle avec une précision
            inégalée.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-600 mb-4">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-sm text-navy-400 hover:text-navy-600 transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-600 mb-4">
            Contact
          </h4>
          <p className="text-sm text-navy-400 mb-4">contact@bayania.ma</p>
          <div className="flex items-center gap-3 text-navy-400">
            <LinkedinIcon size={16} />
            <TwitterIcon size={16} />
            <Globe size={16} />
          </div>
        </div>
      </div>

      <div className="border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy-400">
          <span>© 2026 BayanIA. Tous droits réservés.</span>
          <span className="italic">Conçu pour le paysage juridique marocain.</span>
        </div>
      </div>
    </footer>
  );
}
