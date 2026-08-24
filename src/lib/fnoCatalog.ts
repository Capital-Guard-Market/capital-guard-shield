export interface FnoInstrument {
  symbol: string;
  name: string;
  segment: "INDICES" | "STOCKS";
  sector?: string;
  spot: number;
  lot: number;
  step: number;
  marginPerLot: number;
}

export const INDICES_DATA: FnoInstrument[] = [
  { symbol: "NIFTY", name: "NIFTY 50", segment: "INDICES", spot: 24780.35, lot: 65, step: 50, marginPerLot: 125000 },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", segment: "INDICES", spot: 51240.8, lot: 30, step: 100, marginPerLot: 140000 },
  { symbol: "SENSEX", name: "BSE SENSEX", segment: "INDICES", spot: 81350.25, lot: 20, step: 100, marginPerLot: 135000 },
  { symbol: "FINNIFTY", name: "FIN NIFTY", segment: "INDICES", spot: 23420.6, lot: 60, step: 50, marginPerLot: 110000 },
  { symbol: "MIDCPNIFTY", name: "MIDCAP NIFTY", segment: "INDICES", spot: 13150.0, lot: 120, step: 25, marginPerLot: 95000 },
];

export const STOCKS_DATA: FnoInstrument[] = [
  // Banking & Financials
  { symbol: "HDFCBANK", name: "HDFC Bank", segment: "STOCKS", sector: "Banking", spot: 1660.0, lot: 550, step: 10, marginPerLot: 180000 },
  { symbol: "ICICIBANK", name: "ICICI Bank", segment: "STOCKS", sector: "Banking", spot: 1220.0, lot: 700, step: 10, marginPerLot: 170000 },
  { symbol: "SBIN", name: "State Bank of India", segment: "STOCKS", sector: "Banking", spot: 840.0, lot: 750, step: 10, marginPerLot: 145000 },
  { symbol: "AXISBANK", name: "Axis Bank", segment: "STOCKS", sector: "Banking", spot: 1180.0, lot: 625, step: 10, marginPerLot: 150000 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", segment: "STOCKS", sector: "Banking", spot: 1780.0, lot: 400, step: 20, marginPerLot: 140000 },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", segment: "STOCKS", sector: "Banking", spot: 1420.0, lot: 500, step: 20, marginPerLot: 145000 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", segment: "STOCKS", sector: "Financial", spot: 7100.0, lot: 125, step: 50, marginPerLot: 175000 },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", segment: "STOCKS", sector: "Financial", spot: 1850.0, lot: 500, step: 20, marginPerLot: 160000 },
  { symbol: "CHOLAFIN", name: "Cholamandalam Inv", segment: "STOCKS", sector: "Financial", spot: 1540.0, lot: 625, step: 20, marginPerLot: 190000 },
  { symbol: "PFC", name: "Power Finance Corp", segment: "STOCKS", sector: "Financial", spot: 510.0, lot: 1300, step: 10, marginPerLot: 155000 },
  { symbol: "RECLTD", name: "REC Limited", segment: "STOCKS", sector: "Financial", spot: 580.0, lot: 1000, step: 10, marginPerLot: 140000 },
  { symbol: "SHRIRAMFIN", name: "Shriram Finance", segment: "STOCKS", sector: "Financial", spot: 3250.0, lot: 300, step: 50, marginPerLot: 195000 },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance", segment: "STOCKS", sector: "Financial", spot: 1940.0, lot: 550, step: 20, marginPerLot: 180000 },
  { symbol: "FEDERALBNK", name: "Federal Bank", segment: "STOCKS", sector: "Banking", spot: 195.0, lot: 5000, step: 2.5, marginPerLot: 160000 },
  { symbol: "BANDHANBNK", name: "Bandhan Bank", segment: "STOCKS", sector: "Banking", spot: 190.0, lot: 5000, step: 2.5, marginPerLot: 180000 },
  { symbol: "AUBANK", name: "AU Small Finance Bank", segment: "STOCKS", sector: "Banking", spot: 660.0, lot: 1000, step: 10, marginPerLot: 150000 },

  // IT & Tech
  { symbol: "TCS", name: "Tata Consultancy Serv", segment: "STOCKS", sector: "IT", spot: 4250.0, lot: 175, step: 50, marginPerLot: 160000 },
  { symbol: "INFY", name: "Infosys Limited", segment: "STOCKS", sector: "IT", spot: 1865.0, lot: 400, step: 20, marginPerLot: 150000 },
  { symbol: "HCLTECH", name: "HCL Technologies", segment: "STOCKS", sector: "IT", spot: 1780.0, lot: 350, step: 20, marginPerLot: 140000 },
  { symbol: "WIPRO", name: "Wipro Limited", segment: "STOCKS", sector: "IT", spot: 530.0, lot: 1500, step: 10, marginPerLot: 155000 },
  { symbol: "TECHM", name: "Tech Mahindra", segment: "STOCKS", sector: "IT", spot: 1610.0, lot: 600, step: 20, marginPerLot: 175000 },
  { symbol: "LTIM", name: "LTIMindtree", segment: "STOCKS", sector: "IT", spot: 5950.0, lot: 150, step: 50, marginPerLot: 185000 },
  { symbol: "PERSISTENT", name: "Persistent Systems", segment: "STOCKS", sector: "IT", spot: 5200.0, lot: 125, step: 50, marginPerLot: 165000 },
  { symbol: "COFORGE", name: "Coforge Limited", segment: "STOCKS", sector: "IT", spot: 7400.0, lot: 100, step: 100, marginPerLot: 170000 },
  { symbol: "MPHASIS", name: "Mphasis Limited", segment: "STOCKS", sector: "IT", spot: 3050.0, lot: 275, step: 50, marginPerLot: 160000 },
  { symbol: "NAUKRI", name: "Info Edge (India)", segment: "STOCKS", sector: "Tech", spot: 7850.0, lot: 75, step: 100, marginPerLot: 150000 },
  { symbol: "ZOMATO", name: "Zomato Limited", segment: "STOCKS", sector: "Tech", spot: 260.0, lot: 2500, step: 5, marginPerLot: 170000 },

  // Energy, Oil & Utilities
  { symbol: "RELIANCE", name: "Reliance Industries", segment: "STOCKS", sector: "Energy", spot: 3020.0, lot: 250, step: 20, marginPerLot: 150000 },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", segment: "STOCKS", sector: "Energy", spot: 315.0, lot: 2250, step: 5, marginPerLot: 150000 },
  { symbol: "NTPC", name: "NTPC Limited", segment: "STOCKS", sector: "Power", spot: 410.0, lot: 1500, step: 5, marginPerLot: 140000 },
  { symbol: "POWERGRID", name: "Power Grid Corp", segment: "STOCKS", sector: "Power", spot: 340.0, lot: 1800, step: 5, marginPerLot: 135000 },
  { symbol: "COALINDIA", name: "Coal India", segment: "STOCKS", sector: "Energy", spot: 510.0, lot: 1350, step: 10, marginPerLot: 145000 },
  { symbol: "BPCL", name: "Bharat Petroleum", segment: "STOCKS", sector: "Energy", spot: 360.0, lot: 1800, step: 5, marginPerLot: 160000 },
  { symbol: "IOC", name: "Indian Oil Corp", segment: "STOCKS", sector: "Energy", spot: 175.0, lot: 4875, step: 2.5, marginPerLot: 170000 },
  { symbol: "GAIL", name: "GAIL (India) Ltd", segment: "STOCKS", sector: "Energy", spot: 230.0, lot: 3250, step: 2.5, marginPerLot: 165000 },
  { symbol: "ADANIENT", name: "Adani Enterprises", segment: "STOCKS", sector: "Conglomerate", spot: 3050.0, lot: 300, step: 50, marginPerLot: 220000 },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", segment: "STOCKS", sector: "Infra", spot: 1480.0, lot: 400, step: 20, marginPerLot: 160000 },
  { symbol: "TATAPOWER", name: "Tata Power", segment: "STOCKS", sector: "Power", spot: 430.0, lot: 1350, step: 5, marginPerLot: 155000 },

  // Auto & Industrials
  { symbol: "TATAMOTORS", name: "Tata Motors", segment: "STOCKS", sector: "Auto", spot: 1015.0, lot: 575, step: 10, marginPerLot: 125000 },
  { symbol: "MARUTI", name: "Maruti Suzuki", segment: "STOCKS", sector: "Auto", spot: 12400.0, lot: 50, step: 100, marginPerLot: 155000 },
  { symbol: "M&M", name: "Mahindra & Mahindra", segment: "STOCKS", sector: "Auto", spot: 2850.0, lot: 350, step: 50, marginPerLot: 180000 },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", segment: "STOCKS", sector: "Auto", spot: 11200.0, lot: 75, step: 100, marginPerLot: 185000 },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", segment: "STOCKS", sector: "Auto", spot: 5450.0, lot: 150, step: 50, marginPerLot: 165000 },
  { symbol: "EICHERMOT", name: "Eicher Motors", segment: "STOCKS", sector: "Auto", spot: 4850.0, lot: 175, step: 50, marginPerLot: 170000 },
  { symbol: "TVSMOTOR", name: "TVS Motor Co", segment: "STOCKS", sector: "Auto", spot: 2650.0, lot: 350, step: 50, marginPerLot: 175000 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", segment: "STOCKS", sector: "Telecom", spot: 1550.0, lot: 475, step: 20, marginPerLot: 150000 },
  { symbol: "LT", name: "Larsen & Toubro", segment: "STOCKS", sector: "Capital Goods", spot: 3650.0, lot: 150, step: 50, marginPerLot: 135000 },
  { symbol: "BEL", name: "Bharat Electronics", segment: "STOCKS", sector: "Defense", spot: 295.0, lot: 2850, step: 5, marginPerLot: 170000 },
  { symbol: "HAL", name: "Hindustan Aeronautics", segment: "STOCKS", sector: "Defense", spot: 4750.0, lot: 150, step: 50, marginPerLot: 190000 },
  { symbol: "SIEMENS", name: "Siemens India", segment: "STOCKS", sector: "Capital Goods", spot: 6850.0, lot: 125, step: 50, marginPerLot: 180000 },
  { symbol: "ABB", name: "ABB India", segment: "STOCKS", sector: "Capital Goods", spot: 8100.0, lot: 125, step: 100, marginPerLot: 210000 },

  // Metals & Mining
  { symbol: "TATASTEEL", name: "Tata Steel", segment: "STOCKS", sector: "Metals", spot: 155.0, lot: 5500, step: 2.5, marginPerLot: 165000 },
  { symbol: "JSWSTEEL", name: "JSW Steel", segment: "STOCKS", sector: "Metals", spot: 950.0, lot: 675, step: 10, marginPerLot: 150000 },
  { symbol: "HINDALCO", name: "Hindalco Industries", segment: "STOCKS", sector: "Metals", spot: 675.0, lot: 1400, step: 10, marginPerLot: 180000 },
  { symbol: "VEDL", name: "Vedanta Limited", segment: "STOCKS", sector: "Metals", spot: 460.0, lot: 1550, step: 5, marginPerLot: 170000 },
  { symbol: "JINDALSTEL", name: "Jindal Steel & Power", segment: "STOCKS", sector: "Metals", spot: 980.0, lot: 625, step: 10, marginPerLot: 155000 },
  { symbol: "NMDC", name: "NMDC Limited", segment: "STOCKS", sector: "Metals", spot: 225.0, lot: 3350, step: 2.5, marginPerLot: 160000 },
  { symbol: "SAIL", name: "Steel Authority of India", segment: "STOCKS", sector: "Metals", spot: 135.0, lot: 8000, step: 2.5, marginPerLot: 180000 },

  // Pharma & Healthcare
  { symbol: "SUNPHARMA", name: "Sun Pharma", segment: "STOCKS", sector: "Pharma", spot: 1820.0, lot: 350, step: 20, marginPerLot: 140000 },
  { symbol: "CIPLA", name: "Cipla Limited", segment: "STOCKS", sector: "Pharma", spot: 1620.0, lot: 650, step: 20, marginPerLot: 175000 },
  { symbol: "DRREDDY", name: "Dr. Reddy's Labs", segment: "STOCKS", sector: "Pharma", spot: 6700.0, lot: 125, step: 50, marginPerLot: 160000 },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", segment: "STOCKS", sector: "Pharma", spot: 5150.0, lot: 150, step: 50, marginPerLot: 170000 },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", segment: "STOCKS", sector: "Healthcare", spot: 6900.0, lot: 125, step: 50, marginPerLot: 180000 },
  { symbol: "LUPIN", name: "Lupin Limited", segment: "STOCKS", sector: "Pharma", spot: 2150.0, lot: 425, step: 20, marginPerLot: 165000 },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma", segment: "STOCKS", sector: "Pharma", spot: 1480.0, lot: 550, step: 20, marginPerLot: 160000 },

  // FMCG, Consumption & Retail
  { symbol: "ITC", name: "ITC Limited", segment: "STOCKS", sector: "FMCG", spot: 495.0, lot: 1600, step: 5, marginPerLot: 140000 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", segment: "STOCKS", sector: "FMCG", spot: 2750.0, lot: 300, step: 20, marginPerLot: 150000 },
  { symbol: "NESTLEIND", name: "Nestle India", segment: "STOCKS", sector: "FMCG", spot: 2520.0, lot: 250, step: 20, marginPerLot: 145000 },
  { symbol: "BRITANNIA", name: "Britannia Industries", segment: "STOCKS", sector: "FMCG", spot: 5850.0, lot: 125, step: 50, marginPerLot: 155000 },
  { symbol: "TATACONSUM", name: "Tata Consumer", segment: "STOCKS", sector: "FMCG", spot: 1180.0, lot: 550, step: 10, marginPerLot: 140000 },
  { symbol: "DABUR", name: "Dabur India", segment: "STOCKS", sector: "FMCG", spot: 620.0, lot: 1250, step: 5, marginPerLot: 145000 },
  { symbol: "GODREJCP", name: "Godrej Consumer", segment: "STOCKS", sector: "FMCG", spot: 1450.0, lot: 500, step: 20, marginPerLot: 150000 },
  { symbol: "TITAN", name: "Titan Company", segment: "STOCKS", sector: "Consumer", spot: 3600.0, lot: 175, step: 50, marginPerLot: 145000 },
  { symbol: "TRENT", name: "Trent Limited", segment: "STOCKS", sector: "Retail", spot: 7100.0, lot: 100, step: 50, marginPerLot: 190000 },
  { symbol: "DMART", name: "Avenue Supermarts", segment: "STOCKS", sector: "Retail", spot: 4800.0, lot: 150, step: 50, marginPerLot: 165000 },
];

export function generateStrikeChain(spot: number, step: number) {
  const atmBase = Math.round(spot / step) * step;
  const chain = [];

  for (let offset = -3; offset <= 3; offset++) {
    const strike = atmBase + offset * step;
    const moneyness = (strike - spot) / spot;
    
    const baseAtmPrem = spot * 0.015;
    const ce = Math.max(1.5, Number((Math.max(0, spot - strike) + baseAtmPrem * Math.exp(-moneyness * 4)).toFixed(1)));
    const pe = Math.max(1.5, Number((Math.max(0, strike - spot) + baseAtmPrem * Math.exp(moneyness * 4)).toFixed(1)));

    chain.push({ strike, ce, pe });
  }

  return chain;
}