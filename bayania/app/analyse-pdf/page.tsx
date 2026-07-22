"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  FileText,
  UploadCloud,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { questionsApi, ReponseIAResponse, PieceJointe, getToken } from "@/src/lib/api";

const DEFAULT_INSTRUCTIONS =
  "Analyse ce document juridique : résume les points clés, identifie les clauses à risque et vérifie sa conformité au droit marocain.";

type Step = "idle" | "creating" | "uploading" | "analyzing" | "done" | "error";

function normalizeScore(score: number) {
  return score <= 1 ? score * 100 : score;
}

export default function AnalysePdfPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<PieceJointe | null>(null);
  const [reponse, setReponse] = useState<ReponseIAResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getToken()) router.push("/connexion");
  }, [router]);

  const validateAndSetFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("Le fichier dépasse la taille maximale de 20 Mo.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
    e.target.value = "";
  };

  const reset = () => {
    setFile(null);
    setInstructions("");
    setStep("idle");
    setError(null);
    setAttachment(null);
    setReponse(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);

    try {
      setStep("creating");
      const question = await questionsApi.create(
        instructions.trim() || DEFAULT_INSTRUCTIONS,
        "pro"
      );

      setStep("uploading");
      const piece = await questionsApi.uploadPieceJointe(question.id_question, file);
      setAttachment(piece);

      setStep("analyzing");
      const result = await questionsApi.getReponse(question.id_question);
      setReponse(result);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue pendant l'analyse.");
      setStep("error");
    }
  };

  const isProcessing = step === "creating" || step === "uploading" || step === "analyzing";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 bg-surface-muted py-10 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-600 mb-6">
            <ArrowLeft size={14} />
            Retour au tableau de bord
          </Link>

          <div className="text-center mb-8">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600 mb-3">
              <FileText size={18} />
            </span>
            <h1 className="font-serif text-2xl text-navy-600 mb-1">Analyse de PDF</h1>
            <p className="text-sm text-navy-400">
              Déposez un contrat ou un jugement pour un résumé structuré et une détection des risques.
            </p>
          </div>

          {/* --- Étape 1 : pas encore de résultat --- */}
          {step !== "done" && (
            <div className="rounded-2xl border border-surface-border bg-white p-6 space-y-5">
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition-colors ${
                    dragActive ? "border-navy-600 bg-navy-50" : "border-surface-border hover:bg-surface-muted"
                  }`}
                >
                  <UploadCloud size={28} className="mx-auto mb-3 text-navy-300" />
                  <p className="text-sm font-medium text-navy-600 mb-1">
                    Glissez votre fichier PDF ici, ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-navy-300">PDF uniquement, 20 Mo maximum</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-muted px-4 py-3">
                  <FileText size={20} className="text-navy-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-600 truncate">{file.name}</p>
                    <p className="text-xs text-navy-300">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                  </div>
                  {!isProcessing && (
                    <button onClick={() => setFile(null)} className="text-navy-300 hover:text-navy-600 shrink-0">
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-2">
                  Instructions (facultatif)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={isProcessing}
                  placeholder={DEFAULT_INSTRUCTIONS}
                  rows={3}
                  className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-600 disabled:opacity-60 resize-none"
                />
                <p className="text-xs text-navy-300 mt-1.5">
                  Laissez vide pour une analyse générale, ou précisez ce que vous cherchez (ex: "vérifie la clause de non-concurrence").
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!file || isProcessing}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-navy-600 px-4 py-3 text-sm font-semibold text-white hover:bg-navy-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {step === "creating" && "Envoi de la demande..."}
                    {step === "uploading" && "Envoi du fichier..."}
                    {step === "analyzing" && "Analyse en cours..."}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Lancer l'analyse
                  </>
                )}
              </button>
            </div>
          )}

          {/* --- Étape 2 : résultat --- */}
          {step === "done" && reponse && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-surface-border bg-white p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy-600">
                    <Sparkles size={15} className="text-navy-600" />
                    Rapport d'analyse
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-success bg-status-successBg rounded-full px-2.5 py-1">
                    <CheckCircle2 size={11} />
                    Confiance : {normalizeScore(reponse.score_confiance).toFixed(1)}%
                  </span>
                </div>

                {attachment && (
                  <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 mb-4 text-xs text-navy-500">
                    <FileText size={14} />
                    {attachment.nom_fichier}
                  </div>
                )}

                <p className="text-sm text-navy-500 leading-relaxed whitespace-pre-line">
                  {reponse.texte_reponse}
                </p>
              </div>

              {reponse.sources.length > 0 && (
                <div className="rounded-2xl border border-surface-border bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-300 mb-3">
                    Sources consultées ({reponse.sources.length})
                  </p>
                  <div className="space-y-3">
                    {reponse.sources.map((s) => (
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
                          <p className="text-xs font-medium text-navy-600 leading-snug">{s.titre_document}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full rounded-lg border border-surface-border bg-white text-navy-600 text-sm font-medium px-4 py-3 hover:bg-surface-muted transition-colors"
              >
                Analyser un autre document
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}