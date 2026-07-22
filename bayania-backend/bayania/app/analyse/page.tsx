"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Download,
  Share2,
  Bookmark,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Copy,
  Flag,
  FileText,
  MessageSquare,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  questionsApi,
  QuestionResponse,
  ReponseIAResponse,
} from "@/src/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeScore(score: number) {
  // Gère le cas où score_confiance est une fraction (0.985) ou un pourcentage (98.5)
  return score <= 1 ? score * 100 : score;
}

function AnalyseContent() {
  const searchParams = useSearchParams();
  const question = searchParams.get("q") || "";

  const [questionData, setQuestionData] = useState<QuestionResponse | null>(null);
  const [reponseData, setReponseData] = useState<ReponseIAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!question.trim()) {
      setError("Aucune question fournie.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { question: q, reponse: r } = await questionsApi.askAndGetAnswer(question, "simple");
        if (!cancelled) {
          setQuestionData(q);
          setReponseData(r);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Erreur lors de l'analyse");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [question]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 bg-surface-muted flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-navy-400">
            <Loader2 size={28} className="animate-spin text-navy-600" />
            <p className="text-sm">Analyse en cours pour : « {question} »</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !questionData || !reponseData) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 bg-surface-muted flex items-center justify-center py-24">
          <div className="max-w-md text-center">
            <AlertTriangle size={28} className="text-status-warning mx-auto mb-4" />
            <p className="text-sm text-navy-500 mb-4">
              {error || "Impossible de récupérer l'analyse."}
            </p>
            <Link href="/" className="text-sm font-semibold text-navy-600 hover:underline">
              ← Retour à l'accueil
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const score = normalizeScore(reponseData.score_confiance);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 bg-surface-muted">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-xs text-navy-300 mb-2">
                Requête n° {questionData.id_question} — {formatDate(questionData.date_heure_envoi)}
              </p>
              <h1 className="font-serif text-xl sm:text-2xl text-navy-600 mb-3 max-w-2xl text-balance">
                {questionData.texte_question_brute}
              </h1>
              <span className="text-[11px] font-medium text-navy-500 bg-white border border-surface-border rounded-full px-2.5 py-1">
                Mode : {questionData.mode_reponse}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="inline-flex items-center gap-1.5 rounded-md border border-surface-border bg-white text-navy-600 text-xs font-medium px-3.5 py-2 hover:bg-surface-muted">
                <Download size={14} />
                Exporter
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-surface-border bg-white text-navy-600 text-xs font-medium px-3.5 py-2 hover:bg-surface-muted">
                <Share2 size={14} />
                Partager
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-navy-600 text-white text-xs font-medium px-3.5 py-2 hover:bg-navy-700">
                <Bookmark size={14} />
                Enregistrer
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Colonne principale */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-surface-border bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy-600">
                    <Sparkles size={15} className="text-navy-600" />
                    Réponse de BayanIA
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-success bg-status-successBg rounded-full px-2.5 py-1">
                    <CheckCircle2 size={11} />
                    Générée le {formatDate(reponseData.date_heure_generation)}
                  </span>
                </div>
                <p className="text-sm text-navy-500 leading-relaxed whitespace-pre-line">
                  {reponseData.texte_reponse}
                </p>
              </div>

              {questionData.donnees_sensibles.length > 0 && (
                <div className="rounded-2xl border border-surface-border bg-white p-6">
                  <p className="text-sm font-semibold text-navy-600 mb-3">
                    Données sensibles anonymisées ({questionData.donnees_sensibles.length})
                  </p>
                  <div className="space-y-2">
                    {questionData.donnees_sensibles.map((d) => (
                      <div key={d.id_donnee} className="text-xs text-navy-400 flex items-center gap-2">
                        <span className="font-medium text-navy-600">{d.type_donnee}</span>
                        <span>→ {d.valeur_anonymisee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne latérale */}
            <aside className="space-y-6">
              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300 mb-1">
                  Indice de Confiance
                </p>
                <p className="font-serif text-3xl text-navy-600 mb-1">{score.toFixed(1)}%</p>
                <div className="h-1.5 rounded-full bg-surface-border overflow-hidden mt-3">
                  <div className="h-full bg-navy-600 rounded-full" style={{ width: `${score}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300 mb-3">
                  Sources consultées ({reponseData.sources.length})
                </p>
                <div className="space-y-3">
                  {reponseData.sources.map((s) => (
                    <div key={s.id_source} className="flex items-start gap-2.5">
                      <FileText size={14} className="text-navy-300 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-500 bg-surface-muted rounded px-1.5 py-0.5">
                            {s.type_source}
                          </span>
                          {s.numero_article && (
                            <span className="text-[10px] text-navy-300">Art. {s.numero_article}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-navy-600 leading-snug mb-1">
                          {s.titre_document}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            s.statut_validite ? "text-status-success" : "text-status-warning"
                          }`}
                        >
                          {s.statut_validite ? (
                            <>
                              <CheckCircle2 size={11} /> Validé
                            </>
                          ) : (
                            <>
                              <XCircle size={11} /> Non vérifié
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                  {reponseData.sources.length === 0 && (
                    <p className="text-xs text-navy-300">Aucune source citée.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300 mb-3">
                  Outils de Dossier
                </p>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2.5 rounded-md border border-surface-border px-3 py-2 text-xs font-medium text-navy-600 hover:bg-surface-muted">
                    <Printer size={14} />
                    Imprimer l'avis juridique
                  </button>
                  <button className="w-full flex items-center gap-2.5 rounded-md border border-surface-border px-3 py-2 text-xs font-medium text-navy-600 hover:bg-surface-muted">
                    <Copy size={14} />
                    Copier pour citation
                  </button>
                  <button className="w-full flex items-center gap-2.5 rounded-md border border-surface-border px-3 py-2 text-xs font-medium text-navy-600 hover:bg-surface-muted">
                    <Flag size={14} />
                    Signaler une erreur
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="border-t border-surface-border bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-600 shrink-0">
                <MessageSquare size={15} />
              </span>
              <p className="text-sm text-navy-500">
                Besoin d'une analyse spécifique pour votre contrat ?<br className="hidden sm:block" />
                Notre IA peut analyser vos clauses actuelles et détecter les risques potentiels.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/dashboard" className="rounded-md bg-navy-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-navy-700 transition-colors">
                Analyse de PDF
              </Link>
              <Link href="/dashboard" className="rounded-md border border-surface-border bg-white text-navy-600 text-sm font-medium px-4 py-2.5 hover:bg-surface-muted transition-colors">
                Posez une sous-question
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AnalysePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AnalyseContent />
    </Suspense>
  );
}
