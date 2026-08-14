"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  Bookmark,
  FileText,
  ChevronRight,
  Search as SearchIcon,
  RotateCcw,
  Info,
} from "lucide-react";
import { sourcesApi, SourceSearchResult } from "@/src/lib/api";

const sourceFilters = ["Jurisprudence", "Législation", "Doctrine", "Bulletin Officiel"];
// ⚠️ Le backend ne renvoie pas encore de champ "domaine_droit" dans /sources/search.
// Ce filtre reste affiché (pour l'UX/roadmap) mais désactivé tant que le champ
// n'existe pas côté payload Qdrant + schema SourceSearchResult.
const domaineFilters = ["Droit Civil", "Droit Pénal", "Droit des Affaires", "Droit Social"];

const PAGE_SIZE = 10;
const MAX_TOP_K = 50; // limite acceptée par le backend (Query(..., le=50))

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Surligne les mots de la requête présents dans l'extrait, sans jamais casser le HTML
function highlightText(text: string, query: string) {
  if (!text) return null;
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map(escapeRegExp);

  if (terms.length === 0) return text;

  const regex = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-100 text-slate-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<SourceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [topK, setTopK] = useState(PAGE_SIZE);

  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const runSearch = async (q: string, k: number) => {
    const data = await sourcesApi.search(q, k);
    setResults(data);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setError(null);
    setLoading(true);
    setSearched(true);
    setTopK(PAGE_SIZE);
    setSelectedSources([]);

    try {
      await runSearch(trimmed, PAGE_SIZE);
      setLastQuery(trimmed);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la recherche");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastQuery) return;
    const nextTopK = Math.min(topK + PAGE_SIZE, MAX_TOP_K);
    setLoadingMore(true);
    setError(null);
    try {
      await runSearch(lastQuery, nextTopK);
      setTopK(nextTopK);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des résultats supplémentaires");
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleSourceFilter = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const resetFilters = () => setSelectedSources([]);

  // Compte le nombre de résultats actuels par type de source, pour afficher un badge
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of results) {
      if (r.type_source) counts[r.type_source] = (counts[r.type_source] || 0) + 1;
    }
    return counts;
  }, [results]);

  const filteredResults = useMemo(() => {
    const filtered =
      selectedSources.length === 0
        ? results
        : results.filter((r) => r.type_source && selectedSources.includes(r.type_source));
    // Toujours trié par pertinence (score décroissant) — seul tri pertinent
    // tant que le backend ne renvoie pas de date de publication.
    return [...filtered].sort((a, b) => b.score - a.score);
  }, [results, selectedSources]);

  const hasActiveFilters = selectedSources.length > 0;
  const canLoadMore = searched && results.length >= topK && topK < MAX_TOP_K;

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
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
              disabled={loading || query.trim().length < 2}
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
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-bayan-darkBlue"
                >
                  <RotateCcw size={10} /> Réinitialiser
                </button>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Source du Document
              </h4>
              <div className="flex flex-wrap gap-2">
                {sourceFilters.map((source) => {
                  const active = selectedSources.includes(source);
                  const count = sourceCounts[source];
                  return (
                    <button
                      key={source}
                      onClick={() => toggleSourceFilter(source)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        active
                          ? "border-bayan-darkBlue bg-bayan-darkBlue text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {source}
                      {searched && count ? (
                        <span className={active ? "ml-1 opacity-80" : "ml-1 text-slate-400"}>
                          ({count})
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Domaine du Droit
                <span title="Bientôt disponible : nécessite un champ 'domaine_droit' côté backend">
                  <Info size={11} className="text-slate-300" />
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {domaineFilters.map((domaine) => (
                  <button
                    key={domaine}
                    disabled
                    title="Bientôt disponible côté serveur"
                    className="cursor-not-allowed rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {domaine}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                Ce filtre sera activé dès que le backend exposera le domaine juridique dans les résultats.
              </p>
            </div>
          </aside>

          <main className="col-span-9 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Résultats de recherche</h2>
                {searched && !loading && (
                  <p className="text-xs text-slate-400">
                    {filteredResults.length} résultat{filteredResults.length !== 1 ? "s" : ""}
                    {hasActiveFilters ? ` (filtré sur ${results.length})` : ""} pour &quot;{lastQuery}&quot;
                  </p>
                )}
              </div>
            </div>

            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 h-32"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && searched && filteredResults.length === 0 && !error && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                {hasActiveFilters
                  ? "Aucun résultat ne correspond à ces filtres. Essayez de les réinitialiser."
                  : "Aucun résultat pertinent trouvé pour cette recherche."}
              </div>
            )}

            {!searched && !loading && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                <SearchIcon size={24} className="mx-auto mb-3 text-slate-300" />
                Lancez une recherche pour explorer la base juridique marocaine.
              </div>
            )}

            {!loading &&
              filteredResults.map((r, idx) => (
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
                    {r.contenu_texte ? highlightText(r.contenu_texte, lastQuery) : null}
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

            {canLoadMore && !loading && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-xs font-medium text-slate-600 transition hover:border-bayan-darkBlue hover:text-bayan-darkBlue disabled:opacity-60"
                >
                  {loadingMore ? "Chargement..." : "Charger plus de résultats"}
                </button>
              </div>
            )}
          </main>
        </div>
      </main>
    </div>
  );
}