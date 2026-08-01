"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  LayoutGrid,
  History,
  Briefcase,
  Settings,
  Download,
  Plus,
  Search,
  Zap,
  FileText,
  ShieldCheck,
  ArrowUp,
  EyeOff,
  CheckCircle2,
  File,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { questionsApi, ReponseIAResponse, getToken, usersApi } from "@/src/lib/api";

const sidebarNav = [
  { icon: LayoutGrid, label: "Tableau de bord", href: "/dashboard", active: true },
  { icon: Search, label: "Recherche Juridique", href: "/search" },
  { icon: History, label: "Historique des requêtes", href: "/history" },
  { icon: FileText, label: "Mes documents", href: "/documents" },
  { icon: Settings, label: "Paramètres", href: "/compte" },
];

const recentDocs = ["Contrat_Bail_Sidi.pdf", "Jugement_TPI_Rabat.pdf", "Statuts_SARL_New.pdf"];

const veille = [
  { tag: "Droit des Sociétés", title: "Modification Loi 17-95", time: "Il y a 2h" },
  { tag: "Social", title: "Nouveaux tarifs CNSS", time: "Hier" },
  { tag: "Jurisprudence", title: "Arrêt Cour de Cassation", time: "3 oct" },
];

type ChatMessage =
  | { role: "assistant"; text: string; reponse?: ReponseIAResponse }
  | { role: "user"; text: string }
  | { role: "error"; text: string };

function normalizeScore(score: number) {
  return score <= 1 ? score * 100 : score;
}

export default function DashboardPage() {
  const router = useRouter();
  const [modePro, setModePro] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastReponse, setLastReponse] = useState<ReponseIAResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Bonjour. Je suis votre assistant BayanIA spécialisé dans le droit marocain. Comment puis-je vous assister dans vos recherches juridiques aujourd'hui ?",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Redirige vers la connexion si pas de token
  useEffect(() => {
    if (!getToken()) {
      router.push("/connexion");
    }
  }, [router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [profile, setProfile] = useState<{ nom_user: string; type_profil?: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await usersApi.getMe();
        setProfile({ nom_user: data.nom_user, type_profil: data.profil?.type_profil });
      } catch {
        // silencieux, la redirection /connexion gère déjà le cas non-connecté
      }
    }
    fetchProfile();
  }, []);

  const initials = profile?.nom_user
    ? profile.nom_user.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSend = async () => {
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setSending(true);

    try {
      const { reponse } = await questionsApi.askAndGetAnswer(
        question,
        modePro ? "pro" : "simple"
      );
      setLastReponse(reponse);
      setMessages((prev) => [...prev, { role: "assistant", text: reponse.texte_reponse, reponse }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: err.message || "Erreur lors de la génération de la réponse." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      

      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-0">
        {/* Sidebar gauche */}
        <aside className="hidden lg:flex flex-col gap-8 border-r border-surface-border bg-white px-5 py-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-300 mb-3">Workspace</p>
            <nav className="space-y-1">
              {sidebarNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                    item.active ? "bg-navy-600 text-white font-medium" : "text-navy-500 hover:bg-surface-muted"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-300 mb-3">Paramètres d&apos;IA</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-600">Mode Professionnel</p>
                  <p className="text-xs text-navy-300">Analyses approfondies</p>
                </div>
                <button
                  onClick={() => setModePro((v) => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${modePro ? "bg-navy-600" : "bg-surface-border"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${modePro ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-600">Anonymisation Auto</p>
                  <p className="text-xs text-navy-300">Protection des données</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-300">Documents Récents</p>
              <Plus size={14} className="text-navy-300" />
            </div>
            <ul className="space-y-2">
              {recentDocs.map((doc) => (
                <li key={doc} className="flex items-center gap-2 text-sm text-navy-500 truncate">
                  <File size={14} className="shrink-0 text-navy-300" />
                  <span className="truncate">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/compte" className="mt-auto flex items-center gap-2.5 pt-4 border-t border-surface-border hover:bg-surface-muted -mx-5 px-5 -mb-6 pb-6 rounded-b-lg transition-colors">
            <span className="h-9 w-9 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-semibold">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-600 truncate">
                {profile?.nom_user || "Chargement..."}
              </p>
              <p className="text-xs text-navy-300 truncate">
                {profile?.type_profil || ""}
              </p>
            </div>
          </Link>
        </aside>

        {/* Colonne centrale — chat */}
        <main className="px-6 py-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide bg-navy-50 text-navy-600 rounded-full px-3 py-1.5">
                {modePro ? "Mode Professionnel" : "Mode Simple"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-xs font-medium text-navy-600 hover:bg-surface-muted">
                <Download size={14} />
                Exporter l&apos;analyse
              </button>
              <button
                onClick={() => {
                  setMessages([
                    {
                      role: "assistant",
                      text: "Bonjour. Je suis votre assistant BayanIA spécialisé dans le droit marocain. Comment puis-je vous assister dans vos recherches juridiques aujourd'hui ?",
                    },
                  ]);
                  setLastReponse(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy-600 px-3 py-2 text-xs font-medium text-white hover:bg-navy-700"
              >
                <Plus size={14} />
                Nouvelle Requête
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-6 flex-1">
            {messages.map((m, i) => {
              if (m.role === "assistant") {
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="h-8 w-8 rounded-full bg-navy-600 text-white flex items-center justify-center shrink-0">
                      <Zap size={14} />
                    </span>
                    <div className="bg-white border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-navy-600 max-w-2xl space-y-2">
                      <p className="whitespace-pre-line">{m.text}</p>
                      {m.reponse && m.reponse.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {m.reponse.sources.map((s) => (
                            <span key={s.id_source} className="inline-flex items-center gap-1 text-[11px] text-navy-500 bg-surface-muted rounded-full px-2.5 py-1">
                              <FileText size={10} />
                              {s.titre_document}
                              {s.numero_article ? ` — Art. ${s.numero_article}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              if (m.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="bg-navy-50 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-navy-600 max-w-xl">
                      {m.text}
                    </div>
                  </div>
                );
              }
              // error
              return (
                <div key={i} className="flex gap-3 items-start">
                  <span className="h-8 w-8 rounded-full bg-status-warning text-white flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} />
                  </span>
                  <div className="bg-status-warningBg border border-status-warning/30 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-status-warning max-w-2xl">
                    {m.text}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-3 items-start">
                <span className="h-8 w-8 rounded-full bg-navy-600 text-white flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </span>
                <div className="bg-white border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-navy-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Analyse en cours...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Zone de saisie — chat + accès à l'analyse PDF */}
          <div className="rounded-2xl border border-surface-border bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Link
                href="/analyse-pdf"
                title="Analyser un document PDF"
                className="h-10 w-10 rounded-xl hover:bg-surface-muted flex items-center justify-center transition shrink-0"
              >
                <FileText size={18} className="text-navy-500" />
              </Link>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder="Posez une question juridique..."
                className="flex-1 text-sm text-navy-600 placeholder:text-navy-300 focus:outline-none disabled:opacity-60"
              />

              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="h-10 w-10 rounded-xl bg-navy-600 text-white flex items-center justify-center hover:bg-navy-700 disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-navy-300">Suggestions :</span>
              {["Bail commercial", "Droit des sociétés", "CNSS"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="uppercase tracking-wide text-navy-500 hover:text-navy-600 font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Sidebar droite */}
        <aside className="hidden lg:flex flex-col gap-6 border-l border-surface-border bg-white px-5 py-6">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-600 mb-3">
              <ShieldCheck size={14} />
              Conformité Juridique
            </p>
            <div className="rounded-xl border border-surface-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-navy-400">Score de Précision</span>
                <span className="text-sm font-semibold text-navy-600">
                  {lastReponse ? `${normalizeScore(lastReponse.score_confiance).toFixed(1)}%` : "—"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                <div
                  className="h-full bg-navy-600 rounded-full"
                  style={{ width: lastReponse ? `${normalizeScore(lastReponse.score_confiance)}%` : "0%" }}
                />
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="flex items-center gap-1.5 text-xs text-navy-500"><CheckCircle2 size={12} className="text-navy-600" /> Sources: Bulletin Officiel (BO)</p>
                <p className="flex items-center gap-1.5 text-xs text-navy-500"><CheckCircle2 size={12} className="text-navy-600" /> Conformité CNDP</p>
              </div>
            </div>
          </div>

          {lastReponse && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-600 mb-3">Dernière Réponse</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-navy-400">Sources citées</span><span className="font-semibold text-navy-600">{lastReponse.sources.length.toString().padStart(2, "0")}</span></div>
                <div className="flex items-center justify-between"><span className="text-navy-400">Sources validées</span><span className="font-semibold text-navy-600">{lastReponse.sources.filter((s) => s.statut_validite).length}</span></div>
              </div>
              <Link
                href="/analyse"
                className="block text-center w-full mt-3 rounded-lg border border-surface-border py-2 text-xs font-medium text-navy-600 hover:bg-surface-muted"
              >
                Voir le rapport détaillé
              </Link>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-600 mb-3">Veille Juridique</p>
            <div className="space-y-3">
              {veille.map((v) => (
                <div key={v.title}>
                  <span className="inline-block text-[10px] font-medium text-navy-500 bg-surface-muted rounded-full px-2 py-0.5 mb-1">{v.tag}</span>
                  <p className="text-sm text-navy-600 leading-snug">{v.title}</p>
                  <p className="text-xs text-navy-300">{v.time}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

     
    </div>
  );
}