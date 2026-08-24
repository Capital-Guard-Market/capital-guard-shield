import React, { useState } from "react";

type IndexType = "NIFTY" | "BANKNIFTY" | "SENSEX" | "FINNIFTY";

interface IndexConfig {
  name: string;
  spot: number;
  lotSize: number;
  step: number;
  exchange: "NSE" | "BSE";
}

const INDICES: Record<IndexType, IndexConfig> = {
  NIFTY: { name: "Nifty 50", spot: 24500, lotSize: 65, step: 50, exchange: "NSE" },
  BANKNIFTY: { name: "Bank Nifty", spot: 51200, lotSize: 30, step: 100, exchange: "NSE" },
  SENSEX: { name: "BSE Sensex", spot: 81300, lotSize: 20, step: 100, exchange: "BSE" },
  FINNIFTY: { name: "Fin Nifty", spot: 23400, lotSize: 60, step: 50, exchange: "NSE" },
};

interface OrderTicketProps {
  dailyLossLimit?: number;
  totalRealizedLossToday?: number;
  onExecuteTrade?: (trade: any) => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  dailyLossLimit = 5000,
  totalRealizedLossToday = 1200,
  onExecuteTrade,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<IndexType>("NIFTY");
  const [optionType, setOptionType] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState(1);
  const [entryPrice, setEntryPrice] = useState(140);
  const [stopLossPrice, setStopLossPrice] = useState(120);

  const activeConfig = INDICES[selectedIndex];
  const totalQuantity = lots * activeConfig.lotSize;

  const strikeOptions = [
    `${activeConfig.spot - activeConfig.step} CE`,
    `${activeConfig.spot} CE`,
    `${activeConfig.spot + activeConfig.step} CE`,
    `${activeConfig.spot} PE`,
    `${activeConfig.spot - activeConfig.step} PE`,
  ];
  const [selectedStrike, setSelectedStrike] = useState(strikeOptions[1]);

  const plannedRiskPerUnit = Math.max(0, entryPrice - stopLossPrice);
  const plannedTradeRisk = totalQuantity * plannedRiskPerUnit;
  const remainingRiskBudget = Math.max(0, dailyLossLimit - totalRealizedLossToday);

  const minBuffer = activeConfig.lotSize * 5;
  const isRiskExceeded = plannedTradeRisk > remainingRiskBudget;
  const isBufferTooSmall = remainingRiskBudget < minBuffer;
  const canExecute = !isRiskExceeded && !isBufferTooSmall && plannedTradeRisk > 0;

  return (
    <div className="w-full max-w-md p-5 bg-[#0F172A] border border-slate-800 rounded-2xl shadow-xl text-white">
      {/* Multi-Index Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-4">
        {(Object.keys(INDICES) as IndexType[]).map((indexKey) => (
          <button
            key={indexKey}
            onClick={() => {
              setSelectedIndex(indexKey);
              setSelectedStrike(`${INDICES[indexKey].spot} CE`);
            }}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              selectedIndex === indexKey
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {indexKey}
          </button>
        ))}
      </div>

      {/* Header Telemetry */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="text-sm font-bold text-slate-100">{activeConfig.name}</div>
          <div className="text-xs text-slate-400">
            Spot: <span className="text-emerald-400 font-semibold">{activeConfig.spot.toLocaleString("en-IN")}</span> • {activeConfig.exchange}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining Shield</div>
          <div className="text-sm font-bold text-amber-400">₹{remainingRiskBudget.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Side Selector */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <button
          onClick={() => setOptionType("BUY")}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            optionType === "BUY" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-slate-800 text-slate-400"
          }`}
        >
          BUY (LONG)
        </button>
        <button
          onClick={() => setOptionType("SELL")}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            optionType === "SELL" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-slate-800 text-slate-400"
          }`}
        >
          SELL (SHORT)
        </button>
      </div>

      {/* Strike Selector */}
      <div className="mb-3">
        <label className="text-[10px] text-slate-400">Select Strike</label>
        <select
          value={selectedStrike}
          onChange={(e) => setSelectedStrike(e.target.value)}
          className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
        >
          {strikeOptions.map((str) => (
            <option key={str} value={str}>
              {selectedIndex} {str}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity & Price Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Position Size (Lots)</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLots(Math.max(1, lots - 1))}
              className="w-7 h-7 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-slate-100">{lots}</span>
            <button
              onClick={() => setLots(lots + 1)}
              className="w-7 h-7 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
            >
              +
            </button>
            <span className="text-[10px] text-slate-500">({totalQuantity} Qty @ {activeConfig.lotSize}/lot)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400">Entry Price (₹)</label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Stop Loss (₹)</label>
            <input
              type="number"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Risk Telemetry & Warnings */}
      <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Planned Trade Risk:</span>
          <span className={`font-bold ${isRiskExceeded ? "text-rose-400" : "text-slate-200"}`}>
            ₹{plannedTradeRisk.toLocaleString("en-IN")}
          </span>
        </div>

        {isRiskExceeded && (
          <div className="mt-2 text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50">
            ⚠️ <b>Risk Limit Exceeded:</b> Trade risk ₹{plannedTradeRisk} exceeds remaining limit (₹{remainingRiskBudget}). Reduce lots or tighten SL.
          </div>
        )}

        {isBufferTooSmall && (
          <div className="mt-2 text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/50">
            🛡️ <b>Buffer Preserved:</b> Remaining capital is below the minimum tick spread for {activeConfig.name}. Shield has secured remaining funds.
          </div>
        )}
      </div>

      {/* Execution Button */}
      <button
        disabled={!canExecute}
        onClick={() =>
          onExecuteTrade?.({
            index: selectedIndex,
            selectedStrike,
            optionType,
            lots,
            totalQuantity,
            entryPrice,
            stopLossPrice,
            plannedTradeRisk,
          })
        }
        className={`w-full mt-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
          canExecute
            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98]"
            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
        }`}
      >
        {isRiskExceeded ? "BLOCKED BY RISK SHIELD" : isBufferTooSmall ? "DAILY LIMIT REACHED" : "EXECUTE PROTECTED ORDER"}
      </button>
    </div>
  );
};
export default OrderTicket;