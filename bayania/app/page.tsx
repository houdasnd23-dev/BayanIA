"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroConversation from "@/components/HeroConversation";
import HomePreviewSlider from "@/components/HomePreviewSlider";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Search,
  ShieldCheck,
  MessageSquare,
  FileText,
  Lock,
  CheckCircle2,
  User,
  Sparkles,
  FileCheck2,
  EyeOff,
} from "lucide-react";

const stats = [
  { value: "1.2M+", label: "Fichiers sources indexées", eyebrow: "Documents juridiques" },
  { value: "99.8%", label: "Précision des réponses", eyebrow: "Précision" },
  { value: "250k+", label: "Réponses générées", eyebrow: "Questions" },
  { value: "24/7", label: "Toujours disponible", eyebrow: "Support" },
];

const features = [
  {
    icon: MessageSquare,
    title: "AI Legal Chat",
    description:
      "Interrogez notre IA sur tout point de droit marocain et recevez des réponses entièrement sourcées avec citations juridiques.",
    image: "/features/legal-chat.png",
  },
  {
    icon: FileText,
    title: "Analyse de PDF",
    description:
      "Téléchargez des contrats ou jugements pour un résumé automatique et une détection instantanée des risques.",
    image: "/features/pdf-analysis.png",
  },
  {
    icon: Search,
    title: "Recherche Intelligente",
    description:
      "Explorez une base de données exhaustive de lois et de jurisprudence marocaine en un seul clic.",
    image: "/features/search.png",
  },
  {
    icon: Lock,
    title: "Auto-Anonymisation",
    description:
      "Protégez la vie privée en masquant automatiquement les données personnelles sensibles dans vos documents juridiques.",
    image: "/features/anonymisation.png",
  },
];

const workflow = [
  { title: "Question", desc: "Posez-la dans n'importe quelle langue", icon: MessageSquare },
  { title: "Anonymisation", desc: "Protection des données", icon: EyeOff },
  { title: "Recherche RAG", desc: "Sources officielles", icon: Search },
  { title: "Analyse IA", desc: "Moteur de raisonnement", icon: Sparkles },
  { title: "Réponse référencée", desc: "Citations incluses", icon: FileCheck2 },
];

const whyPoints = [
  { text: "Sources juridiques officielles marocaines (Bulletin Officiel)", icon: FileText },
  { text: "Anonymisation automatique des données", icon: EyeOff },
  { text: "Réponses IA fiables et vérifiées", icon: Sparkles },
  { text: "Support multilingue (arabe et français)", icon: MessageSquare },
  { text: "Traitement des données sécurisé de bout en bout", icon: ShieldCheck },
];

const analysisChecklist = [
  "Vérification des sources officielles",
  "Extraction de la jurisprudence",
  "Vérification de la validité légale",
  "Génération du rapport d'analyse",
];

const testimonials = [
  {
    quote:
      "BayanIA a radicalement changé ma façon de préparer les dossiers. La rapidité avec laquelle je trouve la jurisprudence pertinente est impressionnante. Un outil indispensable pour la pratique moderne.",
    name: "Ahmed Alami",
    role: "Attorney, Casablanca Bar",
  },
  {
    quote:
      "L'analyse de PDF me fait gagner des heures sur les révisions de contrats complexes. La précision de l'IA concernant les spécificités du droit marocain est ce qui distingue vraiment.",
    name: "Dr. Sarah Benjelloun",
    role: "Senior Legal Consultant",
  },
];

const plans = [
  {
    name: "Basique",
    price: "60MAD",
    period: "/month",
    features: ["50 requêtes IA/mois", "Analyse de PDF basique", "Support standard"],
    cta: "Choisir ce forfait",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "490MAD",
    period: "/month",
    features: [
      "Requêtes IA illimitées",
      "Analyse de PDF avancée",
      "Support prioritaire",
      "Réponses jusqu'à 2x plus rapides avec les modèles abonnés",
    ],
    cta: "Choisir ce forfait",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Coutume",
    period: "",
    features: [
      "Entraînement de modèle personnalisé",
      "Déploiement sur site",
      "Garanties SLA",
    ],
    cta: "Choisir ce forfait",
    highlighted: false,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  const handleAnalyser = () => {
    if (!question.trim()) return;
    router.push(`/analyse?q=${encodeURIComponent(question)}`);
  };

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-surface-muted">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-xs font-semibold tracking-wide uppercase text-navy-500 bg-white border border-surface-border rounded-full px-3 py-1 mb-5">
                IA juridique marocaine
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-navy-600 mb-5 text-balance">
                Votre Assistant Juridique Intelligent pour le Droit Marocain
              </h1>
              <p className="text-navy-400 text-base leading-relaxed mb-7 max-w-lg">
                BayanIA transforme la recherche juridique au Maroc. Accédez
                instantanément à la jurisprudence, analysez vos contrats et
                sécurisez vos données avec une précision inégalée.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex items-center flex-1 bg-white border border-surface-border rounded-md px-4 py-3 gap-2">
                  <Search size={16} className="text-navy-300 shrink-0" />
                  <input
                    type="text"
                    placeholder="Poser une question juridique"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyser()}
                    className="flex-1 outline-none text-sm text-navy-600 placeholder:text-navy-300 bg-transparent"
                  />
                </div>
                <button
                  onClick={handleAnalyser}
                  className="rounded-md bg-navy-600 text-white text-sm font-medium px-6 py-3 hover:bg-navy-700 transition-colors"
                >
                  Analyser
                </button>
              </div>
              <p className="text-xs text-navy-300 mb-6">
                Suggestions:{" "}
                <span className="text-navy-500">
                  Licenciement abusif, Bail commercial, Droit des sociétés
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="rounded-md bg-navy-600 text-white text-sm font-medium px-6 py-3 hover:bg-navy-700 transition-colors">
                  Démarrer l&apos;essai gratuit
                </button>
                <button className="rounded-md border border-surface-border bg-white text-navy-600 text-sm font-medium px-6 py-3 hover:bg-navy-50 transition-colors">
                  Réserver une démo
                </button>
              </div>
            </div>

           <div className="relative">
               <HeroConversation />
               </div>
          </div>     
        </section>

        {/* Stats */}
        <section className="border-y border-surface-border bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.eyebrow} className="text-center md:text-left">
                <p className="text-xs uppercase tracking-wide text-navy-300 mb-1">
                  {s.eyebrow}
                </p>
                <p className="font-serif text-3xl text-navy-600 mb-1">
                  {s.value}
                </p>
                <p className="text-xs text-navy-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="fonctionnalites" className="bg-surface-muted">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-3">
                Fonctionnalités Clés
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy-600 mb-4 text-balance">
                Une suite d&apos;outils puissants pour les experts juridiques
              </h2>
              <p className="text-navy-400 text-sm leading-relaxed">
                Conçue spécifiquement pour naviguer dans les subtilités du
                système juridique marocain, de l&apos;arabe juridique aux
                structures judiciaires.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {features.map((f) => (
    <div
      key={f.title}
      className="bg-white border border-surface-border rounded-xl p-5 flex flex-col h-[460px]"
    >
      {/* Icône */}
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-600 mb-4">
        <f.icon size={20} />
      </span>

      {/* Titre */}
      <h3 className="font-semibold text-navy-600 text-lg mb-3">
        {f.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-navy-400 leading-7">
        {f.description}
      </p>

      {/* Image */}
      <div className="mt-auto flex justify-center pt-6">
  <div className="relative w-[220px] h-[130px] overflow-hidden rounded-xl">
    <Image
      src={f.image}
      alt={f.title}
      fill
      className="object-cover"
    />
  </div>
</div>
    </div>
  ))}
</div>
                </div>
              
        </section>

        {/* Workflow */}
        <section id="solutions" className="bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-3">
                Flux de Travail
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy-600 mb-4 text-balance">
                Comment BayanIA traite vos demandes
              </h2>
              <p className="text-navy-400 text-sm leading-relaxed">
                Notre pipeline sophistiqué garantit que chaque réponse est
                sécurisée, précise et entièrement vérifiable.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mb-16">
              {workflow.map((step) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-white text-navy-600">
                    <step.icon size={18} />
                  </div>
                  <p className="text-sm font-semibold text-navy-600 mb-1">
                    {step.title}
                  </p>
                  <p className="text-xs text-navy-400">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-3">
                  Pourquoi BayanIA
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl text-navy-600 mb-5 text-balance">
                  Une IA juridique de niveau entreprise
                </h3>
                <ul className="space-y-3 mb-6">
                  {whyPoints.map((point) => (
                    <li key={point.text} className="flex items-start gap-2.5 text-sm text-navy-500">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600 mt-0.5">
                        <point.icon size={13} />
                      </span>
                      {point.text}
                    </li>
                  ))}
                </ul>
                <button className="text-sm font-semibold text-navy-600 hover:text-navy-700 transition-colors">
                  Voir la documentation complète →
                </button>
              </div>

           <div className="flex justify-center items-center">
  <HomePreviewSlider />
</div>
</div>
</div>
        </section>

       {/* Testimonials */}
<section className="bg-surface-muted">
  <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
    <div className="text-center max-w-2xl mx-auto mb-12">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-3">
        Témoignages
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl text-navy-600 text-balance">
        La confiance des leaders du secteur
      </h2>
    </div>
    <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
      {testimonials.map((t) => (
        <div
          key={t.name}
          className="bg-white border border-surface-border rounded-xl p-6 flex flex-col h-full"
        >
          <p className="font-serif text-3xl text-navy-200 mb-2">
            &ldquo;
          </p>
          <p className="text-sm text-navy-500 leading-relaxed mb-5 flex-1">
            {t.quote}
          </p>
          <div className="flex items-center gap-3 mt-auto">
            <span className="h-9 w-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-500">
              <User size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-600">
                {t.name}
              </p>
              <p className="text-xs text-navy-400">{t.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

        {/* Pricing */}
        <section id="tarifs" className="bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-3">
                Tarifs
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy-600 text-balance">
                Des forfaits simples et transparents
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl p-6 border flex flex-col ${
                    plan.highlighted
                      ? "border-navy-600 bg-navy-600 text-white shadow-lg scale-[1.02]"
                      : "border-surface-border bg-white text-navy-600"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold mb-2 ${
                      plan.highlighted ? "text-white" : "text-navy-600"
                    }`}
                  >
                    {plan.name.toUpperCase()}
                  </p>
                  <p className="font-serif text-3xl mb-4">
                    {plan.price}
                    <span
                      className={`text-sm font-sans ${
                        plan.highlighted ? "text-white/70" : "text-navy-300"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </p>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2 text-xs ${
                          plan.highlighted ? "text-white/90" : "text-navy-400"
                        }`}
                      >
                        <CheckCircle2
                          size={14}
                          className={`mt-0.5 shrink-0 ${
                            plan.highlighted ? "text-white" : "text-status-success"
                          }`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`rounded-md text-sm font-medium px-4 py-2.5 transition-colors ${
                      plan.highlighted
                        ? "bg-white text-navy-600 hover:bg-navy-50"
                        : "border border-surface-border text-navy-600 hover:bg-navy-50"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-navy-600">
          <div className="max-w-3xl mx-auto px-6 text-center py-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4 text-balance">
              Prêt à moderniser votre pratique juridique ?
            </h2>
            <p className="text-white/70 text-sm mb-8">
              Rejoignez des centaines de professionnels du droit qui
              utilisent déjà BayanIA pour gagner en efficacité et en
              précision.
            </p>
            <button className="rounded-md bg-white text-navy-600 text-sm font-semibold px-6 py-3 hover:bg-navy-50 transition-colors mb-3">
              Démarrer l&apos;essai gratuit
            </button>
            <p className="text-xs text-white/60">
              Aucune carte bancaire requise · Essai de 14 jours · Support
              prioritaire
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}