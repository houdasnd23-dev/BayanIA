"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Scale, Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { authApi, usersApi } from "@/src/lib/api";

export default function ConnexionPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Le token est déjà stocké automatiquement par authApi.login()
      await authApi.login(email, motDePasse);

      // On récupère le profil pour connaître le rôle et rediriger en conséquence
      const profile = await usersApi.getMe();

      if (profile.profil?.type_profil?.toLowerCase() === "administrateur") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 relative overflow-hidden bg-navy-900">
        {/* Fond juridique — dégradés + texture, 100% CSS */}
        <div className="absolute inset-0 bg-navy-900">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 10%, rgba(201,151,29,0.12), transparent 40%), radial-gradient(circle at 85% 90%, rgba(30,58,138,0.4), transparent 50%), linear-gradient(135deg, #0B1526 0%, #1B2A4A 55%, #0F1B33 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 48px)",
            }}
          />
          <svg
            className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none"
            width="600" height="600" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 3v18M4 7l4-2m0 0l4 2m-4-2v0M20 7l-4-2m0 0l-4 2m4-2v0M4 7l-2 5a3 3 0 006 0L4 7zM20 7l2 5a3 3 0 01-6 0l4-5zM8 21h8"
              stroke="#C9971D" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, transparent 30%, rgba(11,21,38,0.55) 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-white">
            <span className="inline-block text-[11px] font-semibold tracking-wide uppercase bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-6">
              IA Juridique
            </span>
            <h1 className="font-serif text-4xl lg:text-5xl leading-tight mb-6">
              Accédez à l&apos;excellence juridique marocaine
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-10 max-w-md">
              Rejoignez les leaders du droit au Maroc et optimisez votre pratique
              grâce à notre intelligence artificielle spécialisée.
            </p>

            <div className="space-y-6">
              <div className="flex gap-3">
                <CheckCircle2 size={20} className="text-white/90 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Précision certifiée</p>
                  <p className="text-white/60 text-sm">
                    Analyse basée exclusivement sur le Bulletin Officiel.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck size={20} className="text-white/90 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Sécurité souveraine</p>
                  <p className="text-white/60 text-sm">
                    Hébergement sécurisé et conformité CNDP stricte.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 w-full max-w-md justify-self-center lg:justify-self-end">
            <div className="flex flex-col items-center text-center mb-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600 mb-4">
                <Scale size={22} />
              </span>
              <h2 className="font-serif text-2xl text-navy-600 mb-1">
                Connexion Partenaire
              </h2>
              <p className="text-sm text-navy-400">
                Veuillez entrer vos identifiants professionnels
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-2">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@cabinet.ma"
                    className="w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 py-2.5 text-sm text-navy-600 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500">
                    Mot de passe
                  </label>
                  <Link href="#" className="text-xs text-navy-600 hover:underline">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full rounded-lg border border-surface-border bg-white pl-9 pr-9 py-2.5 text-sm text-navy-600 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-navy-500">
                <input type="checkbox" className="rounded border-surface-border text-navy-600 focus:ring-navy-600/30" />
                Rester connecté sur cet appareil
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-navy-600 px-4 py-3 text-sm font-semibold text-white hover:bg-navy-700 transition-colors disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center gap-3 text-xs text-navy-300">
                <div className="h-px flex-1 bg-surface-border" />
                OU
                <div className="h-px flex-1 bg-surface-border" />
              </div>

              <Link
                href="/inscription"
                className="block text-center rounded-lg border border-surface-border py-3 text-sm font-medium text-navy-600 hover:bg-surface-muted transition-colors"
              >
                S&apos;inscrire à l&apos;essai gratuit
              </Link>
            </form>

            <div className="mt-8 pt-6 border-t border-surface-border text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs text-navy-400 mb-2">
                <Info size={13} />
                Connexion sécurisée par chiffrement 256-bits
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-navy-400">
                <Link href="#" className="hover:text-navy-600">Politique de confidentialité</Link>
                <span>•</span>
                <Link href="#" className="hover:text-navy-600">Support technique</Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}