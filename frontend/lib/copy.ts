import type { Lang } from "./lang";

const COPY = {
  en: {
    // Header
    siteTitle: "Portfolio Analytics",
    siteSubtitle: "Enter your holdings and get key risk metrics instantly.",
    // Form
    weightPlaceholder: "Weight %",
    addTicker: "+ Add ticker",
    analyze: "Analyze",
    analyzing: "Analyzing…",
    // Results
    resultsFor: "Results for:",
    lastMonths: "— last 12 months",
    correlationMatrix: "Correlation Matrix",
    // Main metrics
    annReturn: "Annualized Return",
    annReturnDesc: "Compound yearly return of the portfolio",
    annVol: "Annualized Volatility",
    annVolDesc: "Yearly standard deviation of returns",
    sharpe: "Sharpe Ratio",
    sharpeDesc: "Return per unit of risk (vs 5% risk-free rate)",
    maxDrawdown: "Max Drawdown",
    maxDrawdownDesc: "Worst peak-to-trough loss over the period",
    // Auth
    signIn: "Sign in with Google",
    signOut: "Sign out",
    // Portfolio manager
    myPortfolios: "My Portfolios",
    portfolioNamePlaceholder: "Portfolio name...",
    save: "Save",
    saving: "Saving...",
    noPortfolios: "No saved portfolios yet.",
    delete: "Delete",
    // Optimizer
    optimizerTitle: "Reduce Your Risk",
    optimizerSubtitle: "We find the allocation of your holdings that carries the least risk.",
    howItWorksLabel: "How does it work?",
    howItWorksBody:
      "Uses minimum-variance optimization — we find the combination of your assets that has the lowest possible volatility. No return forecasting involved, only how your assets move relative to each other.",
    optimizeButton: "Optimize for me",
    optimizeButtonLoading: "Optimizing…",
    optimizerSignInPrompt: "Sign in to optimize your own portfolio",
    cached: "cached",
    frontierTitle: "Risk–Return Map",
    frontierSubtitle: "2 000 random allocations of your assets. ★ is the lowest-risk one.",
    suggestedAllocation: "Suggested Allocation",
    projectedReturn: "Projected Return",
    projectedReturnDesc: "Estimated annualized return of this allocation",
    portfolioRisk: "Portfolio Risk",
    portfolioRiskDesc: "Annualized volatility — lower is better",
    riskAdjustedScore: "Risk-Adjusted Score",
    riskAdjustedScoreDesc: "Return per unit of risk (vs 5% risk-free rate)",
  },
  fr: {
    // Header
    siteTitle: "Analyse de portefeuille",
    siteSubtitle: "Entrez vos positions et obtenez les indicateurs de risque clés instantanément.",
    // Form
    weightPlaceholder: "Poids %",
    addTicker: "+ Ajouter un actif",
    analyze: "Analyser",
    analyzing: "Analyse…",
    // Results
    resultsFor: "Résultats pour :",
    lastMonths: "— 12 derniers mois",
    correlationMatrix: "Matrice de corrélation",
    // Main metrics
    annReturn: "Rendement annualisé",
    annReturnDesc: "Rendement annuel composé du portefeuille",
    annVol: "Volatilité annualisée",
    annVolDesc: "Écart-type annuel des rendements",
    sharpe: "Ratio de Sharpe",
    sharpeDesc: "Rendement par unité de risque (vs taux sans risque de 5 %)",
    maxDrawdown: "Drawdown maximum",
    maxDrawdownDesc: "Pire perte pic-à-creux sur la période",
    // Auth
    signIn: "Se connecter avec Google",
    signOut: "Se déconnecter",
    // Portfolio manager
    myPortfolios: "Mes portefeuilles",
    portfolioNamePlaceholder: "Nom du portefeuille...",
    save: "Enregistrer",
    saving: "Enregistrement...",
    noPortfolios: "Aucun portefeuille sauvegardé.",
    delete: "Supprimer",
    // Optimizer
    optimizerTitle: "Réduire votre risque",
    optimizerSubtitle: "On trouve la répartition de vos actifs qui porte le moins de risque.",
    howItWorksLabel: "Comment ça marche ?",
    howItWorksBody:
      "Utilise l'optimisation de variance minimale — on trouve la combinaison de vos actifs avec la volatilité la plus faible possible. Aucune prévision de rendement : seule la façon dont vos actifs évoluent les uns par rapport aux autres compte.",
    optimizeButton: "Optimiser pour moi",
    optimizeButtonLoading: "Optimisation…",
    optimizerSignInPrompt: "Connectez-vous pour optimiser votre portefeuille",
    cached: "mis en cache",
    frontierTitle: "Carte risque–rendement",
    frontierSubtitle: "2 000 répartitions aléatoires de vos actifs. ★ est celle avec le moins de risque.",
    suggestedAllocation: "Répartition suggérée",
    projectedReturn: "Rendement estimé",
    projectedReturnDesc: "Rendement annualisé estimé de cette répartition",
    portfolioRisk: "Risque du portefeuille",
    portfolioRiskDesc: "Volatilité annualisée — plus c'est bas, mieux c'est",
    riskAdjustedScore: "Score ajusté au risque",
    riskAdjustedScoreDesc: "Rendement par unité de risque (vs taux sans risque de 5 %)",
  },
} as const;

export type Copy = Record<string, string>;

export function t(lang: Lang): Copy {
  return COPY[lang];
}
