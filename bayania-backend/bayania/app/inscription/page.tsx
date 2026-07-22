"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { ShieldCheck, Globe, CheckCircle2, ArrowLeft, ChevronRight, User, Mail, Lock } from "lucide-react";
import { authApi } from "@/src/lib/api";

export default function InscriptionPage() {
  const router = useRouter();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [accepteConditions, setAccepteConditions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accepteConditions) {
      setError("Vous devez accepter les conditions générales.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        nom_user: `${prenom} ${nom}`.trim(),
        email,
        mot_de_passe: motDePasse,
        type_profil: "normal",
      });
      router.push("/connexion");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 grid lg:grid-cols-2">
        {/* Colonne gauche — pitch */}
        <div className="relative text-white px-6 lg:px-14 py-16 flex flex-col justify-between overflow-hidden min-h-screen">
          <Image
            src="/images/register-hero.png"
            alt="Cabinet juridique"
            fill
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[#162B6F]/85" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.10), transparent 45%), radial-gradient(circle at 85% 85%, rgba(255,255,255,0.08), transparent 50%)",
            }}
          />
          <div className="relative -z10">
            <span className="inline-block text-[11px] font-semibold tracking-wide uppercase bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-6">
              BayanIA
            </span>
            <h1 className="font-serif text-4xl leading-tight mb-6 max-w-md">
              Modernisez votre pratique avec l&apos;IA Juridique
            </h1>
            <p className="text-white/70 leading-relaxed mb-10 max-w-md">
              Rejoignez l&apos;élite des professionnels du droit au Maroc.
              Bénéficiez d&apos;une précision de 99,8% sur l&apos;analyse de
              jurisprudence et la conformité contractuelle.
            </p>

            <div className="space-y-6">
              <div className="flex gap-3">
                <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Sécurité de grade institutionnel</p>
                  <p className="text-white/60 text-sm">Chiffrement de bout en bout et conformité CNDP stricte.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Globe size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Jurisprudence marocaine exhaustive</p>
                  <p className="text-white/60 text-sm">Accès instantané au Bulletin Officiel et aux codes nationaux.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Analyses certifiées</p>
                  <p className="text-white/60 text-sm">Chaque réponse est sourcée avec des références directes à la loi.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative -z10 flex items-center gap-3 pt-10 mt-10 border-t border-white/10">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D"].map((l) => (
                <span key={l} className="h-8 w-8 rounded-full bg-white/15 border-2 border-navy-600 flex items-center justify-center text-xs font-semibold">
                  {l}
                </span>
              ))}
              <span className="h-8 w-8 rounded-full bg-white/25 border-2 border-navy-600 flex items-center justify-center text-[10px] font-semibold">
                +1k
              </span>
            </div>
            <p className="text-sm text-white/60 italic">Approuvé par les leaders du secteur au Maroc.</p>
          </div>
        </div>

        {/* Colonne droite — formulaire */}
        <div className="px-6 lg:px-14 py-16">
          <div className="max-w-md mx-auto">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-600 mb-6">
              <ArrowLeft size={14} />
              Retour à l&apos;accueil
            </Link>

            <h2 className="font-serif text-3xl text-navy-600 mb-2">
              Créer votre compte professionnel
            </h2>
            <p className="text-navy-400 text-sm mb-8">
              Commencez votre essai gratuit de 14 jours. Aucune carte de crédit requise.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-2">Prénom</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                    <input
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Ahmed"
                      required
                      className="w-full rounded-lg border border-surface-border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-2">Nom</label>
                  <input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Alami"
                    required
                    className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-2">Adresse email professionnelle</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@votre-cabinet.ma"
                    required
                    className="w-full rounded-lg border border-surface-border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input
                    type="password"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-surface-border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-600"
                  />
                </div>
                <p className="text-xs text-navy-300 mt-1.5">Utilisez au moins 8 caractères, incluant des chiffres et des lettres.</p>
              </div>

              <label className="flex items-start gap-2 text-sm text-navy-500">
                <input
                  type="checkbox"
                  checked={accepteConditions}
                  onChange={(e) => setAccepteConditions(e.target.checked)}
                  className="mt-0.5 rounded border-surface-border text-navy-600 focus:ring-navy-600/30"
                />
                <span>
                  J&apos;accepte les{" "}
                  <Link href="#" className="text-navy-600 hover:underline font-medium">Conditions Générales d&apos;Utilisation</Link>{" "}
                  et la{" "}
                  <Link href="#" className="text-navy-600 hover:underline font-medium">Politique de Confidentialité</Link>{" "}
                  de BayanIA.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-navy-600 px-4 py-3 text-sm font-semibold text-white hover:bg-navy-700 transition-colors disabled:opacity-60"
              >
                {loading ? "Création..." : "Démarrer l'essai gratuit"}
                <ChevronRight size={16} />
              </button>

              <p className="text-center text-sm text-navy-400">
                Vous avez déjà un compte ?{" "}
                <Link href="/connexion" className="text-navy-600 font-medium hover:underline">
                  Connectez-vous ici
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}