"use client";

import { useEffect, useRef, useState } from "react";

import {
  ShieldCheck,
  LayoutGrid,
  Library,
  Upload,
  Share2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  Clock,
  Network,
  Boxes,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  adminApi,
  ImportationDocumentDetail,
  AdminUser,
} from "@/src/lib/api";

const mainNav = [
  { icon: LayoutGrid, label: "Tableau de bord", active: true },
  { icon: Library, label: "Corpus Juridique" },
  { icon: Upload, label: "Importation" },
  { icon: Share2, label: "Indexation RAG" },
];

const gestionNav = [
  { icon: Users, label: "Utilisateurs" },
  { icon: MessageSquare, label: "Conversations" },
  { icon: BarChart3, label: "Statistiques" },
];

// --- Ces sections n'ont pas encore d'endpoint backend (Phases 3-5) ---
const systemHealth = [
  { label: "Vector Database", value: "99.98%", color: "bg-emerald-500" },
  { label: "LLM Inference", value: "99.95%", color: "bg-emerald-500" },
  { label: "RAG Pipeline", value: "98.20%", color: "bg-amber-500" },
];

const chartDays = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const chartValues = [38, 52, 45, 70, 62, 30, 20];

function statusMeta(statut: string) {
  switch (statut) {
    case "COMPLETED":
      return { label: "Indexé", color: "text-emerald-600", dot: "bg-emerald-500" };
    case "PENDING":
      return { label: "En cours", color: "text-blue-600", dot: "bg-blue-500" };
    case "FAILED":
      return { label: "Erreur", color: "text-red-600", dot: "bg-red-500" };
    default:
      return { label: statut, color: "text-navy-400", dot: "bg-navy-300" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<ImportationDocumentDetail[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [titreDocument, setTitreDocument] = useState("");
  const [typeSource, setTypeSource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadData() {
    try {
      const [docs, userList] = await Promise.all([
        adminApi.listDocuments(),
        adminApi.listUsers(),
      ]);
      setDocuments(docs);
      setUsers(userList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(false);

    if (!file || !titreDocument || !typeSource) {
      setUploadError("Veuillez remplir tous les champs et choisir un fichier PDF.");
      return;
    }

    setUploading(true);
    try {
      await adminApi.uploadDocument(titreDocument, typeSource, file);
      setUploadSuccess(true);
      setTitreDocument("");
      setTypeSource("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadData();
    } catch (err: any) {
      setUploadError(err.message || "Échec de l'importation");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, titre: string) => {
    const confirmed = window.confirm(
      `Supprimer "${titre}" ? Cette action est irréversible et retirera aussi ses vecteurs de l'index RAG.`
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingId(id);
    try {
      await adminApi.deleteDocument(id);
      await loadData();
    } catch (err: any) {
      setDeleteError(err.message || "Échec de la suppression du document");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = [
    { icon: Library, value: documents.length.toString(), label: "Documents importés" },
    { icon: Users, value: users.length.toString(), label: "Utilisateurs inscrits" },
    {
      icon: Share2,
      value: documents.filter((d) => d.statut_indexation === "COMPLETED").length.toString(),
      label: "Documents indexés",
    },
    {
      icon: ShieldCheck,
      value: documents.filter((d) => d.statut_indexation === "FAILED").length.toString(),
      label: "Erreurs d'indexation",
    },
  ];

  const w = 900;
  const h = 160;
  const stepX = w / (chartValues.length - 1);
  const maxV = Math.max(...chartValues);
  const points = chartValues.map((v, i) => {
    const x = i * stepX;
    const y = h - (v / maxV) * (h - 20) - 10;
    return `${x},${y}`;
  });
  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      

      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0">
        {/* Sidebar admin */}
        <aside className="hidden lg:flex flex-col gap-7 border-r border-surface-border bg-white px-5 py-6">
          <div className="flex items-center gap-2.5 rounded-lg bg-navy-50 px-3 py-2.5">
            <ShieldCheck size={18} className="text-navy-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-navy-600 leading-none mb-1">Terminal Admin</p>
              <p className="text-[11px] text-navy-400">Moteur v2.4.8 — Rabat</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-300 mb-3">Principale</p>
            <nav className="space-y-1">
              {mainNav.map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                    item.active ? "bg-navy-600 text-white font-medium" : "text-navy-500 hover:bg-surface-muted"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-300 mb-3">Gestion</p>
            <nav className="space-y-1">
              {gestionNav.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left text-navy-500 hover:bg-surface-muted transition-colors"
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-300 mb-3">Configuration</p>
            <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left text-navy-500 hover:bg-surface-muted transition-colors">
              <Settings size={16} />
              Paramètres
            </button>
          </div>

          {/* Mock — pas d'endpoint monitoring pour l'instant */}
          <div className="rounded-xl border border-surface-border p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-400 mb-3">
              <Boxes size={12} />
              État du Système
            </p>
            <div className="space-y-2.5">
              {systemHealth.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-navy-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                    {s.label}
                  </span>
                  <span className="font-medium text-navy-600">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2.5 pt-4 border-t border-surface-border">
            <span className="h-9 w-9 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-semibold">YA</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-600 truncate">Administrateur</p>
              <p className="text-[11px] text-navy-300 truncate">Super Admin</p>
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="px-6 py-6 space-y-6">
          {/* Bannière */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 px-7 py-8">
            <span className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/5" />
            <span className="absolute right-24 bottom-0 h-40 w-40 rounded-full bg-white/5" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-white/10 rounded-full px-3 py-1 mb-4">
              <ShieldCheck size={11} />
              Interface de contrôle Bayania
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-white mb-2">Bonjour, Administrateur</h1>
            <p className="text-sm text-white/60 max-w-xl mb-6 leading-relaxed">
              Pilotez l&apos;intelligence juridique au Maroc. Gérez vos corpus et supervisez
              l&apos;indexation vectorielle.
            </p>
          </div>

          {/* Stats réelles */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-surface-border bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
                    <s.icon size={16} />
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-wide text-navy-300 mb-1">{s.label}</p>
                <p className="font-serif text-xl text-navy-600">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Colonne principale */}
            <div className="space-y-6">
              {/* Documents Récents — réel */}
              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-navy-600">Documents Récents</h2>
                    <p className="text-xs text-navy-400">Flux des derniers corpus importés et indexés</p>
                  </div>
                </div>

                {deleteError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600 mb-3">
                    {deleteError}
                  </div>
                )}

                {loadingData && <p className="text-sm text-navy-400 py-4">Chargement...</p>}

                {!loadingData && documents.length === 0 && (
                  <p className="text-sm text-navy-400 py-4">Aucun document importé pour le moment.</p>
                )}

                {!loadingData && documents.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide text-navy-300 border-b border-surface-border">
                          <th className="text-left font-medium pb-2">Titre du document</th>
                          <th className="text-left font-medium pb-2">Catégorie</th>
                          <th className="text-left font-medium pb-2">Statut</th>
                          <th className="text-left font-medium pb-2">Importé le</th>
                          <th className="text-right font-medium pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((d) => {
                          const meta = statusMeta(d.statut_indexation);
                          const isDeleting = deletingId === d.id_importation;
                          return (
                            <tr key={d.id_importation} className="border-b border-surface-border last:border-0">
                              <td className="py-3 pr-3">
                                <div className="flex items-center gap-2.5">
                                  <FileText size={16} className="text-navy-300 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-navy-600 truncate">{d.titre_document}</p>
                                    <p className="text-[11px] text-navy-300">{d.nb_chunks} chunks</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 pr-3">
                                <span className="text-[11px] text-navy-500 bg-surface-muted rounded-full px-2.5 py-1 whitespace-nowrap">
                                  {d.type_source}
                                </span>
                              </td>
                              <td className="py-3 pr-3">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.color}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                  {meta.label}
                                </span>
                              </td>
                              <td className="py-3 pr-3 text-xs text-navy-400 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock size={12} />
                                  {formatDate(d.date_importation)}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleDelete(d.id_importation, d.titre_document)}
                                  disabled={isDeleting}
                                  title="Supprimer ce document"
                                  className="text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                                >
                                  {isDeleting ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Formulaire d'import PDF réel */}
              <div className="rounded-2xl border border-surface-border bg-navy-50 p-6 sm:p-7">
                <h3 className="text-base font-semibold text-navy-600 mb-1.5">Importation de Document</h3>
                <p className="text-xs text-navy-500 leading-relaxed mb-5">
                  Importez un fichier <span className="font-semibold text-navy-600">PDF</span>. Le texte sera
                  extrait, découpé en fragments et indexé automatiquement dans le moteur RAG.
                </p>

                {uploadError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">
                    {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-4">
                    Document importé et indexé avec succès.
                  </div>
                )}

                <form onSubmit={handleUpload} className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1.5">Titre du document</label>
                    <input
                      value={titreDocument}
                      onChange={(e) => setTitreDocument(e.target.value)}
                      placeholder="Code du Travail 2024"
                      className="w-full rounded-md border border-surface-border px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1.5">Type de source</label>
                    <input
                      value={typeSource}
                      onChange={(e) => setTypeSource(e.target.value)}
                      placeholder="Loi, Décret, Jurisprudence..."
                      className="w-full rounded-md border border-surface-border px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-navy-500 mb-1.5">Fichier PDF</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full rounded-md border border-surface-border px-3.5 py-2.5 text-sm bg-white file:mr-3 file:rounded file:border-0 file:bg-navy-600 file:text-white file:px-3 file:py-1.5 file:text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="rounded-md bg-navy-600 text-white text-xs font-semibold px-4 py-2.5 hover:bg-navy-700 transition-colors disabled:opacity-60"
                    >
                      {uploading ? "Importation en cours..." : "Importer et Indexer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Colonne latérale */}
            <aside className="space-y-6">
              {/* Mock — Phase 4 pas encore faite */}
              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-600">
                    <Network size={14} />
                    Indexation RAG
                  </p>
                  <span className="text-[10px] font-semibold text-navy-500 bg-surface-muted rounded-full px-2 py-0.5">
                    V-CORE-RAG
                  </span>
                </div>
                <p className="text-xs text-navy-400">
                  Le suivi détaillé de la file d&apos;indexation (chunks en temps réel) sera disponible prochainement.
                </p>
              </div>

              {/* Utilisateurs — réel */}
              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-600 mb-4">
                  <Users size={14} />
                  Utilisateurs ({users.length})
                </p>

                {loadingData && <p className="text-xs text-navy-400">Chargement...</p>}

                {!loadingData && (
                  <div className="space-y-3.5">
                    {users.slice(0, 6).map((u) => (
                      <div key={u.id_user} className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {u.nom_user.split(" ").slice(-1)[0][0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-navy-600 truncate">{u.nom_user}</p>
                          <p className="text-[11px] text-navy-300 truncate">{u.email}</p>
                        </div>
                        <span className="text-[10px] text-navy-400 shrink-0">
                          {u.profil?.type_profil}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Mock — Phase 4, pas encore d'endpoint statistiques temporelles */}
          <div className="rounded-2xl border border-surface-border bg-white p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-semibold text-navy-600">Activité de l&apos;IA (Analyses)</h2>
                <p className="text-xs text-navy-400">Graphique à connecter — endpoint statistiques à venir</p>
              </div>
            </div>

            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="adminChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#adminChartFill)" />
              <path d={linePath} fill="none" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => {
                const [x, y] = p.split(",");
                return <circle key={i} cx={x} cy={y} r="3.5" fill="#1E3A8A" />;
              })}
            </svg>
            <div className="grid grid-cols-7 text-center mt-1">
              {chartDays.map((d) => (
                <span key={d} className="text-[10px] font-medium text-navy-300">{d}</span>
              ))}
            </div>
          </div>
        </main>
      </div>

      <div className="bg-navy-900">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-4 text-white/50">
            <span>© 2024 Bayania Admin</span>
          </div>
        </div>
      </div>

    </div>
  );
}