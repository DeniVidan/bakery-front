import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  RotateCw, 
  ChefHat, 
  Settings, 
  Sliders
} from 'lucide-react';

export default function OverviewTab({
  t,
  loading,
  calculations,
  loadAllData,
  getBatchShortages,
  handleCopyShoppingList,
  copiedShoppingList,
  starterOverrides,
  setStarterOverrides,
  starterWasteFactor,
  starterReserve,
  setStarterReserve,
  starters,
  availableStarterSeed,
  setAvailableStarterSeed,
  starterPresetRatio,
  setStarterPresetRatio,
  selectedCalculationBatchId,
  batches,
  handleBatchFilterChange,
  handleUpdateBatchStatus,
  orders,
  setRescheduleOrder,
  setRescheduleDate,
  setShowRescheduleModal,
  handleUnbatchOrder,
  handleDeleteOrder,
  setWhatsappOrder,
  formatSlotLabel,
  showOverviewFinancials,
  setShowOverviewFinancials,
  showMarginBreakdown,
  setShowMarginBreakdown,
  calculateBatchRevenue,
  calculateBatchCost,
  getBatchCostItems
}) {
  // Local state for Sourdough Proofing Temperature & Timer Calibrator (persisted in localStorage)
  const [enableTempCalibrator, setEnableTempCalibrator] = useState(() => {
    return localStorage.getItem('enableTempCalibrator') === 'true';
  });
  const [ambientTemp, setAmbientTemp] = useState(() => {
    return parseFloat(localStorage.getItem('ambientTemp')) || 21.0;
  });

  useEffect(() => {
    localStorage.setItem('enableTempCalibrator', enableTempCalibrator);
  }, [enableTempCalibrator]);

  useEffect(() => {
    localStorage.setItem('ambientTemp', ambientTemp);
  }, [ambientTemp]);

  // Calibrated proofing estimation logic based on thermal fermentation kinetics
  // Sourdough rate doubles roughly for every 5.0°C increase from 21.0°C
  const rateMultiplier = Math.pow(2, (ambientTemp - 21.0) / 5.0);
  const adjustedBulkTime = 6.0 / rateMultiplier;
  const adjustedFinalTime = 2.5 / rateMultiplier;

  // Helper to format float hours nicely
  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Temperature status badges and labels
  let roomStatus = "";
  let roomStatusColor = "";
  if (ambientTemp < 20.0) {
    roomStatus = t('chillyKitchenBadge', { defaultValue: 'Chilly Kitchen (Slow Fermentation)' });
    roomStatusColor = "text-blue-500 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20";
  } else if (ambientTemp <= 22.5) {
    roomStatus = t('standardKitchenBadge', { defaultValue: 'Standard Baseline Room Temp' });
    roomStatusColor = "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20";
  } else if (ambientTemp <= 26.5) {
    roomStatus = t('warmKitchenBadge', { defaultValue: 'Warm Kitchen (Fast Fermentation)' });
    roomStatusColor = "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20";
  } else {
    roomStatus = t('hotKitchenBadge', { defaultValue: 'Very Hot (Extreme Fermentation - Watch Closely!)' });
    roomStatusColor = "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20";
  }

  return (
    <div className="space-y-8 no-print animate-rise">
      {/* PERSISTENT HEADER BLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            🌾 {t('bakeryDashboard', { defaultValue: 'Bakery Operations' })}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {selectedCalculationBatchId === 'all' 
              ? t('realtimeOps', { defaultValue: 'Real-time recipe scaling & active queue logistics' })
              : t('historicalOps', { defaultValue: 'Viewing archived batch details & calculated stats' })
            }
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Beautiful Glassmorphic Dropdown */}
          <div className="relative">
            <select
              value={selectedCalculationBatchId}
              onChange={handleBatchFilterChange}
              className="appearance-none bg-white/75 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl pl-9 pr-10 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm cursor-pointer min-w-[200px]"
            >
              <option value="all">
                🌐 {t('activeQueueOption', { defaultValue: 'Live Queue (Auto-Sync)' })}
              </option>
              {batches && batches.length > 0 && (
                <optgroup label={t('pastBatchesGroup', { defaultValue: 'Historical Runs' })} className="text-slate-400 font-normal">
                  {[...batches]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((b) => {
                      const dateStr = new Date(b.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      });
                      const label = `${dateStr} - Run #${b.id.slice(0, 8).toUpperCase()} (${b.status})`;
                      return (
                        <option key={b.id} value={b.id} className="text-slate-800 dark:text-slate-100 font-bold">
                          📦 {label}
                        </option>
                      );
                    })
                  }
                </optgroup>
              )}
            </select>
            {/* Custom Icon placement on left and down arrow on right */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none text-xs">
              {selectedCalculationBatchId === 'all' ? '🌐' : '📦'}
            </div>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button
            onClick={loadAllData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition duration-150 active:scale-95 shadow-sm"
          >
            <RotateCw size={13} className={loading ? 'animate-spin text-amber-500' : 'text-slate-400'} />
            {t('refreshEngine', { defaultValue: 'Sync Engine' })}
          </button>
        </div>
      </div>

      {/* CONDITIONAL BODY LOADING / EMPTY / MAIN CONTENT */}
      {loading ? (
        <div className="glass-card rounded-3xl p-16 border border-slate-200 dark:border-slate-800/60 text-center shadow-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="absolute text-lg">🌾</span>
            </div>
            <p className="text-xs text-slate-500 font-extrabold tracking-wide uppercase mt-4">
              {t('loadingOperations', { defaultValue: 'Calculating recipe weights, batch costs, and inventories...' })}
            </p>
          </div>
        </div>
      ) : !calculations ? (
        <div className="glass-card rounded-3xl p-16 border border-slate-200 dark:border-slate-800/60 text-center shadow-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center justify-center space-y-5 max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-3xl animate-pulse">
              🌾
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                {t('noCalculationsAvailable', { defaultValue: 'No Calculation Data Available' })}
              </h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {selectedCalculationBatchId === 'all'
                  ? t('noCalculationsDesc', { defaultValue: 'There are no active orders scheduled, or the BakEngine calculation service is offline. Place an order or schedule a batch.' })
                  : t('noHistoricalCalculationsDesc', { defaultValue: 'No calculation record could be compiled for this historical batch. It may have no bakes allocated.' })
                }
              </p>
            </div>
            {selectedCalculationBatchId === 'all' && (
              <button
                type="button"
                onClick={loadAllData}
                className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition duration-250 shadow-md shadow-amber-500/10 active:scale-95"
              >
                {t('refreshEngine', { defaultValue: 'Reload Engine' })}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Historical Batch Selected Banner */}
          {selectedCalculationBatchId !== 'all' && batches && (() => {
            const selectedBatch = batches.find(b => b.id === selectedCalculationBatchId);
            if (!selectedBatch) return null;
            const formattedDate = new Date(selectedBatch.date).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            return (
              <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200 flex items-center justify-between flex-wrap gap-4 animate-rise no-print">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      {t('historicalBatchView', { defaultValue: 'Viewing Archived Batch Run' })}
                    </h4>
                    <p className="text-[11px] opacity-90 mt-0.5 font-medium">
                      {t('historicalBatchViewDesc', { 
                        defaultValue: 'You are viewing the compiled recipes, ingredients, and metrics for Batch #{uid} (baked on {date}).' 
                      }).replace('{uid}', selectedBatch.id.slice(0, 8).toUpperCase()).replace('{date}', formattedDate)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleBatchFilterChange({ target: { value: 'all' } })}
                  className="py-1.5 px-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-300 dark:hover:text-amber-100 text-[10px] font-extrabold transition duration-150 uppercase tracking-wider"
                >
                  {t('backToActiveQueue', { defaultValue: 'Return to Active Queue' })}
                </button>
              </div>
            );
          })()}

      {/* Quick Metrics Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/60 shadow">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('totalActiveOrders', { defaultValue: 'Total Active Orders' })}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{calculations ? calculations.summary.totalActiveOrders : 0}</span>
            <span className="text-[10px] text-slate-400 font-bold">{t('ordersLabel', { defaultValue: 'orders' })}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/60 shadow">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('totalProductsBaking', { defaultValue: 'Total Products Baking' })}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {calculations ? calculations.summary.totalProductsCount : 0}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">{t('itemsLabel', { defaultValue: 'items' })}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/60 shadow">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('cumulFlourKg', { defaultValue: 'Cumulative Flour' })}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {calculations ? (calculations.summary.totalFlourGrams / 1000).toFixed(1) : '0.0'}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">kg</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/60 shadow">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('totalEstDoughWeight', { defaultValue: 'Est. Dough Weight' })}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {calculations ? (calculations.summary.totalDoughWeightGrams / 1000).toFixed(1) : '0.0'}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">kg</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Chronological bake workflow */}
        <div className="lg:col-span-2 space-y-8">

          {/* Baker's Financial Margin & Costing Panel */}
          {calculations && (
            <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💰</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      {t('financialPerformanceTitle', { defaultValue: "Baker's Financial Performance" })}
                    </h4>
                    {!showOverviewFinancials && (
                      <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                        € {calculateBatchRevenue().toFixed(2)} {t('grossSales', { defaultValue: 'Gross Sales' })} | {t('projectedProfit', { defaultValue: 'Projected Net Profit' })}: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">€ {(calculateBatchRevenue() - calculateBatchCost()).toFixed(2)}</strong>
                      </p>
                    )}
                    {showOverviewFinancials && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t('financialPerformanceDesc', { defaultValue: "Projected batch profitability, dynamic margin calculations, and ingredient unit costing." })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Net Margin pill */}
                  {(() => {
                    const revenue = calculateBatchRevenue();
                    const cost = calculateBatchCost();
                    const profit = revenue - cost;
                    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                    return (
                      <div className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        {margin.toFixed(1)}% {t('marginBadge', { defaultValue: 'Margin' })}
                      </div>
                    );
                  })()}

                  {/* Toggle expand button */}
                  <button
                    type="button"
                    onClick={() => setShowOverviewFinancials(!showOverviewFinancials)}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                  >
                    {showOverviewFinancials ? t('hideDetails', { defaultValue: 'Hide details' }) : t('showDetails', { defaultValue: 'Show details' })}
                  </button>
                </div>
              </div>

              {showOverviewFinancials && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850 animate-rise">
                  {/* Financial values grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 text-center">
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">{t('grossSales', { defaultValue: 'Gross Sales' })}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 block">
                        € {calculateBatchRevenue().toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 text-center">
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">{t('ingredientCost', { defaultValue: 'Ingredient Cost' })}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 block text-rose-500">
                        - € {calculateBatchCost().toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 text-center">
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">{t('projectedProfit', { defaultValue: 'Projected Net Profit' })}</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                        € {(calculateBatchRevenue() - calculateBatchCost()).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Accordion for Cost Breakdown */}
                  <div className="pt-2 border-t border-slate-150 dark:border-slate-800/40">
                    <button
                      type="button"
                      onClick={() => setShowMarginBreakdown(!showMarginBreakdown)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-bakery-600 transition"
                    >
                      <span>📋 {t('costBreakdownDetails', { defaultValue: 'Ingredient Cost Breakdown' })}</span>
                      <span>{showMarginBreakdown ? '▲' : '▼'}</span>
                    </button>

                    {showMarginBreakdown && (
                      <div className="mt-2.5 space-y-2 bg-slate-950/10 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 max-h-48 overflow-y-auto">
                        {getBatchCostItems().map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-100 dark:border-slate-850 last:border-0 last:pb-0">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{(item.weightGrams >= 1000 ? `${(Math.ceil(item.weightGrams) / 1000).toFixed(3)} kg` : `${Math.ceil(item.weightGrams)} g`)} @ € {item.unitCost.toFixed(2)}/kg</span>
                            </div>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              € {item.totalCost.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Sourdough Starter Feeding Assistant */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                {t('step1StarterFeeding', { defaultValue: 'Step 1: Sourdough Starter Feeding Assistant' })}
              </h4>
            </div>

            {calculations && calculations.summary.startersBreakdown && calculations.summary.startersBreakdown.length > 0 ? (
              <div className="space-y-4">
                {calculations.summary.startersBreakdown.map((sb) => {
                  const activeStarterName = starterOverrides[sb.name] || sb.name;
                  const isStandard = activeStarterName === 'Standard Sourdough Starter';
                  const target = Math.ceil(sb.grams);
                  if (target <= 0) return null;

                  // Scale target tonight by starterWasteFactor to cover transfer/scraping loss:
                  const scaledTarget = Math.ceil(target * (1 + (starterWasteFactor / 100)));
                  const reserveVal = parseFloat(starterReserve) || 0;
                  const seedVal = parseFloat(availableStarterSeed) || 0;
                  const totalTarget = scaledTarget + reserveVal;

                  // Find configuration profile
                  const profile = starters.find(s => s.name === activeStarterName) || {
                    id: 'standard-starter',
                    name: activeStarterName || 'Standard Sourdough Starter',
                    seedParts: 1,
                    flourParts: 2,
                    waterParts: 2,
                    floursBreakdown: [{ name: 'Manitoba', percentage: 100 }]
                  };

                  if (isStandard) {
                    // Render standard, fully interactive card
                    return (
                      <div key={profile.id} className="glass-card rounded-3xl p-5 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 space-y-4 animate-rise">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/10">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🧪</span>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                {profile.name} Feeding Assistant
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                {t('starterFeedingDesc', { defaultValue: 'Calculate exact proportions to scale up your starter seed to the required weight tonight.' })}
                              </p>
                            </div>
                          </div>

                          {/* Starter Profile Selector */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                                Starter:
                              </span>
                              <select
                                value={activeStarterName}
                                onChange={(e) => {
                                  setStarterOverrides({
                                    ...starterOverrides,
                                    [sb.name]: e.target.value
                                  });
                                }}
                                className="py-1 px-2.5 text-[11px] font-extrabold rounded-xl border border-amber-500/20 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                              >
                                {starters.map(s => (
                                  <option key={s.id} value={s.name}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wide whitespace-nowrap">
                              ⚙️ {profile.feedingMethod === 'method-b' ? 'Adaptive' : 'Preset'}
                            </div>
                          </div>
                        </div>

                        {/* Ratio presets */}
                        {profile.feedingMethod !== 'method-b' && (
                          <div className="space-y-1.5 animate-rise">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {t('starterFeedingRatio', { defaultValue: 'Choose Feeding Ratio (Seed : Flour : Water)' })}
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                              {['1:1:1', '1:2:2', '1:3:3', '1:4:4', '1:5:5'].map((ratio) => (
                                <button
                                  key={ratio}
                                  type="button"
                                  onClick={() => setStarterPresetRatio(ratio)}
                                  className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold border transition duration-200 hover:scale-[1.02] ${
                                    starterPresetRatio === ratio
                                      ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold shadow-md shadow-amber-500/5'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {ratio}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Seed & Reserve Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {t('availableSeedLabel', { defaultValue: 'Starter seed in your jar (g)' })}
                            </label>
                            <input
                              type="number"
                              value={availableStarterSeed}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  setAvailableStarterSeed("");
                                } else {
                                  const val = parseInt(raw, 10);
                                  if (!isNaN(val)) {
                                    setAvailableStarterSeed(val);
                                  }
                                }
                              }}
                              className="p-2 w-full text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {t('desiredReserveLabel', { defaultValue: 'Desired leftover in jar (g)' })}
                            </label>
                            <input
                              type="number"
                              value={starterReserve}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  setStarterReserve("");
                                } else {
                                  const val = parseInt(raw, 10);
                                  if (!isNaN(val)) {
                                    setStarterReserve(val);
                                  }
                                }
                              }}
                              className="p-2 w-full text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>
                          
                          <div className="bg-slate-950/10 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                            🎯 {t('bakingTarget', { defaultValue: 'Baking Target' })}: <strong className="text-slate-700 dark:text-slate-200">{target}g</strong><br />
                            🌾 {t('scaledTarget', { defaultValue: 'For Scraping Loss' })} ({starterWasteFactor}%): <strong className="text-slate-700 dark:text-slate-200">{scaledTarget}g</strong><br />
                            📈 {t('totalWithReserve', { defaultValue: 'Total Target (incl. reserve)' })}: <strong className="text-slate-700 dark:text-slate-200">{totalTarget}g</strong>
                          </div>
                        </div>

                        {/* Calculation Results splits */}
                        <div className="grid grid-cols-1 gap-4 pt-1">
                          {profile.feedingMethod === 'method-b' ? (
                            /* Method B: Use All available seed card */
                            (() => {
                              if (seedVal >= totalTarget) {
                                return (
                                  <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] flex flex-col items-center justify-center text-center space-y-1 animate-rise">
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider">
                                      ✨ Sufficient Starter: No feeding required
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                      Post-bake reserve: <strong className="text-slate-700 dark:text-slate-200 font-mono">{seedVal - scaledTarget} g</strong> (Total seed: {seedVal}g / Target: {totalTarget}g)
                                    </span>
                                  </div>
                                );
                              }

                              const remainingWeight = totalTarget - seedVal;
                              const feedFlour = Math.ceil(remainingWeight / 2);
                              const feedWater = Math.ceil(remainingWeight / 2);

                              return (
                                <div className="p-5 rounded-2xl border border-amber-500/15 bg-amber-500/5 dark:bg-amber-950/5 space-y-3 animate-rise">
                                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                    ⚡ Method B: Use ALL of your {seedVal}g Seed
                                  </span>
                                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="flex justify-between border-b dark:border-slate-800 pb-1.5">
                                      <span>🧪 {t('useStarterSeed', { defaultValue: 'Use ALL Starter Seed' })}:</span>
                                      <strong className="font-mono text-slate-800 dark:text-slate-100">{seedVal} g</strong>
                                    </div>
                                    <div className="flex justify-between border-b dark:border-slate-800 pb-1.5">
                                      <span>🥖 {t('addFlour', { defaultValue: 'Add Flour' })}:</span>
                                      <strong className="font-mono text-slate-800 dark:text-slate-100">{feedFlour} g</strong>
                                    </div>
                                    {profile.floursBreakdown && profile.floursBreakdown.length > 0 && (
                                      <div className="pl-3 border-l border-amber-500/20 ml-2 py-0.5 space-y-1 bg-amber-500/[0.01] p-1.5 rounded-lg">
                                        {profile.floursBreakdown.map((fb, fbIdx) => {
                                          const fbGrams = Math.ceil(feedFlour * (fb.percentage / 100));
                                          return (
                                            <div key={fbIdx} className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                              <span>↳ {fb.name} ({fb.percentage}%):</span>
                                              <strong className="font-mono">{fbGrams} g</strong>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span>💧 {t('addWater', { defaultValue: 'Add Water' })}:</span>
                                      <strong className="font-mono text-slate-800 dark:text-slate-100">{feedWater} g</strong>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                    🥣 Tomorrow morning, stir and scoop exactly <strong className="text-amber-600 dark:text-amber-400">{scaledTarget}g</strong> of Sourdough Starter for your bakes. Exactly <strong className="text-amber-600 dark:text-amber-400">{starterReserve}g</strong> will remain pristine in your jar.
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            /* Method A: Preset ratios splits card */
                            (() => {
                              const seedParts = parseInt(starterPresetRatio.split(':')[0], 10) || 1;
                              const flourParts = parseInt(starterPresetRatio.split(':')[1], 10) || 2;
                              const waterParts = parseInt(starterPresetRatio.split(':')[2], 10) || 2;
                              const totalParts = seedParts + flourParts + waterParts;

                              const weightPerPart = totalTarget / totalParts;
                              const requiredSeed = Math.ceil(weightPerPart * seedParts);
                              const requiredFlour = Math.ceil(weightPerPart * flourParts);
                              const requiredWater = Math.ceil(weightPerPart * waterParts);

                              return (
                                <div className="p-5 rounded-2xl border border-amber-500/15 bg-amber-500/5 dark:bg-amber-950/5 space-y-3 animate-rise">
                                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                    🥣 Scale-up Recipe ({starterPresetRatio} split)
                                  </span>
                                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="flex justify-between border-b dark:border-slate-800 pb-1.5">
                                      <span>🧪 {t('starterSeedRequired', { defaultValue: 'Starter Seed Required' })}:</span>
                                      <strong className="font-mono text-slate-800 dark:text-slate-100">{requiredSeed} g</strong>
                                    </div>
                                    <div className="flex justify-between border-b dark:border-slate-800 pb-1.5">
                                      <span>🥖 {t('addFlourRequired', { defaultValue: 'Add Flour' })}:</span>
                                      <strong className="font-mono text-slate-800 dark:text-slate-100">{requiredFlour} g</strong>
                                    </div>
                                    {profile.floursBreakdown && profile.floursBreakdown.length > 0 && (
                                      <div className="pl-3 border-l border-amber-500/20 ml-2 py-0.5 space-y-1 bg-amber-500/[0.01] p-1.5 rounded-lg">
                                        {profile.floursBreakdown.map((fb, fbIdx) => {
                                          const fbGrams = Math.ceil(requiredFlour * (fb.percentage / 100));
                                          return (
                                            <div key={fbIdx} className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                              <span>↳ {fb.name} ({fb.percentage}%):</span>
                                              <strong className="font-mono">{fbGrams} g</strong>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span>💧 {t('addWaterRequired', { defaultValue: 'Add Water' })}:</span>
                                      <strong className="font-mono text-slate-800 dark:text-slate-100">{requiredWater} g</strong>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                    🥣 Tomorrow morning, stir and scoop exactly <strong className="text-amber-600 dark:text-amber-400">{scaledTarget}g</strong> Sourdough Starter for your dough. Exactly <strong className="text-amber-600 dark:text-amber-400">{starterReserve}g</strong> will remain pristine in your jar as your starter seed.
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Custom starter breakdown label
                    return (
                      <div key={sb.name} className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50 flex justify-between items-center text-xs animate-rise">
                        <span className="font-bold text-slate-700 dark:text-slate-300">🧪 {sb.name} Needed:</span>
                        <strong className="font-mono text-sm text-amber-600 dark:text-amber-400">{scaledTarget} g <span className="text-[10px] text-slate-400">({target}g + {starterWasteFactor}% loss)</span></strong>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">{t('noStarterBreakdowns', { defaultValue: 'No active starter feed required for today\'s orders.' })}</div>
            )}
          </div>

          {/* STEP 2: Ingredient Totals & Flour Types Breakdown */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="bg-bakery-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                {t('step2IngredientTotals', { defaultValue: 'Step 2: Ingredient Totals & Flour Breakdown' })}
              </h4>
            </div>

            {/* Flour, water, starter, salt boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/30 text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-orange-600 block">{t('flourRequired')}</span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{Math.ceil(calculations.summary.totalFlourGrams).toLocaleString()} g</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{(calculations.summary.totalFlourGrams / 1000).toFixed(3)} kg</span>
                {(() => {
                  const flourShortages = getBatchShortages().filter(s => s.name !== 'Salt' && s.name !== 'Sourdough Starter');
                  return flourShortages.length > 0 ? (
                    <span className="text-[10px] mt-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 py-0.5 px-2 rounded-lg inline-block font-black animate-pulse">
                      ⚠️ {flourShortages.length} {t('short', { defaultValue: 'short' })}
                    </span>
                  ) : null;
                })()}
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/30 text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 block">{t('waterRequired')}</span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{Math.ceil(calculations.summary.totalWaterGrams).toLocaleString()} g</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{(calculations.summary.totalWaterGrams / 1000).toFixed(3)} L</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 block">{t('starterLeaven')}</span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{Math.ceil(calculations.summary.totalStarterGrams).toLocaleString()} g</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{(calculations.summary.totalStarterGrams / 1000).toFixed(3)} kg</span>
                {(() => {
                  const starterShortage = getBatchShortages().find(s => s.name === 'Sourdough Starter');
                  return starterShortage ? (
                    <span className="text-[10px] mt-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 py-0.5 px-2 rounded-lg inline-block font-black animate-pulse">
                      ⚠️ {t('short', { defaultValue: 'Short' })} {starterShortage.shortKg.toFixed(3)} kg
                    </span>
                  ) : null;
                })()}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/10 border border-slate-300/30 text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600 block">{t('fineSeaSalt')}</span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{Math.ceil(calculations.summary.totalSaltGrams).toLocaleString()} g</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{(calculations.summary.totalSaltGrams / 1000).toFixed(3)} kg</span>
                {(() => {
                  const saltShortage = getBatchShortages().find(s => s.name === 'Salt');
                  return saltShortage ? (
                    <span className="text-[10px] mt-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 py-0.5 px-2 rounded-lg inline-block font-black animate-pulse">
                      ⚠️ {t('short', { defaultValue: 'Short' })} {saltShortage.shortKg.toFixed(3)} kg
                    </span>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Flour Types Breakdown card */}
            {calculations.summary.floursBreakdown && calculations.summary.floursBreakdown.length > 0 && (
              <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 space-y-4 animate-rise">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    🌾 {t('flourTypesBreakdown', { defaultValue: 'Flour Types Breakdown' })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {t('totalFlour', { defaultValue: 'Total Flour' })}: <strong className="font-mono text-slate-700 dark:text-slate-200">{Math.ceil(calculations.summary.totalFlourGrams).toLocaleString()} g</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {calculations.summary.floursBreakdown.map((fb, idx) => {
                    const shortItem = getBatchShortages().find(s => s.name === fb.name);
                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col justify-between text-xs p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border shadow-sm transition-all duration-200 hover:scale-[1.01] ${
                          shortItem 
                            ? 'border-amber-400/40 dark:border-amber-500/25 bg-amber-500/[0.02]' 
                            : 'border-slate-200/50 dark:border-slate-800/50'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{fb.name}</span>
                          <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                            {Math.ceil(fb.grams).toLocaleString()} g
                          </span>
                        </div>
                        {shortItem && (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 font-black mt-2 pt-1.5 border-t border-amber-500/10 flex items-center gap-1">
                            <span>⚠️ Short: {Math.ceil(shortItem.shortKg * 1000).toLocaleString()} g</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extras & Fillings breakdown */}
            {calculations.summary.extras && calculations.summary.extras.length > 0 && (
              <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 space-y-4 animate-rise">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    🧪 {t('richEnrichment', { defaultValue: 'Extras & Enrichments' })}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {calculations.summary.extras.map((extra, idx) => {
                    const shortExtra = getBatchShortages().find(s => s.name === extra.name);
                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col justify-between text-xs p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border shadow-sm transition-all duration-200 hover:scale-[1.01] ${
                          shortExtra 
                            ? 'border-amber-400/40 dark:border-amber-500/25 bg-amber-500/[0.02]' 
                            : 'border-slate-200/50 dark:border-slate-800/50'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{extra.name}</span>
                          <span className="font-black text-bakery-600 dark:text-bakery-400 font-mono text-sm">
                            {Math.ceil(extra.grams).toLocaleString()} g
                          </span>
                        </div>
                        {shortExtra && (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 font-black mt-2 pt-1.5 border-t border-amber-500/10 flex items-center gap-1">
                            <span>⚠️ Short: {Math.ceil(shortExtra.shortKg * 1000).toLocaleString()} g</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clipboard button for shortages */}
            {getBatchShortages().length > 0 && (
              <div className="pt-2 animate-rise">
                <button
                  type="button"
                  onClick={handleCopyShoppingList}
                  className={`w-full py-2.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 transition duration-200 shadow-md ${
                    copiedShoppingList 
                      ? 'bg-emerald-600 text-white shadow-emerald-500/10 scale-[0.99]' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10 hover:scale-[1.01]'
                  }`}
                >
                  <span>{copiedShoppingList ? '✅' : '📋'}</span>
                  <span>{copiedShoppingList ? t('shoppingListCopied', { defaultValue: 'Copied to Clipboard!' }) : t('copyShoppingList', { defaultValue: 'Copy Shopping List for WhatsApp' })}</span>
                </button>
              </div>
            )}

            {/* Cumulative Dough Weight */}
            <div className="flex items-center justify-between text-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20 shadow-sm animate-rise">
              <span className="font-bold text-slate-500">{t('estCumulativeDough', { defaultValue: 'Estimated Cumulative Dough Weight' })}</span>
              <span className="font-black text-bakery-600 dark:text-bakery-400 text-sm">{Math.ceil(calculations.summary.totalDoughWeightGrams).toLocaleString()} g ({(calculations.summary.totalDoughWeightGrams / 1000).toFixed(3)} kg)</span>
            </div>
          </div>

          {/* STEP 3: Smart Single-Bowl Bulk Mixing */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="bg-bakery-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                {t('step3BulkMixing', { defaultValue: 'Step 3: Smart Single-Bowl Bulk Mixing & Portion Guides' })}
              </h4>
            </div>

            {/* Premium Sourdough Proofing Temperature & Timer Calibrator Widget */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-950/20 space-y-3.5 animate-rise">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableTempCalibrator}
                    onChange={(e) => setEnableTempCalibrator(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-amber-500/20"
                  />
                  <div className="flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-500" />
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                      {t('tempCalibratorTitle', { defaultValue: 'Ambient Temperature & Proofing Calibrator' })}
                    </span>
                  </div>
                </label>
                {enableTempCalibrator && (
                  <span className={`text-[9px] font-black uppercase tracking-wider border py-0.5 px-2 rounded-md transition duration-150 ${roomStatusColor}`}>
                    {roomStatus}
                  </span>
                )}
              </div>

              {enableTempCalibrator && (
                <div className="space-y-3 animate-rise">
                  <p className="text-[10px] text-slate-400 max-w-xl">
                    {t('tempCalibratorDesc', { defaultValue: 'Adjusts sourdough fermentation estimates using biology-based thermodynamics. baseline room temperature is 21.0°C.' })}
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="16.0"
                      max="30.0"
                      step="0.5"
                      value={ambientTemp}
                      onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
                      className="flex-1 accent-amber-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="p-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-tight shrink-0">
                      {ambientTemp.toFixed(1)}°C
                    </div>
                  </div>
                </div>
              )}
            </div>

            {calculations && calculations.productBreakdown && calculations.productBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-rise">
                {(() => {
                  const groups = {};
                  calculations.productBreakdown.forEach((pb) => {
                    const singleFlour = pb.flour / pb.quantity;
                    if (!singleFlour || singleFlour === 0) return;
                    
                    const singleWater = pb.water / pb.quantity;
                    const singleStarter = pb.starter / pb.quantity;
                    const singleSalt = pb.salt / pb.quantity;
                    
                    // Compute percentages relative to main recipe flour
                    const hydrationPct = Math.round((singleWater / singleFlour) * 100);
                    const starterPct = Math.round((singleStarter / singleFlour) * 100);
                    const saltPct = Math.round((singleSalt / singleFlour) * 100 * 10) / 10;
                    
                    const floursPct = Object.entries(pb.floursBreakdown || {}).map(([fName, fGrams]) => {
                      const pct = Math.round((fGrams / pb.flour) * 100);
                      return { name: fName, pct };
                    }).filter(item => item.pct > 0);
                    floursPct.sort((a, b) => a.name.localeCompare(b.name));
                    const sortedFloursStr = floursPct.map(item => `${item.name}:${item.pct}%`).join(',');
                    
                    const extrasPct = Object.entries(pb.extraIngredients || {}).map(([extName, extGrams]) => {
                      const pct = Math.round((extGrams / pb.flour) * 100);
                      return { name: extName, pct };
                    }).filter(item => item.pct > 0);
                    extrasPct.sort((a, b) => a.name.localeCompare(b.name));
                    const sortedExtrasStr = extrasPct.map(item => `${item.name}:${item.pct}%`).join(',');
                    
                    const signature = `H${hydrationPct}:S${starterPct}:Sa${saltPct}:F[${sortedFloursStr}]:E[${sortedExtrasStr}]`;
                    
                    if (!groups[signature]) {
                      groups[signature] = {
                        signature,
                        hydrationPct,
                        starterPct,
                        saltPct,
                        flour: 0,
                        water: 0,
                        starter: 0,
                        salt: 0,
                        floursBreakdown: {},
                        extraIngredients: {},
                        productNames: [],
                        variants: [],
                        floursPctList: floursPct,
                        extrasPctList: extrasPct
                      };
                    }
                    
                    const g = groups[signature];
                    g.flour += pb.flour;
                    g.water += pb.water;
                    g.starter += pb.starter;
                    g.salt += pb.salt;
                    
                    if (!g.productNames.includes(pb.productName)) {
                      g.productNames.push(pb.productName);
                    }
                    
                    if (pb.floursBreakdown) {
                      Object.entries(pb.floursBreakdown).forEach(([fName, fGrams]) => {
                        g.floursBreakdown[fName] = (g.floursBreakdown[fName] || 0) + fGrams;
                      });
                    }
                    
                    if (pb.extraIngredients) {
                      Object.entries(pb.extraIngredients).forEach(([extName, extGrams]) => {
                        g.extraIngredients[extName] = (g.extraIngredients[extName] || 0) + extGrams;
                      });
                    }
                    
                    const singleExtras = Object.values(pb.extraIngredients || {}).reduce((acc, curr) => acc + curr, 0) / pb.quantity;
                    const singleDoughWeight = singleFlour + singleWater + singleStarter + singleSalt + singleExtras;
                    
                    g.variants.push({
                      productName: pb.productName,
                      size: pb.variantSize,
                      quantity: pb.quantity,
                      singleFlour,
                      singleDoughWeight
                    });
                  });

                  return Object.values(groups);
                })().map((group, idx) => {
                  const totalExtrasWeight = Object.values(group.extraIngredients).reduce((a, b) => a + Number(b || 0), 0);
                  const totalBatchWeight = group.flour + group.water + group.starter + group.salt + totalExtrasWeight;

                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                      <div>
                        <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-3">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                              {group.productNames.join(" & ")}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-bakery-500/10 dark:bg-bakery-500/20 text-bakery-600 dark:text-bakery-400 px-2.5 py-1 rounded-full whitespace-nowrap">
                              {t('totalBatchWeight', { defaultValue: 'Batch' })}: {Math.ceil(totalBatchWeight).toLocaleString()} g
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="text-[9px] font-mono bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-extrabold uppercase">
                              Signature: {group.hydrationPct}% Hyd | {group.starterPct}% Start | {group.saltPct}% Salt
                            </span>
                          </div>
                        </div>

                        {/* Ingredient Weights Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] mt-4">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 flex justify-between">
                            <span className="font-semibold text-slate-400">{t('totalFlour')}</span>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {Math.ceil(group.flour).toLocaleString()} g
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 flex justify-between">
                            <span className="font-semibold text-slate-400">{t('totalWater')}</span>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {Math.ceil(group.water).toLocaleString()} g
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 flex justify-between">
                            <span className="font-semibold text-slate-400">{t('totalStarter')}</span>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {Math.ceil(group.starter).toLocaleString()} g
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 flex justify-between">
                            <span className="font-semibold text-slate-400">{t('totalSalt')}</span>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {Math.ceil(group.salt).toLocaleString()} g
                            </span>
                          </div>
                        </div>

                        {/* Specific flour types inside the batch */}
                        {Object.keys(group.floursBreakdown).length > 0 && (
                          <div className="mt-3 p-3 bg-amber-500/5 dark:bg-amber-950/10 rounded-xl border border-amber-500/10">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 block mb-1.5">🌾 {t('flourTypesBreakdown')}</span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(group.floursBreakdown).map(([fName, fGrams]) => (
                                <span key={fName} className="text-[10px] bg-white dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40 px-2 py-1 rounded-lg font-bold text-slate-600 dark:text-slate-300">
                                  {fName}: {Math.ceil(fGrams).toLocaleString()} g
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Specific extra ingredients inside the batch */}
                        {Object.keys(group.extraIngredients).length > 0 && (
                          <div className="mt-3 p-3 bg-slate-100/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">🧪 {t('enrichmentsFillingsExtras')}</span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(group.extraIngredients).map(([extName, extGrams]) => (
                                <span key={extName} className="text-[10px] bg-white dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40 px-2 py-1 rounded-lg font-bold text-bakery-600 dark:text-bakery-400">
                                  {extName}: {Math.ceil(extGrams).toLocaleString()} g
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Temperature Adjusted Proof Estimates Panel */}
                        {enableTempCalibrator && (
                          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.04] border border-amber-500/20 text-xs flex flex-col gap-1.5 animate-rise">
                            <span className="font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                              🌡️ {t('tempAdjustedProofEstimates', { defaultValue: 'Ambient Temperature Proof Estimates' })}
                            </span>
                            <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300 font-medium">
                              <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{t('bulkFermentation', { defaultValue: 'Bulk Rise Time' })}:</span>
                                <strong className="text-slate-800 dark:text-slate-100 font-mono block text-sm mt-0.5">{formatDuration(adjustedBulkTime)}</strong>
                                <span className="text-[8px] text-slate-400 block mt-0.5">(baseline standard: 6h)</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{t('finalProof', { defaultValue: 'Final Proof Time' })}:</span>
                                <strong className="text-slate-800 dark:text-slate-100 font-mono block text-sm mt-0.5">{formatDuration(adjustedFinalTime)}</strong>
                                <span className="text-[8px] text-slate-400 block mt-0.5">(baseline standard: 2.5h)</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Scaling instructions checklist */}
                      <div className="border-t border-slate-200 dark:border-slate-800/60 pt-4 mt-2">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-2">{t('scalingInstructions')}</span>
                        <div className="space-y-1.5 bg-white dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 p-3 rounded-xl">
                          {group.variants.map((v, vIdx) => (
                            <div key={vIdx} className="flex justify-between items-center text-[10px] border-b border-dashed border-slate-200 dark:border-slate-800/50 pb-1.5 last:border-0 last:pb-0 font-medium">
                              <span className="text-slate-600 dark:text-slate-300">
                                {v.productName} ({v.size}) x <strong className="font-extrabold text-slate-800 dark:text-slate-200">{v.quantity}</strong>
                              </span>
                              <span className="font-bold text-bakery-600 dark:text-bakery-400">
                                ⚖️ {t('portionWeight', { defaultValue: 'Portion' })}: {Math.ceil(v.singleDoughWeight).toLocaleString()} g
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                {t('noBulkMixing')}
              </div>
            )}
          </div>

          {/* STEP 4: Unified Batch Orders & Progress Management */}
          {selectedCalculationBatchId && selectedCalculationBatchId !== 'all' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="bg-bakery-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">4</span>
                  Step 4: Unified Batch Orders & Progress Management
                </h4>
                {(() => {
                  const b = batches.find(x => x.id === selectedCalculationBatchId);
                  return b ? (
                    <span className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      Batch Status: <strong className="font-mono text-bakery-600 dark:text-bakery-400">{b.status}</strong>
                    </span>
                  ) : null;
                })()}
              </div>

              {(() => {
                const b = batches.find(x => x.id === selectedCalculationBatchId);
                if (!b) return null;

                const batchOrders = orders.filter(o => o.batchId === selectedCalculationBatchId);

                return (
                  <div className="space-y-4 animate-rise">
                    {/* Batch Status Flow */}
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t('batchStatusFlow', { defaultValue: 'Batch Status Pipeline' })}
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                        {['DRAFT', 'IN_PRODUCTION', 'BAKED', 'COMPLETED'].map((st) => {
                          const isActive = b.status === st || (st === 'IN_PRODUCTION' && b.status === 'LOCKED');
                          let activeClass = '';
                          if (isActive) {
                            if (st === 'DRAFT') activeClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm font-black border border-slate-200/30';
                            if (st === 'IN_PRODUCTION') activeClass = 'bg-amber-500 text-white shadow-sm font-black';
                            if (st === 'BAKED') activeClass = 'bg-sky-500 text-white shadow-sm font-black';
                            if (st === 'COMPLETED') activeClass = 'bg-emerald-500 text-white shadow-sm font-black';
                          } else {
                            activeClass = 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 font-semibold';
                          }
                          return (
                            <button
                              key={st}
                              onClick={() => handleUpdateBatchStatus(b.id, st)}
                              className={`py-1.5 px-2 rounded-lg text-[10px] tracking-wide uppercase transition duration-150 active:scale-95 text-center ${activeClass}`}
                            >
                              {st.replace('_', ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Batch Linked Orders Table */}
                    <div className="glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800/50">
                              <th className="p-3">{t('orderInfo', { defaultValue: 'Order' })}</th>
                              <th className="p-3">{t('customer', { defaultValue: 'Customer' })}</th>
                              <th className="p-3">{t('items', { defaultValue: 'Items' })}</th>
                              <th className="p-3 text-right">{t('actions', { defaultValue: 'Actions' })}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                            {batchOrders.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-semibold">
                                  {t('noOrdersInBatch', { defaultValue: 'No orders linked to this batch.' })}
                                </td>
                              </tr>
                            ) : (
                              batchOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/10 transition">
                                  <td className="p-3 font-mono">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">#{o.id.slice(0, 8).toUpperCase()}</span>
                                    <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</span>
                                    {o.pickupSlot && (
                                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 block mt-1">
                                        🕒 {formatSlotLabel(o.pickupSlot)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <span className="font-bold text-slate-800 dark:text-slate-100 block">{o.user.name}</span>
                                    <span className="text-[9px] text-slate-500 block mt-0.5">{o.user.email}</span>
                                    {o.user.phone && (
                                      <span className="text-[8px] font-mono text-slate-400 block mt-0.5">📱 {o.user.phone}</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <div className="space-y-0.5">
                                      {o.items.map((item) => (
                                        <div key={item.id} className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                          {item.productVariant.product.name} ({item.productVariant.size}) x <strong className="text-bakery-600 dark:text-bakery-400">{item.quantity}</strong>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => {
                                          setRescheduleOrder(o);
                                          setRescheduleDate(o.pickupSlot);
                                          setShowRescheduleModal(true);
                                        }}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-bakery-500 transition"
                                        title={t('reschedule', { defaultValue: 'Reschedule Order' })}
                                      >
                                        <Settings size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleUnbatchOrder(o.id)}
                                        className="px-1.5 py-0.5 text-[9px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded border border-red-500/10 transition"
                                        title={t('unbatchOrder', { defaultValue: 'Unbatch Order' })}
                                      >
                                        Unbatch
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOrder(o.id)}
                                        className="px-1.5 py-0.5 text-[9px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 rounded border border-rose-500/10 transition"
                                        title={t('cancelOrder', { defaultValue: 'Cancel Order' })}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => setWhatsappOrder(o)}
                                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition flex items-center justify-center shadow shadow-emerald-500/10"
                                        title="WhatsApp Notify"
                                      >
                                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                          <path d="M17.472 14.382c-.022-.08-.124-.184-.245-.244-.12-.06-1.08-.534-1.246-.593-.166-.06-.286-.09-.406.09-.12.18-.46.593-.564.712-.1.12-.2.13-.36.07-.16-.06-.68-.25-1.29-.8-1.15-1.02-1.92-2.28-2.15-2.67-.22-.39-.02-.6.18-.79.18-.18.4-.41.56-.62.16-.2.22-.34.33-.56.11-.22.06-.41-.03-.56-.08-.15-.71-1.72-1.03-2.48-.3-.72-.6-1.11-.8-1.11H8.08c-.24 0-.45.09-.62.27-.18.18-.68.66-.68 1.62s.48 1.88.55 2c.07.08 1.52 2.33 3.69 3.3.52.23.93.37 1.25.48.52.16 1 .14 1.37.08.41-.06 1.24-.5 1.42-1 .18-.5.18-.93.13-1-.05-.07-.18-.11-.36-.17zm2.14-11.75C17.15 1.01 14.21 0 11.18 0 5.03 0 .03 5.03.03 11.18c0 1.97.51 3.9 1.5 5.6L0 24l7.4-1.94c1.64.9 3.47 1.37 5.34 1.37 6.15 0 11.15-5.03 11.15-11.18 0-2.98-1.16-5.79-3.28-7.82zM12.4 21.64c-1.68 0-3.32-.45-4.75-1.3 l-.34-.2-4.4 1.15 1.18-4.28-.22-.35c-.93-1.48-1.42-3.2-1.42-4.98 0-5.1 4.14-9.24 9.25-9.24 2.48 0 4.8.97 6.55 2.73 1.76 1.76 2.73 4.1 2.73 6.55-.02 5.1-4.16 9.23-9.27 9.23z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Automated Grocery Shopping List Sheet */}
          {(() => {
            const shortages = getBatchShortages();
            if (shortages.length === 0) return null;
            return (
              <div className="glass-panel rounded-3xl p-5 border border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-950/10 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛒</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {t('groceryListTitle', { defaultValue: 'Automated Grocery Shopping List' })}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t('groceryListDesc', { defaultValue: 'The following ingredients are short for this batch. Pick them up before baking!' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shortage checklist items */}
                <div className="space-y-2 bg-white/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-amber-500/10">
                  {shortages.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs py-1">
                      <input 
                        type="checkbox" 
                        id={`shortage-${idx}`}
                        className="w-3.5 h-3.5 rounded text-amber-500 border-slate-300 focus:ring-amber-500/20"
                      />
                      <label htmlFor={`shortage-${idx}`} className="font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between w-full cursor-pointer select-none">
                        <span>{s.name}</span>
                        <strong className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">{s.shortKg >= 1.0 ? `${(Math.ceil(s.shortKg * 1000) / 1000).toFixed(3)} kg` : `${Math.ceil(s.shortKg * 1000)} g`}</strong>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right 1 Column: Bakes breakdown list */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
          <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <ChefHat size={18} className="text-bakery-500" />
            {t('bakeListBreakdown')}
          </h3>

          {calculations && calculations.productBreakdown.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {calculations.productBreakdown.map((pb, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 animate-rise">
                  <div>
                    <span className="font-bold block text-slate-800 dark:text-slate-100 truncate w-36">{pb.productName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{pb.variantSize}</span>
                    {pb.floursBreakdown && Object.keys(pb.floursBreakdown).length > 0 && (
                      <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 space-y-0.5 font-medium">
                        {Object.entries(pb.floursBreakdown).map(([fName, fGrams]) => (
                          <div key={fName}>🌾 {fName}: {Math.ceil(fGrams).toLocaleString()} g</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="bg-bakery-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full block">Qty: {pb.quantity}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">{Math.ceil(pb.flour + pb.water + pb.starter + pb.salt + Object.values(pb.extraIngredients).reduce((a, b) => a + Number(b || 0), 0)).toLocaleString()} g</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">{t('noBakingBreakdowns')}</div>
          )}
        </div>
      </div>
      </>
    )}
    </div>
  );
}
