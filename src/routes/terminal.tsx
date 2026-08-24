import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { ShieldCheck, AlertTriangle, Building2, TrendingUp, Search, X } from "lucide-react";
import { TIERS, useSession } from "@/lib/session";
import { INDICES_DATA, STOCKS_DATA, generateStrikeChain, FnoInstrument } from "@/lib/fnoCatalog";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      { title: "Live F&O Terminal 🛡️ CapitalGuard" },
      { name: "description", content: "Complete 180+ F&O simulator with live strike chains, search, and dynamic margin protection." },
    ],
  }),
  component: Terminal,
});

function Terminal() {
  const navigate = useNavigate();
  const session = useSession();

  const [activeSegment, setActiveSegment] = useState<"INDICES" | "STOCKS">("INDICES");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NIFTY");

  const [selectedStrike, setSelectedStrike] = useState<number>(24800);
  const [optionSide, setOptionSide] = useState<"CE" | "PE">("CE");
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState(1);
  const [entryPrice, setEntryPrice] = useState(104.2);
  const [stopLoss, setStopLoss] = useState(85.0);

  const availableInstruments = useMemo(() => {
    const list = activeSegment === "INDICES" ? INDICES_DATA : STOCKS_DATA;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (i) =>
        i.symbol.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.sector?.toLowerCase().includes(q)
    );
  }, [activeSegment, searchQuery]);

  const activeInstrument: FnoInstrument = useMemo(() => {
    const all = [...INDICES_DATA, ...STOCKS_DATA];
    return all.find((i) => i.symbol === selectedSymbol) || INDICES_DATA[0];
  }, [selectedSymbol]);

  const chain = useMemo(() => {
    return generateStrikeChain(activeInstrument.spot, activeInstrument.step);
  }, [activeInstrument]);

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

  const handleSelectInstrument = (inst: FnoInstrument) => {
    setSelectedSymbol(inst.symbol);
    const newChain = generateStrikeChain(inst.spot, inst.step);
    const mid = newChain[Math.floor(newChain.length / 2)];
    setSelectedStrike(mid.strike);
    const initPrice = optionSide === "CE" ? mid.ce : mid.pe;
    setEntryPrice(initPrice);
    setStopLoss(Math.round(initPrice * 0.8 * 10) / 10);
  };

  const selectContract = (strike: number, side: "CE" | "PE", price: number) => {
    setSelectedStrike(strike);
    setOptionSide(side);
    setEntryPrice(price);
    setStopLoss(Math.round(price * 0.8 * 10) / 10);
  };

  const handleExecute = () => {
    if (!canExecute) return;

    const newPosition = {
      id: "pos_" + Date.now(),
      index: activeInstrument.symbol,
      symbol: `${activeInstrument.symbol} ${selectedStrike} ${optionSide}`,
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

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-3 sm:p-6 pb-24">
      {/* Session Telemetry Header */}
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

      {/* Segment Switcher + Search Bar */}
      <div className="max-w-5xl mx-auto space-y-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex p-1 bg-[#151A23] border border-[#222B3A] rounded-xl shrink-0 sm:w-64">
            <button
              onClick={() => {
                setActiveSegment("INDICES");
                setSearchQuery("");
                handleSelectInstrument(INDICES_DATA[0]);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeSegment === "INDICES" ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Index F&O</span>
            </button>
            <button
              onClick={() => {
                setActiveSegment("STOCKS");
                setSearchQuery("");
                handleSelectInstrument(STOCKS_DATA[0]);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeSegment === "STOCKS" ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All Stocks (180+)</span>
            </button>
          </div>

          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${activeSegment === "INDICES" ? "Indices" : "180+ F&O Stocks"} (e.g., RELIANCE, ZOMATO, TATA, SBIN)...`}
              className="w-full pl-9 pr-8 py-2.5 bg-[#151A23] border border-[#222B3A] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Instrument Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {availableInstruments.map((inst) => {
            const isSelected = selectedSymbol === inst.symbol;
            return (
              <button
                key={inst.symbol}
                onClick={() => handleSelectInstrument(inst)}
                className={`py-2 px-3 rounded-xl border shrink-0 text-left transition-all ${
                  isSelected
                    ? "bg-slate-800 border-amber-400 shadow-md shadow-amber-400/10"
                    : "bg-[#151A23] text-slate-400 border-[#222B3A] hover:border-slate-700 hover:text-white"
                }`}
              >
                <div className="text-[11px] font-bold text-white flex items-center space-x-2">
                  <span>{inst.symbol}</span>
                  <span className="text-[9px] px-1 bg-slate-900 text-slate-400 rounded font-mono">L:{inst.lot}</span>
                </div>
                <div className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                  ₹{inst.spot.toLocaleString("en-IN")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Dynamic Strike Chain Matrix */}
        <div className="lg:col-span-7 bg-[#151A23] border border-[#222B3A] rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222B3A] mb-3">
            <div>
              <span className="text-xs font-bold text-white uppercase">{activeInstrument.name}</span>
              <span className="text-[10px] text-slate-400 ml-2 font-mono">Spot: ₹{activeInstrument.spot.toLocaleString("en-IN")}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Lot Size: {activeInstrument.lot}</div>
          </div>

          <div className="grid grid-cols-3 text-[11px] font-bold text-slate-400 text-center pb-2 border-b border-slate-800">
            <div className="text-emerald-400">CALL (CE)</div>
            <div>STRIKE</div>
            <div className="text-rose-400">PUT (PE)</div>
          </div>

          <div className="space-y-1.5 mt-2">
            {chain.map((row) => {
              const isCE = selectedStrike === row.strike && optionSide === "CE";
              const isPE = selectedStrike === row.strike && optionSide === "PE";
              return (
                <div key={row.strike} className="grid grid-cols-3 text-xs text-center items-center py-1">
                  <button
                    onClick={() => selectContract(row.strike, "CE", row.ce)}
                    className={`py-2 px-2 rounded-lg font-mono font-bold transition-all ${
                      isCE ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30" : "bg-slate-900/60 text-emerald-400 hover:bg-slate-800"
                    }`}
                  >
                    ₹{row.ce.toFixed(1)}
                  </button>

                  <div className="font-mono font-bold text-slate-300 text-sm">{row.strike}</div>

                  <button
                    onClick={() => selectContract(row.strike, "PE", row.pe)}
                    className={`py-2 px-2 rounded-lg font-mono font-bold transition-all ${
                      isPE ? "bg-rose-500 text-slate-950 shadow-md shadow-rose-500/30" : "bg-slate-900/60 text-rose-400 hover:bg-slate-800"
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
                <span className="text-sm font-bold text-white">{activeInstrument.symbol} {selectedStrike} {optionSide}</span>
                <div className="text-[10px] text-slate-400">{activeInstrument.name} • {activeInstrument.segment}</div>
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
                <button onClick={() => setLots(Math.max(1, lots - 1))} className="w-7 h-7 bg-slate-900 rounded text-slate-300 font-bold hover:bg-slate-800">-</button>
                <span className="w-8 text-center font-bold font-mono">{lots}</span>
                <button onClick={() => setLots(lots + 1)} className="w-7 h-7 bg-slate-900 rounded text-slate-300 font-bold hover:bg-slate-800">+</button>
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
                  <span className="text-[10px] text-slate-400 block">{isMarginOrder ? "SPAN Margin Required" : "Upfront Premium Needed"}</span>
                  <span className="font-mono font-bold text-white text-sm">₹{capitalRequired.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
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
                  <span>Risk ₹{plannedRisk.toLocaleString("en-IN")} exceeds remaining limit (₹{remainingBudget.toLocaleString("en-IN")}).</span>
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