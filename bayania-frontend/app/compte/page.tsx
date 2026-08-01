"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  User,
  Shield,
  Bell,
  CreditCard,
  HelpCircle,
  Mail,
  LogOut,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { usersApi, clearToken } from "@/src/lib/api";

const accountNav = [
  { icon: User, label: "Profil Personnel", active: true },
  { icon: Shield, label: "Sécurité" },
  { icon: Bell, label: "Notifications" },
  { icon: CreditCard, label: "Abonnement" },
];

export default function ComptePage() {
  const router = useRouter();

  const [nomUser, setNomUser] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await usersApi.getMe();
        setNomUser(data.nom_user);
        setEmail(data.email);
      } catch (err: any) {
        setError(err.message || "Impossible de charger le profil");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await usersApi.updateMe({ nom_user: nomUser, email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push("/connexion");
  };

  const initials = nomUser
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-10 pb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-navy-600 mb-1">
              Paramètres du Compte
            </h1>
            <p className="text-sm text-navy-400">
              Gérez vos informations personnelles, votre sécurité et vos préférences BayanIA.
            </p>
          </div>
        </div>

        <div className="border-t border-surface-border" />

        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 grid lg:grid-cols-[240px_1fr] gap-10">
          {/* Sidebar */}
          <aside className="space-y-8">
            <nav className="space-y-1">
              {accountNav.map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${
                    item.active
                      ? "bg-navy-600 text-white font-medium"
                      : "text-navy-500 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon size={16} />
                    {item.label}
                  </span>
                  {item.active && <span>›</span>}
                </button>
              ))}
            </nav>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-300 mb-3">
                Aide &amp; Support
              </p>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-navy-500 hover:bg-white text-left">
                  <HelpCircle size={16} />
                  Centre d&apos;aide
                </button>
                <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-navy-500 hover:bg-white text-left">
                  <Mail size={16} />
                  Contacter le support
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </aside>

          {/* Formulaire */}
          <div className="rounded-2xl border border-surface-border bg-white p-6 sm:p-8">
            <h2 className="text-base font-semibold text-navy-600 mb-1">
              Profil de l&apos;utilisateur
            </h2>
            <p className="text-sm text-navy-400 mb-6">
              Mettez à jour vos informations personnelles.
            </p>

            {loading && (
              <p className="text-sm text-navy-400 py-6">Chargement du profil...</p>
            )}

            {!loading && (
              <>
                <div className="flex items-center gap-5 mb-8 pb-8 border-b border-surface-border">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-600 text-white text-lg font-semibold">
                    {initials}
                  </span>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-5">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-5">
                    Profil mis à jour avec succès.
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium text-navy-500 mb-1.5 block">Nom complet</span>
                    <input
                      value={nomUser}
                      onChange={(e) => setNomUser(e.target.value)}
                      className="w-full rounded-md border border-surface-border px-3.5 py-2.5 text-sm text-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-200"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium text-navy-500 mb-1.5 block">Adresse Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-surface-border px-3.5 py-2.5 text-sm text-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-200"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-5 border-t border-surface-border">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md bg-navy-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-navy-700 disabled:opacity-60"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-navy-900">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-xs text-white/70">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-white" />
              Protection de niveau bancaire
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              Conformité CNDP
            </span>
          </div>
        </div>
      </main>


    </div>
  );
}
