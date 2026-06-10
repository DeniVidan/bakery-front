import React from 'react';
import { 
  Clock, 
  Calendar, 
  Pencil, 
  Trash2, 
  Plus, 
  ChevronDown 
} from 'lucide-react';

export default function SettingsTab({
  t,
  scheduleMode,
  saveScheduleModeSetting,
  bakingDays,
  saveSettings,
  localLeadTimeHours,
  setLocalLeadTimeHours,
  leadTimeHours,
  saveLeadTimeHours,
  localBakeTimeOfDay,
  setLocalBakeTimeOfDay,
  bakeTimeOfDay,
  saveBakeTimeOfDay,
  localStarterWasteFactor,
  setLocalStarterWasteFactor,
  starterWasteFactor,
  saveStarterWasteFactor,
  localDoughWasteFactor,
  setLocalDoughWasteFactor,
  doughWasteFactor,
  saveDoughWasteFactor,
  showFallbackDefaults,
  setShowFallbackDefaults,
  bakingSeasons,
  showRosterForm,
  setShowRosterForm,
  editingRosterId,
  setEditingRosterId,
  rosterName,
  setRosterName,
  rosterStartDate,
  setRosterStartDate,
  rosterEndDate,
  setRosterEndDate,
  rosterDays,
  setRosterDays,
  rosterTime,
  setRosterTime,
  rosterCutoff,
  setRosterCutoff,
  handleCreateRoster,
  handleDeleteRoster,
  enabledFlours,
  saveEnabledFlours,
  starters,
  saveStartersSetting,
  editingStarterId,
  setEditingStarterId,
  tempStarterName,
  setTempStarterName,
  tempSeedParts,
  setTempSeedParts,
  tempFlourParts,
  setTempFlourParts,
  tempWaterParts,
  setTempWaterParts,
  tempStarterFlours,
  setTempStarterFlours,
  tempFeedingMethod,
  setTempFeedingMethod,
  calculateBacktrackDeadline,
  pantryStock,
  tempPantryStock,
  setTempPantryStock,
  editingInventory,
  setEditingInventory,
  handleEditStockToggle,
  handleSaveStock,
  ingredientCosts,
  tempIngredientCosts,
  setTempIngredientCosts,
  editingCosts,
  setEditingCosts,
  handleEditCostsToggle,
  handleSaveCosts,
  getUniqueIngredients
}) {
  return (
    <div className="space-y-6 no-print animate-rise">
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-lg max-w-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="space-y-6">
          
          {/* Header with icon and Mode segmented toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  {t('scheduleComplexityTitle', { defaultValue: 'Baking Schedule Mode' })}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {scheduleMode === 'easy'
                    ? t('easyModeDesc', { defaultValue: 'Easy Mode simplifies scheduling: date overrides are disabled, and only your standard weekly baking days are in effect.' })
                    : t('advancedModeDesc', { defaultValue: 'Advanced Mode enables the Seasons Planner: date-bounded seasons and special rosters will override weekly baking days.' })}
                </p>
              </div>
            </div>
            <div className="flex bg-slate-200/60 dark:bg-slate-950/60 p-0.5 rounded-xl border border-slate-300/40 dark:border-slate-800/40 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => saveScheduleModeSetting('easy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-250 ${
                  scheduleMode === 'easy'
                    ? 'bg-white dark:bg-slate-900 text-bakery-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('easyMode', { defaultValue: 'Easy Mode' })}
              </button>
              <button
                type="button"
                onClick={() => saveScheduleModeSetting('advanced')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-250 ${
                  scheduleMode === 'advanced'
                    ? 'bg-white dark:bg-slate-900 text-bakery-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('advancedMode', { defaultValue: 'Advanced Mode' })}
              </button>
            </div>
          </div>

          {/* Mode Content */}
          {scheduleMode === 'easy' ? (
            /* Easy Mode Content */
            <div className="space-y-6 animate-rise">
              
              {/* Weekly Baking Days */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📅</span> {t('bakingDaysConfig', { defaultValue: 'Weekly Baking Days' })}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t('bakingDaysDesc', { defaultValue: 'Select which days of the week you bake. Customers will see upcoming dates for these days during checkout.' })}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isChecked = bakingDays.includes(day);
                    return (
                      <label
                        key={day}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-bakery-500/10 border-bakery-500 text-bakery-600 dark:text-bakery-400 font-extrabold shadow shadow-bakery-500/5'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-900/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            let newDays;
                            if (isChecked) {
                              newDays = bakingDays.filter((d) => d !== day);
                            } else {
                              newDays = [...bakingDays, day];
                            }
                            if (newDays.length === 0) return;
                            saveSettings(newDays);
                          }}
                          className="w-4 h-4 rounded text-bakery-500 border-slate-300 focus:ring-bakery-500/20"
                        />
                        <span className="text-xs capitalize">{t(day.toLowerCase())}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Start Time & Lead Cut-off */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-150 dark:border-slate-800/40 pt-5">
                {/* Lead Time Cut-off */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {t('leadTimeHoursInputLabel', { defaultValue: 'Lead Time Cut-off (Hours)' })}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={localLeadTimeHours}
                      onChange={(e) => setLocalLeadTimeHours(e.target.value)}
                      onBlur={() => {
                        const val = parseInt(localLeadTimeHours, 10);
                        if (!isNaN(val) && val >= 1) {
                          saveLeadTimeHours(val);
                        } else {
                          setLocalLeadTimeHours(String(leadTimeHours));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      className="p-2.5 w-24 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                    />
                    <span className="text-xs text-slate-500 font-semibold">
                      hours ({Math.floor(leadTimeHours / 24)}d {leadTimeHours % 24}h)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                    {t('leadTimeHoursDesc', { defaultValue: 'Set how many hours before the bake day a customer can place an order. For example, 60 hours is 2.5 days.' })}
                  </p>
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {t('bakeStartTimeLabel', { defaultValue: 'Baking Day Start Time' })}
                  </label>
                  <input
                    type="time"
                    value={localBakeTimeOfDay}
                    onChange={(e) => setLocalBakeTimeOfDay(e.target.value)}
                    onBlur={() => {
                      if (localBakeTimeOfDay) {
                        saveBakeTimeOfDay(localBakeTimeOfDay);
                      } else {
                        setLocalBakeTimeOfDay(bakeTimeOfDay);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                    className="p-2.5 w-36 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                    {t('bakeStartTimeDesc', { defaultValue: 'Specify the exact time of day when your baking day officially begins (e.g., 14:00 or 06:00).' })}
                  </p>
                </div>

                {/* Sourdough Starter Scraping Loss */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {t('starterWasteFactorLabel', { defaultValue: 'Sourdough Starter Scraping Loss (%)' })}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={localStarterWasteFactor}
                      onChange={(e) => setLocalStarterWasteFactor(e.target.value)}
                      onBlur={() => {
                        const val = parseFloat(localStarterWasteFactor);
                        if (!isNaN(val) && val >= 0) {
                          saveStarterWasteFactor(val);
                        } else {
                          setLocalStarterWasteFactor(String(starterWasteFactor));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      className="p-2.5 w-24 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                    />
                    <span className="text-xs text-slate-500 font-semibold">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                    {t('starterWasteFactorDesc', { defaultValue: 'Extra starter percentage added Tonight so you feed enough tonight to cover bowl/spatula scraping losses.' })}
                  </p>
                </div>

                {/* Dough Mixing Scraping Loss */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {t('doughWasteFactorLabel', { defaultValue: 'Dough Mixing Scraping Loss (%)' })}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={localDoughWasteFactor}
                      onChange={(e) => setLocalDoughWasteFactor(e.target.value)}
                      onBlur={() => {
                        const val = parseFloat(localDoughWasteFactor);
                        if (!isNaN(val) && val >= 0) {
                          saveDoughWasteFactor(val);
                        } else {
                          setLocalDoughWasteFactor(String(doughWasteFactor));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      className="p-2.5 w-24 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                    />
                    <span className="text-xs text-slate-500 font-semibold">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                    {t('doughWasteFactorDesc', { defaultValue: 'Scales raw recipe weights up to compensate for scraping, spatula, and hand stickiness during bulk mixing.' })}
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 italic border-t border-slate-150 dark:border-slate-800/40 pt-4">
                ℹ️ {t('settingsAutoSaved', { defaultValue: 'Changes are automatically saved and synced instantly across the application.' })}
              </div>

            </div>
          ) : (
            /* Advanced Mode Content */
            <div className="space-y-6 animate-rise">
              
              {/* Collapsible Defaults */}
              <div className="p-3.5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-850/60">
                <button
                  type="button"
                  onClick={() => setShowFallbackDefaults(!showFallbackDefaults)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider select-none text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <span>📋</span> {t('fallbackDefaultsTitle', { defaultValue: 'Fallback Default Weekly Schedule' })}
                  </span>
                  <ChevronDown size={14} className={`transform transition-transform duration-200 ${showFallbackDefaults ? 'rotate-180' : ''}`} />
                </button>

                {showFallbackDefaults && (
                  <div className="mt-4 pt-4 border-t border-slate-250/50 dark:border-slate-800/40 space-y-5 animate-rise">
                    
                    {/* Default Baking Days */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t('defaultBakingDaysLabel', { defaultValue: 'Default Weekly Baking Days' })}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const isChecked = bakingDays.includes(day);
                          return (
                            <label
                              key={day}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                                isChecked
                                  ? 'bg-bakery-500/10 border-bakery-500 text-bakery-600 dark:text-bakery-400 font-extrabold shadow-sm'
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-450 font-medium hover:bg-slate-50 dark:hover:bg-slate-900/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  let newDays;
                                  if (isChecked) {
                                    newDays = bakingDays.filter((d) => d !== day);
                                  } else {
                                    newDays = [...bakingDays, day];
                                  }
                                  if (newDays.length === 0) return;
                                  saveSettings(newDays);
                                }}
                                className="w-3.5 h-3.5 rounded text-bakery-500 border-slate-300 focus:ring-bakery-500/20"
                              />
                              <span className="text-[11px] capitalize">{t(day.toLowerCase())}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Default Start Time & Lead Cut-off */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lead Cut-off */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {t('leadTimeHoursInputLabel')}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="168"
                            value={localLeadTimeHours}
                            onChange={(e) => setLocalLeadTimeHours(e.target.value)}
                            onBlur={() => {
                              const val = parseInt(localLeadTimeHours, 10);
                              if (!isNaN(val) && val >= 1) {
                                saveLeadTimeHours(val);
                              } else {
                                setLocalLeadTimeHours(String(leadTimeHours));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            className="p-2 w-20 text-xs rounded-lg border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100"
                          />
                          <span className="text-[11px] text-slate-500 font-semibold">
                            hours ({Math.floor(leadTimeHours / 24)}d {leadTimeHours % 24}h)
                          </span>
                        </div>
                      </div>

                      {/* Start Time */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {t('bakeStartTimeLabel')}
                        </label>
                        <input
                          type="time"
                          value={localBakeTimeOfDay}
                          onChange={(e) => setLocalBakeTimeOfDay(e.target.value)}
                          onBlur={() => {
                            if (localBakeTimeOfDay) {
                              saveBakeTimeOfDay(localBakeTimeOfDay);
                            } else {
                              setLocalBakeTimeOfDay(bakeTimeOfDay);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                          }}
                          className="p-2 w-32 text-xs rounded-lg border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      {/* Sourdough Starter Scraping Loss */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {t('starterWasteFactorLabel', { defaultValue: 'Sourdough Starter Scraping Loss (%)' })}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="1"
                            value={localStarterWasteFactor}
                            onChange={(e) => setLocalStarterWasteFactor(e.target.value)}
                            onBlur={() => {
                              const val = parseFloat(localStarterWasteFactor);
                              if (!isNaN(val) && val >= 0) {
                                saveStarterWasteFactor(val);
                              } else {
                                setLocalStarterWasteFactor(String(starterWasteFactor));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            className="p-2 w-20 text-xs rounded-lg border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                          />
                          <span className="text-[11px] text-slate-500 font-semibold">
                            %
                          </span>
                        </div>
                      </div>

                      {/* Dough Mixing Scraping Loss */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {t('doughWasteFactorLabel', { defaultValue: 'Dough Mixing Scraping Loss (%)' })}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="1"
                            value={localDoughWasteFactor}
                            onChange={(e) => setLocalDoughWasteFactor(e.target.value)}
                            onBlur={() => {
                              const val = parseFloat(localDoughWasteFactor);
                              if (!isNaN(val) && val >= 0) {
                                saveDoughWasteFactor(val);
                              } else {
                                setLocalDoughWasteFactor(String(doughWasteFactor));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            className="p-2 w-20 text-xs rounded-lg border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                          />
                          <span className="text-[11px] text-slate-500 font-semibold">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Seasons Planner Section */}
              <div className="border-t border-slate-200 dark:border-slate-800/60 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🗓️</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {t('bakingSeasonsPlannerTitle', { defaultValue: 'Baking Seasons & Shift Roster Planner' })}
                    </h3>
                  </div>
                  {!showRosterForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setRosterName('');
                        setRosterStartDate('');
                        setRosterEndDate('');
                        setRosterDays([]);
                        setRosterTime('06:00');
                        setRosterCutoff(leadTimeHours);
                        setEditingRosterId(null);
                        setShowRosterForm(true);
                      }}
                      className="flex items-center gap-1 text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-bakery-500 hover:bg-bakery-600 text-white shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('addSeasonButton', { defaultValue: 'Add Season' })}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('bakingSeasonsPlannerDesc', { defaultValue: 'Define date-bounded seasons/rosters to accommodate work shifts or holiday schedules. Dates falling inside an active season will override your standard weekly baking days.' })}
                </p>

                {/* Create/Edit Season Form */}
                {showRosterForm && (
                  <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 space-y-4 animate-rise">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {editingRosterId ? t('editSeasonTitle', { defaultValue: 'Edit Baking Season Override' }) : t('createSeasonTitle', { defaultValue: 'Create Baking Season Override' })}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t('seasonNameLabel', { defaultValue: 'Season / Roster Name' })}
                        </label>
                        <input
                          type="text"
                          placeholder={t('seasonNamePlaceholder', { defaultValue: 'e.g. Summer Morning Shift, Holidays' })}
                          value={rosterName}
                          onChange={(e) => setRosterName(e.target.value)}
                          className="w-full p-2.5 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                        />
                      </div>

                      {/* Start Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t('startDateLabel', { defaultValue: 'Start Date' })}
                        </label>
                        <input
                          type="date"
                          value={rosterStartDate}
                          onChange={(e) => setRosterStartDate(e.target.value)}
                          className="w-full p-2.5 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                        />
                      </div>

                      {/* End Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t('endDateLabel', { defaultValue: 'End Date' })}
                        </label>
                        <input
                          type="date"
                          value={rosterEndDate}
                          onChange={(e) => setRosterEndDate(e.target.value)}
                          className="w-full p-2.5 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                        />
                      </div>

                      {/* Bake Start Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          {t('seasonBakeTimeLabel', { defaultValue: 'Baking Day Start Time for this Season' })}
                        </label>
                        <input
                          type="time"
                          value={rosterTime}
                          onChange={(e) => setRosterTime(e.target.value)}
                          className="p-2.5 w-full text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                        />
                      </div>

                      {/* Order Cutoff hours */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          {t('seasonCutoffLabel', { defaultValue: 'Order Cut-off for this Season (Hours)' })}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="168"
                            value={rosterCutoff}
                            onChange={(e) => setRosterCutoff(e.target.value)}
                            className="p-2.5 w-24 text-xs rounded-xl border dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20 focus:border-bakery-500"
                          />
                          <span className="text-xs text-slate-500 font-semibold">hours</span>
                        </div>
                      </div>

                      {/* Days selection */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          {t('seasonBakingDaysLabel', { defaultValue: 'Active Overriding Baking Days' })}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const isSelected = rosterDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setRosterDays(rosterDays.filter(d => d !== day));
                                  } else {
                                    setRosterDays([...rosterDays, day]);
                                  }
                                }}
                                className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center select-none ${
                                  isSelected
                                    ? 'bg-bakery-500/15 border-bakery-500 text-bakery-600 dark:text-bakery-400 font-extrabold shadow shadow-bakery-500/5'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                                }`}
                              >
                                {t(day.toLowerCase(), { defaultValue: day })}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRosterName('');
                          setRosterStartDate('');
                          setRosterEndDate('');
                          setRosterDays([]);
                          setRosterTime('06:00');
                          setRosterCutoff(leadTimeHours);
                          setEditingRosterId(null);
                          setShowRosterForm(false);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all"
                      >
                        {t('cancel', { defaultValue: 'Cancel' })}
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateRoster}
                        className="px-4 py-2 rounded-xl bg-bakery-500 hover:bg-bakery-600 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        {t('saveRosterButton', { defaultValue: 'Save Roster' })}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rosters List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('activeSeasonsTitle', { defaultValue: 'Configured Seasons' })}
                  </h4>

                  {bakingSeasons.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/60 text-center bg-slate-50/20 dark:bg-slate-950/10">
                      <span className="text-2xl block mb-2">🌴</span>
                      <p className="text-xs text-slate-400 font-medium">
                        {t('noSeasonsPlaceholder', { defaultValue: 'No active seasonal overrides configured. Your standard weekly baking days are in effect for all weeks.' })}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {bakingSeasons.map((season) => (
                        <div
                          key={season.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/30 flex items-start justify-between gap-4 shadow-sm animate-rise"
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                                {season.name}
                              </h5>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bakery-500/10 text-bakery-600 dark:text-bakery-400">
                                <Clock className="w-3 h-3" />
                                {season.bakeTime || '06:00'}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <span>⚖️</span>
                                <span>{season.cutoffHours !== undefined && season.cutoffHours !== null ? `${season.cutoffHours}h cutoff` : `${leadTimeHours}h cutoff`}</span>
                              </span>
                            </div>

                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {season.startDate} &mdash; {season.endDate}
                            </p>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {season.bakingDays && season.bakingDays.map((day) => (
                                <span
                                  key={day}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-lg capitalize border border-slate-200/40 dark:border-slate-800/40"
                                >
                                  {t(day.toLowerCase(), { defaultValue: day })}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRosterId(season.id);
                                setRosterName(season.name);
                                setRosterStartDate(season.startDate);
                                setRosterEndDate(season.endDate);
                                setRosterDays(season.bakingDays || []);
                                setRosterTime(season.bakeTime || '06:00');
                                setRosterCutoff(season.cutoffHours !== undefined && season.cutoffHours !== null ? season.cutoffHours : leadTimeHours);
                                setShowRosterForm(true);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-bakery-500 dark:hover:text-bakery-400 hover:bg-bakery-500/5 transition-all border border-transparent hover:border-bakery-500/10"
                              title={t('edit', { defaultValue: 'Edit' })}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoster(season.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/10"
                              title={t('delete', { defaultValue: 'Delete' })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
          {scheduleMode === 'easy' && (
            <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10 mt-6">
              <span className="text-3xl block mb-2">🏝️</span>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('easyModeActiveTitle', { defaultValue: 'Seasonal Overrides Disabled' })}
              </h4>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                {t('easyModeActiveDesc', { defaultValue: 'You are currently in Easy Mode. Your microbakery schedule relies entirely on standard weekly baking days. Switch to Advanced Mode to plan date-bound seasons and custom shift rosters.' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flour types configuration */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-lg max-w-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
            <span className="text-lg">🌾</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {t('flourTypesConfigTitle', { defaultValue: 'Flour Types Configuration' })}
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t('flourTypesConfigDesc', { defaultValue: 'Choose which flour types are visible in the recipe builder dropdown. Core/basic flours are selected by default. Enable others to add more complex flours for your recipes.' })}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {[
              'Manitoba',
              'Type 00',
              'Rye',
              'Whole Wheat',
              'Bread Flour',
              'Spelt',
              'Heljda (Buckwheat)',
              'Semolina',
              'Einkorn',
              'Emmer',
              'Barley',
              'Oat Flour'
            ].map((flourName) => {
              const isChecked = enabledFlours.includes(flourName);
              return (
                <label
                  key={flourName}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer select-none ${
                    isChecked
                      ? 'bg-bakery-500/10 border-bakery-500 text-bakery-600 dark:text-bakery-400 font-extrabold shadow shadow-bakery-500/5'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      let newList;
                      if (isChecked) {
                        newList = enabledFlours.filter((f) => f !== flourName);
                      } else {
                        newList = [...enabledFlours, flourName];
                      }
                      if (newList.length === 0) return;
                      saveEnabledFlours(newList);
                    }}
                    className="w-4 h-4 rounded text-bakery-500 border-slate-300 focus:ring-bakery-500/20"
                  />
                  <span className="text-xs">{flourName}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sourdough Starters Configuration */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-lg max-w-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧪</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {t('sourdoughStartersConfigTitle', { defaultValue: 'Sourdough Starters Configuration' })}
              </h3>
            </div>
            {editingStarterId === null && (
              <button
                onClick={() => {
                  setEditingStarterId('new');
                  setTempStarterName('');
                  setTempSeedParts(1);
                  setTempFlourParts(2);
                  setTempWaterParts(2);
                  setTempStarterFlours([{ name: enabledFlours[0] || 'Bread Flour', percentage: 100 }]);
                  setTempFeedingMethod('method-a');
                }}
                className="px-3 py-1 bg-bakery-500 hover:bg-bakery-600 text-white text-[10px] font-black rounded-lg transition"
              >
                ＋ {t('addStarter', { defaultValue: 'Add Starter' })}
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t('sourdoughStartersConfigDesc', { defaultValue: 'Define your custom starters, their feeding ratios (Seed : Flour : Water), and the exact flour composition percentages used to feed them.' })}
          </p>

          {editingStarterId !== null ? (
            // Edit / Create Form
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 space-y-4 animate-rise">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {editingStarterId === 'new' ? t('createNewStarter', { defaultValue: 'Create New Starter' }) : t('editStarter', { defaultValue: 'Edit Starter' })}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {t('starterNameLabel', { defaultValue: 'Starter Name' })}
                  </label>
                  <input
                    type="text"
                    value={tempStarterName}
                    onChange={(e) => setTempStarterName(e.target.value)}
                    placeholder="e.g. Rye Starter"
                    disabled={editingStarterId === 'standard-starter'}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-slate-900 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-center">Seed</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={tempSeedParts}
                      onChange={(e) => setTempSeedParts(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-xl dark:bg-slate-900 bg-white text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-center">Flour</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={tempFlourParts}
                      onChange={(e) => setTempFlourParts(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-xl dark:bg-slate-900 bg-white text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-center">Water</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={tempWaterParts}
                      onChange={(e) => setTempWaterParts(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-xl dark:bg-slate-900 bg-white text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Feeding Method Selector */}
              <div className="space-y-2 border-t dark:border-slate-800 pt-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ⚙️ Preferred Feeding Method (Overview Assistant Tab)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTempFeedingMethod('method-a')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 hover:scale-[1.01] ${
                      tempFeedingMethod === 'method-a'
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">⚖️</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Preset Ratio (Method A)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                      Feed using exact ratio parts (e.g., 1:2:2). Recommends seed discards if available seed is high.
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTempFeedingMethod('method-b')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 hover:scale-[1.01] ${
                      tempFeedingMethod === 'method-b'
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">🔄</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Adaptive / Zero-Waste (Method B)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                      Use ALL of your available seed in the jar and scale up by adding proportional flour and water.
                    </span>
                  </button>
                </div>
              </div>

              {/* Starter Flours Breakdown Builder */}
              <div className="space-y-2 border-t dark:border-slate-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    🌾 {t('feedingFloursComposition', { defaultValue: 'Feeding Flours Composition' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempStarterFlours([...tempStarterFlours, { name: enabledFlours[0] || 'Bread Flour', percentage: 0 }]);
                    }}
                    className="text-[10px] text-bakery-500 hover:underline font-bold flex items-center gap-1"
                  >
                    ＋ {t('addFlour', { defaultValue: 'Add Flour' })}
                  </button>
                </div>

                <div className="space-y-2">
                  {tempStarterFlours.map((item, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <select
                        value={item.name}
                        onChange={(e) => {
                          const list = [...tempStarterFlours];
                          list[fIdx].name = e.target.value;
                          setTempStarterFlours(list);
                        }}
                        className="text-[11px] p-2 border rounded-lg dark:bg-slate-950 flex-1 font-semibold dark:text-slate-100 dark:bg-slate-900"
                      >
                        {enabledFlours.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1 w-20">
                        <input
                          type="number"
                          placeholder="%"
                          value={item.percentage}
                          onChange={(e) => {
                            const list = [...tempStarterFlours];
                            list[fIdx].percentage = e.target.value;
                            setTempStarterFlours(list);
                          }}
                          className="w-12 text-[11px] p-1.5 border rounded-lg dark:bg-slate-950 font-bold text-center dark:bg-slate-900 dark:text-slate-100"
                        />
                        <span className="text-slate-400 text-[10px]">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempStarterFlours(tempStarterFlours.filter((_, idx) => idx !== fIdx));
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition ml-auto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-2 pt-1.5">
                  <span>{t('totalPercentage', { defaultValue: 'Total composition' })}:</span>
                  <span className={tempStarterFlours.reduce((sum, f) => sum + (parseFloat(f.percentage) || 0), 0) === 100 ? 'text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md' : 'text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-md'}>
                    {tempStarterFlours.reduce((sum, f) => sum + (parseFloat(f.percentage) || 0), 0)}%
                  </span>
                  {tempStarterFlours.reduce((sum, f) => sum + (parseFloat(f.percentage) || 0), 0) !== 100 && (
                    <span className="text-rose-400 font-normal">(must sum to exactly 100%)</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end border-t dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!tempStarterName || tempStarterName.trim() === '') {
                      alert('Starter name is required.');
                      return;
                    }
                    const sum = tempStarterFlours.reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0);
                    if (sum !== 100) {
                      alert(`The feeding flours percentages must sum to exactly 100% (currently ${sum}%).`);
                      return;
                    }

                    let updated;
                    const finalSeed = tempSeedParts === "" ? 1.0 : parseFloat(tempSeedParts);
                    const finalFlour = tempFlourParts === "" ? 2.0 : parseFloat(tempFlourParts);
                    const finalWater = tempWaterParts === "" ? 2.0 : parseFloat(tempWaterParts);

                    const cleanFlours = tempStarterFlours.map(f => ({
                      name: f.name,
                      percentage: parseFloat(f.percentage) || 0
                    }));

                    if (editingStarterId === 'new') {
                      const newStarter = {
                        id: `starter-${Date.now()}`,
                        name: tempStarterName.trim(),
                        seedParts: finalSeed,
                        flourParts: finalFlour,
                        waterParts: finalWater,
                        floursBreakdown: cleanFlours,
                        feedingMethod: tempFeedingMethod
                      };
                      updated = [...starters, newStarter];
                    } else {
                      updated = starters.map(s => {
                        if (s.id === editingStarterId) {
                          return {
                            ...s,
                            name: tempStarterName.trim(),
                            seedParts: finalSeed,
                            flourParts: finalFlour,
                            waterParts: finalWater,
                            floursBreakdown: cleanFlours,
                            feedingMethod: tempFeedingMethod
                          };
                        }
                        return s;
                      });
                    }
                    saveStartersSetting(updated);
                    setEditingStarterId(null);
                  }}
                  className="px-3.5 py-1.5 bg-bakery-500 hover:bg-bakery-600 text-white text-xs font-black rounded-lg transition"
                >
                  {t('save', { defaultValue: 'Save Starter' })}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStarterId(null)}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-lg transition"
                >
                  {t('cancel', { defaultValue: 'Cancel' })}
                </button>
              </div>
            </div>
          ) : (
            // List of starters
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {starters.map((s) => (
                <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{s.name}</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                        {s.seedParts}:{s.flourParts}:{s.waterParts}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-bold space-y-0.5">
                      <div>Feed composition:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.floursBreakdown && s.floursBreakdown.map((fb, idx) => (
                          <span key={idx} className="bg-slate-100 dark:bg-slate-900 border dark:border-slate-800/60 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                            🌾 {fb.name} ({fb.percentage}%)
                          </span>
                        ))}
                      </div>
                      <div className="pt-1">
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide inline-block">
                          ⚙️ {s.feedingMethod === 'method-b' ? 'Adaptive / Zero-Waste (Method B)' : 'Preset Ratio (Method A)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t dark:border-slate-900 pt-2.5 mt-2.5">
                    <button
                      onClick={() => {
                        setEditingStarterId(s.id);
                        setTempStarterName(s.name);
                        setTempSeedParts(s.seedParts);
                        setTempFlourParts(s.flourParts);
                        setTempWaterParts(s.waterParts);
                        setTempStarterFlours(s.floursBreakdown || []);
                        setTempFeedingMethod(s.feedingMethod || 'method-a');
                      }}
                      className="text-[10px] font-bold text-bakery-500 hover:underline"
                    >
                      Edit
                    </button>
                    {s.id !== 'standard-starter' && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${s.name}"?`)) {
                            const updated = starters.filter(item => item.id !== s.id);
                            saveStartersSetting(updated);
                          }
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backtracking helper */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-lg max-w-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
            <span className="text-lg">🕒</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {t('lastCallDeadlines', { defaultValue: 'Backtracking Helper: Last Call Deadlines' })}
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t('lastCallDeadlinesDesc', { defaultValue: 'Calculated cut-off deadlines for each active baking day based on the configured hours and baking start time:' })}
          </p>

          <div className="space-y-2">
            {bakingDays.map((day) => {
              const dl = calculateBacktrackDeadline(day, leadTimeHours, bakeTimeOfDay);
              if (!dl) return null;
              return (
                <div key={day} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 text-xs font-semibold">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 font-sans">
                    🍞 {t(day.toLowerCase())} {t('bakingDay', { defaultValue: 'Baking Day' })} @ {bakeTimeOfDay}
                  </span>
                  <span className="font-mono font-bold text-bakery-600 dark:text-bakery-400">
                    {t('lastCallDeadline', { defaultValue: 'Last call' })}: {t(dl.day.toLowerCase())} @ {dl.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pantry Stock Tracker Card */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-lg max-w-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {t('pantryStockTracker', { defaultValue: "Micro-Pantry Stock Tracker" })}
              </h3>
            </div>
            {!editingInventory ? (
              <button
                onClick={handleEditStockToggle}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-lg transition"
              >
                {t('editStock', { defaultValue: "✏️ Edit Stock" })}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveStock}
                  className="px-3 py-1 bg-bakery-500 hover:bg-bakery-600 text-white text-[10px] font-black rounded-lg transition"
                >
                  {t('saveStock', { defaultValue: "💾 Save" })}
                </button>
                <button
                  onClick={() => setEditingInventory(false)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg transition"
                >
                  {t('cancelStock', { defaultValue: "Cancel" })}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t('pantryStockDesc', { defaultValue: "Keep track of your current stock levels (in kg) for all ingredients. Under-stocked flours and extras will trigger highly visible warning badges on active batches." })}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {getUniqueIngredients().map((ing) => {
              const currentVal = pantryStock[ing] !== undefined ? pantryStock[ing] : 0.0;
              const tempVal = tempPantryStock[ing] !== undefined ? tempPantryStock[ing] : currentVal;

              const isUnderStocked = (() => {
                const lower = ing.toLowerCase();
                if (lower.includes('salt')) {
                  return currentVal < 1.0;
                }
                const isFlour = lower.includes('flour') ||
                  lower.includes('wheat') ||
                  lower.includes('rye') ||
                  lower.includes('buckwheat') ||
                  lower.includes('heljda') ||
                  lower.includes('manitoba') ||
                  lower.includes('semolina') ||
                  lower.includes('spelt') ||
                  lower.includes('grain');
                if (isFlour) {
                  return currentVal < 5.0;
                }
                return currentVal < 1.5;
              })();

              return (
                <div
                  key={ing}
                  className={`flex justify-between items-center p-3 rounded-2xl bg-white dark:bg-slate-900/30 border ${
                    isUnderStocked && !editingInventory
                      ? 'border-amber-400 dark:border-amber-500/50 shadow-sm shadow-amber-500/5'
                      : 'border-slate-150 dark:border-slate-800/60 shadow-sm'
                  } transition-all duration-300`}
                >
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                    🌾 {ing}
                    {isUnderStocked && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse">
                        ⚠️ Low Stock
                      </span>
                    )}
                  </span>
                  {!editingInventory ? (
                    <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-100 font-sans">
                      {currentVal.toFixed(2)} kg
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.max(0, parseFloat((tempVal - 1.0).toFixed(2)));
                          setTempPantryStock({ ...tempPantryStock, [ing]: newVal });
                        }}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={tempVal}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          setTempPantryStock({ ...tempPantryStock, [ing]: rawVal });
                        }}
                        className="p-1 w-16 text-center text-xs rounded-lg border dark:bg-slate-950 dark:border-slate-800 bg-white font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = parseFloat((tempVal + 1.0).toFixed(2));
                          setTempPantryStock({ ...tempPantryStock, [ing]: newVal });
                        }}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Raw Materials Costing Panel Card */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-lg max-w-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {t('rawMaterialCosting', { defaultValue: "Raw Materials Costing Panel" })}
              </h3>
            </div>
            {!editingCosts ? (
              <button
                onClick={handleEditCostsToggle}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-lg transition"
              >
                {t('editCosts', { defaultValue: "✏️ Edit Costs" })}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCosts}
                  className="px-3 py-1 bg-bakery-500 hover:bg-bakery-600 text-white text-[10px] font-black rounded-lg transition"
                >
                  {t('saveCosts', { defaultValue: "💾 Save" })}
                </button>
                <button
                  onClick={() => setEditingCosts(false)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg transition"
                >
                  {t('cancelCosts', { defaultValue: "Cancel" })}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t('rawCostsDesc', { defaultValue: "Input your wholesale purchase cost price per kilogram (€/kg) for each raw material. The financial engine uses this to calculate the exact profit margins of your batches." })}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {getUniqueIngredients().map((ing) => {
              const currentVal = ingredientCosts[ing] !== undefined ? ingredientCosts[ing] : 1.50;
              const tempVal = tempIngredientCosts[ing] !== undefined ? tempIngredientCosts[ing] : currentVal;

              return (
                <div key={ing} className="p-3 rounded-2xl bg-white dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800/60 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      🌾 {ing}
                    </span>
                    {!editingCosts ? (
                      <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-100 font-sans">
                        {currentVal.toFixed(2)} €/kg
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={tempVal}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setTempIngredientCosts({ ...tempIngredientCosts, [ing]: raw });
                          }}
                          className="p-1 w-20 text-center text-xs rounded-lg border dark:bg-slate-950 dark:border-slate-800 bg-white font-mono font-bold text-slate-800 dark:text-slate-100"
                        />
                        <span className="text-[10px] text-slate-500 font-extrabold">€/kg</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    Equivalent: <strong className="font-mono">{(tempVal / 1000).toFixed(5)} €/g</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
