"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
  Mic,
  ArrowUp,
  Paperclip,
  EyeOff,
  CheckCircle2,
  File,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { questionsApi, ReponseIAResponse, getToken , usersApi } from "@/src/lib/api";



const sidebarNav = [
  { icon: LayoutGrid, label: "Tableau de bord", href: "/dashboard", active: true },
  { icon: Search, label: "Recherche Juridique", href: "/search" },
  { icon: History, label: "Historique des requêtes", href: "/history" },
  { icon: Briefcase, label: "Dossiers clients", href: "/historique" },
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
  const [anonymisation, setAnonymisation] = useState(true);
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
      <Navbar />

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
                <button
                  onClick={() => setAnonymisation((v) => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${anonymisation ? "bg-navy-600" : "bg-surface-border"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${anonymisation ? "left-4" : "left-0.5"}`} />
                </button>
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

          {messages.length <= 1 && (
            <div className="text-center mb-8">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600 mb-3">
                <LayoutGrid size={18} />
              </span>
              <h1 className="font-serif text-2xl text-navy-600 mb-1">Assistant Juridique BayanIA</h1>
              <p className="text-sm text-navy-400">
                Posez vos questions sur le droit marocain ou importez vos documents pour une analyse avancée.
              </p>
            </div>
          )}

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

          {messages.length <= 1 && (
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Link href="/analyse-pdf" className="rounded-xl border border-surface-border bg-white p-5 flex flex-col justify-between hover:border-navy-300 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-navy-600" />
                    <h3 className="font-medium text-navy-600 text-sm">Analyse de PDF</h3>
                  </div>
                  <p className="text-xs text-navy-400 mb-4">
                    Extrayez les clauses à risque et obtenez un résumé juridique structuré de vos contrats.
                  </p>
                </div>
                <div className="h-32 rounded-lg relative bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent_50%)]" />
                  <svg viewBox="0 0 200 160" className="w-32 h-24 drop-shadow-2xl">
                    <ellipse cx="100" cy="120" rx="45" ry="12" fill="rgba(15,23,42,0.25)" filter="blur(4px)" />
                    <g transform="translate(100, 75)">
                      <path d="M 0,0 L -40,-23 L -40,25 L 0,48 Z" fill="#93C5FD" />
                      <path d="M 0,0 L 40,-23 L 40,25 L 0,48 Z" fill="#60A5FA" />
                      <path d="M 0,0 L -40,-23 L 0,-46 L 40,-23 Z" fill="#E0F2FE" />
                      <g transform="translate(0, -10)">
                        <path d="M -15,-13 L -23,-9 L -15,-5 L -7,-9 Z" fill="#3B82F6" opacity="0.8" />
                        <path d="M 15,-13 L 7,-9 L 15,-5 L 23,-9 Z" fill="#2563EB" opacity="0.8" />
                        <path d="M -5,-7 L -13,-3 L -5,1 L 3,-3 Z" fill="#1D4ED8" opacity="0.9" />
                        <path d="M 5,-7 L -3,-3 L 5,1 L 13,-3 Z" fill="#1E40AF" opacity="0.9" />
                      </g>
                    </g>
                  </svg>
                </div>
              </Link>

              <div className="rounded-xl border border-surface-border bg-white p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-navy-600" />
                    <h3 className="font-medium text-navy-600 text-sm">Anonymisation Intelligente</h3>
                  </div>
                  <p className="text-xs text-navy-400 mb-4">
                    Protégez la vie privée en masquant automatiquement les données sensibles selon la CNDP.
                  </p>
                </div>
                <div className="h-32 rounded-lg relative bg-gradient-to-br from-[#E28F83] via-[#D37365] to-[#B35245] flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.2),transparent_60%)]" />
                  <div className="flex items-center gap-1 drop-shadow-xl z-10 transform -rotate-3">
                    {["S", "E", "C", "U", "R", "E"].map((letter, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 bg-[#FDFBF7] rounded-md relative flex items-center justify-center border-b-[3px] border-slate-300/80 shadow-md"
                        style={{
                          boxShadow: "0 3px 5px -1px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.06), inset 0 -1.5px 0 0 #e2e8f0",
                        }}
                      >
                        <div className="absolute inset-0.5 rounded bg-[#FCFAF2]/40" />
                        <span className="font-mono text-xs font-black text-[#5C4540] relative z-10 select-none">
                          {letter}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-surface-border bg-white p-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <Paperclip size={16} className="text-navy-300" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder="Posez une question juridique ou décrivez votre cas..."
                className="flex-1 py-2 text-sm text-navy-600 placeholder:text-navy-300 focus:outline-none disabled:opacity-60"
              />
              <Mic size={16} className="text-navy-300" />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="h-8 w-8 rounded-lg bg-navy-600 text-white flex items-center justify-center hover:bg-navy-700 disabled:opacity-50"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
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
            <span className="flex items-center gap-1.5 text-xs text-navy-400">
              <EyeOff size={12} />
              {anonymisation ? "Anonymisation Activée" : "Anonymisation Désactivée"}
            </span>
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

      <Footer />
    </div>
  );
}