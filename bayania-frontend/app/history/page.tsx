"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Search, Filter, MessageSquare, Plus } from "lucide-react";
import { questionsApi, QuestionResponse } from "@/src/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const data = await questionsApi.list();
        setQuestions(data);
      } catch (err: any) {
        setError(err.message || "Impossible de charger l'historique");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const filtered = questions.filter((q) =>
    q.texte_question_brute.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Navbar />

      <main className="flex-1 px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-navy-300">Historique</p>
              <h1 className="text-3xl font-serif text-navy-600">Vos analyses juridiques</h1>
              <p className="mt-2 text-sm text-navy-400">
                Retrouvez vos recherches, analyses et documents consultés récemment.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-full bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700"
            >
              <Plus size={16} /> Nouvelle Analyse
            </button>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-surface-border bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 rounded-full border border-surface-border px-3 py-2 text-sm text-navy-400">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 bg-transparent outline-none"
                placeholder="Rechercher"
              />
            </div>
            <button className="flex items-center gap-2 rounded-full border border-surface-border px-3 py-2 text-sm text-navy-400 hover:bg-surface-muted">
              <Filter size={15} /> Filtrer
            </button>
          </div>

          {loading && (
            <p className="text-sm text-navy-400 text-center py-10">Chargement...</p>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-6">
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-surface-border bg-white/70 p-6 text-center text-sm text-navy-400">
              Aucune analyse trouvée pour le moment.
            </div>
          )}

          <div className="space-y-4">
            {filtered.map((item) => (
              <div
                key={item.id_question}
                onClick={() => router.push(`/analyse/${item.id_question}`)}
                className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
                      {item.mode_reponse === "pro" ? "Mode Pro" : "Mode Simple"}
                    </p>
                    <h2 className="mt-1 text-lg font-medium text-navy-600">
                      {item.texte_question_brute}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-navy-300">
                    <span>{formatDate(item.date_heure_envoi)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && filtered.length > 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-surface-border bg-white/70 p-6 text-center text-sm text-navy-400">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-navy-600">
                <MessageSquare size={18} />
              </div>
              <p>Vous pouvez aussi reprendre une analyse précédente pour continuer votre travail.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}