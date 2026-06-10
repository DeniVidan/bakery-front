import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  RotateCw, 
  Settings, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Grid, 
  List, 
  Calendar, 
  User, 
  Smartphone, 
  Mail, 
  Trash2, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Square,
  AlertCircle
} from 'lucide-react';

export default function OrdersTab({
  t,
  orders = [],
  batches = [],
  updatingOrderIds = [],
  selectedOrdersForBatch = [],
  setSelectedOrdersForBatch,
  batchActionType,
  setBatchActionType,
  bakeDate,
  setBakeDate,
  selectedExistingBatchId,
  setSelectedExistingBatchId,
  toggleOrderSelection,
  generateBatch,
  formatSlotLabel,
  setRescheduleOrder,
  setRescheduleDate,
  setShowRescheduleModal,
  handleUnbatchOrder,
  handleDeleteOrder,
  setWhatsappOrder,
  handleOrderStatus,
  showInternalOrderModal,
  setShowInternalOrderModal,
  starters = []
}) {
  // Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('bakery_orders_view_mode') || 'list';
  });
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState(null);
  
  // Track checked-off items locally per order card to help bakers operate
  const [cardCheckedItems, setCardCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bakery_orders_checked_items');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Save checked items local state
  useEffect(() => {
    localStorage.setItem('bakery_orders_checked_items', JSON.stringify(cardCheckedItems));
  }, [cardCheckedItems]);

  // Handle view mode persistence
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('bakery_orders_view_mode', mode);
  };

  // Toggle order expanded in List View
  const toggleRowExpansion = (orderId) => {
    setExpandedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  // Toggle individual item checklist on a card
  const toggleCardItemCheck = (orderId, itemId) => {
    setCardCheckedItems(prev => {
      const orderChecks = prev[orderId] || [];
      const updatedChecks = orderChecks.includes(itemId)
        ? orderChecks.filter(id => id !== itemId)
        : [...orderChecks, itemId];
      return {
        ...prev,
        [orderId]: updatedChecks
      };
    });
  };

  // Calculate live statistics
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = orders.filter(o => o.status === 'CONFIRMED').length;
  const inProductionCount = orders.filter(o => o.status === 'IN_PRODUCTION').length;
  const bakedCount = orders.filter(o => o.status === 'BAKED').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;
  const totalCount = orders.length;

  // Filter orders based on status tab and search query
  const filteredOrders = orders.filter((o) => {
    // 1. Filter by pipeline status
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

    // 2. Filter by Search Query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const orderIdShort = `#${o.id.slice(0, 8).toUpperCase()}`;
    const name = o.user?.name?.toLowerCase() || '';
    const email = o.user?.email?.toLowerCase() || '';
    const phone = o.user?.phone || '';
    const itemsStr = o.items?.map(it => it.productVariant?.product?.name?.toLowerCase() || '').join(' ') || '';
    const dateStr = new Date(o.createdAt).toLocaleDateString();

    return name.includes(query) || 
           email.includes(query) || 
           phone.includes(query) || 
           o.id.toLowerCase().includes(query) || 
           orderIdShort.toLowerCase().includes(query) ||
           itemsStr.includes(query) ||
           dateStr.includes(query);
  });

  // Get status color configuration for badges and steppers
  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/40',
          text: 'text-amber-800 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30',
          accent: 'bg-amber-500',
          label: t('statusPending', { defaultValue: 'Pending' }),
          stepIdx: 0
        };
      case 'CONFIRMED':
        return {
          bg: 'bg-blue-100 dark:bg-blue-950/40',
          text: 'text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30',
          accent: 'bg-blue-500',
          label: t('statusConfirmed', { defaultValue: 'Confirmed' }),
          stepIdx: 1
        };
      case 'IN_PRODUCTION':
        return {
          bg: 'bg-orange-100 dark:bg-orange-950/40',
          text: 'text-orange-800 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/30',
          accent: 'bg-orange-500',
          label: t('statusInProduction', { defaultValue: 'In Production' }),
          stepIdx: 2
        };
      case 'BAKED':
        return {
          bg: 'bg-purple-100 dark:bg-purple-950/40',
          text: 'text-purple-800 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30',
          accent: 'bg-purple-500',
          label: t('statusBaked', { defaultValue: 'Baked' }),
          stepIdx: 3
        };
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/40',
          text: 'text-emerald-800 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30',
          accent: 'bg-emerald-500',
          label: t('statusCompleted', { defaultValue: 'Completed' }),
          stepIdx: 4
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-850',
          text: 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
          accent: 'bg-slate-500',
          label: status,
          stepIdx: 0
        };
    }
  };

  const statuses = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'BAKED', 'COMPLETED'];

  return (
    <div className="space-y-6 no-print animate-fade-in">
      
      {/* SECTION 1: TOP KPI STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: 'PENDING', label: t('statusPending', { defaultValue: 'Pending' }), count: pendingCount, color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-600 dark:text-amber-400', icon: '🕒' },
          { id: 'CONFIRMED', label: t('statusConfirmed', { defaultValue: 'Confirmed' }), count: confirmedCount, color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400', icon: '👍' },
          { id: 'IN_PRODUCTION', label: t('statusInProduction', { defaultValue: 'In Production' }), count: inProductionCount, color: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-600 dark:text-orange-400', icon: '🥣' },
          { id: 'BAKED', label: t('statusBaked', { defaultValue: 'Baked' }), count: bakedCount, color: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-600 dark:text-purple-400', icon: '🥯' },
          { id: 'COMPLETED', label: t('statusCompleted', { defaultValue: 'Completed' }), count: completedCount, color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400', icon: '✅' },
        ].map((card) => (
          <button
            key={card.id}
            onClick={() => setStatusFilter(statusFilter === card.id ? 'ALL' : card.id)}
            className={`glass-card rounded-2xl p-4 border text-left flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-sm bg-gradient-to-br ${card.color} ${
              statusFilter === card.id ? 'ring-2 ring-offset-2 dark:ring-offset-slate-950 ring-slate-400 dark:ring-slate-500' : ''
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black uppercase tracking-wider opacity-80">{card.label}</span>
              <span className="text-sm">{card.icon}</span>
            </div>
            <span className="text-2xl font-black mt-2 font-mono">{card.count}</span>
          </button>
        ))}
      </div>

      {/* SECTION 2: SEARCH, FILTERS & VIEW MODE CONTROL PANEL */}
      <div className="glass-panel rounded-3xl p-4 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Horizontal Pipeline Segmented Slider */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/60 rounded-2xl overflow-x-auto w-full md:w-auto scrollbar-none">
          {[
            { id: 'ALL', label: t('all', { defaultValue: 'All' }), count: totalCount },
            { id: 'PENDING', label: t('statusPending', { defaultValue: 'Pending' }), count: pendingCount },
            { id: 'CONFIRMED', label: t('statusConfirmed', { defaultValue: 'Confirmed' }), count: confirmedCount },
            { id: 'IN_PRODUCTION', label: t('statusInProduction', { defaultValue: 'Production' }), count: inProductionCount },
            { id: 'BAKED', label: t('statusBaked', { defaultValue: 'Baked' }), count: bakedCount },
            { id: 'COMPLETED', label: t('statusCompleted', { defaultValue: 'Completed' }), count: completedCount }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setActiveStatusDropdownId(null);
              }}
              className={`py-2 px-4 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-bakery-500 to-bakery-600 text-white shadow shadow-bakery-500/20 scale-[1.03]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/30'
              }`}
            >
              {tab.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${
                statusFilter === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Add order & View Switcher Column */}
        <div className="flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap shrink-0">
          
          {/* Dynamic Search Box */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
            <input
              type="text"
              placeholder={t('searchPlaceholder', { defaultValue: 'Search orders...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] pl-8 pr-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-bakery-500 focus:ring-1 focus:ring-bakery-500/25 transition shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 w-4 h-4 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* List vs Card Toggle Buttons */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
            <button
              onClick={() => toggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-850 text-bakery-600 dark:text-bakery-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Table view"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => toggleViewMode('card')}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-850 text-bakery-600 dark:text-bakery-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Card view"
            >
              <Grid size={14} />
            </button>
          </div>

          {/* Create Order Trigger */}
          <button
            type="button"
            onClick={() => setShowInternalOrderModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-bakery-500 to-bakery-600 hover:from-bakery-600 hover:to-bakery-700 text-white font-black rounded-xl shadow-md shadow-bakery-500/10 flex items-center gap-1.5 text-xs transition-all duration-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          >
            <Plus size={14} />
            {t('addInternalOrderBtn')}
          </button>
        </div>
      </div>

      {/* SECTION 3: BATCH COMPILER FLOATING DOCK */}
      {selectedOrdersForBatch.length > 0 && (
        <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 bg-amber-500/5 shadow-xl shadow-amber-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-rise no-print relative overflow-hidden">
          {/* Visual abstract glow backer */}
          <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-32 h-32 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

          <div className="space-y-3 w-full max-w-xl z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              <div>
                <span className="font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 text-[11px] block">
                  {t('batchCompiler', { defaultValue: 'Production Batch Compiler' })}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Grouping <strong className="text-slate-700 dark:text-slate-300 font-bold">{selectedOrdersForBatch.length} selected orders</strong> into a scheduled production run.
                </p>
              </div>
            </div>
            
            {/* Pill Selector for Action Type */}
            <div className="flex gap-1.5 p-1 bg-slate-900/10 dark:bg-slate-950/80 rounded-xl max-w-xs border border-slate-200/20">
              <button
                type="button"
                onClick={() => setBatchActionType('new')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-black text-[10px] uppercase tracking-wide transition duration-150 ${
                  batchActionType === 'new'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                🆕 {t('createNewBatch', { defaultValue: 'New Run' })}
              </button>
              <button
                type="button"
                onClick={() => setBatchActionType('existing')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-black text-[10px] uppercase tracking-wide transition duration-150 ${
                  batchActionType === 'existing'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                📥 {t('addToExistingBatch', { defaultValue: 'Add to Draft' })}
              </button>
            </div>

            {batchActionType === 'new' ? (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  📅 {t('chooseBakeDate', { defaultValue: 'Select Bake Target Date' })}
                </label>
                <input
                  type="date"
                  value={bakeDate}
                  onChange={(e) => setBakeDate(e.target.value)}
                  className="text-[11px] p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 transition shadow-inner"
                />
              </div>
            ) : (
              <div className="space-y-1.5 animate-fade-in w-full">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  ⚡ {t('chooseExistingBatch', { defaultValue: 'Select Draft Production Run' })}
                </label>
                {batches.filter(b => b.status === 'DRAFT').length === 0 ? (
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold italic block mt-1">
                    ⚠️ {t('noDraftBatches', { defaultValue: 'No active Draft production runs available. Create a new batch first.' })}
                  </span>
                ) : (
                  <select
                    value={selectedExistingBatchId}
                    onChange={(e) => setSelectedExistingBatchId(e.target.value)}
                    className="text-[11px] p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition w-full sm:max-w-xs shadow-inner"
                  >
                    <option value="">-- {t('selectBatchOption', { defaultValue: 'Select a Draft Run' })} --</option>
                    {batches
                      .filter(b => b.status === 'DRAFT')
                      .map(b => {
                        const formattedDate = new Date(b.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        });
                        const ordersCount = b.orders?.length || 0;
                        return (
                          <option key={b.id} value={b.id}>
                            Run on {formattedDate} ({ordersCount} {ordersCount === 1 ? 'order' : 'orders'})
                          </option>
                        );
                      })}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center shrink-0 w-full md:w-auto justify-end z-10">
            <button
              onClick={() => setSelectedOrdersForBatch([])}
              className="py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={generateBatch}
              disabled={batchActionType === 'existing' && !selectedExistingBatchId}
              className={`px-5 py-3 text-white font-black rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-95 text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                batchActionType === 'existing' && !selectedExistingBatchId
                  ? 'bg-amber-500/40 cursor-not-allowed text-white/60'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
              }`}
            >
              <span>🚀</span>
              {batchActionType === 'existing' ? t('compileToExisting', { defaultValue: 'Add to Batch' }) : t('compileLockedBatch')}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: ORDERS DISPLAY CONTROLLER (LIST VS CARD VIEWS) */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 border border-slate-200 dark:border-slate-800 text-center shadow-md bg-white/30 dark:bg-slate-900/30">
          <div className="max-w-xs mx-auto flex flex-col items-center">
            <AlertCircle size={36} className="text-slate-400 mb-3 animate-bounce" />
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {t('noMatchingOrders', { defaultValue: 'No Matching Orders' })}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              No orders matched your active filters or search criteria. Try modifying your filters or typing a different search query.
            </p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        
        /* MODERN EXPANDABLE LIST VIEW (TABLE OVERHAUL) */
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-slate-200 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="p-4 w-12 text-center">
                    {/* Visual Checkbox Header */}
                    <span className="text-[10px]">⚖️</span>
                  </th>
                  <th className="p-4">{t('orderIdDate', { defaultValue: 'Order & Date' })}</th>
                  <th className="p-4">{t('customer', { defaultValue: 'Customer' })}</th>
                  <th className="p-4">{t('itemsBreakdown', { defaultValue: 'Products Baking' })}</th>
                  <th className="p-4 text-center">{t('ovenStatus', { defaultValue: 'Pipeline Stage' })}</th>
                  <th className="p-4 text-right">{t('actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredOrders.map((o) => {
                  const isSelected = selectedOrdersForBatch.includes(o.id);
                  const isExpanded = expandedOrderIds.includes(o.id);
                  const statusConfig = getStatusConfig(o.status);
                  const isUpdating = updatingOrderIds.includes(o.id);
                  
                  // Simple initials extractor for customer avatar
                  const initials = o.user?.name
                    ? o.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'G';

                  return (
                    <React.Fragment key={o.id}>
                      <tr 
                        className={`transition-all hover:bg-slate-100/50 dark:hover:bg-slate-900/40 ${
                          isSelected ? 'bg-amber-500/5 dark:bg-amber-500/3' : ''
                        } ${isUpdating ? 'animate-pulse bg-amber-500/5 pointer-events-none' : ''}`}
                      >
                        {/* 1. Batch Selection Checkbox Column */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={o.batchId !== null}
                            onChange={() => toggleOrderSelection(o.id)}
                            className={`w-4.5 h-4.5 rounded-lg text-bakery-500 focus:ring-0 focus:ring-offset-0 border-slate-300 dark:border-slate-800 cursor-pointer ${
                              o.batchId !== null ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          />
                        </td>

                        {/* 2. Order short-ID and timestamp */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                              #{o.id.slice(0, 8).toUpperCase()}
                            </span>
                            <button
                              onClick={() => toggleRowExpansion(o.id)}
                              className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                              title={isExpanded ? 'Hide Details' : 'Expand Details'}
                            >
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[9px] text-slate-400 font-semibold block">{new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {o.pickupSlot && (
                              <div className="flex items-center gap-1 self-start">
                                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                                  🕒 {formatSlotLabel(o.pickupSlot)}
                                </span>
                                <button
                                  onClick={() => {
                                    setRescheduleOrder(o);
                                    setRescheduleDate(o.pickupSlot);
                                    setShowRescheduleModal(true);
                                  }}
                                  className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-bakery-500 transition"
                                  title={t('changeBakingDay', { defaultValue: 'Change Baking Day' })}
                                >
                                  <Settings size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Customer Info initials badge + contact link shortcuts */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bakery-400 to-bakery-600 text-white font-extrabold flex items-center justify-center text-[10px] shadow-sm shrink-0 font-mono">
                              {initials}
                            </div>
                            
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-800 dark:text-slate-100 block truncate max-w-[130px]">
                                {o.user.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-medium">
                                <span className="truncate max-w-[100px]">{o.user.email}</span>
                                {o.user.phone && (
                                  <button
                                    onClick={() => setWhatsappOrder(o)}
                                    className="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 transition ml-0.5 shrink-0"
                                    title="Contact via WhatsApp"
                                  >
                                    <ExternalLink size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Products items horizontal badges */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {o.items.map((item) => (
                              <div 
                                key={item.id} 
                                className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 px-2 py-1 rounded-xl flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-300 shadow-sm"
                              >
                                <span className="font-semibold">{item.productVariant.product.name} ({item.productVariant.size})</span>
                                <span className="bg-bakery-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono">
                                  {item.quantity}
                                </span>
                                {item.couponApplied > 0 && (
                                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded-md animate-pulse">
                                    🎁
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 5. Custom Status badge with absolute edit dropdown */}
                        <td className="p-4 text-center">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => {
                                if (isUpdating) return;
                                setActiveStatusDropdownId(activeStatusDropdownId === o.id ? null : o.id);
                              }}
                              disabled={isUpdating}
                              className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition hover:scale-[1.02] cursor-pointer ${statusConfig.bg} ${statusConfig.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.accent} ${o.status === 'IN_PRODUCTION' ? 'animate-ping' : ''}`} />
                              <span>{statusConfig.label}</span>
                              <ChevronDown size={10} className="opacity-60" />
                            </button>

                            {/* Transparent overlay backdrop to dismiss dropdown cleanly */}
                            {activeStatusDropdownId === o.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-30 cursor-default" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveStatusDropdownId(null);
                                  }}
                                />
                                {/* Dropdown Menu content */}
                                <div className="absolute right-0 mt-1.5 w-40 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl z-40 p-1 animate-rise overflow-hidden">
                                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
                                    Change Pipeline Stage
                                  </div>
                                  {statuses.map((st) => {
                                    const optConfig = getStatusConfig(st);
                                    const isActive = o.status === st;
                                    return (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOrderStatus(o.id, st);
                                          setActiveStatusDropdownId(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 text-[10px] font-extrabold rounded-xl transition flex items-center justify-between ${
                                          isActive 
                                            ? 'bg-slate-100 dark:bg-slate-800 text-bakery-600 dark:text-bakery-400' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span className={`w-1.5 h-1.5 rounded-full ${optConfig.accent}`} />
                                          <span>{optConfig.label}</span>
                                        </div>
                                        {isActive && <Check size={10} className="text-bakery-500" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 6. Batch metadata and hover grouped actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {o.batchId && (
                              <span className="text-[9px] uppercase tracking-wider font-extrabold bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 border border-blue-200/30 px-2 py-0.5 rounded-lg mr-1 shadow-sm">
                                🔗 Run #{batches.find(b => b.id === o.batchId)?.id.slice(0, 4).toUpperCase() || 'Gen'}
                              </span>
                            )}
                            
                            <div className="flex items-center gap-1">
                              {o.batchId ? (
                                <button
                                  onClick={() => handleUnbatchOrder(o.id)}
                                  className="p-1.5 text-red-600 hover:text-white dark:text-red-400 hover:bg-red-500 dark:hover:bg-red-600 rounded-xl border border-red-200/40 dark:border-red-900/30 transition-all duration-150 shadow-sm"
                                  title={t('unbatchOrder', { defaultValue: 'Remove from production run' })}
                                >
                                  <X size={12} />
                                </button>
                              ) : null}
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="p-1.5 text-rose-600 hover:text-white dark:text-rose-400 hover:bg-rose-500 dark:hover:bg-rose-600 rounded-xl border border-rose-200/40 dark:border-rose-900/30 transition-all duration-150 shadow-sm"
                                title={t('deleteOrder', { defaultValue: 'Permanently delete order' })}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
                          <td colSpan="6" className="p-4 text-[11px] animate-slide-down">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-medium text-slate-600 dark:text-slate-400">
                              
                              <div className="space-y-1 bg-white dark:bg-slate-900/40 border border-slate-200/40 p-3 rounded-2xl">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Customer Contact</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1 text-xs mt-1">
                                  <User size={12} className="text-slate-400" /> {o.user.name}
                                </p>
                                <p className="flex items-center gap-1 text-slate-500 mt-1">
                                  <Mail size={12} className="text-slate-450" /> {o.user.email}
                                </p>
                                {o.user.phone && (
                                  <p className="flex items-center gap-1 text-slate-500 mt-1 font-mono">
                                    <Smartphone size={12} className="text-slate-450" /> {o.user.phone}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1.5 bg-white dark:bg-slate-900/40 border border-slate-200/40 p-3 rounded-2xl">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Baking Order Metadata</span>
                                <p className="flex items-center gap-1 text-slate-500 mt-1">
                                  <Calendar size={12} className="text-slate-450" /> Created: {new Date(o.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Batch Status:</span>
                                  {o.batchId ? (
                                    <span className="text-[9px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200/40">
                                      Included in Run #{batches.find(b => b.id === o.batchId)?.id.slice(0, 8).toUpperCase()}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200/40">
                                      Unscheduled Unbatched Order
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1.5 bg-white dark:bg-slate-900/40 border border-slate-200/40 p-3 rounded-2xl">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Operational Actions</span>
                                <div className="flex gap-2 flex-wrap mt-2">
                                  {o.user.phone && (
                                    <button
                                      onClick={() => setWhatsappOrder(o)}
                                      className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold flex items-center gap-1 text-[10px] shadow transition hover:scale-[1.02] active:scale-95"
                                    >
                                      💬 Notify Customer
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setRescheduleOrder(o);
                                      setRescheduleDate(o.pickupSlot);
                                      setShowRescheduleModal(true);
                                    }}
                                    className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-extrabold flex items-center gap-1 text-[10px] text-slate-700 dark:text-slate-300 transition hover:scale-[1.02] active:scale-95"
                                  >
                                    🕒 Reschedule Baking Day
                                  </button>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* HIGH-FIDELITY GRID / CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((o) => {
            const statusConfig = getStatusConfig(o.status);
            const isUpdating = updatingOrderIds.includes(o.id);
            const isSelected = selectedOrdersForBatch.includes(o.id);
            const initials = o.user?.name
              ? o.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : 'G';

            // Get lists of checked off item IDs for this card
            const checkedItemIds = cardCheckedItems[o.id] || [];

            return (
              <div 
                key={o.id}
                className={`glass-panel rounded-3xl border p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between h-full relative ${
                  isSelected ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-slate-200 dark:border-slate-800/80'
                } ${isUpdating ? 'animate-pulse bg-amber-500/5 pointer-events-none' : ''}`}
              >
                {/* Visual Glow Header Edge */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl ${statusConfig.accent}`} />

                <div className="space-y-4">
                  
                  {/* Card Header: Order Short ID + Batch Checkbox */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      {o.pickupSlot && (
                        <span className="text-[8px] uppercase tracking-wider font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-400 py-0.5 px-2 rounded-md border border-amber-500/20">
                          🕒 {formatSlotLabel(o.pickupSlot).split(' - ')[0] || formatSlotLabel(o.pickupSlot)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {o.batchId && (
                        <span className="text-[8px] uppercase tracking-wider font-black bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 py-0.5 px-2 rounded-md">
                          Batched
                        </span>
                      )}
                      
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={o.batchId !== null}
                        onChange={() => toggleOrderSelection(o.id)}
                        className={`w-4 h-4 rounded text-bakery-500 border-slate-300 dark:border-slate-800 cursor-pointer ${
                          o.batchId !== null ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Select for production run batch"
                      />
                    </div>
                  </div>

                  {/* Customer Block info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-8.5 rounded-full bg-gradient-to-br from-bakery-400 to-bakery-600 text-white font-extrabold flex items-center justify-center text-[11px] shadow-sm font-mono shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs block truncate leading-tight">
                        {o.user.name}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate mt-0.5">{o.user.email}</span>
                    </div>
                  </div>

                  {/* Collapsible Operational Baking Checklist items */}
                  <div className="space-y-1.5 py-1">
                    <span className="text-[8px] uppercase font-black tracking-widest text-slate-400 block mb-1">Items Checklist</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {o.items.map((item) => {
                        const isChecked = checkedItemIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleCardItemCheck(o.id, item.id)}
                            className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all duration-150 ${
                              isChecked 
                                ? 'bg-slate-100/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-850 opacity-65 line-through' 
                                : 'bg-white dark:bg-slate-950/30 border-slate-150 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="shrink-0 text-slate-400 hover:text-bakery-500">
                                {isChecked 
                                  ? <CheckSquare size={13} className="text-bakery-500" /> 
                                  : <Square size={13} />
                                }
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                {item.productVariant.product.name} ({item.productVariant.size})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.couponApplied > 0 && <span className="text-[8px]">🎁</span>}
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                                isChecked ? 'bg-slate-200 text-slate-500' : 'bg-bakery-100 dark:bg-bakery-950/60 text-bakery-600 dark:text-bakery-400'
                              }`}>
                                x{item.quantity}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* INTERACTIVE PIPELINE PROGRESS STEPPER TIMELINE */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-150 dark:border-slate-850">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <span>Pipeline Progress</span>
                      <span className="font-extrabold text-slate-600 dark:text-slate-300">{statusConfig.label}</span>
                    </div>

                    {/* Stepper Timeline Grid of Nodes */}
                    <div className="relative flex items-center justify-between px-1 mt-1">
                      {/* Connecting Background Stepper Line */}
                      <div className="absolute left-3 right-3 h-0.5 bg-slate-200 dark:bg-slate-800 top-1/2 -translate-y-1/2 z-0" />
                      
                      {/* Colored active connecting progress line */}
                      <div 
                        className={`absolute left-3 h-0.5 transition-all duration-300 top-1/2 -translate-y-1/2 z-0 ${statusConfig.accent}`} 
                        style={{ 
                          width: `${(statusConfig.stepIdx / (statuses.length - 1)) * 90}%`
                        }}
                      />

                      {statuses.map((st, sIdx) => {
                        const isCurrent = o.status === st;
                        const isPast = sIdx < statusConfig.stepIdx;
                        const labelMap = { PENDING: 'Pend', CONFIRMED: 'Conf', IN_PRODUCTION: 'Prod', BAKED: 'Bake', COMPLETED: 'Done' };
                        
                        return (
                          <button
                            key={st}
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleOrderStatus(o.id, st)}
                            className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center text-[7px] font-black uppercase transition-all duration-300 shrink-0 z-10 cursor-pointer ${
                              isCurrent 
                                ? `${statusConfig.accent} border-white text-white scale-110 shadow ring-4 ring-offset-1 dark:ring-offset-slate-900 ${statusConfig.text.split(' ')[0]} animate-pulse`
                                : isPast
                                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100'
                                  : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:text-slate-600'
                            }`}
                            title={`Mark as ${st.replace('_', ' ')}`}
                          >
                            {isPast ? '✓' : labelMap[st][0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Footer grouped buttons */}
                <div className="flex items-center gap-1.5 pt-4 mt-4 border-t border-slate-150 dark:border-slate-850 justify-between">
                  <div className="flex gap-1">
                    {o.user.phone && (
                      <button
                        onClick={() => setWhatsappOrder(o)}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow transition duration-200 hover:scale-[1.05] active:scale-95"
                        title="Contact Customer via WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.022-.08-.124-.184-.245-.244-.12-.06-1.08-.534-1.246-.593-.166-.06-.286-.09-.406.09-.12.18-.46.593-.564.712-.1.12-.2.13-.36.07-.16-.06-.68-.25-1.29-.8-1.15-1.02-1.92-2.28-2.15-2.67-.22-.39-.02-.6.18-.79.18-.18.4-.41.56-.62.16-.2.22-.34.33-.56.11-.22.06-.41-.03-.56-.08-.15-.71-1.72-1.03-2.48-.3-.72-.6-1.11-.8-1.11H8.08c-.24 0-.45.09-.62.27-.18.18-.68.66-.68 1.62s.48 1.88.55 2c.07.08 1.52 2.33 3.69 3.3.52.23.93.37 1.25.48.52.16 1 .14 1.37.08.41-.06 1.24-.5 1.42-1 .18-.5.18-.93.13-1-.05-.07-.18-.11-.36-.17zm2.14-11.75C17.15 1.01 14.21 0 11.18 0 5.03 0 .03 5.03.03 11.18c0 1.97.51 3.9 1.5 5.6L0 24l7.4-1.94c1.64.9 3.47 1.37 5.34 1.37 6.15 0 11.15-5.03 11.15-11.18 0-2.98-1.16-5.79-3.28-7.82zM12.4 21.64c-1.68 0-3.32-.45-4.75-1.3 l-.34-.2-4.4 1.15 1.18-4.28-.22-.35c-.93-1.48-1.42-3.2-1.42-4.98 0-5.1 4.14-9.24 9.25-9.24 2.48 0 4.8.97 6.55 2.73 1.76 1.76 2.73 4.1 2.73 6.55-.02 5.1-4.16 9.23-9.27 9.23z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setRescheduleOrder(o);
                        setRescheduleDate(o.pickupSlot);
                        setShowRescheduleModal(true);
                      }}
                      className="p-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition duration-200 hover:scale-[1.05] active:scale-95"
                      title={t('changeBakingDay', { defaultValue: 'Change Baking Day' })}
                    >
                      <Settings size={13} />
                    </button>
                  </div>

                  <div className="flex gap-1">
                    {o.batchId ? (
                      <button
                        onClick={() => handleUnbatchOrder(o.id)}
                        className="py-1.5 px-3 text-[10px] font-extrabold text-red-600 hover:text-white hover:bg-red-500 rounded-xl border border-red-200/40 dark:border-red-900/30 transition-all active:scale-95 flex items-center gap-0.5"
                        title={t('unbatchOrder', { defaultValue: 'Remove from production run' })}
                      >
                        ✕ Unbatch
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleDeleteOrder(o.id)}
                      className="py-1.5 px-3 text-[10px] font-extrabold text-rose-600 hover:text-white hover:bg-rose-500 rounded-xl border border-rose-200/40 dark:border-rose-900/30 transition-all active:scale-95 flex items-center gap-0.5"
                      title={t('deleteOrder', { defaultValue: 'Permanently delete order' })}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
