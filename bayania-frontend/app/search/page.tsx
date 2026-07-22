"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Filter, Bookmark, FileText, ChevronRight, Search as SearchIcon } from "lucide-react";
import { sourcesApi, SourceSearchResult } from "@/src/lib/api";

const sourceFilters = ["Jurisprudence", "Législation", "Doctrine", "Bulletin Officiel"];
const domaineFilters = ["Droit Civil", "Droit Pénal", "Droit des Affaires", "Droit Social"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SourceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const data = await sourcesApi.search(query.trim());
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Navbar />

      <main className="flex-1 bg-[#F8FAFC] pb-12">
        <div className="border-b border-slate-200 bg-white px-8 py-10 text-center">
          <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-bayan-darkBlue">
            Recherche Avancée
          </span>
          <h1 className="mt-3 mb-2 text-3xl font-extrabold text-slate-800">
            Recherche Juridique Intelligente
          </h1>
          <p className="mx-auto max-w-xl text-sm text-slate-500">
            Accédez à l&apos;intégralité du droit marocain : Bulletin Officiel, codes, jurisprudence et doctrine, analysés par notre IA.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-6 max-w-3xl relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Licenciement abusif, Article 62 Code du Travail, Bail commercial..."
              className="w-full rounded-xl border border-slate-200 py-3.5 pl-5 pr-32 text-sm shadow-sm focus:border-bayan-darkBlue focus:outline-none focus:ring-2 focus:ring-bayan-darkBlue/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 rounded-lg bg-bayan-darkBlue px-5 py-2 text-xs font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Recherche..." : "Rechercher"}
            </button>
          </form>
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl grid-cols-12 gap-8 px-6">
          <aside className="col-span-3 h-fit space-y-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Filter size={14} /> FILTRES
              </span>
              <button className="text-[10px] font-medium text-slate-400 hover:text-bayan-darkBlue">
                Réinitialiser
              </button>
            </div>

            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Source du Document
              </h4>
              <div className="flex flex-wrap gap-2">
                {sourceFilters.map((source) => (
                  <button key={source} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    {source}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Domaine du Droit
              </h4>
              <div className="flex flex-wrap gap-2">
                {domaineFilters.map((domaine) => (
                  <button key={domaine} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    {domaine}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Les filtres seront bientôt appliqués côté serveur.
            </p>
          </aside>

          <main className="col-span-9 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Résultats de recherche</h2>
                {searched && !loading && (
                  <p className="text-xs text-slate-400">
                    {results.length} résultat{results.length !== 1 ? "s" : ""} trouvé{results.length !== 1 ? "s" : ""} pour &quot;{query}&quot;
                  </p>
                )}
              </div>
            </div>

            {loading && (
              <p className="text-sm text-slate-400 text-center py-10">Recherche en cours...</p>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                Aucun résultat pertinent trouvé pour cette recherche.
              </div>
            )}

            {!searched && !loading && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                <SearchIcon size={24} className="mx-auto mb-3 text-slate-300" />
                Lancez une recherche pour explorer la base juridique marocaine.
              </div>
            )}

            {!loading &&
              results.map((r, idx) => (
                <div
                  key={r.id_source ?? idx}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-bayan-darkBlue"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.type_source && (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-bayan-darkBlue">
                          {r.type_source}
                        </span>
                      )}
                      {r.numero_article && (
                        <span className="text-[10px] text-slate-400">Article {r.numero_article}</span>
                      )}
                    </div>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 whitespace-nowrap">
                      PERTINENCE {Math.round(r.score * 100)}%
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800">
                    {r.titre_document || "Document sans titre"}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">
                    {r.contenu_texte}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                    <div className="flex gap-4">
                      <button className="flex items-center gap-1 hover:text-slate-600">
                        <Bookmark size={14} /> Enregistrer
                      </button>
                      {r.id_source && (
                        <button className="flex items-center gap-1 hover:text-slate-600">
                          <FileText size={14} /> Voir le document
                        </button>
                      )}
                    </div>
                    <button className="flex items-center gap-1 font-bold text-bayan-darkBlue hover:underline">
                      Analyse IA <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </main>
        </div>
      </main>

      <Footer />
    </div>
  );
}
