import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, ShieldCheck, AlertTriangle, Building2, TrendingUp } from "lucide-react";
import { TIERS, inr, useSession } from "@/lib/session";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      {
        title: "Live F&O Terminal 🛡️ CapitalGuard",
      },
      {
        name: "description",
        content: "Multi-Index and Stock F&O option chain simulation with realistic margin calculations.",
      },
    ],
  }),
  component: Terminal,
});

type SegmentType = "INDICES" | "STOCKS";
type InstrumentKey = "NIFTY" | "BANKNIFTY" | "SENSEX" | "FINNIFTY" | "RELIANCE" | "HDFCBANK" | "TATAMOTORS" | "INFY" | "ICICIBANK";

interface InstrumentConfig {
  name: string;
  segment: SegmentType;
  spot: number;
  lot: number;
  step: number;
  marginPerLot: number;
  chain: Array<{ strike: number; ce: number; pe: number }>;
}

const INSTRUMENTS: Record<InstrumentKey, InstrumentConfig> = {
  // Indices
  NIFTY: {
    name: "NIFTY 50",
    segment: "INDICES",
    spot: 24780.35,
    lot: 65,
    step: 50,
    marginPerLot: 125000,
    chain: [
      { strike: 24650, ce: 198.4, pe: 54.2 },
      { strike: 24700, ce: 162.8, pe: 71.6 },
      { strike: 24750, ce: 131.5, pe: 92.4 },
      { strike: 24800, ce: 104.2, pe: 118.4 },
      { strike: 24850, ce: 81.35, pe: 148.9 },
      { strike: 24900, ce: 62.1, pe: 184.2 },
    ],
  },
  BANKNIFTY: {
    name: "BANK NIFTY",
    segment: "INDICES",
    spot: 51240.8,
    lot: 30,
    step: 100,
    marginPerLot: 140000,
    chain: [
      { strike: 51000, ce: 380.5, pe: 142.0 },
      { strike: 51100, ce: 312.0, pe: 175.5 },
      { strike: 51200, ce: 250.4, pe: 215.2 },
      { strike: 51300, ce: 198.0, pe: 265.0 },
      { strike: 51400, ce: 152.6, pe: 320.4 },
      { strike: 51500, ce: 115.0, pe: 385.0 },
    ],
  },
  SENSEX: {
    name: "BSE SENSEX",
    segment: "INDICES",
    spot: 81350.25,
    lot: 20,
    step: 100,
    marginPerLot: 135000,
    chain: [
      { strike: 81100, ce: 410.0, pe: 165.0 },
      { strike: 81200, ce: 340.5, pe: 195.4 },
      { strike: 81300, ce: 278.2, pe: 235.0 },
      { strike: 81400, ce: 220.0, pe: 282.5 },
      { strike: 81500, ce: 170.8, pe: 340.0 },
    ],
  },
  FINNIFTY: {
    name: "FIN NIFTY",
    segment: "INDICES",
    spot: 23420.6,
    lot: 60,
    step: 50,
    marginPerLot: 110000,
    chain: [
      { strike: 23300, ce: 185.0, pe: 65.4 },
      { strike: 23350, ce: 148.2, pe: 82.0 },
      { strike: 23400, ce: 115.6, pe: 105.0 },
      { strike: 23450, ce: 88.4, pe: 132.8 },
      { strike: 23500, ce: 66.0, pe: 164.5 },
    ],
  },
  // Stock F&O
  RELIANCE: {
    name: "RELIANCE",
    segment: "STOCKS",
    spot: 3020.0,
    lot: 250,
    step: 20,
    marginPerLot: 150000,
    chain: [
      { strike: 2980, ce: 58.5, pe: 18.2 },
      { strike: 3000, ce: 44.0, pe: 24.5 },
      { strike: 3020, ce: 32.0, pe: 32.0 },
      { strike: 3040, ce: 22.5, pe: 42.0 },
      { strike: 3060, ce: 15.0, pe: 54.5 },
    ],
  },
  HDFCBANK: {
    name: "HDFC BANK",
    segment: "STOCKS",
    spot: 1660.0,
    lot: 550,
    step: 10,
    marginPerLot: 180000,
    chain: [
      { strike: 1640, ce: 32.0, pe: 11.5 },
      { strike: 1650, ce: 24.5, pe: 14.2 },
      { strike: 1660, ce: 18.0, pe: 18.0 },
      { strike: 1670, ce: 12.5, pe: 23.5 },
      { strike: 1680, ce: 8.5, pe: 30.0 },
    ],
  },
  TATAMOTORS: {
    name: "TATA MOTORS",
    segment: "STOCKS",
    spot: 1015.0,
    lot: 575,
    step: 10,
    marginPerLot: 125000,
    chain: [
      { strike: 990, ce: 34.0, pe: 8.5 },
      { strike: 1000, ce: 26.5, pe: 11.2 },
      { strike: 1010, ce: 19.8, pe: 14.6 },
      { strike: 1020, ce: 14.0, pe: 19.0 },
      { strike: 1030, ce: 9.5, pe: 25.0 },
    ],
  },
  INFY: {
    name: "INFOSYS",
    segment: "STOCKS",
    spot: 1865.0,
    lot: 400,
    step: 20,
    marginPerLot: 150000,
    chain: [
      { strike: 1820, ce: 58.0, pe: 12.4 },
      { strike: 1840, ce: 42.5, pe: 17.0 },
      { strike: 1860, ce: 29.0, pe: 24.0 },
      { strike: 1880, ce: 18.5, pe: 33.5 },
      { strike: 1900, ce: 11.0, pe: 46.0 },
    ],
  },
  ICICIBANK: {
    name: "ICICI BANK",
    segment: "STOCKS",
    spot: 1220.0,
    lot: 700,
    step: 10,
    marginPerLot: 170000,
    chain: [
      { strike: 1200, ce: 29.5, pe: 9.0 },
      { strike: 1210, ce: 22.0, pe: 12.0 },
      { strike: 1220, ce: 16.0, pe: 16.0 },
      { strike: 1230, ce: 11.0, pe: 21.0 },
      { strike: 1240, ce: 7.2, pe: 27.5 },
    ],
  },
};

function Terminal() {
  const navigate = useNavigate();
  const session = useSession();

  const [activeSegment, setActiveSegment] = useState<SegmentType>("INDICES");
  const [selectedKey, setSelectedKey] = useState<InstrumentKey>("NIFTY");
  const [selectedStrike, setSelectedStrike] = useState<number>(24800);
  const [optionSide, setOptionSide] = useState<"CE" | "PE">("CE");
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState(1);
  const [entryPrice, setEntryPrice] = useState(104.2);
  const [stopLoss, setStopLoss] = useState(85.0);

  const activeInstrument = INSTRUMENTS[selectedKey];
  const totalQty = lots * activeInstrument.lot;

  const isFuturesArena = session?.arena === "futures";
  const virtualBalance = isFuturesArena ? 5000000 : 1000000;

  const isMarginOrder = isFuturesArena || orderType === "SELL";
  const capitalRequired = isMarginOrder
    ? lots * activeInstrument.marginPerLot
    : totalQty * entryPrice;

  const riskPerUnit = Math.max(0, entryPrice - stopLoss);
  const plannedRisk = isMarginOrder ? totalQty * (entryPrice * 0.015) : totalQty * riskPerUnit;

  const getSessionLimit = () => {
    if (session?.dailyLossLimit) return session.dailyLossLimit;
    if (session?.maxLoss) return session.maxLoss;
    if (session?.tier && (TIERS as any)?.[session.tier]?.maxLoss) {
      return (TIERS as any)[session.tier].maxLoss;
    }
    return isFuturesArena ? 250000 : 5000;
  };

  const dailyLimit = getSessionLimit();
  const realizedLoss = session?.totalRealizedLoss || 0;
  const remainingBudget = Math.max(0, dailyLimit - realizedLoss);

  const isRiskExceeded = plannedRisk > remainingBudget;
  const isInsufficientCapital = capitalRequired > virtualBalance;
  const canExecute = !isRiskExceeded && !isInsufficientCapital && capitalRequired > 0;

  const handleInstrumentChange = (key: InstrumentKey) => {
    setSelectedKey(key);
    const inst = INSTRUMENTS[key];
    const midRow = inst.chain[Math.floor(inst.chain.length / 2)];
    setSelectedStrike(midRow.strike);
    const initialPrice = optionSide === "CE" ? midRow.ce : midRow.pe;
    setEntryPrice(initialPrice);
    setStopLoss(Math.round(initialPrice * 0.8));
  };

  const selectContract = (strike: number, side: "CE" | "PE", price: number) => {
    setSelectedStrike(strike);
    setOptionSide(side);
    setEntryPrice(price);
    setStopLoss(Math.round(price * 0.8));
  };

  const handleExecute = () => {
    if (!canExecute) return;

    const newPosition = {
      id: "pos_" + Date.now(),
      index: selectedKey,
      symbol: `${selectedKey} ${selectedStrike} ${optionSide}`,
      strike: selectedStrike,
      side: optionSide,
      type: orderType,
      lots,
      quantity: totalQty,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss,
      plannedRisk,
      capitalRequired,
      isMarginOrder,
      timestamp: new Date().toLocaleTimeString(),
    };

    localStorage.setItem("capitalguard_position", JSON.stringify(newPosition));
    navigate({ to: "/position" });
  };

  const visibleInstruments = (Object.keys(INSTRUMENTS) as InstrumentKey[]).filter(
    (k) => INSTRUMENTS[k].segment === activeSegment
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-3 sm:p-6 pb-24">
      {/* Session Telemetry Bar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            {isFuturesArena ? "Futures Arena Shield" : "Options Arena Shield"}
          </span>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-lg font-bold text-amber-400">₹{remainingBudget.toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-400">/ ₹{dailyLimit.toLocaleString("en-IN")} Max Loss</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Virtual Capital</span>
          <div className="text-sm font-bold font-mono text-slate-200">₹{virtualBalance.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Segment Selector */}
      <div className="max-w-5xl mx-auto flex space-x-2 p-1 bg-[#151A23] border border-[#222B3A] rounded-xl mb-3">
        <button
          onClick={() => {
            setActiveSegment("INDICES");
            handleInstrumentChange("NIFTY");
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeSegment === "INDICES"
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Index F&O</span>
        </button>
        <button
          onClick={() => {
            setActiveSegment("STOCKS");
            handleInstrumentChange("RELIANCE");
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeSegment === "STOCKS"
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Stock F&O</span>
        </button>
      </div>

      {/* Instrument Tabs */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
        {visibleInstruments.map((key) => {
          const inst = INSTRUMENTS[key];
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              onClick={() => handleInstrumentChange(key)}
              className={`py-2 px-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-slate-800 border-amber-400 shadow-md shadow-amber-400/10"
                  : "bg-[#151A23] text-slate-400 border-[#222B3A] hover:border-slate-700 hover:text-white"
              }`}
            >
              <div className="text-[11px] font-bold text-white flex justify-between">
                <span>{inst.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">L:{inst.lot}</span>
              </div>
              <div className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                ₹{inst.spot.toLocaleString("en-IN")}
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Strike Chain Matrix */}
        <div className="lg:col-span-7 bg-[#151A23] border border-[#222B3A] rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222B3A] mb-3">
            <div className="text-xs font-bold text-slate-300 uppercase">{activeInstrument.name} OPTION CHAIN</div>
            <div className="text-[11px] text-slate-400">Lot Size: {activeInstrument.lot} Qty</div>
          </div>

          <div className="grid grid-cols-3 text-[11px] font-bold text-slate-400 text-center pb-2 border-b border-slate-800">
            <div className="text-emerald-400">CALL (CE)</div>
            <div>STRIKE</div>
            <div className="text-rose-400">PUT (PE)</div>
          </div>

          <div className="space-y-1.5 mt-2">
            {activeInstrument.chain.map((row) => {
              const isCE = selectedStrike === row.strike && optionSide === "CE";
              const isPE = selectedStrike === row.strike && optionSide === "PE";
              return (
                <div key={row.strike} className="grid grid-cols-3 text-xs text-center items-center py-1">
                  <button
                    onClick={() => selectContract(row.strike, "CE", row.ce)}
                    className={`py-2 px-2 rounded-lg font-mono font-bold transition-all ${
                      isCE
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                        : "bg-slate-900/60 text-emerald-400 hover:bg-slate-800"
                    }`}
                  >
                    ₹{row.ce.toFixed(1)}
                  </button>

                  <div className="font-mono font-bold text-slate-300 text-sm">{row.strike}</div>

                  <button
                    onClick={() => selectContract(row.strike, "PE", row.pe)}
                    className={`py-2 px-2 rounded-lg font-mono font-bold transition-all ${
                      isPE
                        ? "bg-rose-500 text-slate-950 shadow-md shadow-rose-500/30"
                        : "bg-slate-900/60 text-rose-400 hover:bg-slate-800"
                    }`}
                  >
                    ₹{row.pe.toFixed(1)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Ticket */}
        <div className="lg:col-span-5 bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300 mb-3">ORDER TICKET</div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">
                  {selectedKey} {selectedStrike} {optionSide}
                </span>
                <div className="text-[10px] text-slate-400">
                  {activeInstrument.name} • {activeInstrument.segment === "STOCKS" ? "Stock F&O" : "Index F&O"}
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-amber-400">₹{entryPrice.toFixed(1)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setOrderType("BUY")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  orderType === "BUY" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-slate-900 text-slate-400"
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setOrderType("SELL")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  orderType === "SELL" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-slate-900 text-slate-400"
                }`}
              >
                SELL
              </button>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Lots ({activeInstrument.lot} Qty/Lot)</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLots(Math.max(1, lots - 1))}
                  className="w-7 h-7 bg-slate-900 rounded text-slate-300 font-bold hover:bg-slate-800"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold font-mono">{lots}</span>
                <button
                  onClick={() => setLots(lots + 1)}
                  className="w-7 h-7 bg-slate-900 rounded text-slate-300 font-bold hover:bg-slate-800"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-[10px] text-slate-400">Entry Price (₹)</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Stop-Loss (₹)</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {isMarginOrder ? "SPAN Margin Required" : "Upfront Premium Needed"}
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{capitalRequired.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {isMarginOrder ? `₹${(activeInstrument.marginPerLot / 100000).toFixed(2)}L/lot` : `${totalQty} Qty × ₹${entryPrice}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Planned Risk (Max SL)</span>
                  <span className={`font-mono font-bold text-sm ${isRiskExceeded ? "text-rose-400" : "text-amber-400"}`}>
                    ₹{plannedRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Against Daily Guardrail</span>
                </div>
              </div>

              {isRiskExceeded && (
                <div className="text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50 flex items-start space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Planned risk ₹{plannedRisk.toLocaleString("en-IN")} exceeds remaining shield budget (₹{remainingBudget.toLocaleString("en-IN")}).
                  </span>
                </div>
              )}

              {isInsufficientCapital && (
                <div className="text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50">
                  ⚠️ Insufficient virtual capital (Required: ₹{capitalRequired.toLocaleString("en-IN")} | Available: ₹{virtualBalance.toLocaleString("en-IN")}).
                </div>
              )}
            </div>
          </div>

          <button
            disabled={!canExecute}
            onClick={handleExecute}
            className={`w-full mt-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all ${
              canExecute
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98]"
                : "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
            }`}
          >
            {isInsufficientCapital ? "INSUFFICIENT CAPITAL" : isRiskExceeded ? "BLOCKED BY SHIELD" : "EXECUTE PROTECTED ORDER"}
          </button>
        </div>
      </div>
    </div>
  );
}