import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  TrendingUp, 
  Search, 
  X, 
  ArrowLeft, 
  LogOut, 
  RefreshCw,
  Briefcase,
  User,
  Lock
} from "lucide-react";
import { useSession } from "@/lib/session";
import { INDICES_DATA, STOCKS_DATA, generateStrikeChain, FnoInstrument } from "@/lib/fnoCatalog";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      { title: "Live F&O Terminal 🛡️ CapitalGuard" },
      { name: "description", content: "Mandatory stop-loss protected F&O simulator." },
    ],
  }),
  component: Terminal,
});

function Terminal() {
  const navigate = useNavigate();
  const session = useSession();

  const [currentArena, setCurrentArena] = useState<"options" | "futures">(
    (localStorage.getItem("capitalguard_arena") as "options" | "futures") || "options"
  );

  const [activeSegment, setActiveSegment] = useState<"INDICES" | "STOCKS">("INDICES");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NIFTY");

  const [selectedStrike, setSelectedStrike] = useState<number>(24800);
  const [optionSide, setOptionSide] = useState<"CE" | "PE">("CE");
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState(1);
  const [entryPrice, setEntryPrice] = useState<number>(104.2);
  const [stopLoss, setStopLoss] = useState<number>(85.0);

  // Position count for top badge
  const [openPositionsCount, setOpenPositionsCount] = useState(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("capitalguard_positions");
      if (saved) {
        const parsed = JSON.parse(saved);
        setOpenPositionsCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch (e) {}
  }, []);

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
    return all.find((i) => i.symbol === selectedSymbol) ?? (INDICES_DATA[0] as FnoInstrument);
  }, [selectedSymbol]);

  const chain = useMemo(() => {
    return generateStrikeChain(activeInstrument.spot, activeInstrument.step);
  }, [activeInstrument]);

  const totalQty = lots * activeInstrument.lot;
  const isFuturesArena = currentArena === "futures";
  const virtualBalance = isFuturesArena ? 5000000 : 1000000;

  const isMarginOrder = isFuturesArena || orderType === "SELL";
  const capitalRequired = isMarginOrder
    ? lots * activeInstrument.marginPerLot
    : totalQty * entryPrice;

  // STRICT MANDATORY STOP-LOSS VALIDATIONS
  const isSlMissing = !stopLoss || stopLoss <= 0 || isNaN(stopLoss);
  const isSlInvalid = orderType === "BUY" ? stopLoss >= entryPrice : stopLoss <= entryPrice;
  const riskPerUnit = orderType === "BUY" ? Math.max(0, entryPrice - stopLoss) : Math.max(0, stopLoss - entryPrice);
  const plannedRisk = totalQty * riskPerUnit;

  // Read Guardrail Floor
  const dailyLimit = Number(localStorage.getItem("capitalguard_guardrail_limit")) || 5000;
  const realizedLoss = Math.max(0, -(session?.realized ?? 0));
  const remainingBudget = Math.max(0, dailyLimit - realizedLoss);

  const isRiskExceeded = plannedRisk > remainingBudget;
  const isInsufficientCapital = capitalRequired > virtualBalance;
  const canExecute = !isSlMissing && !isSlInvalid && !isRiskExceeded && !isInsufficientCapital && capitalRequired > 0;

  const handleSelectInstrument = (inst: FnoInstrument) => {
    setSelectedSymbol(inst.symbol);
    if (currentArena === "futures") {
      setEntryPrice(inst.spot);
      setStopLoss(Math.round(inst.spot * 0.985 * 10) / 10);
    } else {
      const newChain = generateStrikeChain(inst.spot, inst.step);
      const mid = newChain[Math.floor(newChain.length / 2)];
      if (!mid) return;
      setSelectedStrike(mid.strike);
      const initPrice = optionSide === "CE" ? mid.ce : mid.pe;
      setEntryPrice(initPrice);
      setStopLoss(Math.round(initPrice * 0.8 * 10) / 10);
    }
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
      arena: currentArena,
      segment: activeInstrument.segment,
      symbol: currentArena === "futures" 
        ? `${activeInstrument.symbol} FUT`
        : `${activeInstrument.symbol} ${selectedStrike} ${optionSide}`,
      strike: currentArena === "futures" ? activeInstrument.spot : selectedStrike,
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

    try {
      const existing = localStorage.getItem("capitalguard_positions");
      const list = existing ? JSON.parse(existing) : [];
      list.push(newPosition);
      localStorage.setItem("capitalguard_positions", JSON.stringify(list));
    } catch (e) {
      localStorage.setItem("capitalguard_positions", JSON.stringify([newPosition]));
    }

    navigate({ to: "/position" });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-3 sm:p-6 pb-24">
      {/* Top Global Navigation Bar */}
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 p-3 bg-[#151A23] border border-[#222B3A] rounded-2xl mb-3 shadow-md">
        <div className="flex items-center space-x-2">
          <Link
            to="/arena"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Arenas</span>
          </Link>

          <button
            onClick={() => {
              const nextArena = currentArena === "options" ? "futures" : "options";
              setCurrentArena(nextArena);
              localStorage.setItem("capitalguard_arena", nextArena);
              if (nextArena === "futures") {
                setEntryPrice(activeInstrument.spot);
                setStopLoss(Math.round(activeInstrument.spot * 0.985 * 10) / 10);
              } else {
                setEntryPrice(104.2);
                setStopLoss(85.0);
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold hover:bg-amber-400/20 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Mode: {isFuturesArena ? "Futures Arena" : "Options Arena"}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/position"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Positions ({openPositionsCount})</span>
          </Link>

          <Link
            to="/profile"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </Link>
        </div>
      </div>

      {/* Session Telemetry Header */}
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            {isFuturesArena ? "Futures Arena Shield" : "Options Arena Shield"}
          </span>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-lg font-bold text-amber-400">₹{remainingBudget.toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-400">/ ₹{dailyLimit.toLocaleString("en-IN")} Max Loss Shield</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            {isFuturesArena ? "Virtual Margin Pool" : "Virtual Capital"}
          </span>
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
                handleSelectInstrument(INDICES_DATA[0] as FnoInstrument);
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
                handleSelectInstrument(STOCKS_DATA[0] as FnoInstrument);
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
              placeholder={`Search 180+ F&O symbols (RELIANCE, ZOMATO, SBIN)...`}
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
        {/* Dynamic Strike Chain Matrix OR Futures Direct Panel */}
        <div className="lg:col-span-7 bg-[#151A23] border border-[#222B3A] rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222B3A] mb-3">
            <div>
              <span className="text-xs font-bold text-white uppercase">{activeInstrument.name}</span>
              <span className="text-[10px] text-slate-400 ml-2 font-mono">Spot: ₹{activeInstrument.spot.toLocaleString("en-IN")}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Lot Size: {activeInstrument.lot} Qty</div>
          </div>

          {currentArena === "futures" ? (
            <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-800 text-center space-y-3">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Underlying Futures Contract</div>
              <div className="text-2xl font-bold font-mono text-white">{activeInstrument.symbol} CURRENT MONTH FUT</div>
              <div className="text-sm font-mono text-emerald-400 font-bold">₹{activeInstrument.spot.toLocaleString("en-IN")}</div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Margin per Lot: ₹{(activeInstrument.marginPerLot / 100000).toFixed(2)} Lakh. Mandatory Stop-loss enforces maximum downside control.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Order Ticket */}
        <div className="lg:col-span-5 bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300 mb-3">ORDER TICKET</div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">
                  {currentArena === "futures" ? `${activeInstrument.symbol} FUT` : `${activeInstrument.symbol} ${selectedStrike} ${optionSide}`}
                </span>
                <div className="text-[10px] text-slate-400">
                  {activeInstrument.name} • {currentArena === "futures" ? "Futures" : "Options"}
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
                <button onClick={() => setLots(Math.max(1, lots - 1))} className="w-7 h-7 bg-slate-900 rounded text-slate-300 font-bold hover:bg-slate-800">-</button>
                <span className="w-8 text-center font-bold font-mono">{lots}</span>
                <button onClick={() => setLots(lots + 1)} className="w-7 h-7 bg-slate-900 rounded text-slate-300 font-bold hover:bg-slate-800">+</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold">Entry Price (₹)</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-amber-400 font-bold flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Mandatory Stop-Loss (₹)</span>
                </label>
                <input
                  type="number"
                  value={stopLoss || ""}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  placeholder="Required SL"
                  className={`w-full mt-1 px-3 py-2 bg-slate-900 border rounded-lg text-xs font-mono font-bold text-rose-400 focus:outline-none ${
                    isSlMissing || isSlInvalid ? "border-rose-500" : "border-slate-800 focus:border-rose-500"
                  }`}
                />
              </div>
            </div>

            {/* Validation & Risk Box */}
            <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isMarginOrder ? "SPAN Margin Required" : "Premium Required"}</span>
                  <span className="font-mono font-bold text-white text-sm">₹{capitalRequired.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Planned SL Risk</span>
                  <span className={`font-mono font-bold text-sm ${isRiskExceeded ? "text-rose-400" : "text-amber-400"}`}>
                    ₹{plannedRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Stop loss alerts */}
              {isSlMissing && (
                <div className="text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Stop-Loss is strictly mandatory to protect capital.</span>
                </div>
              )}

              {isSlInvalid && !isSlMissing && (
                <div className="text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50">
                  {orderType === "BUY" ? "Stop-loss must be below entry price." : "Stop-loss must be above entry price."}
                </div>
              )}

              {isRiskExceeded && (
                <div className="text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50 flex items-start space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>SL Risk ₹{plannedRisk.toLocaleString("en-IN")} breaches remaining shield limit (₹{remainingBudget.toLocaleString("en-IN")}).</span>
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
            {isSlMissing 
              ? "STOP-LOSS REQUIRED" 
              : isSlInvalid 
              ? "INVALID STOP-LOSS PRICE" 
              : isRiskExceeded 
              ? "RISK EXCEEDS SHIELD LIMIT" 
              : isInsufficientCapital 
              ? "INSUFFICIENT CAPITAL" 
              : "EXECUTE PROTECTED ORDER"}
          </button>
        </div>
      </div>
    </div>
  );
}