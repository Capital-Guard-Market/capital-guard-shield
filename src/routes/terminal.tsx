import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLiveMarket } from "../hooks/useLiveMarket";
import {
  loadGuardrailState,
  saveGuardrailState,
  GuardrailState,
  OpenPosition,
  ClosedPosition,
  ProductType,
} from "../lib/guardrailStore";
import {
  Lock,
  ShieldCheck,
  Zap,
  Flame,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle,
  History,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/terminal")({
  component: TerminalComponent,
});

interface InstrumentConfig {
  id: string;
  symbol: string;
  name: string;
  lotSize: number;
  spanMargin: number;
  strikeStep: number;
  defaultPrice: number;
}

const INSTRUMENTS: InstrumentConfig[] = [
  { id: "NIFTY", symbol: "NIFTY", name: "NIFTY 50", lotSize: 65, spanMargin: 125000, strikeStep: 50, defaultPrice: 24282.40 },
  { id: "BANKNIFTY", symbol: "BANKNIFTY", name: "BANK NIFTY", lotSize: 30, spanMargin: 145000, strikeStep: 100, defaultPrice: 57883.15 },
  { id: "SENSEX", symbol: "SENSEX", name: "BSE SENSEX", lotSize: 20, spanMargin: 135000, strikeStep: 100, defaultPrice: 81350.25 },
  { id: "FINNIFTY", symbol: "FINNIFTY", name: "FIN NIFTY", lotSize: 60, spanMargin: 110000, strikeStep: 50, defaultPrice: 23420.60 },
  { id: "MIDCPNIFTY", symbol: "MIDCPNIFTY", name: "MIDCAP NIFTY", lotSize: 120, spanMargin: 95000, strikeStep: 25, defaultPrice: 13150.00 },
];

export function TerminalComponent() {
  const navigate = useNavigate();
  const { bySymbol, isLive } = useLiveMarket();
  const [state, setState] = useState<GuardrailState>(loadGuardrailState());

  const [arenaMode, setArenaMode] = useState<"FUTURES" | "OPTIONS">("FUTURES");
  const [selectedInstId, setSelectedInstId] = useState<string>("NIFTY");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [productType, setProductType] = useState<ProductType>("NRML"); // Default: Carry Forward
  const [lotsInput, setLotsInput] = useState<string>("1"); // Clean string for easy typing
  const [positionTab, setPositionTab] = useState<"OPEN" | "CLOSED">("OPEN");

  // Selected Option Strike details
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [selectedOptionType, setSelectedOptionType] = useState<"CE" | "PE">("CE");
  const [selectedOptionPremium, setSelectedOptionPremium] = useState<number>(140);

  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const current = loadGuardrailState();
    if (!current.isLocked) {
      navigate({ to: "/" });
    } else {
      setState(current);
    }
  }, [navigate]);

  const activeShield = arenaMode === "FUTURES" ? state.futures : state.options;
  const activeCapital = activeShield.capital;
  const activeLossFloor = activeShield.selectedFloor;
  const activeSelectedPct = activeShield.selectedTierPct;

  const activeInstrument = useMemo(() => {
    return INSTRUMENTS.find((i) => i.id === selectedInstId) || INSTRUMENTS[0];
  }, [selectedInstId]);

  const spotPrice = bySymbol[activeInstrument.symbol]?.ltp ?? activeInstrument.defaultPrice;

  // Compute ATM & 5 Strike Chain dynamically
  const step = activeInstrument.strikeStep;
  const atmStrike = Math.round(spotPrice / step) * step;

  const strikeChain = useMemo(() => {
    const strikes = [
      atmStrike - 2 * step,
      atmStrike - 1 * step,
      atmStrike,
      atmStrike + 1 * step,
      atmStrike + 2 * step,
    ];

    return strikes.map((strike) => {
      const dist = (strike - spotPrice) / step;
      // Simulated premium pricing based on distance
      const ceLtp = Math.max(12, Math.round(140 - dist * 35));
      const peLtp = Math.max(12, Math.round(140 + dist * 35));
      const tag = strike === atmStrike ? "ATM" : strike < atmStrike ? "ITM" : "OTM";

      return { strike, ceLtp, peLtp, tag };
    });
  }, [atmStrike, spotPrice, step]);

  // Set default option selection on strike chain update
  useEffect(() => {
    if (!selectedStrike || Math.abs(selectedStrike - atmStrike) > step * 3) {
      setSelectedStrike(atmStrike);
      setSelectedOptionPremium(140);
    }
  }, [atmStrike, selectedStrike, step]);

  // Pricing & Risk calculations
  const parsedLots = Math.max(1, parseInt(lotsInput) || 1);
  const totalQty = parsedLots * activeInstrument.lotSize;

  const activeExecutionPrice = arenaMode === "FUTURES" ? spotPrice : selectedOptionPremium;
  const [customSL, setCustomSL] = useState<number>(() => Math.round(activeExecutionPrice * 0.90));

  useEffect(() => {
    setCustomSL(
      Math.round(activeExecutionPrice * (orderSide === "BUY" ? 0.85 : 1.15))
    );
  }, [activeExecutionPrice, orderSide, arenaMode]);

  // Dynamic Capital Required
  const capitalRequired = useMemo(() => {
    if (arenaMode === "FUTURES") {
      return parsedLots * activeInstrument.spanMargin;
    }
    // Options Buying = Premium * Qty | Options Selling = Span Margin
    if (orderSide === "BUY") {
      return selectedOptionPremium * totalQty;
    }
    return parsedLots * activeInstrument.spanMargin;
  }, [arenaMode, orderSide, parsedLots, activeInstrument, selectedOptionPremium, totalQty]);

  // Live PnL calculation for active positions
  const arenaOpenPositions = (state.positions || []).filter((p) => p.segment === arenaMode);
  const arenaClosedPositions = (state.closedPositionsToday || []).filter((p) => p.segment === arenaMode);

  const unrealizedPnL = useMemo(() => {
    return arenaOpenPositions.reduce((acc, pos) => {
      const currentPrice = arenaMode === "FUTURES" 
        ? (bySymbol[pos.symbol]?.ltp ?? pos.currentPrice)
        : pos.currentPrice;
      const diff = pos.side === "BUY" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
      return acc + diff * pos.qty;
    }, 0);
  }, [arenaOpenPositions, bySymbol, arenaMode]);

  const totalPnL = activeShield.realizedPnL + unrealizedPnL;
  const currentDrawdown = totalPnL < 0 ? Math.abs(totalPnL) : 0;
  const isFloorBreached = currentDrawdown >= activeLossFloor;

  const plannedRisk = Math.abs(activeExecutionPrice - customSL) * totalQty;
  const willBreach = (currentDrawdown + plannedRisk > activeLossFloor) || isFloorBreached;

  // Handlers
  const handleSelectOptionStrike = (strike: number, type: "CE" | "PE", ltp: number) => {
    setSelectedStrike(strike);
    setSelectedOptionType(type);
    setSelectedOptionPremium(ltp);
  };

  const handlePlaceOrder = () => {
    if (willBreach) return;

    const symbolString = arenaMode === "FUTURES"
      ? `${activeInstrument.symbol} FUT`
      : `${activeInstrument.symbol} ${selectedStrike} ${selectedOptionType}`;

    const newPos: OpenPosition = {
      id: "POS-" + Date.now(),
      symbol: symbolString,
      segment: arenaMode,
      side: orderSide,
      productType: productType,
      lots: parsedLots,
      qty: totalQty,
      entryPrice: activeExecutionPrice,
      currentPrice: activeExecutionPrice,
      slPrice: customSL,
      pnl: 0,
      timestamp: new Date().toLocaleTimeString(),
      optionType: arenaMode === "OPTIONS" ? selectedOptionType : undefined,
      strike: arenaMode === "OPTIONS" ? (selectedStrike ?? undefined) : undefined,
    };

    const updated: GuardrailState = {
      ...state,
      positions: [newPos, ...(state.positions || [])],
    };

    saveGuardrailState(updated);
    setState(updated);
    setOrderSuccessMsg(`Placed ${productType} ${orderSide} ${symbolString} (${totalQty} Qty)`);
    setTimeout(() => setOrderSuccessMsg(null), 3500);
  };

  const handleSquareOffSingle = (posId: string) => {
    const pos = (state.positions || []).find((p) => p.id === posId);
    if (!pos) return;

    const currentPrice = arenaMode === "FUTURES" ? (bySymbol[pos.symbol]?.ltp ?? pos.currentPrice) : pos.currentPrice;
    const diff = pos.side === "BUY" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
    const realizedPnL = diff * pos.qty;

    const closedRecord: ClosedPosition = {
      id: "CLS-" + Date.now(),
      symbol: pos.symbol,
      segment: pos.segment,
      side: pos.side,
      productType: pos.productType,
      qty: pos.qty,
      entryPrice: pos.entryPrice,
      exitPrice: currentPrice,
      realizedPnL: realizedPnL,
      closedAt: new Date().toLocaleTimeString(),
    };

    const segmentKey = pos.segment.toLowerCase() as "futures" | "options";
    const updated: GuardrailState = {
      ...state,
      [segmentKey]: {
        ...state[segmentKey],
        realizedPnL: state[segmentKey].realizedPnL + realizedPnL,
      },
      positions: (state.positions || []).filter((p) => p.id !== posId),
      closedPositionsToday: [closedRecord, ...(state.closedPositionsToday || [])],
    };

    saveGuardrailState(updated);
    setState(updated);
  };

  const handleSquareOffAllArena = () => {
    let closedPnL = 0;
    const newClosedRecords: ClosedPosition[] = [];

    arenaOpenPositions.forEach((pos) => {
      const currentPrice = arenaMode === "FUTURES" ? (bySymbol[pos.symbol]?.ltp ?? pos.currentPrice) : pos.currentPrice;
      const diff = pos.side === "BUY" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
      const pnl = diff * pos.qty;
      closedPnL += pnl;

      newClosedRecords.push({
        id: "CLS-" + Date.now() + Math.random(),
        symbol: pos.symbol,
        segment: pos.segment,
        side: pos.side,
        productType: pos.productType,
        qty: pos.qty,
        entryPrice: pos.entryPrice,
        exitPrice: currentPrice,
        realizedPnL: pnl,
        closedAt: new Date().toLocaleTimeString(),
      });
    });

    const segmentKey = arenaMode.toLowerCase() as "futures" | "options";
    const updated: GuardrailState = {
      ...state,
      [segmentKey]: {
        ...state[segmentKey],
        realizedPnL: state[segmentKey].realizedPnL + closedPnL,
      },
      positions: (state.positions || []).filter((p) => p.segment !== arenaMode),
      closedPositionsToday: [...newClosedRecords, ...(state.closedPositionsToday || [])],
    };

    saveGuardrailState(updated);
    setState(updated);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* TOP BANNER HUD */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#151a23] border border-[#22283a] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Lock className="w-3.5 h-3.5" />
            <span>{arenaMode} Guardrail Active ({activeSelectedPct}% Selected Floor - Locked till 12 AM)</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-white flex items-baseline gap-2">
            <span className={totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {totalPnL >= 0 ? `+₹${totalPnL.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : `-₹${currentDrawdown.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            </span>
            <span className="text-slate-500 text-sm font-normal">
              / ₹{activeLossFloor.toLocaleString("en-IN")} Floor ({activeSelectedPct}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
            isLive ? "bg-emerald-950/80 border-emerald-500 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span>ANGEL ONE LIVE</span>
          </div>

          <button
            onClick={() => navigate({ to: "/" })}
            className="px-3 py-1.5 rounded-xl bg-[#1c2331] hover:bg-[#252f42] text-xs font-medium text-slate-300"
          >
            Switch Realm
          </button>
        </div>
      </header>

      {/* ARENA TOGGLE */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setArenaMode("FUTURES")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
            arenaMode === "FUTURES"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-[#151a23] text-slate-400 border border-[#22283a]"
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Futures Arena (₹{state.futures.capital.toLocaleString("en-IN")} Pool)</span>
        </button>

        <button
          onClick={() => setArenaMode("OPTIONS")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
            arenaMode === "OPTIONS"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-[#151a23] text-slate-400 border border-[#22283a]"
          }`}
        >
          <Flame className="w-4 h-4 fill-current" />
          <span>Options Arena (₹{state.options.capital.toLocaleString("en-IN")} Pool)</span>
        </button>
      </div>

      {/* BREACH ALERT */}
      {isFloorBreached && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs font-bold">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            {activeSelectedPct}% Floor (₹{activeLossFloor.toLocaleString("en-IN")}) Breached: {arenaMode} trading is locked until 12:00 AM.
          </span>
        </div>
      )}

      {/* SUCCESS NOTIFICATION */}
      {orderSuccessMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-bold">
          <CheckCircle className="w-4 h-4" />
          <span>{orderSuccessMsg}</span>
        </div>
      )}

      {/* INDEX TICKERS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {INSTRUMENTS.map((inst) => {
          const ltp = bySymbol[inst.symbol]?.ltp ?? inst.defaultPrice;
          const isSelected = selectedInstId === inst.id;
          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInstId(inst.id)}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? "bg-[#182030] border-amber-400 shadow-md ring-1 ring-amber-400/50"
                  : "bg-[#151a23] border-[#22283a] hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between text-xs font-bold text-white">
                <span>{inst.name}</span>
                <span className="text-[10px] text-slate-400">Lot: {inst.lotSize}</span>
              </div>
              <div className="mt-2 text-base font-extrabold text-emerald-400 font-mono">
                ₹{ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT WORKSPACE: FUTURES or 5-STRIKE OPTION CHAIN */}
        <div className="lg:col-span-7 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start border-b border-[#22283a] pb-3">
              <div>
                <h2 className="text-xl font-black text-white">{activeInstrument.name}</h2>
                <p className="text-xs text-slate-400">
                  Spot: <span className="font-mono text-emerald-400">₹{spotPrice.toLocaleString("en-IN")}</span>
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono">Lot Size: {activeInstrument.lotSize} Qty</span>
            </div>

            {/* FUTURES DISPLAY */}
            {arenaMode === "FUTURES" && (
              <div className="my-6 py-8 rounded-2xl bg-[#0f141d] border border-[#1f2638] text-center space-y-2">
                <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                  Futures Active Contract
                </span>
                <h3 className="text-2xl font-black text-white">{activeInstrument.symbol} CURRENT MONTH</h3>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono animate-pulse">
                  ₹{spotPrice.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 font-mono pt-2">
                  Span Margin: ₹{activeInstrument.spanMargin.toLocaleString("en-IN")} / Lot
                </div>
              </div>
            )}

            {/* 5-STRIKE OPTION CHAIN DISPLAY */}
            {arenaMode === "OPTIONS" && (
              <div className="my-4 space-y-2">
                <div className="flex justify-between items-center px-1 text-xs text-slate-400 font-bold uppercase">
                  <span>Call (CE) Buy</span>
                  <span>Strike & Type</span>
                  <span>Put (PE) Buy</span>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  {strikeChain.map((row) => {
                    const isCeSelected = selectedStrike === row.strike && selectedOptionType === "CE";
                    const isPeSelected = selectedStrike === row.strike && selectedOptionType === "PE";
                    const isAtm = row.tag === "ATM";

                    return (
                      <div
                        key={row.strike}
                        className={`grid grid-cols-3 items-center p-2 rounded-xl border transition-all ${
                          isAtm ? "bg-[#182030] border-amber-400/60" : "bg-[#0f141d] border-[#1f2638]"
                        }`}
                      >
                        {/* CE Button */}
                        <button
                          onClick={() => handleSelectOptionStrike(row.strike, "CE", row.ceLtp)}
                          className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-between transition-all ${
                            isCeSelected
                              ? "bg-emerald-500 text-slate-950 font-black shadow"
                              : "bg-[#151a23] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span className="text-[10px]">CE</span>
                          <span>₹{row.ceLtp}</span>
                        </button>

                        {/* Strike & Tag */}
                        <div className="text-center">
                          <div className={`font-black ${isAtm ? "text-amber-400" : "text-white"}`}>
                            {row.strike}
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            isAtm ? "bg-amber-400/20 text-amber-300" : "text-slate-500"
                          }`}>
                            {row.tag}
                          </span>
                        </div>

                        {/* PE Button */}
                        <button
                          onClick={() => handleSelectOptionStrike(row.strike, "PE", row.peLtp)}
                          className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-between transition-all ${
                            isPeSelected
                              ? "bg-rose-500 text-white font-black shadow"
                              : "bg-[#151a23] hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          <span>₹{row.peLtp}</span>
                          <span className="text-[10px]">PE</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#101622] border border-[#1e273a] text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              {arenaMode === "OPTIONS"
                ? `Selected: ${activeInstrument.symbol} ${selectedStrike} ${selectedOptionType} (₹${selectedOptionPremium} Premium)`
                : `Non-overlapping guardrail active with ₹${activeLossFloor.toLocaleString("en-IN")} max daily floor.`}
            </span>
          </div>
        </div>

        {/* RIGHT: ORDER EXECUTION TICKET */}
        <div className="lg:col-span-5 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#22283a] pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Order Ticket</span>
            <span className="text-sm font-black font-mono text-amber-400">₹{activeExecutionPrice.toFixed(2)}</span>
          </div>

          {/* PRODUCT TYPE: INTRADAY (MIS) vs CARRY FORWARD (NRML) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Product Code</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setProductType("NRML")}
                className={`py-2 rounded-xl font-bold text-xs ${
                  productType === "NRML"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                    : "bg-[#0f141d] text-slate-400 border border-[#22283a]"
                }`}
              >
                Carry Forward (NRML)
              </button>
              <button
                onClick={() => setProductType("MIS")}
                className={`py-2 rounded-xl font-bold text-xs ${
                  productType === "MIS"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                    : "bg-[#0f141d] text-slate-400 border border-[#22283a]"
                }`}
              >
                Intraday (MIS)
              </button>
            </div>
          </div>

          {/* BUY / SELL Switch */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderSide("BUY")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase ${
                orderSide === "BUY" ? "bg-emerald-500 text-slate-950 font-black" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setOrderSide("SELL")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase ${
                orderSide === "SELL" ? "bg-rose-500 text-white font-black" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Sell
            </button>
          </div>

          {/* FLUID LOTS INPUT */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Lots (Type directly or use steppers)</span>
              <span className="font-mono text-white">Qty: {totalQty}</span>
            </div>
            <div className="flex items-center bg-[#0f141d] border border-[#22283a] rounded-xl p-1">
              <button
                disabled={isFloorBreached}
                onClick={() => setLotsInput(String(Math.max(1, parsedLots - 1)))}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] text-white disabled:opacity-50"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                disabled={isFloorBreached}
                value={lotsInput}
                onChange={(e) => setLotsInput(e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  if (!lotsInput || parseInt(lotsInput) <= 0) setLotsInput("1");
                }}
                className="w-full text-center bg-transparent text-white font-bold font-mono text-sm focus:outline-none disabled:opacity-50"
              />
              <button
                disabled={isFloorBreached}
                onClick={() => setLotsInput(String(parsedLots + 1))}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] text-white disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Entry & Mandatory SL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">Entry Price (₹)</label>
              <input
                type="number"
                value={activeExecutionPrice}
                readOnly
                className="w-full py-2 px-3 rounded-xl bg-[#0f141d] border border-[#22283a] text-xs font-mono font-bold text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mandatory SL (₹)
              </label>
              <input
                type="number"
                disabled={isFloorBreached}
                value={customSL}
                onChange={(e) => setCustomSL(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-[#0f141d] border border-amber-500/40 text-xs font-mono font-bold text-amber-300 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* ACCURATE MARGIN & PLANNED RISK */}
          <div className="space-y-2 pt-2 text-xs border-t border-[#22283a]">
            <div className="flex justify-between">
              <span className="text-slate-400">Capital Req:</span>
              <span className="text-white font-bold font-mono">₹{capitalRequired.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400 font-semibold">Planned Trade Risk:</span>
              <span className={`font-bold font-mono ${willBreach ? "text-rose-500" : "text-amber-400"}`}>
                ₹{plannedRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={willBreach}
            onClick={handlePlaceOrder}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
              willBreach
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : orderSide === "BUY"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
            }`}
          >
            {willBreach
              ? "RISK BREACH: ORDER BLOCKED"
              : `${orderSide} ${arenaMode === "OPTIONS" ? `${selectedStrike} ${selectedOptionType}` : activeInstrument.symbol} (${totalQty} Qty)`}
          </button>
        </div>
      </div>

      {/* POSITIONS BOOK (OPEN TRADES + CLOSED TRADES TODAY) */}
      <div className="bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap justify-between items-center border-b border-[#22283a] pb-3 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPositionTab("OPEN")}
              className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all ${
                positionTab === "OPEN"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-[#0f141d] text-slate-400 border border-[#22283a]"
              }`}
            >
              Open Positions ({arenaOpenPositions.length})
            </button>
            <button
              onClick={() => setPositionTab("CLOSED")}
              className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all flex items-center gap-1.5 ${
                positionTab === "CLOSED"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-[#0f141d] text-slate-400 border border-[#22283a]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Closed Trades Today ({arenaClosedPositions.length})</span>
            </button>
          </div>

          {positionTab === "OPEN" && arenaOpenPositions.length > 0 && (
            <button
              onClick={handleSquareOffAllArena}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-rose-400 text-xs font-bold transition-all"
            >
              Square Off All ({arenaMode})
            </button>
          )}
        </div>

        {/* OPEN POSITIONS TAB */}
        {positionTab === "OPEN" && (
          arenaOpenPositions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No open positions in {arenaMode} Arena.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-[#1f2638]">
                    <th className="pb-2">Contract</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">LTP</th>
                    <th className="pb-2">Live P&L</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2638]">
                  {arenaOpenPositions.map((pos) => {
                    const currentPrice = arenaMode === "FUTURES" ? (bySymbol[pos.symbol]?.ltp ?? pos.currentPrice) : pos.currentPrice;
                    const diff = pos.side === "BUY" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
                    const pnl = diff * pos.qty;

                    return (
                      <tr key={pos.id} className="text-white font-mono">
                        <td className="py-3 font-bold">{pos.symbol}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                            {pos.productType}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            pos.side === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}>
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-3">{pos.qty} ({pos.lots}L)</td>
                        <td className="py-3">₹{pos.entryPrice.toFixed(2)}</td>
                        <td className="py-3 text-emerald-400">₹{currentPrice.toFixed(2)}</td>
                        <td className={`py-3 font-black ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleSquareOffSingle(pos.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#252f42] hover:bg-rose-600 text-slate-200 hover:text-white text-[11px] font-bold transition-colors"
                          >
                            Exit / Square Off
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* CLOSED TRADES TODAY TAB (Retained until 12 AM) */}
        {positionTab === "CLOSED" && (
          arenaClosedPositions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No closed trades recorded today. All realized positions will remain here until 12:00 AM Midnight.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-[#1f2638]">
                    <th className="pb-2">Contract</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">Exit Price</th>
                    <th className="pb-2">Realized P&L</th>
                    <th className="pb-2 text-right">Closed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2638]">
                  {arenaClosedPositions.map((item) => (
                    <tr key={item.id} className="text-white font-mono opacity-80">
                      <td className="py-3 font-bold">{item.symbol}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                          {item.productType}
                        </span>
                      </td>
                      <td className="py-3 font-black">{item.side}</td>
                      <td className="py-3">{item.qty}</td>
                      <td className="py-3">₹{item.entryPrice.toFixed(2)}</td>
                      <td className="py-3">₹{item.exitPrice.toFixed(2)}</td>
                      <td className={`py-3 font-black ${item.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {item.realizedPnL >= 0 ? `+₹${item.realizedPnL.toFixed(2)}` : `-₹${Math.abs(item.realizedPnL).toFixed(2)}`}
                      </td>
                      <td className="py-3 text-right text-slate-400">{item.closedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default TerminalComponent;