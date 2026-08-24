import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, ShieldCheck, X, AlertTriangle } from "lucide-react";
import { TIERS, inr, useSession } from "@/lib/session";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      {
        title: "Live F&O Terminal 🛡️ CapitalGuard",
      },
      {
        name: "description",
        content: "Multi-Index option chain simulation with live LTPs, order tickets, and real-time risk tracking.",
      },
    ],
  }),
  component: Terminal,
});

type IndexType = "NIFTY" | "BANKNIFTY" | "SENSEX" | "FINNIFTY";

interface IndexConfig {
  name: string;
  spot: number;
  lot: number;
  step: number;
  chain: Array<{ strike: number; ce: number; pe: number }>;
}

const INDICES: Record<IndexType, IndexConfig> = {
  NIFTY: {
    name: "NIFTY 50",
    spot: 24780.35,
    lot: 65,
    step: 50,
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
    spot: 51240.8,
    lot: 30,
    step: 100,
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
    spot: 81350.25,
    lot: 20,
    step: 100,
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
    spot: 23420.6,
    lot: 60,
    step: 50,
    chain: [
      { strike: 23300, ce: 185.0, pe: 65.4 },
      { strike: 23350, ce: 148.2, pe: 82.0 },
      { strike: 23400, ce: 115.6, pe: 105.0 },
      { strike: 23450, ce: 88.4, pe: 132.8 },
      { strike: 23500, ce: 66.0, pe: 164.5 },
    ],
  },
};

function Terminal() {
  const navigate = useNavigate();
  const session = useSession();

  const [selectedIndex, setSelectedIndex] = useState<IndexType>("NIFTY");
  const [selectedStrike, setSelectedStrike] = useState<number>(24800);
  const [optionSide, setOptionSide] = useState<"CE" | "PE">("CE");
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState(1);
  const [entryPrice, setEntryPrice] = useState(104.2);
  const [stopLoss, setStopLoss] = useState(85.0);

  const activeIndex = INDICES[selectedIndex];
  const totalQty = lots * activeIndex.lot;

  const handleIndexChange = (indexKey: IndexType) => {
    setSelectedIndex(indexKey);
    const newIdx = INDICES[indexKey];
    const midStrike = newIdx.chain[Math.floor(newIdx.chain.length / 2)];
    setSelectedStrike(midStrike.strike);
    setEntryPrice(optionSide === "CE" ? midStrike.ce : midStrike.pe);
    setStopLoss(Math.round((optionSide === "CE" ? midStrike.ce : midStrike.pe) * 0.8));
  };

  const selectContract = (strike: number, side: "CE" | "PE", price: number) => {
    setSelectedStrike(strike);
    setOptionSide(side);
    setEntryPrice(price);
    setStopLoss(Math.round(price * 0.8));
  };

  const riskPerUnit = Math.max(0, entryPrice - stopLoss);
  const plannedRisk = totalQty * riskPerUnit;


  const dailyLimit = session.maxLoss;
  const realizedLoss = Math.max(0, -session.realized);
  const remainingBudget = Math.max(0, dailyLimit - realizedLoss);

  const isRiskExceeded = plannedRisk > remainingBudget;
  const isBufferTooSmall = remainingBudget < activeIndex.lot * 5;
  const canExecute = !isRiskExceeded && !isBufferTooSmall && plannedRisk > 0 && !session.locked;

  const handleExecute = () => {
    if (!canExecute) return;

    session.openPosition({
      symbol: selectedIndex,
      strike: selectedStrike,
      type: optionSide,
      side: orderType,
      qty: totalQty,
      entry: entryPrice,
      sl: stopLoss > 0 ? stopLoss : null,
      target: null,
    });

    navigate({ to: "/position" });
  };


  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-3 sm:p-6 pb-24">
      {/* Top Header & Risk Telemetry */}
      <div className="max-w-4xl mx-auto flex items-center justify-between p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Session Risk Shield</span>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-lg font-bold text-amber-400">₹{remainingBudget.toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-400">/ ₹{dailyLimit.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Active Protection</span>
        </div>
      </div>

      {/* Multi-Index Selector Tabs */}
      <div className="max-w-4xl mx-auto grid grid-cols-4 gap-2 mb-4">
        {(Object.keys(INDICES) as IndexType[]).map((key) => (
          <button
            key={key}
            onClick={() => handleIndexChange(key)}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center ${
              selectedIndex === key
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]"
                : "bg-[#151A23] text-slate-400 border-[#222B3A] hover:text-white"
            }`}
          >
            <span>{INDICES[key].name}</span>
            <span className={`text-[10px] mt-0.5 ${selectedIndex === key ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
              {INDICES[key].spot.toLocaleString("en-IN")}
            </span>
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Option Chain Section */}
        <div className="lg:col-span-7 bg-[#151A23] border border-[#222B3A] rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222B3A] mb-3">
            <div className="text-xs font-bold text-slate-300">STRIKE MATRIX</div>
            <div className="text-[11px] text-slate-400">Lot: {activeIndex.lot} Qty</div>
          </div>

          <div className="grid grid-cols-3 text-[11px] font-bold text-slate-400 text-center pb-2 border-b border-slate-800">
            <div className="text-emerald-400">CALL (CE)</div>
            <div>STRIKE</div>
            <div className="text-rose-400">PUT (PE)</div>
          </div>

          <div className="space-y-1.5 mt-2">
            {activeIndex.chain.map((row) => {
              const isSelectedCE = selectedStrike === row.strike && optionSide === "CE";
              const isSelectedPE = selectedStrike === row.strike && optionSide === "PE";
              return (
                <div key={row.strike} className="grid grid-cols-3 text-xs text-center items-center py-1">
                  <button
                    onClick={() => selectContract(row.strike, "CE", row.ce)}
                    className={`py-2 px-2 rounded-lg font-mono font-bold transition-all ${
                      isSelectedCE
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
                      isSelectedPE
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

        {/* Order Ticket Section */}
        <div className="lg:col-span-5 bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300 mb-3">ORDER TICKET</div>

            {/* Selected Contract Info */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">
                  {selectedIndex} {selectedStrike} {optionSide}
                </span>
                <div className="text-[10px] text-slate-400">{activeIndex.name} Option</div>
              </div>
              <span className="text-sm font-bold font-mono text-amber-400">₹{entryPrice.toFixed(1)}</span>
            </div>

            {/* Buy / Sell Toggles */}
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

            {/* Lot Counter */}
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Lots ({activeIndex.lot} Qty/Lot)</span>
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

            {/* Price & SL Inputs */}
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

            {/* Planned Risk Box */}
            <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Planned Risk:</span>
                <span className={`font-mono font-bold ${isRiskExceeded ? "text-rose-400" : "text-amber-400"}`}>
                  ₹{plannedRisk.toLocaleString("en-IN")}
                </span>
              </div>

              {isRiskExceeded && (
                <div className="mt-2 text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50 flex items-start space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Risk of ₹{plannedRisk.toLocaleString("en-IN")} exceeds remaining limit (₹{remainingBudget.toLocaleString("en-IN")}). Reduce lots or tighten SL.
                  </span>
                </div>
              )}

              {isBufferTooSmall && (
                <div className="mt-2 text-[10px] text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/50">
                  🛡️ Remaining shield limit is below minimum tick buffer for {selectedIndex}.
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            disabled={!canExecute}
            onClick={handleExecute}
            className={`w-full mt-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all ${
              canExecute
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98]"
                : "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
            }`}
          >
            {isRiskExceeded ? "BLOCKED BY SHIELD" : isBufferTooSmall ? "DAILY LIMIT DEPLETED" : "EXECUTE PROTECTED ORDER"}
          </button>
        </div>
      </div>
    </div>
  );
}