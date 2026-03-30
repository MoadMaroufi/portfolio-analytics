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

// Filter by ticker or company name
export function searchCompanies(query: string) {
  const q = query.toLowerCase();
  return FRENCH_COMPANIES.filter(
    (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  ).slice(0, 6); // cap at 6 suggestions
}
