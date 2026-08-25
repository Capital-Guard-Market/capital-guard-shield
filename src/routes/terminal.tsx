import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Flame, 
  Zap, 
  Briefcase, 
  Search, 
  AlertOctagon, 
  PieChart 
} from "lucide-react";

export const Route = createFileRoute("/terminal")({
  component: TerminalComponent,
});

const FNO_INSTRUMENTS = [
  { symbol: "NIFTY", name: "NIFTY 50", spot: 24780.35, lotSize: 65, type: "INDEX", marginPerLot: 125000 },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", spot: 51240.80, lotSize: 30, type: "INDEX", marginPerLot: 130000 },
  { symbol: "SENSEX", name: "BSE SENSEX", spot: 81350.25, lotSize: 20, type: "INDEX", marginPerLot: 140000 },
  { symbol: "FINNIFTY", name: "FIN NIFTY", spot: 23420.60, lotSize: 60, type: "INDEX", marginPerLot: 110000 },
  { symbol: "MIDCPNIFTY", name: "MIDCAP NIFTY", spot: 13150.00, lotSize: 120, type: "INDEX", marginPerLot: 95000 },
  { symbol: "RELIANCE", name: "Reliance Industries", spot: 2940.50, lotSize: 250, type: "STOCK", marginPerLot: 145000 },
  { symbol: "SBIN", name: "State Bank of India", spot: 825.40, lotSize: 750, type: "STOCK", marginPerLot: 125000 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", spot: 1640.20, lotSize: 550, type: "STOCK", marginPerLot: 180000 },
  { symbol: "TCS", name: "Tata Consultancy Services", spot: 4190.00, lotSize: 175, type: "STOCK", marginPerLot: 150000 },
  { symbol: "INFY", name: "Infosys Ltd", spot: 1860.10, lotSize: 400, type: "STOCK", marginPerLot: 148000 },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", spot: 985.30, lotSize: 575, type: "STOCK", marginPerLot: 115000 },
  { symbol: "ZOMATO", name: "Zomato Ltd", spot: 260.40, lotSize: 2000, type: "STOCK", marginPerLot: 105000 },
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function TerminalComponent() {
  const navigate = useNavigate();
  const todayKey = getTodayKey();

  // Guardrail state
  const [dailyLimit, setDailyLimit] = useState<number>(50000);
  const [cumulativeLoss, setCumulativeLoss] = useState<number>(0);
  const [openCount, setOpenCount] = useState<number>(0);

  // Mode Toggle: Futures Arena vs Options Arena
  const [fnoMode, setFnoMode] = useState<"FUTURES" | "OPTIONS">("FUTURES");

  // Active Instrument
  const [activeTab, setActiveTab] = useState<"INDEX" | "STOCK">("INDEX");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(FNO_INSTRUMENTS[0]);
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE");
  const [strike, setStrike] = useState<number>(24800);

  // Order Details
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(104.20);
  const [stopLoss, setStopLoss] = useState<string>("85");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lockDate = localStorage.getItem("capitalguard_lock_date");
      const rawLimit = localStorage.getItem("capitalguard_daily_limit");

      if (lockDate !== todayKey || !rawLimit) {
        navigate({ to: "/arena" });
        return;
      }

      setDailyLimit(Number(rawLimit));

      const saved = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      const openTrades = saved.filter((p: any) => p.status !== "CLOSED");
      setOpenCount(openTrades.length);

      const dayLoss = saved.reduce((acc: number, pos: any) => {
        const p = Number(pos.pnl || 0);
        return p < 0 ? acc + Math.abs(p) : acc;
      }, 0);
      setCumulativeLoss(dayLoss);
    } catch (e) {}
  }, [navigate, todayKey]);

  const handleSelectInstrument = (item: typeof FNO_INSTRUMENTS[0]) => {
    setSelectedItem(item);
    setStrike(Math.round(item.spot / 100) * 100);
    setEntryPrice(fnoMode === "FUTURES" ? Number((item.spot * 0.005).toFixed(2)) : 120.50);
  };

  const totalQty = (Number(lots) || 1) * selectedItem.lotSize;
  const isFutures = fnoMode === "FUTURES";
  const marginRequired = isFutures 
    ? (Number(lots) || 1) * selectedItem.marginPerLot 
    : (Number(lots) || 1) * selectedItem.lotSize * (Number(entryPrice) || 0);

  const virtualMarginPool = 5000000;
  const availableMarginAfter = Math.max(0, virtualMarginPool - marginRequired);
  const plannedRisk = stopLoss && Number(stopLoss) > 0 ? Math.abs((Number(entryPrice) || 0) - Number(stopLoss)) * totalQty : 0;
  const isBreached = cumulativeLoss >= dailyLimit;

  const filteredList = FNO_INSTRUMENTS.filter((i) => {
    const matchesTab = activeTab === "INDEX" ? i.type === "INDEX" : i.type === "STOCK";
    const matchesQuery = i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBreached) {
      setToastMessage("⛔ TERMINAL LOCKED: Simultaneous Daily Loss Floor Breached.");
      return;
    }

    if (marginRequired > virtualMarginPool) {
      setToastMessage(`⚠️ INSUFFICIENT MARGIN: Required ₹${marginRequired.toLocaleString("en-IN")} exceeds margin pool.`);
      return;
    }

    if (!stopLoss || Number(stopLoss) <= 0) {
      setToastMessage("⚠️ MANDATORY STOP-LOSS: CapitalGuard refuses orders without a hard Stop-Loss.");
      return;
    }

    const slNum = Number(stopLoss);
    const entryNum = Number(entryPrice);

    if (orderSide === "BUY" && slNum >= entryNum) {
      setToastMessage("⚠️ Long Stop-Loss must be lower than Entry Price.");
      return;
    }
    if (orderSide === "SELL" && slNum <= entryNum) {
      setToastMessage("⚠️ Short Stop-Loss must be higher than Entry Price.");
      return;
    }

    const newPosition = {
      id: "pos_" + Date.now(),
      symbol: isFutures ? `${selectedItem.symbol} FUT` : `${selectedItem.symbol} ${strike} ${optionType}`,
      baseSymbol: selectedItem.symbol,
      arena: isFutures ? "FUTURES" : "OPTIONS",
      orderSide,
      lots: Number(lots) || 1,
      lotSize: selectedItem.lotSize,
      quantity: totalQty,
      entryPrice: entryNum,
      currentPrice: entryNum,
      stopLoss: slNum,
      marginUsed: marginRequired,
      pnl: 0,
      status: "OPEN",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      localStorage.setItem("capitalguard_positions", JSON.stringify([newPosition, ...existing]));
      setToastMessage("✅ Order Armored Under Active Shield!");
      setTimeout(() => navigate({ to: "/position" }), 500);
    } catch (e) {
      setToastMessage("Failed to place order.");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      
      {/* 🛡️ TOP SIMULTANEOUS F&O GUARDRAIL HUD */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>SIMULTANEOUS F&amp;O SHIELD (LOCKED TILL 12 AM)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-black text-amber-400">
              ₹{cumulativeLoss.toLocaleString("en-IN")}
            </span>
            <span className="text-sm font-mono text-slate-400">
              / ₹{dailyLimit.toLocaleString("en-IN")} Combined Floor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/equity"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#222B3A] text-slate-300 hover:text-white text-xs font-bold transition"
          >
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Switch Home</span>
          </Link>
          <Link
            to="/position"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
          >
            <Briefcase className="w-4 h-4" />
            <span>Positions ({openCount})</span>
          </Link>
        </div>
      </div>

      {isBreached && (
        <div className="bg-rose-500/20 border border-rose-500/50 p-3.5 rounded-2xl flex items-center gap-3 text-rose-200 text-xs font-bold shadow-lg">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
          <span>COMBINED LOSS FLOOR BREACHED. F&amp;O execution locked until 12:00 AM midnight.</span>
        </div>
      )}

      {toastMessage && (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* 🔄 1-CLICK MODE TOGGLE: FUTURES VS OPTIONS */}
      <div className="bg-[#151A23] p-1.5 rounded-2xl border border-[#222B3A] flex gap-2">
        <button
          onClick={() => {
            setFnoMode("FUTURES");
            setEntryPrice(Number((selectedItem.spot * 0.005).toFixed(2)));
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            fnoMode === "FUTURES"
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Futures Arena Mode</span>
        </button>

        <button
          onClick={() => {
            setFnoMode("OPTIONS");
            setEntryPrice(120.50);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            fnoMode === "OPTIONS"
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Options Arena Mode</span>
        </button>
      </div>

      {/* Symbol Search & Selector Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-1 bg-[#151A23] p-1 rounded-xl border border-[#222B3A] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("INDEX")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "INDEX" ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            Index F&amp;O
          </button>
          <button
            onClick={() => setActiveTab("STOCK")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "STOCK" ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            Equity F&amp;O (180+)
          </button>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search F&O contracts (RELIANCE, SBIN, TCS, NIFTY)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151A23] border border-[#222B3A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Contract Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 max-h-36 overflow-y-auto pr-1">
        {filteredList.map((item) => (
          <button
            key={item.symbol}
            onClick={() => handleSelectInstrument(item)}
            className={`p-3 rounded-2xl border text-left transition ${
              selectedItem.symbol === item.symbol
                ? "bg-[#151A23] border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                : "bg-[#151A23]/60 border-[#222B3A] hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">{item.symbol}</span>
              <span className="text-[9px] text-slate-500 font-mono">Lot: {item.lotSize}</span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
              ₹{item.spot.toLocaleString("en-IN")}
            </div>
          </button>
        ))}
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Contract Card */}
        <div className="lg:col-span-7 bg-[#151A23] border border-[#222B3A] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222B3A] pb-3">
            <div>
              <h2 className="text-base font-black text-white">{selectedItem.name}</h2>
              <span className="text-xs text-slate-400 font-mono">Spot: ₹{selectedItem.spot.toLocaleString("en-IN")}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-amber-400 block">Lot Size: {selectedItem.lotSize} Qty</span>
              <span className="text-[10px] text-slate-500 font-mono">Span/Lot: ₹{selectedItem.marginPerLot.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-[#222B3A] rounded-2xl p-6 text-center space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {isFutures ? "UNDERLYING FUTURES CONTRACT" : "OPTIONS CONTRACT VIEW"}
            </div>
            <div className="text-2xl font-black tracking-tight text-white">
              {selectedItem.symbol} CURRENT MONTH {isFutures ? "FUT" : `${strike} ${optionType}`}
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400">
              ₹{selectedItem.spot.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Options Type & Strike Selector */}
          {!isFutures && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Option Type</label>
                <div className="grid grid-cols-2 gap-1 bg-[#0B0E14] p-1 rounded-xl border border-[#222B3A]">
                  <button
                    type="button"
                    onClick={() => setOptionType("CE")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${optionType === "CE" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
                  >
                    CALL (CE)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptionType("PE")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${optionType === "PE" ? "bg-rose-500 text-white font-black" : "text-slate-400 hover:text-white"}`}
                  >
                    PUT (PE)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Strike Price</label>
                <input
                  type="number"
                  value={strike}
                  onChange={(e) => setStrike(Number(e.target.value))}
                  className="w-full bg-[#0B0E14] border border-[#222B3A] rounded-xl p-2 text-xs font-mono font-bold text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Execution Ticket */}
        <div className="lg:col-span-5 bg-[#151A23] border border-[#222B3A] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222B3A] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ORDER TICKET</span>
            <span className="text-sm font-mono font-bold text-amber-400">₹{entryPrice}</span>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderSide("BUY")}
                className={`py-2 rounded-xl text-xs font-black transition ${
                  orderSide === "BUY" ? "bg-emerald-500 text-slate-950 shadow-md" : "bg-[#0B0E14] text-slate-400 border border-[#222B3A]"
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderSide("SELL")}
                className={`py-2 rounded-xl text-xs font-black transition ${
                  orderSide === "SELL" ? "bg-rose-500 text-white shadow-md" : "bg-[#0B0E14] text-slate-400 border border-[#222B3A]"
                }`}
              >
                SELL
              </button>
            </div>

            {/* Editable Lots Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Lots</label>
                <span className="text-[10px] font-mono text-slate-400 font-bold">Total Qty: {totalQty}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLots(Math.max(1, (Number(lots) || 1) - 1))}
                  className="w-10 h-10 rounded-xl bg-[#0B0E14] border border-[#222B3A] text-slate-200 font-bold hover:text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, Number(e.target.value)))}
                  className="flex-1 bg-[#0B0E14] border border-[#222B3A] text-center rounded-xl py-2 font-mono font-bold text-sm text-white outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setLots((Number(lots) || 1) + 1)}
                  className="w-10 h-10 rounded-xl bg-[#0B0E14] border border-[#222B3A] text-slate-200 font-bold hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Entry Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full bg-[#0B0E14] border border-[#222B3A] rounded-xl p-2.5 text-xs font-mono font-bold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1 mb-1">
                  <Lock className="w-3 h-3" /> Mandatory SL (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Required"
                  className="w-full bg-[#0B0E14] border-2 border-amber-500/60 rounded-xl p-2.5 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Margin Breakdown Card */}
            <div className="bg-[#0B0E14] border border-[#222B3A] rounded-xl p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Capital/Margin Req:</span>
                <span className="text-white font-bold">₹{marginRequired.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Margin Remaining:</span>
                <span className="text-emerald-400 font-bold">₹{availableMarginAfter.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#222B3A]">
                <span className="text-amber-400">Planned SL Risk:</span>
                <span className="text-rose-400 font-bold">₹{plannedRisk.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              disabled={isBreached}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                isBreached
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                  : orderSide === "BUY"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg"
                  : "bg-rose-500 hover:bg-rose-400 text-white shadow-lg"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isBreached ? "Terminal Locked" : `Execute Guarded ${orderSide}`}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}