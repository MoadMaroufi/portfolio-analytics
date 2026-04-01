// CAC 40 companies with their Yahoo Finance tickers (.PA = Paris exchange)
// Static list — no API needed, filter client-side
export const FRENCH_COMPANIES = [
  { ticker: "AIR.PA",  name: "Airbus" },
  { ticker: "AI.PA",   name: "Air Liquide" },
  { ticker: "ALO.PA",  name: "Alstom" },
  { ticker: "CS.PA",   name: "AXA" },
  { ticker: "BNP.PA",  name: "BNP Paribas" },
  { ticker: "EN.PA",   name: "Bouygues" },
  { ticker: "CAP.PA",  name: "Capgemini" },
  { ticker: "CA.PA",   name: "Carrefour" },
  { ticker: "ACA.PA",  name: "Crédit Agricole" },
  { ticker: "BN.PA",   name: "Danone" },
  { ticker: "DSY.PA",  name: "Dassault Systèmes" },
  { ticker: "ENGI.PA", name: "Engie" },
  { ticker: "EL.PA",   name: "EssilorLuxottica" },
  { ticker: "RMS.PA",  name: "Hermès" },
  { ticker: "KER.PA",  name: "Kering" },
  { ticker: "OR.PA",   name: "L'Oréal" },
  { ticker: "MC.PA",   name: "LVMH" },
  { ticker: "ML.PA",   name: "Michelin" },
  { ticker: "ORA.PA",  name: "Orange" },
  { ticker: "RI.PA",   name: "Pernod Ricard" },
  { ticker: "PUB.PA",  name: "Publicis" },
  { ticker: "RNO.PA",  name: "Renault" },
  { ticker: "SAF.PA",  name: "Safran" },
  { ticker: "SGO.PA",  name: "Saint-Gobain" },
  { ticker: "SAN.PA",  name: "Sanofi" },
  { ticker: "SU.PA",   name: "Schneider Electric" },
  { ticker: "GLE.PA",  name: "Société Générale" },
  { ticker: "STM.PA",  name: "STMicroelectronics" },
  { ticker: "HO.PA",   name: "Thales" },
  { ticker: "TTE.PA",  name: "TotalEnergies" },
  { ticker: "URW.PA",  name: "Unibail-Rodamco-Westfield" },
  { ticker: "VIE.PA",  name: "Veolia" },
  { ticker: "DG.PA",   name: "Vinci" },
  { ticker: "VIV.PA",  name: "Vivendi" },
  { ticker: "WLN.PA",  name: "Worldline" },
];

// MASI blue chips — Casablanca Stock Exchange (.CS suffix on Yahoo Finance)
export const MOROCCAN_COMPANIES = [
  { ticker: "ATW.CS",   name: "Attijariwafa Bank" },
  { ticker: "IAM.CS",   name: "Maroc Telecom" },
  { ticker: "BCP.CS",   name: "Banque Centrale Populaire" },
  { ticker: "BOA.CS",   name: "Bank of Africa" },
  { ticker: "CIH.CS",   name: "CIH Bank" },
  { ticker: "HPS.CS",   name: "HPS" },
  { ticker: "LBV.CS",   name: "Label Vie" },
  { ticker: "MNG.CS",   name: "Managem" },
  { ticker: "WAA.CS",   name: "Wafa Assurance" },
  { ticker: "TQM.CS",   name: "TotalEnergies Maroc" },
  { ticker: "ADH.CS",   name: "Addoha" },
  { ticker: "ALM.CS",   name: "Aluminium du Maroc" },
  { ticker: "CNIA.CS",  name: "CNIA Saada Assurance" },
  { ticker: "DLM.CS",   name: "Delattre Levivier Maroc" },
  { ticker: "MSA.CS",   name: "Marsa Maroc" },
];

const ALL_COMPANIES = [...FRENCH_COMPANIES, ...MOROCCAN_COMPANIES];

// Filter by ticker or company name
export function searchCompanies(query: string) {
  const q = query.toLowerCase();
  return ALL_COMPANIES.filter(
    (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  ).slice(0, 6); // cap at 6 suggestions
}
