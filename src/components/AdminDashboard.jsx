import React, { useState, useEffect, useRef } from 'react';
import OverviewTab from './AdminDashboard/OverviewTab';
import SettingsTab from './AdminDashboard/SettingsTab';
import OrdersTab from './AdminDashboard/OrdersTab';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  ChefHat, 
  FileText, 
  Printer, 
  BarChart4, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  RotateCw, 
  Trash2, 
  Plus, 
  Lock, 
  Unlock, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  AlertCircle,
  Settings,
  Search,
  Award,
  MessageSquare,
  DollarSign,
  Download,
  Package,
  Pencil
} from 'lucide-react';


const generateUpcomingDates = (bakingDays = ['Tuesday', 'Saturday'], count = 6, seasons = []) => {
  const result = [];
  const daysMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  let current = new Date();
  current.setHours(12, 0, 0, 0);

  for (let i = 0; i < 90 && result.length < count; i++) {
    // Format date as YYYY-MM-DD
    const yearStr = current.getFullYear();
    const monthStr = String(current.getMonth() + 1).padStart(2, '0');
    const dateStr = String(current.getDate()).padStart(2, '0');
    const isoDateStr = `${yearStr}-${monthStr}-${dateStr}`;

    // Find if there is an active season covering this date
    let activeSeason = null;
    if (seasons && seasons.length > 0) {
      activeSeason = seasons.find(s => s.startDate <= isoDateStr && isoDateStr <= s.endDate);
    }

    let activeBakingDays = bakingDays;
    if (activeSeason) {
      activeBakingDays = activeSeason.bakingDays || [];
    }

    const targetDays = activeBakingDays.map(d => daysMap[d]).filter(d => d !== undefined);
    const dayOfWeek = current.getDay();

    if (targetDays.includes(dayOfWeek)) {
      result.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
};

const formatBakingDate = (dateObj, lang = 'en') => {
  const locales = {
    'en': 'en-US',
    'hr': 'hr-HR',
    'it': 'it-IT'
  };
  const locale = locales[lang] || 'en-US';
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  });
  return formatter.format(dateObj);
};

const calculateBacktrackDeadline = (dayName, leadTime, bakeTimeOfDay = '06:00') => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = daysOfWeek.indexOf(dayName);
  if (dayIndex === -1) return null;

  const tempDate = new Date();
  const currentDay = tempDate.getDay();
  let daysDiff = dayIndex - currentDay;
  if (daysDiff <= 0) {
    daysDiff += 7;
  }
  tempDate.setDate(tempDate.getDate() + daysDiff);

  let startHours = 6;
  let startMinutes = 0;
  if (bakeTimeOfDay && bakeTimeOfDay.includes(':')) {
    const parts = bakeTimeOfDay.split(':');
    startHours = parseInt(parts[0], 10) || 6;
    startMinutes = parseInt(parts[1], 10) || 0;
  }
  tempDate.setHours(startHours, startMinutes, 0, 0);

  const deadline = new Date(tempDate.getTime() - leadTime * 60 * 60 * 1000);

  const deadlineDayName = daysOfWeek[deadline.getDay()];
  const hours = String(deadline.getHours()).padStart(2, '0');
  const minutes = String(deadline.getMinutes()).padStart(2, '0');
  
  return {
    day: deadlineDayName,
    time: `${hours}:${minutes}`
  };
};

export default function AdminDashboard() {
  const { logout, authFetch } = useAuth();
  const { t, LanguageSwitcher, currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview'); // overview | users | products | menu | orders | batches | printing | subscriptions
  
  // State lists
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [menu, setMenu] = useState(null);
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [standingOrders, setStandingOrders] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [selectedCalculationBatchId, setSelectedCalculationBatchId] = useState('all');
  
  // Settings & Rescheduling States
  const [bakingDays, setBakingDays] = useState(['Tuesday', 'Saturday']);
  const [bakingSeasons, setBakingSeasons] = useState([]);
  const [deductedBatches, setDeductedBatches] = useState([]);
  const [showRosterForm, setShowRosterForm] = useState(false);
  const [editingRosterId, setEditingRosterId] = useState(null);
  const [scheduleMode, setScheduleMode] = useState('advanced'); // 'easy' or 'advanced'
  const [showFallbackDefaults, setShowFallbackDefaults] = useState(false);
  const [rosterName, setRosterName] = useState('');
  const [rosterStartDate, setRosterStartDate] = useState('');
  const [rosterEndDate, setRosterEndDate] = useState('');
  const [rosterDays, setRosterDays] = useState([]);
  const [rosterTime, setRosterTime] = useState('06:00');
  const [rosterCutoff, setRosterCutoff] = useState(72);
  const [updatingOrderIds, setUpdatingOrderIds] = useState([]);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [rescheduleOrder, setRescheduleOrder] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [enabledFlours, setEnabledFlours] = useState(['Manitoba', 'Type 00', 'Rye', 'Whole Wheat', 'Bread Flour']);

  // Loyalty states
  const [loyaltyList, setLoyaltyList] = useState([]);
  const [searchLoyalty, setSearchLoyalty] = useState('');
  const [selectedLoyaltyUser, setSelectedLoyaltyUser] = useState(null);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [leadTimeHours, setLeadTimeHours] = useState(72);
  const [bakeTimeOfDay, setBakeTimeOfDay] = useState('06:00');
  const [localLeadTimeHours, setLocalLeadTimeHours] = useState('72');
  const [localBakeTimeOfDay, setLocalBakeTimeOfDay] = useState('06:00');
  const [starterWasteFactor, setStarterWasteFactor] = useState(10);
  const [doughWasteFactor, setDoughWasteFactor] = useState(5);
  const [localStarterWasteFactor, setLocalStarterWasteFactor] = useState('10');
  const [localDoughWasteFactor, setLocalDoughWasteFactor] = useState('5');

  useEffect(() => {
    setLocalLeadTimeHours(String(leadTimeHours));
  }, [leadTimeHours]);

  useEffect(() => {
    setLocalBakeTimeOfDay(bakeTimeOfDay);
  }, [bakeTimeOfDay]);

  useEffect(() => {
    setLocalStarterWasteFactor(String(starterWasteFactor));
  }, [starterWasteFactor]);

  useEffect(() => {
    setLocalDoughWasteFactor(String(doughWasteFactor));
  }, [doughWasteFactor]);
  const [starterPresetRatio, setStarterPresetRatio] = useState('1:2:2');
  const [availableStarterSeed, setAvailableStarterSeed] = useState(100);
  const [starterReserve, setStarterReserve] = useState(100);
  const [starters, setStarters] = useState([]);
  const [editingStarterId, setEditingStarterId] = useState(null); // 'new', 'id', or null
  const [tempStarterName, setTempStarterName] = useState('');
  const [tempSeedParts, setTempSeedParts] = useState(1);
  const [tempFlourParts, setTempFlourParts] = useState(2);
  const [tempWaterParts, setTempWaterParts] = useState(2);
  const [tempStarterFlours, setTempStarterFlours] = useState([]); // [{ name: 'Bread Flour', percentage: 100 }]
  const [tempFeedingMethod, setTempFeedingMethod] = useState('method-a');
  const [starterOverrides, setStarterOverrides] = useState({});

  // Forecasting States (Option 5)
  const [forecastDays, setForecastDays] = useState(14);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Dispatch & Bagging States (Option 4)
  const [selectedDispatchBatchId, setSelectedDispatchBatchId] = useState('');
  const [selectedDispatchSlot, setSelectedDispatchSlot] = useState('all');
  const [searchDispatchQuery, setSearchDispatchQuery] = useState('');
  const [loadingDispatch, setLoadingDispatch] = useState(false);
  const [ordersMetadata, setOrdersMetadata] = useState({});

  const [pantryStock, setPantryStock] = useState({
    "Manitoba": 10.0,
    "Whole Wheat": 5.0,
    "Rye": 5.0,
    "Buckwheat/Heljda": 2.0,
    "Bread Flour": 10.0,
    "Salt": 2.0,
    "Sourdough Starter": 5.0
  });
  const [ingredientCosts, setIngredientCosts] = useState({
    "Manitoba": 1.80,
    "Whole Wheat": 2.20,
    "Rye": 2.40,
    "Buckwheat/Heljda": 3.50,
    "Bread Flour": 1.50,
    "Salt": 0.60,
    "Sourdough Starter": 1.00
  });
  const [editingInventory, setEditingInventory] = useState(false);
  const [editingCosts, setEditingCosts] = useState(false);
  const [tempPantryStock, setTempPantryStock] = useState({});
  const [tempIngredientCosts, setTempIngredientCosts] = useState({});
  const [showMarginBreakdown, setShowMarginBreakdown] = useState(false);
  const [showOverviewFinancials, setShowOverviewFinancials] = useState(false);
  const [copiedShoppingList, setCopiedShoppingList] = useState(false);


  // WhatsApp notification helper states
  const [whatsappOrder, setWhatsappOrder] = useState(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('confirmed');
  const [customMessage, setCustomMessage] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  
  // Bulk Grouped WhatsApp helper states
  const [bulkWhatsappBatch, setBulkWhatsappBatch] = useState(null);
  const [bulkWhatsappTemplate, setBulkWhatsappTemplate] = useState('confirmed');
  const [bulkWhatsappSentList, setBulkWhatsappSentList] = useState({}); // { [userId]: boolean }
  const [bulkWhatsappCustomMessages, setBulkWhatsappCustomMessages] = useState({}); // { [userId]: string }
  const [bulkWhatsappCustomPhones, setBulkWhatsappCustomPhones] = useState({}); // { [userId]: string }
  
  // Selection states
  const [selectedOrdersForBatch, setSelectedOrdersForBatch] = useState([]);
  const [bakeDate, setBakeDate] = useState('');
  const [batchActionType, setBatchActionType] = useState('new');
  const [selectedExistingBatchId, setSelectedExistingBatchId] = useState('');
  
  // Finances and Analytics Tab States
  const [financeTimeFilter, setFinanceTimeFilter] = useState('all');
  const [financeSearchDate, setFinanceSearchDate] = useState('');
  const [expandedFinancialBatchId, setExpandedFinancialBatchId] = useState(null);
  
  // Refresh and Loading states
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMessage] = useState('');
  
  // Forms & Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Internal guest order states
  const [showInternalOrderModal, setShowInternalOrderModal] = useState(false);
  const [internalOrderCustomer, setInternalOrderCustomer] = useState({ name: '', phone: '', email: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [internalOrderItems, setInternalOrderItems] = useState([{ productVariantId: '', quantity: 1 }]);
  const [internalOrderSlot, setInternalOrderSlot] = useState('');

  const addInternalOrderItemRow = () => {
    setInternalOrderItems([...internalOrderItems, { productVariantId: '', quantity: 1 }]);
  };

  const updateInternalOrderItemRow = (index, field, value) => {
    const list = internalOrderItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setInternalOrderItems(list);
  };

  const removeInternalOrderItemRow = (index) => {
    if (internalOrderItems.length === 1) {
      setInternalOrderItems([{ productVariantId: '', quantity: 1 }]);
    } else {
      setInternalOrderItems(internalOrderItems.filter((_, idx) => idx !== index));
    }
  };

  const submitInternalOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMsg('');

    const itemsToSubmit = internalOrderItems.filter(item => item.productVariantId);
    if (itemsToSubmit.length === 0) {
      setErrorMessage(t('internalOrderFailed') + ' (Please select at least one product)');
      return;
    }

    if (!internalOrderCustomer.name) {
      setErrorMessage(t('internalOrderFailed') + ' (Name is required)');
      return;
    }

    const payload = {
      pickupSlot: internalOrderSlot,
      items: itemsToSubmit.map(item => ({
        productVariantId: item.productVariantId,
        quantity: parseInt(item.quantity) || 1
      })),
      internalCustomer: {
        name: internalOrderCustomer.name,
        phone: internalOrderCustomer.phone || null,
        email: internalOrderCustomer.email || null
      }
    };

    setLoading(true);
    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('internalOrderSuccess'));
        setShowInternalOrderModal(false);
        setInternalOrderCustomer({ name: '', phone: '', email: '' });
        setInternalOrderItems([{ productVariantId: '', quantity: 1 }]);
        if (upcomingDates && upcomingDates.length > 0) {
          setInternalOrderSlot(upcomingDates[0].toISOString().split('T')[0]);
        } else {
          setInternalOrderSlot('Saturday 09:00 - 10:30');
        }
        fetchOrders();
        fetchCalculations('', selectedCalculationBatchId);
      } else {
        setErrorMessage(data.error || t('internalOrderFailed'));
      }
    } catch (err) {
      setErrorMessage('Could not connect to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleOrder = async (e) => {
    e.preventDefault();
    if (!rescheduleOrder) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/orders/${rescheduleOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupSlot: rescheduleDate })
      });
      if (res.ok) {
        setStatusMsg('Order rescheduled successfully');
        setShowRescheduleModal(false);
        setRescheduleOrder(null);
        fetchOrders();
        fetchBatches();
        fetchCalculations('', selectedCalculationBatchId);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to reschedule order');
      }
    } catch (err) {
      setErrorMessage('Could not connect to database.');
    } finally {
      setLoading(false);
    }
  };

  // Compile all selectable variant options across all products
  const productVariantOptions = products.flatMap(p => 
    p.variants.map(v => ({
      id: v.id,
      label: `${p.name} (${v.size}) - $${v.price.toFixed(2)}`,
      price: v.price
    }))
  );

  const [editingProduct, setEditingProduct] = useState(null);
  const [sessionFlours, setSessionFlours] = useState([]);
  const [editingCustomRow, setEditingCustomRow] = useState(null);
  const [editingCustomExtraRow, setEditingCustomExtraRow] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    variants: [{ size: 'Medium', price: 9.0, recipe: { flour: 400, water: 280, salt: 8, starter: 80, extraIngredients: [], floursBreakdown: [] } }]
  });

  const [bakersPercentages, setBakersPercentages] = useState({
    enabled: false,
    hydration: 64,
    starter: 20,
    salt: 2,
    extraIngredients: [] // Array of { name: string, percentage: number }
  });

  const applyBakersPercentagesToVariants = (hydration, starter, salt, extraIngs = bakersPercentages.extraIngredients, currentVariants = newProduct.variants) => {
    const hVal = parseFloat(hydration) || 0;
    const sVal = parseFloat(starter) || 0;
    const saVal = parseFloat(salt) || 0;
    return currentVariants.map(v => {
      const flourVal = parseFloat(v.recipe.flour) || 0;
      return {
        ...v,
        recipe: {
          ...v.recipe,
          water: Math.round(flourVal * (hVal / 100)),
          starter: Math.round(flourVal * (sVal / 100)),
          salt: Math.round(flourVal * (saVal / 100)),
          extraIngredients: (extraIngs || []).map(ext => ({
            name: ext.name,
            grams: Math.round(flourVal * (parseFloat(ext.percentage) || 0) / 100)
          }))
        }
      };
    });
  };

  const addExtraPercentageRow = () => {
    const updatedExtras = [...(bakersPercentages.extraIngredients || []), { name: '', percentage: 0 }];
    setBakersPercentages(prev => ({
      ...prev,
      extraIngredients: updatedExtras
    }));
    if (bakersPercentages.enabled) {
      const updatedVariants = applyBakersPercentagesToVariants(
        bakersPercentages.hydration,
        bakersPercentages.starter,
        bakersPercentages.salt,
        updatedExtras
      );
      setNewProduct(prev => ({ ...prev, variants: updatedVariants }));
    }
  };

  const updateExtraPercentageRow = (index, field, value) => {
    const updatedExtras = (bakersPercentages.extraIngredients || []).map((ext, idx) => {
      if (idx === index) {
        return { ...ext, [field]: value };
      }
      return ext;
    });
    setBakersPercentages(prev => ({
      ...prev,
      extraIngredients: updatedExtras
    }));
    if (bakersPercentages.enabled) {
      const updatedVariants = applyBakersPercentagesToVariants(
        bakersPercentages.hydration,
        bakersPercentages.starter,
        bakersPercentages.salt,
        updatedExtras
      );
      setNewProduct(prev => ({ ...prev, variants: updatedVariants }));
    }
  };

  const removeExtraPercentageRow = (index) => {
    const updatedExtras = (bakersPercentages.extraIngredients || []).filter((_, idx) => idx !== index);
    setBakersPercentages(prev => ({
      ...prev,
      extraIngredients: updatedExtras
    }));
    if (bakersPercentages.enabled) {
      const updatedVariants = applyBakersPercentagesToVariants(
        bakersPercentages.hydration,
        bakersPercentages.starter,
        bakersPercentages.salt,
        updatedExtras
      );
      setNewProduct(prev => ({ ...prev, variants: updatedVariants }));
    }
  };

  const addManualExtraIngredient = (variantIdx) => {
    const list = [...newProduct.variants];
    const extras = list[variantIdx].recipe.extraIngredients || [];
    list[variantIdx].recipe.extraIngredients = [...extras, { name: '', grams: 0 }];
    setNewProduct({ ...newProduct, variants: list });
  };

  const updateManualExtraIngredient = (variantIdx, extraIdx, field, value) => {
    const list = [...newProduct.variants];
    list[variantIdx].recipe.extraIngredients = list[variantIdx].recipe.extraIngredients.map((ext, idx) => {
      if (idx === extraIdx) {
        return { ...ext, [field]: value };
      }
      return ext;
    });
    setNewProduct({ ...newProduct, variants: list });
  };

  const removeManualExtraIngredient = (variantIdx, extraIdx) => {
    const list = [...newProduct.variants];
    list[variantIdx].recipe.extraIngredients = list[variantIdx].recipe.extraIngredients.filter((_, idx) => idx !== extraIdx);
    setNewProduct({ ...newProduct, variants: list });
  };

  const formatSlotLabel = (slotStr) => {
    if (!slotStr) return '';
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(slotStr);
    if (isIsoDate) {
      const parts = slotStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
      return formatBakingDate(date, currentLanguage);
    }
    let result = slotStr;
    result = result.replace('Saturday', t('saturday', { defaultValue: 'Saturday' }));
    result = result.replace('Sunday', t('sunday', { defaultValue: 'Sunday' }));
    return result;
  };

  const getFormattedMessage = (templateName, order) => {
    if (!order) return '';
    const name = order.user.name;
    const id = order.id.slice(0, 8).toUpperCase();
    const slot = formatSlotLabel(order.pickupSlot) || 'your selected slot';
    const itemsStr = order.items.map(item => `${item.quantity}x ${item.productVariant.product.name} (${item.productVariant.size})`).join(', ');

    switch (templateName) {
      case 'confirmed':
        return t('whatsappConfirmedMessage', {
          defaultValue: `Hi {name}! 🍞 Your order #{id} at La Petite Farine has been confirmed. We're preparing your fresh artisanal bakes ({items}) for your selected slot: {slot}! See you soon!`,
          name,
          id,
          items: itemsStr,
          slot
        });
      case 'baking':
        return t('whatsappBakingMessage', {
          defaultValue: `Hi {name}! 🔥 Just to let you know, your bread is in the oven right now at La Petite Farine! The bakery smells amazing, and your bakes ({items}) will be ready for pickup during your slot: {slot}.`,
          name,
          id,
          items: itemsStr,
          slot
        });
      case 'ready':
        return t('whatsappReadyMessage', {
          defaultValue: `Hi {name}! 🎉 Exciting news - your fresh bakes ({items}) are ready! 🥖 Warm, crusty, and waiting for you to pick them up during your slot: {slot}. See you at La Petite Farine!`,
          name,
          id,
          items: itemsStr,
          slot
        });
      default:
        return '';
    }
  };

  const getGroupedCustomersForBatch = (batch) => {
    if (!batch || !batch.orders) return [];
    const groups = {};
    batch.orders.forEach(order => {
      const userId = order.userId;
      if (!groups[userId]) {
        groups[userId] = {
          userId,
          user: order.user,
          orders: [],
          items: []
        };
      }
      groups[userId].orders.push(order);
      
      order.items.forEach(item => {
        const pvId = item.productVariantId;
        const existing = groups[userId].items.find(i => i.productVariantId === pvId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          groups[userId].items.push({
            ...item,
            productVariantId: pvId,
            productVariant: item.productVariant,
            quantity: item.quantity
          });
        }
      });
    });
    return Object.values(groups);
  };

  const getGroupedFormattedMessage = (templateName, group, batchDate) => {
    if (!group) return '';
    const name = group.user.name;
    const dateStr = batchDate ? new Date(batchDate).toLocaleDateString() : '';
    const slots = [...new Set(group.orders.map(o => formatSlotLabel(o.pickupSlot)).filter(Boolean))].join(', ');
    const itemsStr = group.items.map(item => `${item.quantity}x ${item.productVariant?.product?.name || 'Artisan Bread'} (${item.productVariant?.size || 'Standard'})`).join(', ');

    switch (templateName) {
      case 'confirmed':
        return t('whatsappGroupedConfirmedMessage', {
          defaultValue: `Hi {name}! 🍞 Your order at La Petite Farine for {date} is confirmed! We are preparing your fresh artisanal bakes ({items}) for slot: {slot}! See you soon!`,
          name,
          date: dateStr,
          items: itemsStr,
          slot: slots || dateStr
        });
      case 'baking':
        return t('whatsappGroupedBakingMessage', {
          defaultValue: `Hi {name}! 🔥 Just to let you know, we are in the process of mixing & baking your fresh artisanal bakes ({items}) today! Everything is smelling amazing at La Petite Farine, and they will be ready for pickup during slot: {slot}.`,
          name,
          items: itemsStr,
          slot: slots || dateStr
        });
      case 'ready':
        return t('whatsappGroupedReadyMessage', {
          defaultValue: `Hi {name}! 🎉 Exciting news - your fresh bakes ({items}) are completed and ready for pickup! 🥖 Warm, crusty, and waiting for you during your slot: {slot}. See you at La Petite Farine!`,
          name,
          items: itemsStr,
          slot: slots || dateStr
        });
      default:
        return '';
    }
  };

  const handleOpenBulkWhatsapp = async (batchId) => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/production/batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setBulkWhatsappBatch(data.batch);
        setBulkWhatsappTemplate('confirmed');
        setBulkWhatsappSentList({});
        
        const groups = getGroupedCustomersForBatch(data.batch);
        const phones = {};
        const messages = {};
        groups.forEach(g => {
          phones[g.userId] = g.user?.phone || '+385994460717';
          messages[g.userId] = getGroupedFormattedMessage('confirmed', g, data.batch.date);
        });
        setBulkWhatsappCustomPhones(phones);
        setBulkWhatsappCustomMessages(messages);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to load batch details');
      }
    } catch (err) {
      console.error('Error loading bulk WhatsApp details:', err);
      alert('Could not connect to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkWhatsappTemplateChange = (tpl) => {
    setBulkWhatsappTemplate(tpl);
    if (!bulkWhatsappBatch) return;
    const groups = getGroupedCustomersForBatch(bulkWhatsappBatch);
    const messages = {};
    groups.forEach(g => {
      messages[g.userId] = getGroupedFormattedMessage(tpl, g, bulkWhatsappBatch.date);
    });
    setBulkWhatsappCustomMessages(messages);
  };

  const handleSendNextUnsent = () => {
    if (!bulkWhatsappBatch) return;
    const groups = getGroupedCustomersForBatch(bulkWhatsappBatch);
    const nextGroup = groups.find(g => !bulkWhatsappSentList[g.userId]);
    if (nextGroup) {
      const phone = bulkWhatsappCustomPhones[nextGroup.userId] || '';
      const msg = bulkWhatsappCustomMessages[nextGroup.userId] || '';
      if (phone) {
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        const encodedText = encodeURIComponent(msg);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
        setBulkWhatsappSentList(prev => ({ ...prev, [nextGroup.userId]: true }));
      } else {
        setErrorMessage(`Phone number is missing for ${nextGroup.user?.name || 'Unknown customer'}`);
      }
    } else {
      setStatusMsg('All customers in this batch have been sent messages!');
    }
  };

  useEffect(() => {
    if (whatsappOrder) {
      setCustomMessage(getFormattedMessage(whatsappTemplate, whatsappOrder));
    }
  }, [whatsappOrder, whatsappTemplate]);

  useEffect(() => {
    if (whatsappOrder) {
      setWhatsappPhone(whatsappOrder.user.phone || '+385994460717');
    } else {
      setWhatsappPhone('');
    }
  }, [whatsappOrder]);

  const printRef = useRef();

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchProducts(),
        fetchCurrentMenu(),
        fetchOrders(),
        fetchBatches(),
        fetchCalculations('', selectedCalculationBatchId),
        fetchStandingOrders(),
        fetchSettings(),
        fetchLoyaltyList()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'finances') {
      fetchForecast(forecastDays);
    }
  }, [activeTab, forecastDays]);

  useEffect(() => {
    if (activeTab === 'dispatch' && selectedDispatchBatchId) {
      const batchOrders = orders.filter(o => o.batchId === selectedDispatchBatchId);
      batchOrders.forEach(o => {
        fetchOrderMetadata(o.id);
      });
    }
  }, [activeTab, selectedDispatchBatchId, orders]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.guest-name-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const handleSelectSuggestion = (user) => {
    const hasDummyEmail = user.email && (user.email.includes('@internal.bakery.com') || user.email.includes('@internal.'));
    setInternalOrderCustomer({
      name: user.name || '',
      phone: user.phone || '',
      email: hasDummyEmail ? '' : (user.email || '')
    });
    setShowSuggestions(false);
  };

  const handleClearCustomerInfo = () => {
    setInternalOrderCustomer({ name: '', phone: '', email: '' });
    setShowSuggestions(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {}
  };

  const fetchProducts = async () => {
    try {
      const res = await authFetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (err) {}
  };

  const fetchCurrentMenu = async () => {
    try {
      const res = await authFetch('/api/menu/current');
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (err) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await authFetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (err) {}
  };

  const fetchBatches = async () => {
    try {
      const res = await authFetch('/api/production/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
      }
    } catch (err) {}
  };

  const fetchCalculations = async (weekStr = '', batchId = null) => {
    try {
      let query = '';
      if (batchId && batchId !== 'all') {
        query = `?batchId=${batchId}`;
      } else if (weekStr) {
        query = `?week=${weekStr}`;
      }
      const res = await authFetch(`/api/production/calculations${query}`);
      if (res.ok) {
        const data = await res.json();
        setCalculations(data);
      }
    } catch (err) {}
  };

  const handleBatchFilterChange = (e) => {
    const bId = e.target.value;
    setSelectedCalculationBatchId(bId);
    fetchCalculations('', bId);
  };

  const fetchStandingOrders = async () => {
    try {
      const res = await authFetch('/api/standing-orders');
      if (res.ok) {
        const data = await res.json();
        setStandingOrders(data.standingOrders);
      }
    } catch (err) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await authFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          let mode = 'advanced';
          if (data.settings.scheduleMode) {
            mode = data.settings.scheduleMode;
            setScheduleMode(mode);
          } else {
            setScheduleMode('advanced');
          }

          let activeSeasons = [];
          if (data.settings.bakingSeasons) {
            try {
              activeSeasons = JSON.parse(data.settings.bakingSeasons);
              setBakingSeasons(activeSeasons);
            } catch (e) {
              console.error('Error parsing bakingSeasons setting:', e);
            }
          }

          const seasonsForCalc = mode === 'easy' ? [] : activeSeasons;

          if (data.settings.deductedBatches) {
            try {
              setDeductedBatches(JSON.parse(data.settings.deductedBatches));
            } catch (e) {
              console.error('Error parsing deductedBatches setting:', e);
            }
          }

          if (data.settings.bakingDays) {
            const parsed = JSON.parse(data.settings.bakingDays);
            setBakingDays(parsed);
            const dates = generateUpcomingDates(parsed, 6, seasonsForCalc);
            setUpcomingDates(dates);
            if (dates.length > 0 && !internalOrderSlot) {
              setInternalOrderSlot(dates[0].toISOString().split('T')[0]);
            }
          } else {
            const defaultDays = ['Tuesday', 'Saturday'];
            setBakingDays(defaultDays);
            const dates = generateUpcomingDates(defaultDays, 6, seasonsForCalc);
            setUpcomingDates(dates);
            if (dates.length > 0 && !internalOrderSlot) {
              setInternalOrderSlot(dates[0].toISOString().split('T')[0]);
            }
          }
          if (data.settings.leadTimeHours) {
            setLeadTimeHours(parseInt(data.settings.leadTimeHours, 10));
          } else {
            setLeadTimeHours(72);
          }
          if (data.settings.bakeTimeOfDay) {
            setBakeTimeOfDay(data.settings.bakeTimeOfDay);
          } else {
            setBakeTimeOfDay('06:00');
          }
          if (data.settings.starterWasteFactor) {
            setStarterWasteFactor(parseFloat(data.settings.starterWasteFactor));
          } else {
            setStarterWasteFactor(10);
          }
          if (data.settings.doughWasteFactor) {
            setDoughWasteFactor(parseFloat(data.settings.doughWasteFactor));
          } else {
            setDoughWasteFactor(5);
          }

          if (data.settings.enabledFlours) {
            try {
              setEnabledFlours(JSON.parse(data.settings.enabledFlours));
            } catch (e) {
              setEnabledFlours(['Manitoba', 'Type 00', 'Rye', 'Whole Wheat', 'Bread Flour']);
            }
          } else {
            setEnabledFlours(['Manitoba', 'Type 00', 'Rye', 'Whole Wheat', 'Bread Flour']);
          }

          const defaultPantryStock = {
            "Manitoba": 10.0,
            "Whole Wheat": 5.0,
            "Rye": 5.0,
            "Buckwheat/Heljda": 2.0,
            "Bread Flour": 10.0,
            "Salt": 2.0,
            "Sourdough Starter": 5.0
          };
          const defaultIngredientCosts = {
            "Manitoba": 1.80,
            "Whole Wheat": 2.20,
            "Rye": 2.40,
            "Buckwheat/Heljda": 3.50,
            "Bread Flour": 1.50,
            "Salt": 0.60,
            "Sourdough Starter": 1.00
          };

          if (data.settings.pantryStock) {
            try {
              const parsed = JSON.parse(data.settings.pantryStock);
              setPantryStock({ ...defaultPantryStock, ...parsed });
            } catch (e) {
              setPantryStock(defaultPantryStock);
            }
          } else {
            setPantryStock(defaultPantryStock);
          }

          if (data.settings.ingredientCosts) {
            try {
              const parsed = JSON.parse(data.settings.ingredientCosts);
              setIngredientCosts({ ...defaultIngredientCosts, ...parsed });
            } catch (e) {
              setIngredientCosts(defaultIngredientCosts);
            }
          } else {
            setIngredientCosts(defaultIngredientCosts);
          }

          if (data.settings.starters) {
            try {
              const loadedStarters = JSON.parse(data.settings.starters).map(s => {
                const floursBreakdown = (s.floursBreakdown || []).map(f => {
                  if (f.name === 'Bread Flour') {
                    return { ...f, name: 'Manitoba' };
                  }
                  return f;
                });
                return {
                  ...s,
                  floursBreakdown,
                  feedingMethod: s.feedingMethod || 'method-a'
                };
              });
              setStarters(loadedStarters);
              const std = loadedStarters.find(s => s.id === 'standard-starter');
              if (std) {
                setStarterPresetRatio(`${std.seedParts || 1}:${std.flourParts || 2}:${std.waterParts || 2}`);
              }
            } catch (e) {
              setStarters([
                {
                  id: 'standard-starter',
                  name: 'Standard Sourdough Starter',
                  seedParts: 1,
                  flourParts: 2,
                  waterParts: 2,
                  floursBreakdown: [{ name: 'Manitoba', percentage: 100 }],
                  feedingMethod: 'method-a'
                }
              ]);
            }
          } else {
            setStarters([
              {
                id: 'standard-starter',
                name: 'Standard Sourdough Starter',
                seedParts: 1,
                flourParts: 2,
                waterParts: 2,
                floursBreakdown: [{ name: 'Manitoba', percentage: 100 }],
                feedingMethod: 'method-a'
              }
            ]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchLoyaltyList = async () => {
    try {
      const res = await authFetch('/api/loyalty/admin');
      if (res.ok) {
        const data = await res.json();
        setLoyaltyList(data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching loyalty list:', err);
    }
  };

  const fetchLoyaltyHistory = async (userId) => {
    try {
      setLoadingLoyalty(true);
      const res = await authFetch(`/api/loyalty/status?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLoyaltyUser(data.user);
        setLoyaltyHistory(data.purchaseLedger || []);
      }
    } catch (err) {
      console.error('Error fetching loyalty history:', err);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  const redeemLoyaltyLoaf = async (userId) => {
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('redeemLoafSuccess', { defaultValue: 'Successfully redeemed 1 free loaf!' }));
        fetchLoyaltyList();
        if (selectedLoyaltyUser && selectedLoyaltyUser.id === userId) {
          fetchLoyaltyHistory(userId);
        }
      } else {
        setErrorMessage(data.error || t('redeemLoafError', { defaultValue: 'Cannot redeem free loaf.' }));
      }
    } catch (err) {
      setErrorMessage('Could not connect to loyalty server.');
    }
  };

  const fetchForecast = async (days) => {
    try {
      setLoadingForecast(true);
      const res = await authFetch(`/api/production/forecast?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setForecastData(data);
      }
    } catch (err) {
      console.error('Error fetching recipe forecast:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchOrderMetadata = async (orderId) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/metadata`);
      if (res.ok) {
        const data = await res.json();
        setOrdersMetadata(prev => ({
          ...prev,
          [orderId]: data || { cubby: '', checkedItems: [] }
        }));
      }
    } catch (err) {
      console.error(`Error fetching metadata for order ${orderId}:`, err);
    }
  };

  const saveOrderMetadata = async (orderId, meta) => {
    try {
      setOrdersMetadata(prev => ({
        ...prev,
        [orderId]: meta
      }));
      await authFetch(`/api/orders/${orderId}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta)
      });
    } catch (err) {
      console.error(`Error saving metadata for order ${orderId}:`, err);
    }
  };

  const adjustManualStamps = async (userId, adjustment) => {
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/loyalty/adjust-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, adjustment })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('loyaltyAdjustSuccess', { defaultValue: 'Loyalty stamps successfully updated!' }));
        fetchLoyaltyList();
        if (selectedLoyaltyUser && selectedLoyaltyUser.id === userId) {
          fetchLoyaltyHistory(userId);
        }
      } else {
        setErrorMessage(data.error || 'Failed to adjust stamps.');
      }
    } catch (err) {
      console.error('Error adjusting manual stamps:', err);
      setErrorMessage('Could not connect to loyalty server.');
    }
  };

  const saveLeadTimeHours = async (hours) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'leadTimeHours',
          value: String(hours)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved'));
        setLeadTimeHours(hours);
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveStarterWasteFactor = async (factor) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'starterWasteFactor',
          value: String(factor)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved', { defaultValue: 'Settings saved successfully!' }));
        setStarterWasteFactor(parseFloat(factor) || 0);
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveDoughWasteFactor = async (factor) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'doughWasteFactor',
          value: String(factor)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved', { defaultValue: 'Settings saved successfully!' }));
        setDoughWasteFactor(parseFloat(factor) || 0);
        // Refresh calculations to immediately reflect the new dough waste factor scaling
        if (selectedCalculationBatchId) {
          fetchCalculations('', selectedCalculationBatchId);
        }
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveEnabledFlours = async (flourList) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'enabledFlours',
          value: JSON.stringify(flourList)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved'));
        setEnabledFlours(flourList);
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveBakeTimeOfDay = async (timeStr) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'bakeTimeOfDay',
          value: timeStr
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved'));
        setBakeTimeOfDay(timeStr);
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const savePantryStock = async (newStock) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'pantryStock',
          value: JSON.stringify(newStock)
        })
      });
      if (res.ok) {
        setStatusMsg(t('settingsSaved', { defaultValue: 'Settings saved successfully!' }));
        setPantryStock(newStock);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to save pantry stock.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRegisterCustomFlour = async (name) => {
    const trimmed = name ? name.trim() : '';
    if (!trimmed) return;
    
    // Add to session flours
    setSessionFlours(prev => Array.from(new Set([...prev, trimmed])));
    
    // Auto-save to pantryStock (with 0.0 kg) if not present
    if (pantryStock[trimmed] === undefined) {
      const updatedStock = { ...pantryStock, [trimmed]: 0.0 };
      await savePantryStock(updatedStock);
    }
    
    // Auto-save to enabledFlours if not present
    if (!enabledFlours.includes(trimmed)) {
      const updatedFlours = [...enabledFlours, trimmed];
      await saveEnabledFlours(updatedFlours);
    }
  };

  const handleRegisterCustomExtra = async (name) => {
    const trimmed = name ? name.trim() : '';
    if (!trimmed) return;
    
    // Auto-save to pantryStock (with 0.0 kg) if not present
    if (pantryStock[trimmed] === undefined) {
      const updatedStock = { ...pantryStock, [trimmed]: 0.0 };
      await savePantryStock(updatedStock);
    }
  };

  const saveIngredientCosts = async (newCosts) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'ingredientCosts',
          value: JSON.stringify(newCosts)
        })
      });
      if (res.ok) {
        setStatusMsg(t('settingsSaved', { defaultValue: 'Settings saved successfully!' }));
        setIngredientCosts(newCosts);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to save ingredient costs.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveStartersSetting = async (updatedStarters) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'starters',
          value: JSON.stringify(updatedStarters)
        })
      });
      if (res.ok) {
        setStatusMsg(t('settingsSaved', { defaultValue: 'Starters saved successfully!' }));
        setStarters(updatedStarters);
        const std = updatedStarters.find(s => s.id === 'standard-starter');
        if (std) {
          setStarterPresetRatio(`${std.seedParts || 1}:${std.flourParts || 2}:${std.waterParts || 2}`);
        }
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to save starters config.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };


  const saveSettings = async (selectedDays) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'bakingDays',
          value: JSON.stringify(selectedDays)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved'));
        setBakingDays(selectedDays);
        setUpcomingDates(generateUpcomingDates(selectedDays, 6, scheduleMode === 'easy' ? [] : bakingSeasons));
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveBakingSeasonsSetting = async (seasonsList) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'bakingSeasons',
          value: JSON.stringify(seasonsList)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved'));
        setBakingSeasons(seasonsList);
        setUpcomingDates(generateUpcomingDates(bakingDays, 6, scheduleMode === 'easy' ? [] : seasonsList));
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveScheduleModeSetting = async (mode) => {
    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'scheduleMode',
          value: mode
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t('settingsSaved'));
        setScheduleMode(mode);
        setUpcomingDates(generateUpcomingDates(bakingDays, 6, mode === 'easy' ? [] : bakingSeasons));
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateRoster = async () => {
    if (!rosterName.trim()) {
      setErrorMessage(t('rosterNameRequired', { defaultValue: 'Please enter a roster name.' }));
      return;
    }
    if (!rosterStartDate || !rosterEndDate) {
      setErrorMessage(t('rosterDatesRequired', { defaultValue: 'Please select both start and end dates.' }));
      return;
    }
    if (rosterStartDate > rosterEndDate) {
      setErrorMessage(t('rosterStartDateAfterEnd', { defaultValue: 'Start date cannot be after end date.' }));
      return;
    }
    if (rosterDays.length === 0) {
      setErrorMessage(t('rosterDaysRequired', { defaultValue: 'Please select at least one baking day.' }));
      return;
    }

    let updatedSeasons;
    if (editingRosterId) {
      updatedSeasons = bakingSeasons.map(s => {
        if (s.id === editingRosterId) {
          return {
            ...s,
            name: rosterName.trim(),
            startDate: rosterStartDate,
            endDate: rosterEndDate,
            bakingDays: rosterDays,
            bakeTime: rosterTime || '06:00',
            cutoffHours: rosterCutoff !== "" ? parseInt(rosterCutoff, 10) : null
          };
        }
        return s;
      });
    } else {
      const newRoster = {
        id: Date.now().toString(),
        name: rosterName.trim(),
        startDate: rosterStartDate,
        endDate: rosterEndDate,
        bakingDays: rosterDays,
        bakeTime: rosterTime || '06:00',
        cutoffHours: rosterCutoff !== "" ? parseInt(rosterCutoff, 10) : null
      };
      updatedSeasons = [...bakingSeasons, newRoster];
    }

    await saveBakingSeasonsSetting(updatedSeasons);

    // Reset fields
    setRosterName('');
    setRosterStartDate('');
    setRosterEndDate('');
    setRosterDays([]);
    setRosterTime('06:00');
    setRosterCutoff(leadTimeHours);
    setEditingRosterId(null);
    setShowRosterForm(false);
  };

  const handleDeleteRoster = async (id) => {
    const updatedSeasons = bakingSeasons.filter(s => s.id !== id);
    await saveBakingSeasonsSetting(updatedSeasons);
  };


  // User Actions: Approve, Reject, Role Update
  const handleUserStatus = async (userId, newStatus) => {
    try {
      const res = await authFetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setStatusMsg(`User status updated to ${newStatus}`);
        fetchUsers();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to update user status');
      }
    } catch (err) {}
  };

  const handleUserRole = async (userId, newRole) => {
    try {
      const res = await authFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setStatusMsg(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to update user role');
      }
    } catch (err) {}
  };

  // Order Actions: Change status
  const handleOrderStatus = async (orderId, status) => {
    setUpdatingOrderIds((prev) => [...prev, orderId, `${orderId}-${status}`]);
    try {
      const res = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setStatusMsg(`Order status updated to ${status}`);
        await fetchOrders();
        if (activeTab === 'batches') {
          fetchBatches();
          fetchCalculations('', selectedCalculationBatchId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrderIds((prev) => prev.filter((id) => id !== orderId && id !== `${orderId}-${status}`));
    }
  };

  // Remove single order from production batch (unbatch)
  const handleUnbatchOrder = async (orderId) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: null })
      });
      if (res.ok) {
        setStatusMsg('Order removed from production run successfully');
        fetchOrders();
        fetchBatches();
        fetchCalculations('', selectedCalculationBatchId);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to remove order from production run');
      }
    } catch (err) {
      setErrorMessage('Could not connect to database.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to permanently delete this order?")) {
      return;
    }

    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setStatusMsg('Order permanently deleted!');
        fetchOrders();
        fetchBatches();
        fetchCalculations('', selectedCalculationBatchId);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to delete order');
      }
    } catch (err) {
      setErrorMessage('Could not connect to database.');
    }
  };

  // Create/Update Product
  const saveProduct = async () => {
    if (!newProduct.name || !newProduct.description) {
      setErrorMessage('Product Name and Description are required');
      return;
    }

    // Validate flours breakdown percentages
    for (const v of newProduct.variants) {
      if (v.recipe && v.recipe.floursBreakdown && v.recipe.floursBreakdown.length > 0) {
        const sum = v.recipe.floursBreakdown.reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0);
        if (sum !== 100) {
          setErrorMessage(`The flours breakdown percentages for size "${v.size}" must sum to exactly 100% (currently ${sum}%).`);
          return;
        }
      }
    }

    const cleanedProduct = JSON.parse(JSON.stringify(newProduct));
    cleanedProduct.variants = cleanedProduct.variants.map(v => {
      const priceVal = (v.price === '' || isNaN(parseFloat(v.price))) ? 0.0 : parseFloat(v.price);
      if (v.recipe) {
        const flourVal = (v.recipe.flour === '' || isNaN(parseFloat(v.recipe.flour))) ? 0.0 : parseFloat(v.recipe.flour);
        const waterVal = (v.recipe.water === '' || isNaN(parseFloat(v.recipe.water))) ? 0.0 : parseFloat(v.recipe.water);
        const saltVal = (v.recipe.salt === '' || isNaN(parseFloat(v.recipe.salt))) ? 0.0 : parseFloat(v.recipe.salt);
        const starterVal = (v.recipe.starter === '' || isNaN(parseFloat(v.recipe.starter))) ? 0.0 : parseFloat(v.recipe.starter);

        const floursBreakdown = (v.recipe.floursBreakdown || []).map(fb => ({
          ...fb,
          percentage: (fb.percentage === '' || isNaN(parseFloat(fb.percentage))) ? 0 : parseFloat(fb.percentage)
        }));

        const extraIngredients = (v.recipe.extraIngredients || []).map(ext => ({
          ...ext,
          grams: (ext.grams === '' || isNaN(parseFloat(ext.grams))) ? 0.0 : parseFloat(ext.grams)
        }));

        return {
          ...v,
          price: priceVal,
          recipe: {
            ...v.recipe,
            flour: flourVal,
            water: waterVal,
            salt: saltVal,
            starter: starterVal,
            floursBreakdown,
            extraIngredients
          }
        };
      }
      return { ...v, price: priceVal };
    });

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedProduct)
      });

      if (res.ok) {
        // Fail-safe registration of any custom flours and extras in the saved product
        let updatedStock = { ...pantryStock };
        let stockChanged = false;
 
        let updatedFlours = [...enabledFlours];
        let floursChanged = false;
 
        cleanedProduct.variants.forEach(v => {
          if (v.recipe) {
            if (v.recipe.floursBreakdown) {
              v.recipe.floursBreakdown.forEach(fb => {
                if (fb.name && fb.name.trim()) {
                  const name = fb.name.trim();
                  if (updatedStock[name] === undefined) {
                    updatedStock[name] = 0.0;
                    stockChanged = true;
                  }
                  if (!updatedFlours.includes(name)) {
                    updatedFlours.push(name);
                    floursChanged = true;
                  }
                }
              });
            }
            if (v.recipe.extraIngredients) {
              v.recipe.extraIngredients.forEach(ext => {
                if (ext.name && ext.name.trim()) {
                  const name = ext.name.trim();
                  if (updatedStock[name] === undefined) {
                    updatedStock[name] = 0.0;
                    stockChanged = true;
                  }
                }
              });
            }
          }
        });

        if (stockChanged) {
          await savePantryStock(updatedStock);
        }
        if (floursChanged) {
          await saveEnabledFlours(updatedFlours);
        }

        setStatusMsg(editingProduct ? 'Product details updated!' : 'New product created successfully!');
        setShowProductModal(false);
        setEditingProduct(null);
        setNewProduct({
          name: '',
          description: '',
          variants: [{ size: 'Medium', price: 9.0, recipe: { flour: 400, water: 280, salt: 8, starter: 80, extraIngredients: [], floursBreakdown: [], starterName: 'default' } }]
        });
        fetchProducts();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save product');
      }
    } catch (err) {}
  };

  const handleEditProductClick = (prod) => {
    setEditingProduct(prod);
    setNewProduct({
      name: prod.name,
      description: prod.description,
      variants: prod.variants.map(v => ({
        id: v.id,
        size: v.size,
        price: v.price,
        recipe: v.recipe ? {
          flour: v.recipe.flour,
          water: v.recipe.water,
          salt: v.recipe.salt,
          starter: v.recipe.starter,
          starterName: v.recipe.starterName || 'default',
          extraIngredients: typeof v.recipe.extraIngredients === 'string' ? JSON.parse(v.recipe.extraIngredients) : (v.recipe.extraIngredients || []),
          floursBreakdown: typeof v.recipe.floursBreakdown === 'string' ? JSON.parse(v.recipe.floursBreakdown) : (v.recipe.floursBreakdown || [])
        } : { flour: 0, water: 0, salt: 0, starter: 0, extraIngredients: [], floursBreakdown: [], starterName: 'default' }
      }))
    });

    // Attempt to infer baker's percentages from the first variant to prepopulate inputs
    const firstVariant = prod.variants[0];
    if (firstVariant && firstVariant.recipe && firstVariant.recipe.flour > 0) {
      const rec = firstVariant.recipe;
      const hyd = Math.round((rec.water / rec.flour) * 100);
      const start = Math.round((rec.starter / rec.flour) * 100);
      const s = Math.round((rec.salt / rec.flour) * 100);
      
      let inferredExtras = [];
      const rawExtras = typeof rec.extraIngredients === 'string' ? JSON.parse(rec.extraIngredients) : (rec.extraIngredients || []);
      if (Array.isArray(rawExtras)) {
        inferredExtras = rawExtras.map(ext => ({
          name: ext.name,
          percentage: Number(((ext.grams / rec.flour) * 100).toFixed(1))
        }));
      }

      setBakersPercentages({
        enabled: false,
        hydration: hyd,
        starter: start,
        salt: s,
        extraIngredients: inferredExtras
      });
    } else {
      setBakersPercentages({ enabled: false, hydration: 64, starter: 20, salt: 2, extraIngredients: [] });
    }

    setShowProductModal(true);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to completely delete this product? All active recipes and variants will be deleted.')) return;
    try {
      const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMsg('Product removed successfully');
        fetchProducts();
      }
    } catch (err) {}
  };

  // Add variant field to form
  const addVariantFormRow = () => {
    setNewProduct({
      ...newProduct,
      variants: [...newProduct.variants, { size: '', price: 0, recipe: { flour: 0, water: 0, salt: 0, starter: 0, extraIngredients: [], floursBreakdown: [], starterName: 'default' } }]
    });
  };

  // Sync Weekly Menu products
  const handleToggleMenuProduct = async (productId) => {
    const isCurrentlyAdded = menu?.products?.some(p => p.id === productId);
    let updatedProductIds = menu?.products?.map(p => p.id) || [];

    if (isCurrentlyAdded) {
      updatedProductIds = updatedProductIds.filter(id => id !== productId);
    } else {
      updatedProductIds.push(productId);
    }

    try {
      const res = await authFetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: new Date().toISOString().split('T')[0],
          productIds: updatedProductIds
        })
      });

      if (res.ok) {
        setStatusMsg('Weekly menu updated successfully');
        fetchCurrentMenu();
      }
    } catch (err) {}
  };

  // Batch Generation Actions
  const toggleOrderSelection = (id) => {
    if (selectedOrdersForBatch.includes(id)) {
      setSelectedOrdersForBatch(selectedOrdersForBatch.filter(oId => oId !== id));
    } else {
      setSelectedOrdersForBatch([...selectedOrdersForBatch, id]);
    }
  };

  const generateBatch = async () => {
    if (selectedOrdersForBatch.length === 0) {
      alert('Select at least one order to build a production batch.');
      return;
    }

    if (batchActionType === 'existing' && !selectedExistingBatchId) {
      alert('Please select an existing draft batch to add orders to.');
      return;
    }

    try {
      const payload = {
        orderIds: selectedOrdersForBatch
      };

      if (batchActionType === 'existing') {
        payload.batchId = selectedExistingBatchId;
      } else {
        payload.date = bakeDate || new Date().toISOString().split('T')[0];
      }

      const res = await authFetch('/api/production/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMsg(batchActionType === 'existing' ? 'Orders successfully added to the existing draft batch!' : 'A new locked baking batch was generated successfully!');
        setSelectedOrdersForBatch([]);
        setSelectedExistingBatchId('');
        setBatchActionType('new');
        fetchBatches();
        fetchOrders();
        setActiveTab('batches');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to process batch operation');
      }
    } catch (err) {}
  };

  const getUniqueIngredients = () => {
    const baseList = [
      "Manitoba",
      "Whole Wheat",
      "Rye",
      "Buckwheat/Heljda",
      "Bread Flour",
      "Salt",
      "Sourdough Starter"
    ];
    const set = new Set(baseList);

    // Include all keys from database pantryStock
    if (pantryStock) {
      Object.keys(pantryStock).forEach(key => {
        if (key) set.add(key);
      });
    }

    products.forEach((p) => {
      if (p.variants) {
        p.variants.forEach((v) => {
          if (v.recipe) {
            let fBreakdown = [];
            if (v.recipe.floursBreakdown) {
              try {
                fBreakdown = typeof v.recipe.floursBreakdown === 'string'
                  ? JSON.parse(v.recipe.floursBreakdown)
                  : v.recipe.floursBreakdown;
              } catch (e) {}
            }
            if (Array.isArray(fBreakdown)) {
              fBreakdown.forEach((fb) => {
                if (fb && fb.name) {
                  set.add(fb.name);
                }
              });
            }

            let extras = [];
            if (v.recipe.extraIngredients) {
              try {
                extras = typeof v.recipe.extraIngredients === 'string'
                  ? JSON.parse(v.recipe.extraIngredients)
                  : v.recipe.extraIngredients;
              } catch (e) {}
            }
            if (Array.isArray(extras)) {
              extras.forEach((ex) => {
                if (ex && ex.name) {
                  set.add(ex.name);
                }
              });
            }
          }
        });
      }
    });

    return Array.from(set);
  };

  const getBatchOrders = () => {
    if (!orders) return [];
    if (selectedCalculationBatchId && selectedCalculationBatchId !== 'all') {
      return orders.filter(o => o.batchId === selectedCalculationBatchId);
    }
    const getMonday = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    const thisMonday = getMonday(new Date());
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);

    return orders.filter(o => {
      const isStatusValid = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'BAKED'].includes(o.status);
      const orderDate = new Date(o.createdAt);
      return isStatusValid && orderDate >= thisMonday && orderDate < nextMonday;
    });
  };

  const getBatchFinancialDetails = (b) => {
    if (!b || !b.orders) return { breakdown: [], totalCost: 0, revenue: 0, profit: 0, margin: 0 };

    const costs = ingredientCosts || {};
    const ingredientBreakdown = {};

    const addIngredient = (name, grams, type) => {
      if (!name) return;
      const unitCost = costs[name] !== undefined ? costs[name] : 1.50;
      const weightKg = grams / 1000;
      const itemCost = weightKg * unitCost;

      if (!ingredientBreakdown[name]) {
        ingredientBreakdown[name] = {
          name,
          grams: 0,
          totalCost: 0,
          type,
          unitCost
        };
      }
      ingredientBreakdown[name].grams += grams;
      ingredientBreakdown[name].totalCost += itemCost;
    };

    (b.orders || []).forEach((ord) => {
      if (!ord || !ord.items) return;
      ord.items.forEach((item) => {
        if (!item) return;
        const variant = item.productVariant;
        const recipe = variant?.recipe;
        const qty = item.quantity || 0;
        if (!recipe) return;

        // 1. Flour costing
        const flourWeightGrams = (recipe.flour || 0) * qty;
        let floursBreakdown = [];
        if (recipe.floursBreakdown) {
          try {
            floursBreakdown = typeof recipe.floursBreakdown === 'string'
              ? JSON.parse(recipe.floursBreakdown)
              : recipe.floursBreakdown;
          } catch (e) {
            floursBreakdown = [];
          }
        }

        if (Array.isArray(floursBreakdown) && floursBreakdown.length > 0) {
          floursBreakdown.forEach((fb) => {
            if (fb && fb.name && typeof fb.percentage === 'number') {
              const fbGrams = (fb.percentage / 100) * flourWeightGrams;
              addIngredient(fb.name, fbGrams, 'flour');
            }
          });
        } else if (flourWeightGrams > 0) {
          addIngredient('Bread Flour', flourWeightGrams, 'flour');
        }

        // 2. Starter costing
        const starterWeightGrams = (recipe.starter || 0) * qty;
        if (starterWeightGrams > 0) {
          addIngredient('Sourdough Starter', starterWeightGrams, 'starter');
        }

        // 3. Salt costing
        const saltWeightGrams = (recipe.salt || 0) * qty;
        if (saltWeightGrams > 0) {
          addIngredient('Salt', saltWeightGrams, 'salt');
        }

        // 4. Extras costing
        let extras = [];
        if (recipe.extraIngredients) {
          try {
            extras = typeof recipe.extraIngredients === 'string'
              ? JSON.parse(recipe.extraIngredients)
              : recipe.extraIngredients;
          } catch (e) {
            extras = [];
          }
        }

        if (Array.isArray(extras)) {
          extras.forEach((ex) => {
            if (ex && ex.name && typeof ex.grams === 'number') {
              const exGrams = ex.grams * qty;
              addIngredient(ex.name, exGrams, 'extra');
            }
          });
        }
      });
    });

    const breakdownList = Object.values(ingredientBreakdown).sort((a, b) => b.totalCost - a.totalCost);
    const totalCost = breakdownList.reduce((sum, item) => sum + item.totalCost, 0);

    const revenue = b.orders.reduce((sum, ord) => {
      const orderTotal = ord.items.reduce((acc, item) => {
        const price = item.productVariant?.price || 0;
        const qty = item.quantity || 0;
        const coupon = item.couponApplied || 0;
        return acc + price * Math.max(0, qty - coupon);
      }, 0);
      return sum + orderTotal;
    }, 0);

    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      breakdown: breakdownList,
      totalCost,
      revenue,
      profit,
      margin
    };
  };

  const getBatchCostItems = () => {
    if (!calculations || !calculations.summary) return [];
    const items = [];
    const costs = ingredientCosts || {};

    // 1. Flours
    const flours = calculations.summary.floursBreakdown || [];
    if (flours.length > 0) {
      flours.forEach(f => {
        const unitCost = costs[f.name] || 0;
        const weightKg = f.grams / 1000;
        const totalCost = weightKg * unitCost;
        items.push({
          name: f.name,
          type: 'flour',
          weightGrams: f.grams,
          weightKg,
          unitCost,
          totalCost
        });
      });
    } else if (calculations.summary.totalFlourGrams > 0) {
      const unitCost = costs['Bread Flour'] || 0;
      const weightKg = calculations.summary.totalFlourGrams / 1000;
      const totalCost = weightKg * unitCost;
      items.push({
        name: 'Bread Flour',
        type: 'flour',
        weightGrams: calculations.summary.totalFlourGrams,
        weightKg,
        unitCost,
        totalCost
      });
    }

    // 2. Starter
    if (calculations.summary.totalStarterGrams > 0) {
      const unitCost = costs['Sourdough Starter'] || 0;
      const weightKg = calculations.summary.totalStarterGrams / 1000;
      const totalCost = weightKg * unitCost;
      items.push({
        name: 'Sourdough Starter',
        type: 'starter',
        weightGrams: calculations.summary.totalStarterGrams,
        weightKg,
        unitCost,
        totalCost
      });
    }

    // 3. Salt
    if (calculations.summary.totalSaltGrams > 0) {
      const unitCost = costs['Salt'] || 0;
      const weightKg = calculations.summary.totalSaltGrams / 1000;
      const totalCost = weightKg * unitCost;
      items.push({
        name: 'Salt',
        type: 'salt',
        weightGrams: calculations.summary.totalSaltGrams,
        weightKg,
        unitCost,
        totalCost
      });
    }

    // 4. Extras
    const extras = calculations.summary.extras || [];
    extras.forEach(ex => {
      const unitCost = costs[ex.name] || 0;
      const weightKg = ex.grams / 1000;
      const totalCost = weightKg * unitCost;
      items.push({
        name: ex.name,
        type: 'extra',
        weightGrams: ex.grams,
        weightKg,
        unitCost,
        totalCost
      });
    });

    return items;
  };

  const calculateBatchCost = () => {
    const costItems = getBatchCostItems();
    return costItems.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const calculateBatchRevenue = () => {
    const batchOrders = getBatchOrders();
    return batchOrders.reduce((sum, o) => {
      const orderTotal = o.items.reduce((acc, item) => {
        const price = item.productVariant?.price || 0;
        const qty = item.quantity || 0;
        const coupon = item.couponApplied || 0;
        return acc + price * Math.max(0, qty - coupon);
      }, 0);
      return sum + orderTotal;
    }, 0);
  };

  const getBatchIngredientsRequired = () => {
    if (!calculations || !calculations.summary) return {};
    const reqGrams = {};

    // 1. Calculate additional flour requirements from starter feeding
    const feedingFloursMap = {};
    if (calculations.summary.startersBreakdown && calculations.summary.startersBreakdown.length > 0) {
      calculations.summary.startersBreakdown.forEach((sb) => {
        const target = Math.ceil(sb.grams);
        if (target <= 0) return;

        const activeStarterName = starterOverrides[sb.name] || sb.name;
        const profile = starters.find(s => s.name === activeStarterName) || {
          id: 'standard-starter',
          name: activeStarterName || 'Standard Sourdough Starter',
          seedParts: 1,
          flourParts: 2,
          waterParts: 2,
          floursBreakdown: [{ name: 'Manitoba', percentage: 100 }]
        };

        const isStandard = activeStarterName === 'Standard Sourdough Starter';
        const isMethodB = profile.feedingMethod === 'method-b';
        const reserveVal = parseFloat(starterReserve) || 0;
        const seedVal = parseFloat(availableStarterSeed) || 0;
        const totalTarget = target + reserveVal;

        let feedFlour = 0;

        if (isMethodB) {
          if (seedVal < totalTarget) {
            const remainingWeight = totalTarget - seedVal;
            const flourPart = profile.flourParts || 2;
            const waterPart = profile.waterParts || 2;
            const totalFeedParts = flourPart + waterPart;
            feedFlour = Math.ceil(remainingWeight * (flourPart / totalFeedParts));
          }
        } else {
          let seedPart = profile.seedParts || 1;
          let flourPart = profile.flourParts || 2;
          let waterPart = profile.waterParts || 2;

          if (isStandard) {
            const parts = starterPresetRatio.split(':').map(p => parseFloat(p));
            seedPart = parts[0] || 1;
            flourPart = parts[1] || 2;
            waterPart = parts[2] || 2;
          }

          const sumParts = seedPart + flourPart + waterPart;
          const reqSeed = Math.ceil(totalTarget / sumParts);
          feedFlour = Math.ceil(reqSeed * flourPart);
        }

        if (feedFlour > 0) {
          const floursBreakdown = profile.floursBreakdown || [{ name: 'Manitoba', percentage: 100 }];
          floursBreakdown.forEach((fb) => {
            const fbGrams = Math.ceil(feedFlour * (fb.percentage / 100));
            feedingFloursMap[fb.name] = (feedingFloursMap[fb.name] || 0) + fbGrams;
          });
        }
      });
    }

    // 2. Regular baking flours
    const flours = calculations.summary.floursBreakdown || [];
    if (flours.length > 0) {
      flours.forEach(f => {
        reqGrams[f.name] = (reqGrams[f.name] || 0) + f.grams;
      });
    } else if (calculations.summary.totalFlourGrams > 0) {
      reqGrams['Bread Flour'] = (reqGrams['Bread Flour'] || 0) + calculations.summary.totalFlourGrams;
    }

    // Combine feeding flours
    Object.entries(feedingFloursMap).forEach(([flourName, grams]) => {
      reqGrams[flourName] = (reqGrams[flourName] || 0) + grams;
    });

    // 3. Salt
    if (calculations.summary.totalSaltGrams > 0) {
      reqGrams['Salt'] = (reqGrams['Salt'] || 0) + calculations.summary.totalSaltGrams;
    }

    // 4. Extras
    const extras = calculations.summary.extras || [];
    extras.forEach(ex => {
      reqGrams[ex.name] = (reqGrams[ex.name] || 0) + ex.grams;
    });

    return reqGrams;
  };

  const handleDeductBatchIngredients = async (batchId) => {
    if (!batchId || batchId === 'all') {
      alert('Please select a specific batch first before performing inventory deductions.');
      return;
    }
    if (deductedBatches.includes(batchId)) {
      alert('This batch has already been deducted from your pantry stock!');
      return;
    }

    const reqGrams = getBatchIngredientsRequired();
    const items = Object.entries(reqGrams);
    if (items.length === 0) {
      alert('No ingredients required for this batch.');
      return;
    }

    const totalWeightKg = items.reduce((sum, [, g]) => sum + g, 0) / 1000;

    const confirmDeduct = window.confirm(
      `Are you sure you want to deduct ${totalWeightKg.toFixed(2)} kg of ingredients from your Micro-Pantry stock for this batch? This action cannot be undone.`
    );
    if (!confirmDeduct) return;

    setSavingSettings(true);
    setStatusMsg('');
    setErrorMessage('');

    try {
      // 1. Calculate new pantry stock levels
      const updatedStock = { ...pantryStock };
      items.forEach(([name, grams]) => {
        const requiredKg = grams / 1000;
        const currentKg = pantryStock[name] !== undefined ? pantryStock[name] : 0.0;
        // Clamp stock level at 0.0
        updatedStock[name] = Math.max(0, currentKg - requiredKg);
      });

      // 2. Save new stock to settings
      const resStock = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'pantryStock',
          value: JSON.stringify(updatedStock)
        })
      });

      if (!resStock.ok) {
        throw new Error('Failed to save updated stock levels.');
      }

      // 3. Add batchId to deducted list and save
      const updatedDeducted = [...deductedBatches, batchId];
      const resDeducted = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'deductedBatches',
          value: JSON.stringify(updatedDeducted)
        })
      });

      if (resDeducted.ok) {
        setPantryStock(updatedStock);
        setDeductedBatches(updatedDeducted);
        setStatusMsg('Ingredients successfully deducted from Micro-Pantry stock!');
      } else {
        throw new Error('Failed to save batch deduction status.');
      }
    } catch (err) {
      console.error('Error deducting ingredients:', err);
      setErrorMessage(err.message || 'An error occurred during inventory deduction.');
    } finally {
      setSavingSettings(false);
    }
  };

  const getBatchShortages = () => {
    if (!calculations || !calculations.summary) return [];
    const shortages = [];
    const stock = pantryStock || {};

    const checkShortage = (name, requiredGrams) => {
      const requiredKg = requiredGrams / 1000;
      const stockedKg = stock[name] !== undefined ? stock[name] : 0.0;
      if (requiredKg > stockedKg) {
        shortages.push({
          name,
          requiredKg,
          stockedKg,
          shortKg: requiredKg - stockedKg
        });
      }
    };

    // Calculate additional flour requirements from starter feeding
    const feedingFloursMap = {};
    if (calculations.summary.startersBreakdown && calculations.summary.startersBreakdown.length > 0) {
      calculations.summary.startersBreakdown.forEach((sb) => {
        const target = Math.ceil(sb.grams);
        if (target <= 0) return;

        const activeStarterName = starterOverrides[sb.name] || sb.name;
        const profile = starters.find(s => s.name === activeStarterName) || {
          id: 'standard-starter',
          name: activeStarterName || 'Standard Sourdough Starter',
          seedParts: 1,
          flourParts: 2,
          waterParts: 2,
          floursBreakdown: [{ name: 'Manitoba', percentage: 100 }]
        };

        const isStandard = activeStarterName === 'Standard Sourdough Starter';
        const isMethodB = profile.feedingMethod === 'method-b';
        const reserveVal = parseFloat(starterReserve) || 0;
        const seedVal = parseFloat(availableStarterSeed) || 0;
        const totalTarget = target + reserveVal;

        let feedFlour = 0;

        if (isMethodB) {
          if (seedVal < totalTarget) {
            const remainingWeight = totalTarget - seedVal;
            const flourPart = profile.flourParts || 2;
            const waterPart = profile.waterParts || 2;
            const totalFeedParts = flourPart + waterPart;
            feedFlour = Math.ceil(remainingWeight * (flourPart / totalFeedParts));
          }
        } else {
          let seedPart = profile.seedParts || 1;
          let flourPart = profile.flourParts || 2;
          let waterPart = profile.waterParts || 2;

          if (isStandard) {
            const parts = starterPresetRatio.split(':').map(p => parseFloat(p));
            seedPart = parts[0] || 1;
            flourPart = parts[1] || 2;
            waterPart = parts[2] || 2;
          }

          const sumParts = seedPart + flourPart + waterPart;
          const reqSeed = Math.ceil(totalTarget / sumParts);
          feedFlour = Math.ceil(reqSeed * flourPart);
        }

        if (feedFlour > 0) {
          const floursBreakdown = profile.floursBreakdown || [{ name: 'Manitoba', percentage: 100 }];
          floursBreakdown.forEach((fb) => {
            const fbGrams = Math.ceil(feedFlour * (fb.percentage / 100));
            feedingFloursMap[fb.name] = (feedingFloursMap[fb.name] || 0) + fbGrams;
          });
        }
      });
    }

    // 1. Flours (regular baking flours + feeding flours combined!)
    const flourGramsMap = {};
    const flours = calculations.summary.floursBreakdown || [];
    if (flours.length > 0) {
      flours.forEach(f => {
        flourGramsMap[f.name] = (flourGramsMap[f.name] || 0) + f.grams;
      });
    } else if (calculations.summary.totalFlourGrams > 0) {
      flourGramsMap['Bread Flour'] = (flourGramsMap['Bread Flour'] || 0) + calculations.summary.totalFlourGrams;
    }

    // Add feeding flours to the map
    Object.entries(feedingFloursMap).forEach(([flourName, grams]) => {
      flourGramsMap[flourName] = (flourGramsMap[flourName] || 0) + grams;
    });

    // Run checks for all aggregated flours
    Object.entries(flourGramsMap).forEach(([flourName, grams]) => {
      checkShortage(flourName, grams);
    });

    // 2. Starter
    // WE NO LONGER DO SHORTAGE CHECK FOR 'Sourdough Starter' DIRECTLY
    // because starter is made from raw feeding flours (which are now added to Flours check above!)

    // 3. Salt
    if (calculations.summary.totalSaltGrams > 0) {
      checkShortage('Salt', calculations.summary.totalSaltGrams);
    }

    // 4. Extras
    const extras = calculations.summary.extras || [];
    extras.forEach(ex => {
      checkShortage(ex.name, ex.grams);
    });

    return shortages;
  };

  const handleCopyShoppingList = () => {
    const shortages = getBatchShortages();
    if (shortages.length === 0) return;

    let batchLabel = '';
    if (selectedCalculationBatchId && selectedCalculationBatchId !== 'all') {
      const b = batches.find(x => x.id === selectedCalculationBatchId);
      if (b) {
        batchLabel = new Date(b.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    } else {
      batchLabel = 'Active Week';
    }

    let msg = `🛒 *Bakery Shopping List* (Batch: ${batchLabel})\n\n`;
    msg += `The following ingredients are short for this batch:\n`;
    shortages.forEach(s => {
      msg += `• ${s.name}: *${s.shortKg.toFixed(2)} kg* short (Required: ${s.requiredKg.toFixed(2)} kg, Stock: ${s.stockedKg.toFixed(2)} kg)\n`;
    });
    msg += `\nPlease purchase these items before baking! 🍞`;

    navigator.clipboard.writeText(msg).then(() => {
      setCopiedShoppingList(true);
      setTimeout(() => setCopiedShoppingList(false), 2500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleEditStockToggle = () => {
    if (!editingInventory) {
      setTempPantryStock({ ...pantryStock });
      setEditingInventory(true);
    } else {
      setEditingInventory(false);
    }
  };

  const handleSaveStock = () => {
    const cleaned = {};
    Object.keys(tempPantryStock).forEach(key => {
      const val = tempPantryStock[key];
      cleaned[key] = (val === '' || isNaN(parseFloat(val))) ? 0.0 : parseFloat(val);
    });
    savePantryStock(cleaned);
    setEditingInventory(false);
  };

  const handleEditCostsToggle = () => {
    if (!editingCosts) {
      setTempIngredientCosts({ ...ingredientCosts });
      setEditingCosts(true);
    } else {
      setEditingCosts(false);
    }
  };

  const handleSaveCosts = () => {
    const cleaned = {};
    Object.keys(tempIngredientCosts).forEach(key => {
      const val = tempIngredientCosts[key];
      cleaned[key] = (val === '' || isNaN(parseFloat(val))) ? 0.0 : parseFloat(val);
    });
    saveIngredientCosts(cleaned);
    setEditingCosts(false);
  };


  const handleUpdateBatchStatus = async (batchId, status) => {
    try {
      const res = await authFetch(`/api/production/batches/${batchId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setStatusMsg(`Batch status has been successfully updated to ${status}`);
        fetchBatches();
        fetchOrders();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to update batch status.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this production batch? This will unbatch all linked orders but will NOT delete the orders themselves.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`/api/production/batches/${batchId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatusMsg('Batch successfully deleted.');
        fetchBatches();
        fetchOrders();
        fetchCalculations('', selectedCalculationBatchId);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete batch');
      }
    } catch (err) {
      alert('Could not connect to database.');
    } finally {
      setLoading(false);
    }
  };

  // Label print trigger
  const handleLoadLabels = async (batchId) => {
    try {
      const res = await authFetch(`/api/production/batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBatch(data);
        setActiveTab('printing');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to load labels');
      }
    } catch (err) {
      console.error('Error loading labels:', err);
      alert('Could not connect to database or fetch label data.');
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };


  const handleGenerateSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/standing-orders/generate-orders', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMsg(`Successfully generated ${data.generatedCount} normal orders from active weekly subscriptions!`);
        fetchOrders();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to generate weekly standing orders.');
      }
    } catch (err) {
      setErrorMessage('Failed to trigger subscription generator.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic custom and standard flours aggregation for the recipe builder
  const baseFlours = enabledFlours;
  const existingFloursSet = new Set(baseFlours);

  // Scan all loaded products for custom flours
  products?.forEach(p => {
    p.variants?.forEach(v => {
      let fBreakdown = [];
      if (v.recipe?.floursBreakdown) {
        fBreakdown = typeof v.recipe.floursBreakdown === 'string'
          ? JSON.parse(v.recipe.floursBreakdown)
          : v.recipe.floursBreakdown;
      }
      if (Array.isArray(fBreakdown)) {
        fBreakdown.forEach(fb => {
          if (fb.name) existingFloursSet.add(fb.name);
        });
      }
    });
  });

  // Scan the current form state variants for custom flours
  newProduct.variants?.forEach(v => {
    v.recipe?.floursBreakdown?.forEach(fb => {
      if (fb.name) existingFloursSet.add(fb.name);
    });
  });

  // Include session flours
  sessionFlours.forEach(name => {
    if (name) existingFloursSet.add(name);
  });

  const availableFlours = Array.from(existingFloursSet).filter(Boolean);

  const getAvailableExtras = () => {
    const extrasSet = new Set();
    
    // Add keys from pantryStock that are not flours / salt / starter
    Object.keys(pantryStock || {}).forEach(key => {
      const kLower = key.toLowerCase();
      if (kLower === 'salt' || kLower.includes('starter')) return;
      
      const isFlour = availableFlours.some(f => f.toLowerCase() === kLower) ||
        kLower.includes('flour') || kLower.includes('wheat') || kLower.includes('rye') || 
        kLower.includes('manitoba') || kLower.includes('heljda') || kLower.includes('spelt') || 
        kLower.includes('semolina') || kLower.includes('brašno');
        
      if (!isFlour) {
        extrasSet.add(key);
      }
    });

    // Also scan existing products for extra ingredients
    products?.forEach(p => {
      p.variants?.forEach(v => {
        let extras = [];
        if (v.recipe?.extraIngredients) {
          try {
            extras = typeof v.recipe.extraIngredients === 'string'
              ? JSON.parse(v.recipe.extraIngredients)
              : v.recipe.extraIngredients;
          } catch (e) {}
        }
        if (Array.isArray(extras)) {
          extras.forEach(ex => {
            if (ex && ex.name) extrasSet.add(ex.name);
          });
        }
      });
    });

    // Scan current form state too
    newProduct.variants?.forEach(v => {
      v.recipe?.extraIngredients?.forEach(ex => {
        if (ex && ex.name) extrasSet.add(ex.name);
      });
    });

    return Array.from(extrasSet).filter(Boolean);
  };

  const availableExtras = getAvailableExtras();

  return (
    <div className="min-h-screen md:h-screen bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row md:overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 overflow-y-auto bg-slate-900 text-white flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <span className="text-3xl">🍞</span>
            <div>
              <h1 className="text-md font-extrabold text-bakery-400 uppercase tracking-tight">Artisan BakEngine</h1>
              <p className="text-[10px] text-slate-400">{t('adminCore')}</p>
            </div>
          </div>

          {/* Nav items */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'overview', label: t('overview'), icon: BarChart4 },
              { id: 'finances', label: t('finances', { defaultValue: 'Finances & Analytics' }), icon: DollarSign },
              { id: 'users', label: t('userApprovals'), icon: Users },
              { id: 'products', label: t('productRecipes'), icon: ChefHat },
              { id: 'menu', label: t('weeklyMenuPlanner'), icon: Calendar },
              { id: 'orders', label: t('bakingOrders'), icon: FileText },
              { id: 'batches', label: t('productionBatches'), icon: Layers },
              { id: 'subscriptions', label: t('standingSubscriptions'), icon: RotateCw },
              { id: 'loyalty', label: t('loyaltyTracker', { defaultValue: 'Loyalty Rewards' }), icon: Award },
              { id: 'dispatch', label: t('dispatchBoard', { defaultValue: 'Dispatch & Packing' }), icon: Package },
              { id: 'settings', label: t('settings'), icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                   key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setErrorMessage('');
                    setStatusMsg('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-bakery-500 text-white shadow-md shadow-bakery-500/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & exit */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">Marie Antoinette</span>
              <span className="text-[9px] uppercase tracking-wider text-bakery-400 font-extrabold">{t('bakeryOwner')}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded bg-slate-800 hover:bg-red-500 hover:text-white transition"
              title={t('logout')}
            >
              <LogOut size={14} />
            </button>
          </div>
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </aside>

      {/* Main container */}
      <main className="flex-1 md:h-screen md:overflow-y-auto overflow-x-hidden p-6 md:p-8">
        
        {/* Floating Toast Notification Overlay to stop page layout shifting */}
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none no-print">
          {statusMsg && (
            <div className="p-4 bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-3 shadow-2xl animate-toast-slide-in border border-emerald-400/20 pointer-events-auto">
              <CheckCircle2 size={18} className="text-white shrink-0" />
              <div className="flex-1 pr-2">{statusMsg}</div>
              <button onClick={() => setStatusMsg('')} className="text-white/80 hover:text-white transition font-bold text-base leading-none">&times;</button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-500 text-white rounded-2xl text-xs font-bold flex items-center gap-3 shadow-2xl animate-toast-slide-in border border-red-400/20 pointer-events-auto">
              <AlertCircle size={18} className="text-white shrink-0" />
              <div className="flex-1 pr-2">{errorMsg}</div>
              <button onClick={() => setErrorMessage('')} className="text-white/80 hover:text-white transition font-bold text-base leading-none">&times;</button>
            </div>
          )}
        </div>

        {/* 1. OVERVIEW SCREEN */}
        {activeTab === 'overview' && (
          <OverviewTab
            t={t}
            loading={loading}
            calculations={calculations}
            loadAllData={loadAllData}
            getBatchShortages={getBatchShortages}
            handleCopyShoppingList={handleCopyShoppingList}
            copiedShoppingList={copiedShoppingList}
            starterOverrides={starterOverrides}
            setStarterOverrides={setStarterOverrides}
            starterWasteFactor={starterWasteFactor}
            starterReserve={starterReserve}
            setStarterReserve={setStarterReserve}
            starters={starters}
            availableStarterSeed={availableStarterSeed}
            setAvailableStarterSeed={setAvailableStarterSeed}
            starterPresetRatio={starterPresetRatio}
            setStarterPresetRatio={setStarterPresetRatio}
            selectedCalculationBatchId={selectedCalculationBatchId}
            batches={batches}
            handleBatchFilterChange={handleBatchFilterChange}
            handleUpdateBatchStatus={handleUpdateBatchStatus}
            orders={orders}
            setRescheduleOrder={setRescheduleOrder}
            setRescheduleDate={setRescheduleDate}
            setShowRescheduleModal={setShowRescheduleModal}
            handleUnbatchOrder={handleUnbatchOrder}
            handleDeleteOrder={handleDeleteOrder}
            setWhatsappOrder={setWhatsappOrder}
            formatSlotLabel={formatSlotLabel}
            showOverviewFinancials={showOverviewFinancials}
            setShowOverviewFinancials={setShowOverviewFinancials}
            showMarginBreakdown={showMarginBreakdown}
            setShowMarginBreakdown={setShowMarginBreakdown}
            calculateBatchRevenue={calculateBatchRevenue}
            calculateBatchCost={calculateBatchCost}
            getBatchCostItems={getBatchCostItems}
          />
        )}

        {/* 2. USER APPROVALS GRID */}
        {activeTab === 'users' && (
          <div className="space-y-6 no-print">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('customerRegApprovals')}</h2>
              <p className="text-xs text-slate-500">{t('customerRegApprovalsDesc')}</p>
            </div>

            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">{t('customerName')}</th>
                      <th className="p-4">{t('emailAddressTable')}</th>
                      <th className="p-4">{t('accessStatusTable')}</th>
                      <th className="p-4">{t('assignedRoleTable')}</th>
                      <th className="p-4 text-right">{t('actionPanelTable')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-200/40 dark:hover:bg-slate-900/20 transition">
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{u.name}</td>
                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{u.email}</td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            u.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            u.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${u.role === 'ADMIN' ? 'text-bakery-600' : 'text-slate-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 flex gap-1.5 justify-end">
                          {u.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUserStatus(u.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-500 text-white rounded font-bold hover:bg-emerald-600 transition"
                            >
                              {t('approve')}
                            </button>
                          )}
                          {u.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleUserStatus(u.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition"
                            >
                              {t('reject')}
                            </button>
                          )}
                          {u.role !== 'ADMIN' ? (
                            <button
                              onClick={() => handleUserRole(u.id, 'ADMIN')}
                              className="px-2.5 py-1 bg-slate-700 text-white rounded font-bold hover:bg-slate-800 transition"
                            >
                              {t('makeAdmin')}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserRole(u.id, 'CUSTOMER')}
                              className="px-2.5 py-1 bg-slate-700 text-white rounded font-bold hover:bg-slate-800 transition"
                            >
                              {t('revokeAdmin')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRODUCT & RECIPE CREATOR */}
        {activeTab === 'products' && (
          <div className="space-y-6 no-print">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('productsCatalog')} & {t('productRecipes')}</h2>
                <p className="text-xs text-slate-500">{t('variantsAndRecipesDesc')}</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({
                    name: '',
                    description: '',
                    variants: [{ size: 'Medium', price: 9.0, recipe: { flour: 400, water: 280, starter: 80, salt: 8, extraIngredients: [] } }]
                  });
                  setBakersPercentages({ enabled: false, hydration: 64, starter: 20, salt: 2, extraIngredients: [] });
                  setShowProductModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-bakery-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-bakery-500/20 hover:bg-bakery-600 transition"
              >
                <Plus size={14} />
                {t('createNewProduct')}
              </button>
            </div>

            {/* Modal Form for Product and Recipes */}
            {showProductModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-md font-bold mb-4 text-slate-800 dark:text-white">
                    {editingProduct ? t('editProductTitle') : t('createArtisanProductTitle')}
                  </h3>

                  <div className="space-y-4">
                    {/* Basic info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('productNameLabel')}</label>
                        <input
                          type="text"
                          placeholder="e.g. Country Sourdough, Croissant"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full text-xs p-3 border rounded-xl dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('descriptionLabel')}</label>
                        <input
                          type="text"
                          placeholder="e.g. Traditional long-fermentation..."
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          className="w-full text-xs p-3 border rounded-xl dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                    </div>

                    {/* Baker's Percentages Tool */}
                    <div className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🧪</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-amber-400">{t('bakersPercentageTitle')}</h4>
                            <p className="text-[10px] text-slate-400">{t('bakersPercentageDesc')}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bakersPercentages.enabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setBakersPercentages({ ...bakersPercentages, enabled });
                              if (enabled) {
                                const updatedVariants = applyBakersPercentagesToVariants(
                                  bakersPercentages.hydration,
                                  bakersPercentages.starter,
                                  bakersPercentages.salt,
                                  bakersPercentages.extraIngredients
                                );
                                setNewProduct({ ...newProduct, variants: updatedVariants });
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {bakersPercentages.enabled && (
                        <div className="space-y-4 animate-rise">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('hydrationLabel')}</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={bakersPercentages.hydration}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      setBakersPercentages({ ...bakersPercentages, hydration: "" });
                                      const updated = applyBakersPercentagesToVariants(0, bakersPercentages.starter, bakersPercentages.salt, bakersPercentages.extraIngredients);
                                      setNewProduct({ ...newProduct, variants: updated });
                                    } else {
                                      const hydration = parseFloat(raw);
                                      if (!isNaN(hydration)) {
                                        setBakersPercentages({ ...bakersPercentages, hydration: raw });
                                        const updated = applyBakersPercentagesToVariants(hydration, bakersPercentages.starter, bakersPercentages.salt, bakersPercentages.extraIngredients);
                                        setNewProduct({ ...newProduct, variants: updated });
                                      }
                                    }
                                  }}
                                  className="w-full text-xs p-2 border rounded-xl dark:bg-slate-950 dark:border-slate-800 font-bold text-center"
                                />
                                <span className="text-slate-400 text-xs font-bold">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('starterLeavenLabel')}</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={bakersPercentages.starter}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      setBakersPercentages({ ...bakersPercentages, starter: "" });
                                      const updated = applyBakersPercentagesToVariants(bakersPercentages.hydration, 0, bakersPercentages.salt, bakersPercentages.extraIngredients);
                                      setNewProduct({ ...newProduct, variants: updated });
                                    } else {
                                      const starter = parseFloat(raw);
                                      if (!isNaN(starter)) {
                                        setBakersPercentages({ ...bakersPercentages, starter: raw });
                                        const updated = applyBakersPercentagesToVariants(bakersPercentages.hydration, starter, bakersPercentages.salt, bakersPercentages.extraIngredients);
                                        setNewProduct({ ...newProduct, variants: updated });
                                      }
                                    }
                                  }}
                                  className="w-full text-xs p-2 border rounded-xl dark:bg-slate-950 dark:border-slate-800 font-bold text-center"
                                />
                                <span className="text-slate-400 text-xs font-bold">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('fineSaltLabel')}</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={bakersPercentages.salt}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      setBakersPercentages({ ...bakersPercentages, salt: "" });
                                      const updated = applyBakersPercentagesToVariants(bakersPercentages.hydration, bakersPercentages.starter, 0, bakersPercentages.extraIngredients);
                                      setNewProduct({ ...newProduct, variants: updated });
                                    } else {
                                      const salt = parseFloat(raw);
                                      if (!isNaN(salt)) {
                                        setBakersPercentages({ ...bakersPercentages, salt: raw });
                                        const updated = applyBakersPercentagesToVariants(bakersPercentages.hydration, bakersPercentages.starter, salt, bakersPercentages.extraIngredients);
                                        setNewProduct({ ...newProduct, variants: updated });
                                      }
                                    }
                                  }}
                                  className="w-full text-xs p-2 border rounded-xl dark:bg-slate-950 dark:border-slate-800 font-bold text-center"
                                />
                                <span className="text-slate-400 text-xs font-bold">%</span>
                              </div>
                            </div>
                          </div>

                          {/* Extra Custom Percentage Ingredients */}
                          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">🧪 {t('formulaScaledExtras')}</span>
                              <button
                                type="button"
                                onClick={addExtraPercentageRow}
                                className="text-[10px] text-amber-600 hover:text-amber-700 hover:underline font-bold flex items-center gap-1"
                              >
                                <Plus size={10} /> {t('addCustomFormulaExtra')}
                              </button>
                            </div>

                            {(!bakersPercentages.extraIngredients || bakersPercentages.extraIngredients.length === 0) ? (
                              <p className="text-[10px] text-slate-400 italic">{t('noFormulaScaledExtras')}</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                {bakersPercentages.extraIngredients.map((ext, extIdx) => {
                                  const rowKey = `formula-${extIdx}`;
                                  const isCustomMode = editingCustomExtraRow === rowKey;

                                  return (
                                    <div key={extIdx} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                      {isCustomMode ? (
                                        <div className="flex-1 flex items-center gap-1">
                                          <input
                                            type="text"
                                            placeholder="Enter custom extra name..."
                                            value={ext.name || ''}
                                            onChange={(e) => updateExtraPercentageRow(extIdx, 'name', e.target.value)}
                                            className="text-[11px] p-1.5 border rounded-lg dark:bg-slate-950 dark:border-slate-800 flex-1 font-semibold bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-amber-500"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                setEditingCustomExtraRow(null);
                                                if (!ext.name || ext.name.trim() === '') {
                                                  updateExtraPercentageRow(extIdx, 'name', 'Chocolate');
                                                } else {
                                                  handleRegisterCustomExtra(ext.name);
                                                }
                                              }
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingCustomExtraRow(null);
                                              if (!ext.name || ext.name.trim() === '') {
                                                updateExtraPercentageRow(extIdx, 'name', 'Chocolate');
                                              } else {
                                                handleRegisterCustomExtra(ext.name);
                                              }
                                            }}
                                            className="p-1 text-emerald-500 hover:text-emerald-600 transition"
                                            title={t('saveAndSelect', { defaultValue: 'Apply custom extra' })}
                                          >
                                            <CheckCircle2 size={14} />
                                          </button>
                                        </div>
                                      ) : (
                                        <select
                                          value={ext.name || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '__ADD_CUSTOM__') {
                                              setEditingCustomExtraRow(rowKey);
                                              updateExtraPercentageRow(extIdx, 'name', '');
                                            } else {
                                              updateExtraPercentageRow(extIdx, 'name', val);
                                              handleRegisterCustomExtra(val);
                                            }
                                          }}
                                          className="text-[11px] p-1.5 border rounded-lg dark:bg-slate-950 dark:border-slate-800 flex-1 font-semibold text-slate-800 dark:text-slate-100 bg-transparent"
                                        >
                                          <option value="" disabled>{t('selectExtra', { defaultValue: 'Select extra...' })}</option>
                                          {availableExtras.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                          ))}
                                          <option value="__ADD_CUSTOM__" className="text-amber-600 font-bold dark:text-amber-400">
                                            ✨ {t('addCustomExtraOption', { defaultValue: '＋ Add custom extra...' })}
                                          </option>
                                        </select>
                                      )}
                                      <div className="flex items-center gap-1 w-24">
                                        <input
                                          type="number"
                                          step="0.1"
                                          placeholder="%"
                                          value={ext.percentage}
                                          onChange={(e) => updateExtraPercentageRow(extIdx, 'percentage', e.target.value)}
                                          className="w-16 text-[11px] p-1.5 border rounded-lg dark:bg-slate-950 dark:border-slate-800 font-bold text-center"
                                        />
                                        <span className="text-slate-400 text-[10px]">%</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeExtraPercentageRow(extIdx)}
                                        className="p-1 text-slate-400 hover:text-red-500 transition ml-auto"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Variant items and nested recipes */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">{t('sizeVariantsAndRecipes')}</span>
                        <button
                          onClick={addVariantFormRow}
                          className="text-[10px] text-bakery-500 hover:underline font-bold flex items-center gap-1"
                        >
                          <Plus size={12} />
                          {t('addVariantSize')}
                        </button>
                      </div>

                      {newProduct.variants.map((variant, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
                          <div className="lg:col-span-1">
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">{t('sizeNameLabel')}</label>
                            <input
                              type="text"
                              placeholder="e.g. Small (500g)"
                              value={variant.size}
                              onChange={(e) => {
                                const list = [...newProduct.variants];
                                list[idx].size = e.target.value;
                                setNewProduct({ ...newProduct, variants: list });
                              }}
                              className="w-full text-[11px] p-2 border rounded-lg dark:bg-slate-900"
                            />
                          </div>

                           <div className="lg:col-span-1">
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">{t('priceLabel')}</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="e.g. 9.00"
                              value={variant.price}
                              onChange={(e) => {
                                const rawVal = e.target.value;
                                const list = [...newProduct.variants];
                                list[idx].price = rawVal;
                                setNewProduct({ ...newProduct, variants: list });
                              }}
                              className="w-full text-[11px] p-2 border rounded-lg dark:bg-slate-900"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">{t('flourLabel')}</label>
                            <input
                              type="number"
                              value={variant.recipe.flour}
                              onChange={(e) => {
                                const rawVal = e.target.value;
                                const list = [...newProduct.variants];
                                list[idx].recipe.flour = rawVal;
                                if (rawVal !== '') {
                                  const flourVal = parseFloat(rawVal);
                                  if (!isNaN(flourVal) && bakersPercentages.enabled) {
                                    list[idx].recipe.water = Math.round(flourVal * (bakersPercentages.hydration / 100));
                                    list[idx].recipe.starter = Math.round(flourVal * (bakersPercentages.starter / 100));
                                    list[idx].recipe.salt = Math.round(flourVal * (bakersPercentages.salt / 100));
                                    list[idx].recipe.extraIngredients = (bakersPercentages.extraIngredients || []).map(ext => ({
                                      name: ext.name,
                                      grams: Math.round(flourVal * (parseFloat(ext.percentage) || 0) / 100)
                                    }));
                                  }
                                }
                                setNewProduct({ ...newProduct, variants: list });
                              }}
                              className="w-full text-[11px] p-2 border rounded-lg dark:bg-slate-900 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">{t('waterLabel')}</label>
                            <input
                              type="number"
                              value={variant.recipe.water}
                              readOnly={bakersPercentages.enabled}
                              onChange={(e) => {
                                const rawVal = e.target.value;
                                const list = [...newProduct.variants];
                                list[idx].recipe.water = rawVal;
                                setNewProduct({ ...newProduct, variants: list });
                              }}
                              className={`w-full text-[11px] p-2 border rounded-lg dark:bg-slate-900 font-bold ${bakersPercentages.enabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-80 text-slate-500' : ''}`}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">{t('starterLabel')}</label>
                            <input
                              type="number"
                              value={variant.recipe.starter}
                              readOnly={bakersPercentages.enabled}
                              onChange={(e) => {
                                const rawVal = e.target.value;
                                const list = [...newProduct.variants];
                                list[idx].recipe.starter = rawVal;
                                setNewProduct({ ...newProduct, variants: list });
                              }}
                              className={`w-full text-[11px] p-2 border rounded-lg dark:bg-slate-900 font-bold ${bakersPercentages.enabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-80 text-slate-500' : ''}`}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">
                              {t('starterTypeLabel', { defaultValue: 'Starter Type' })}
                            </label>
                            <select
                              value={variant.recipe.starterName || 'default'}
                              onChange={(e) => {
                                const list = [...newProduct.variants];
                                list[idx].recipe.starterName = e.target.value;
                                setNewProduct({ ...newProduct, variants: list });
                              }}
                              className="w-full text-[11px] p-2 border rounded-lg dark:bg-slate-900 bg-white font-bold text-slate-700 dark:text-slate-200"
                            >
                              <option value="default">{t('standardStarter', { defaultValue: 'Standard Starter' })}</option>
                              {starters.filter(s => s.id !== 'standard-starter').map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">{t('saltLabel')}</label>
                            <input
                              type="number"
                              value={variant.recipe.salt}
                              readOnly={bakersPercentages.enabled}
                              onChange={(e) => {
                                const rawVal = e.target.value;
                                const list = [...newProduct.variants];
                                list[idx].recipe.salt = rawVal;
                                setNewProduct({ ...newProduct, variants: list });
                              }}
                              className={`w-full text-[11px] p-2 border rounded-lg dark:bg-slate-900 font-bold ${bakersPercentages.enabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-80 text-slate-500' : ''}`}
                            />
                          </div>

                          <div className="col-span-full border-t border-slate-200 dark:border-slate-800/60 pt-3 mt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">🌾 {t('flourBreakdownTitle')}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...newProduct.variants];
                                  const fb = list[idx].recipe.floursBreakdown || [];
                                  list[idx].recipe.floursBreakdown = [...fb, { name: 'Manitoba', percentage: 0 }];
                                  setNewProduct({ ...newProduct, variants: list });
                                }}
                                className="text-[10px] text-amber-600 hover:text-amber-700 hover:underline font-bold flex items-center gap-1"
                              >
                                <Plus size={10} /> {t('addFlourType')}
                              </button>
                            </div>
                            
                            {(!variant.recipe.floursBreakdown || variant.recipe.floursBreakdown.length === 0) ? (
                              <p className="text-[10px] text-slate-400 italic">{t('noFlourBreakdown')}</p>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {variant.recipe.floursBreakdown.map((fb, fbIdx) => {
                                    const rowKey = `${idx}-${fbIdx}`;
                                    const isCustomMode = editingCustomRow === rowKey;

                                    return (
                                      <div key={fbIdx} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        {isCustomMode ? (
                                          <div className="flex-1 flex items-center gap-1">
                                            <input
                                              type="text"
                                              value={fb.name}
                                              onChange={(e) => {
                                                const list = [...newProduct.variants];
                                                list[idx].recipe.floursBreakdown[fbIdx].name = e.target.value;
                                                setNewProduct({ ...newProduct, variants: list });
                                              }}
                                              placeholder={t('customFlourPlaceholder', { defaultValue: 'Enter flour...' })}
                                              className="text-[11px] p-1.5 border rounded-lg dark:bg-slate-900 dark:border-slate-800 flex-1 font-medium bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-amber-500"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  setEditingCustomRow(null);
                                                  if (!fb.name || fb.name.trim() === '') {
                                                    const list = [...newProduct.variants];
                                                    list[idx].recipe.floursBreakdown[fbIdx].name = 'Manitoba';
                                                    setNewProduct({ ...newProduct, variants: list });
                                                  } else {
                                                    handleRegisterCustomFlour(fb.name);
                                                  }
                                                }
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCustomRow(null);
                                                if (!fb.name || fb.name.trim() === '') {
                                                  const list = [...newProduct.variants];
                                                  list[idx].recipe.floursBreakdown[fbIdx].name = 'Manitoba';
                                                  setNewProduct({ ...newProduct, variants: list });
                                                } else {
                                                  handleRegisterCustomFlour(fb.name);
                                                }
                                              }}
                                              className="p-1 text-emerald-500 hover:text-emerald-600 transition"
                                              title={t('saveAndSelect', { defaultValue: 'Apply custom flour' })}
                                            >
                                              <CheckCircle2 size={14} />
                                            </button>
                                          </div>
                                        ) : (
                                          <select
                                            value={fb.name}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === '__ADD_CUSTOM__') {
                                                setEditingCustomRow(rowKey);
                                                const list = [...newProduct.variants];
                                                list[idx].recipe.floursBreakdown[fbIdx].name = '';
                                                setNewProduct({ ...newProduct, variants: list });
                                              } else {
                                                const list = [...newProduct.variants];
                                                list[idx].recipe.floursBreakdown[fbIdx].name = val;
                                                setNewProduct({ ...newProduct, variants: list });
                                              }
                                            }}
                                            className="text-[11px] p-1.5 border rounded-lg dark:bg-slate-900 dark:border-slate-800 flex-1 font-semibold"
                                          >
                                            {availableFlours.map(name => (
                                              <option key={name} value={name}>{name}</option>
                                            ))}
                                            <option value="__ADD_CUSTOM__" className="text-amber-600 font-bold dark:text-amber-400">
                                              ✨ {t('addCustomFlourOption', { defaultValue: '＋ Add custom flour...' })}
                                            </option>
                                          </select>
                                        )}
                                      <div className="flex items-center gap-1 w-20">
                                        <input
                                          type="number"
                                          placeholder="%"
                                          value={fb.percentage}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            const list = [...newProduct.variants];
                                            list[idx].recipe.floursBreakdown[fbIdx].percentage = rawVal;
                                            setNewProduct({ ...newProduct, variants: list });
                                          }}
                                          className="w-12 text-[11px] p-1.5 border rounded-lg dark:bg-slate-900 font-bold text-center"
                                        />
                                        <span className="text-slate-400 text-[10px]">%</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...newProduct.variants];
                                          list[idx].recipe.floursBreakdown = list[idx].recipe.floursBreakdown.filter((_, i) => i !== fbIdx);
                                          setNewProduct({ ...newProduct, variants: list });
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-500 transition ml-auto"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                                </div>
                                
                                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-2 mt-1.5">
                                  <span>{t('totalRatio')}</span>
                                  <span className={variant.recipe.floursBreakdown.reduce((sum, f) => sum + (parseFloat(f.percentage) || 0), 0) === 100 ? 'text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md' : 'text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-md'}>
                                    {variant.recipe.floursBreakdown.reduce((sum, f) => sum + (parseFloat(f.percentage) || 0), 0)}%
                                  </span>
                                  {variant.recipe.floursBreakdown.reduce((sum, f) => sum + (parseFloat(f.percentage) || 0), 0) !== 100 && (
                                    <span className="text-rose-400 font-normal">(must equal 100%)</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enrichments & Fillings (Extras) Subsection */}
                          <div className="col-span-full border-t border-slate-200 dark:border-slate-800/60 pt-3 mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">🧪 {t('enrichmentsFillingsExtras')}</span>
                              {!bakersPercentages.enabled && (
                                <button
                                  type="button"
                                  onClick={() => addManualExtraIngredient(idx)}
                                  className="text-[10px] text-amber-600 hover:text-amber-700 hover:underline font-bold flex items-center gap-1"
                                >
                                  <Plus size={10} /> {t('addExtraIngredient')}
                                </button>
                              )}
                            </div>

                            {bakersPercentages.enabled ? (
                              // Formula Mode: Read-Only Badges
                              (!variant.recipe.extraIngredients || variant.recipe.extraIngredients.length === 0) ? (
                                <p className="text-[10px] text-slate-400 italic">{t('noExtrasFormula')}</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {variant.recipe.extraIngredients.map((ext, extIdx) => {
                                    // Match against the percentage in state
                                    const percentObj = (bakersPercentages.extraIngredients || []).find(pExt => pExt.name === ext.name);
                                    const percentVal = percentObj ? percentObj.percentage : 0;
                                    return (
                                      <span key={extIdx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-700 dark:text-amber-400 animate-rise">
                                        🧪 {ext.name}: {ext.grams}g ({percentVal}%)
                                      </span>
                                    );
                                  })}
                                </div>
                              )
                            ) : (
                              // Manual Mode: Editable Rows
                              (!variant.recipe.extraIngredients || variant.recipe.extraIngredients.length === 0) ? (
                                <p className="text-[10px] text-slate-400 italic">{t('noExtrasManual')}</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-rise">
                                  {variant.recipe.extraIngredients.map((ext, extIdx) => {
                                    const rowKey = `manual-${idx}-${extIdx}`;
                                    const isCustomMode = editingCustomExtraRow === rowKey;

                                    return (
                                      <div key={extIdx} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        {isCustomMode ? (
                                          <div className="flex-1 flex items-center gap-1">
                                            <input
                                              type="text"
                                              placeholder="Enter custom extra name..."
                                              value={ext.name || ''}
                                              onChange={(e) => updateManualExtraIngredient(idx, extIdx, 'name', e.target.value)}
                                              className="text-[11px] p-1.5 border rounded-lg dark:bg-slate-900 dark:border-slate-800 flex-1 font-medium bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-amber-500"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  setEditingCustomExtraRow(null);
                                                  if (!ext.name || ext.name.trim() === '') {
                                                    updateManualExtraIngredient(idx, extIdx, 'name', 'Chocolate');
                                                  } else {
                                                    handleRegisterCustomExtra(ext.name);
                                                  }
                                                }
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCustomExtraRow(null);
                                                if (!ext.name || ext.name.trim() === '') {
                                                  updateManualExtraIngredient(idx, extIdx, 'name', 'Chocolate');
                                                } else {
                                                  handleRegisterCustomExtra(ext.name);
                                                }
                                              }}
                                              className="p-1 text-emerald-500 hover:text-emerald-600 transition"
                                              title={t('saveAndSelect', { defaultValue: 'Apply custom extra' })}
                                            >
                                              <CheckCircle2 size={14} />
                                            </button>
                                          </div>
                                        ) : (
                                          <select
                                            value={ext.name || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === '__ADD_CUSTOM__') {
                                                setEditingCustomExtraRow(rowKey);
                                                updateManualExtraIngredient(idx, extIdx, 'name', '');
                                              } else {
                                                updateManualExtraIngredient(idx, extIdx, 'name', val);
                                                handleRegisterCustomExtra(val);
                                              }
                                            }}
                                            className="text-[11px] p-1.5 border rounded-lg dark:bg-slate-900 dark:border-slate-800 flex-1 font-semibold text-slate-800 dark:text-slate-100 bg-transparent"
                                          >
                                            <option value="" disabled>{t('selectExtra', { defaultValue: 'Select extra...' })}</option>
                                            {availableExtras.map(name => (
                                              <option key={name} value={name}>{name}</option>
                                            ))}
                                            <option value="__ADD_CUSTOM__" className="text-amber-600 font-bold dark:text-amber-400">
                                              ✨ {t('addCustomExtraOption', { defaultValue: '＋ Add custom extra...' })}
                                            </option>
                                          </select>
                                        )}
                                        <div className="flex items-center gap-1 w-20">
                                          <input
                                            type="number"
                                            placeholder="Weight"
                                            value={ext.grams}
                                            onChange={(e) => {
                                              updateManualExtraIngredient(idx, extIdx, 'grams', e.target.value);
                                            }}
                                            className="w-12 text-[11px] p-1.5 border rounded-lg dark:bg-slate-950 dark:border-slate-800 font-bold text-center"
                                          />
                                          <span className="text-slate-400 text-[10px]">g</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removeManualExtraIngredient(idx, extIdx)}
                                          className="p-1 text-slate-400 hover:text-red-500 transition ml-auto"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button
                      onClick={() => {
                        setShowProductModal(false);
                        setEditingProduct(null);
                      }}
                      className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-100"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={saveProduct}
                      className="px-4 py-2 bg-bakery-500 text-white rounded-xl text-xs font-bold hover:bg-bakery-600"
                    >
                      {t('saveProductDetails')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List of existing products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((p) => (
                <div key={p.id} className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{p.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditProductClick(p)}
                        className="px-2 py-1 bg-slate-700 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Size Variants and formulas list */}
                  <div className="space-y-3">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">{t('recipesPerVariant')}</span>
                    {p.variants.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          <span>{v.size}</span>
                          <span className="text-bakery-600 font-black">${v.price.toFixed(2)}</span>
                        </div>
                        
                        {v.recipe ? (
                          (() => {
                            const flours = typeof v.recipe.floursBreakdown === 'string' ? JSON.parse(v.recipe.floursBreakdown) : (v.recipe.floursBreakdown || []);
                            const extras = typeof v.recipe.extraIngredients === 'string' ? JSON.parse(v.recipe.extraIngredients) : (v.recipe.extraIngredients || []);
                            return (
                              <div>
                                <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold text-slate-500">
                                  <div>{t('flourText')}: <span className="font-bold text-slate-800 dark:text-slate-200">{v.recipe.flour}g</span></div>
                                  <div>{t('waterText')}: <span className="font-bold text-slate-800 dark:text-slate-200">{v.recipe.water}g</span></div>
                                  <div>
                                    {t('starterText')}: <span className="font-bold text-slate-800 dark:text-slate-200">{v.recipe.starter}g</span>
                                    {v.recipe.starterName && v.recipe.starterName !== 'default' && (
                                      <span className="text-[8px] text-amber-500 font-extrabold block truncate mt-0.5" title={v.recipe.starterName}>
                                        {v.recipe.starterName}
                                      </span>
                                    )}
                                  </div>
                                  <div>{t('saltText')}: <span className="font-bold text-slate-800 dark:text-slate-200">{v.recipe.salt}g</span></div>
                                </div>
                                
                                {(flours.length > 0 || extras.length > 0) && (
                                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 flex flex-col gap-1.5">
                                    {flours.length > 0 && (
                                      <div className="flex flex-wrap gap-1 items-center">
                                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">{t('floursText')}:</span>
                                        {flours.map((f, fIdx) => (
                                          <span key={fIdx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                            {f.name} ({f.percentage}%)
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {extras.length > 0 && (
                                      <div className="flex flex-wrap gap-1 items-center">
                                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">{t('extrasText')}:</span>
                                        {extras.map((ext, extIdx) => (
                                          <span key={extIdx} className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                            {ext.name}: {ext.grams}g
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-red-500 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle size={10} /> {t('recipeUndefined')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. WEEKLY MENU PLANNER */}
        {activeTab === 'menu' && (
          <div className="space-y-6 no-print">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('weeklyMenuPublisher')}</h2>
              <p className="text-xs text-slate-500">{t('weeklyMenuPublisherDesc')}</p>
            </div>

            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/60 p-6 shadow-lg">
              <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="text-bakery-500" />
                {t('selectProductsMonday')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => {
                  const isChecked = menu?.products?.some(prod => prod.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleToggleMenuProduct(p.id)}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition duration-300 ${
                        isChecked 
                          ? 'bg-bakery-500/5 dark:bg-bakery-500/10 border-bakery-500/60 ring-2 ring-bakery-500/20' 
                          : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition mt-0.5 ${
                        isChecked ? 'bg-bakery-500 border-bakery-500 text-white' : 'border-slate-300'
                      }`}>
                        {isChecked && '✓'}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold block text-xs text-slate-800 dark:text-slate-100">{p.name}</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{p.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. BAKING ORDERS LIST & BATCH BUILDER */}
        {activeTab === 'orders' && (
          <OrdersTab
            t={t}
            orders={orders}
            batches={batches}
            updatingOrderIds={updatingOrderIds}
            selectedOrdersForBatch={selectedOrdersForBatch}
            setSelectedOrdersForBatch={setSelectedOrdersForBatch}
            batchActionType={batchActionType}
            setBatchActionType={setBatchActionType}
            bakeDate={bakeDate}
            setBakeDate={setBakeDate}
            selectedExistingBatchId={selectedExistingBatchId}
            setSelectedExistingBatchId={setSelectedExistingBatchId}
            toggleOrderSelection={toggleOrderSelection}
            generateBatch={generateBatch}
            formatSlotLabel={formatSlotLabel}
            setRescheduleOrder={setRescheduleOrder}
            setRescheduleDate={setRescheduleDate}
            setShowRescheduleModal={setShowRescheduleModal}
            handleUnbatchOrder={handleUnbatchOrder}
            handleDeleteOrder={handleDeleteOrder}
            setWhatsappOrder={setWhatsappOrder}
            handleOrderStatus={handleOrderStatus}
            showInternalOrderModal={showInternalOrderModal}
            setShowInternalOrderModal={setShowInternalOrderModal}
            starters={starters}
          />
        )}

        {/* 6. PRODUCTION BATCH LIST PANEL */}
        {activeTab === 'batches' && (
          <div className="space-y-6 no-print">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('relationalProductionRuns')}</h2>
              <p className="text-xs text-slate-500">{t('relationalProductionRunsDesc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batches.map((b) => {
                const totalDough = b.orders.reduce((sum, ord) => {
                  return sum + ord.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
                }, 0);

                // Calculate Batch costing and revenue dynamically
                let totalFlourCost = 0;
                let totalStarterCost = 0;
                let totalSaltCost = 0;
                let totalExtrasCost = 0;

                const costs = ingredientCosts || {};

                b.orders.forEach((ord) => {
                  ord.items.forEach((item) => {
                    const variant = item.productVariant;
                    const recipe = variant?.recipe;
                    const qty = item.quantity || 0;
                    if (!recipe) return;

                    // 1. Flour costing
                    const flourWeightGrams = (recipe.flour || 0) * qty;
                    const flourWeightKg = flourWeightGrams / 1000;
                    let floursBreakdown = [];
                    if (recipe.floursBreakdown) {
                      try {
                        floursBreakdown = typeof recipe.floursBreakdown === 'string'
                          ? JSON.parse(recipe.floursBreakdown)
                          : recipe.floursBreakdown;
                      } catch (e) {
                        floursBreakdown = [];
                      }
                    }

                    if (Array.isArray(floursBreakdown) && floursBreakdown.length > 0) {
                      floursBreakdown.forEach((fb) => {
                        if (fb && fb.name && typeof fb.percentage === 'number') {
                          const fbWeightKg = (fb.percentage / 100) * flourWeightKg;
                          const unitCost = costs[fb.name] || 0;
                          totalFlourCost += fbWeightKg * unitCost;
                        }
                      });
                    } else {
                      const unitCost = costs['Bread Flour'] || 0;
                      totalFlourCost += flourWeightKg * unitCost;
                    }

                    // 2. Starter costing
                    const starterWeightGrams = (recipe.starter || 0) * qty;
                    const starterWeightKg = starterWeightGrams / 1000;
                    const starterUnitCost = costs['Sourdough Starter'] || 0;
                    totalStarterCost += starterWeightKg * starterUnitCost;

                    // 3. Salt costing
                    const saltWeightGrams = (recipe.salt || 0) * qty;
                    const saltWeightKg = saltWeightGrams / 1000;
                    const saltUnitCost = costs['Salt'] || 0;
                    totalSaltCost += saltWeightKg * saltUnitCost;

                    // 4. Extras costing
                    let extras = [];
                    if (recipe.extraIngredients) {
                      try {
                        extras = typeof recipe.extraIngredients === 'string'
                          ? JSON.parse(recipe.extraIngredients)
                          : recipe.extraIngredients;
                      } catch (e) {
                        extras = [];
                      }
                    }

                    if (Array.isArray(extras)) {
                      extras.forEach((ex) => {
                        if (ex && ex.name && typeof ex.grams === 'number') {
                          const exWeightKg = (ex.grams * qty) / 1000;
                          const unitCost = costs[ex.name] || 0;
                          totalExtrasCost += exWeightKg * unitCost;
                        }
                      });
                    }
                  });
                });

                const batchCost = totalFlourCost + totalStarterCost + totalSaltCost + totalExtrasCost;

                const batchRevenue = b.orders.reduce((sum, ord) => {
                  const orderTotal = ord.items.reduce((acc, item) => {
                    const price = item.productVariant?.price || 0;
                    const qty = item.quantity || 0;
                    const coupon = item.couponApplied || 0;
                    return acc + price * Math.max(0, qty - coupon);
                  }, 0);
                  return sum + orderTotal;
                }, 0);

                const batchProfit = batchRevenue - batchCost;
                const batchMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;

                return (
                  <div key={b.id} className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{t('bakeDate')} {new Date(b.date).toLocaleDateString()}</h3>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">{t('batchUid')} #{b.id.slice(0, 8).toUpperCase()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === 'DRAFT' && (
                          <span className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 text-[10px] px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1 border border-slate-200 dark:border-slate-800 uppercase tracking-wider shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t('draft')}
                          </span>
                        )}
                        {(b.status === 'IN_PRODUCTION' || b.status === 'LOCKED') && (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1 border border-amber-200/40 dark:border-amber-900/30 uppercase tracking-wider shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {t('inProduction', { defaultValue: 'Production' })}
                          </span>
                        )}
                        {b.status === 'BAKED' && (
                          <span className="bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 text-[10px] px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1 border border-sky-200/40 dark:border-sky-900/30 uppercase tracking-wider shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> {t('baked', { defaultValue: 'Baked' })}
                          </span>
                        )}
                        {b.status === 'COMPLETED' && (
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1 border border-emerald-200/40 dark:border-emerald-900/30 uppercase tracking-wider shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('completed', { defaultValue: 'Completed' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>{t('ordersLinked')} <span className="font-bold text-slate-800 dark:text-slate-200">{b.orders.length}</span></div>
                        <div>{t('estLoavesCount')} <span className="font-bold text-slate-800 dark:text-slate-200">{totalDough} items</span></div>
                      </div>

                      {/* Premium Dynamic Financial Performance Panel */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs">
                        <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 block mb-2">{t('batchFinancials', { defaultValue: 'Financial Performance' })}</span>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="border-r border-slate-200/60 dark:border-slate-800/60">
                            <span className="text-[10px] text-slate-400 block">{t('grossSales', { defaultValue: 'Sales' })}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">€{batchRevenue.toFixed(2)}</span>
                          </div>
                          <div className="border-r border-slate-200/60 dark:border-slate-800/60">
                            <span className="text-[10px] text-slate-400 block">{t('rawCostsLabel', { defaultValue: 'Costs' })}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">€{batchCost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t('netProfit', { defaultValue: 'Net Profit' })}</span>
                            <span className={`font-extrabold block ${batchProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                              €{batchProfit.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-medium">({batchMargin.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 pt-3 border-t">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('batchStatusFlow', { defaultValue: 'Batch Status Pipeline' })}</span>
                          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
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
                                  className={`py-1.5 px-1 rounded-lg text-[9px] tracking-wide uppercase transition duration-150 active:scale-95 text-center ${activeClass}`}
                                >
                                  {st === 'DRAFT' ? t('draft') : st === 'IN_PRODUCTION' ? t('inProductionShort', { defaultValue: 'Prod' }) : st === 'BAKED' ? t('bakedShort', { defaultValue: 'Bake' }) : t('doneShort', { defaultValue: 'Done' })}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-2 items-center flex-wrap pt-2 border-t border-dashed border-slate-150 dark:border-slate-800/40">

                        <button
                          onClick={() => handleDeleteBatch(b.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 rounded-xl text-[11px] font-bold transition"
                          title={t('delete', { defaultValue: 'Delete' })}
                        >
                          <Trash2 size={12} /> {t('delete', { defaultValue: 'Delete' })}
                        </button>

                        <button
                          onClick={() => handleOpenBulkWhatsapp(b.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-bold hover:bg-emerald-700 transition ml-auto"
                        >
                          <MessageSquare size={12} /> {t('bulkWhatsapp', { defaultValue: 'Bulk WhatsApp' })}
                        </button>

                        <button
                          onClick={() => handleLoadLabels(b.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-bakery-500 text-white rounded-xl text-[11px] font-bold hover:bg-bakery-600 transition"
                        >
                          <Printer size={12} /> {t('loadLabels')}
                        </button>

                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dedicated Finances & Analytics Tab */}
        {activeTab === 'finances' && (() => {
          const getFilteredBatches = () => {
            let list = [...batches];
            if (financeSearchDate) {
              list = list.filter((b) => {
                const dateStr = new Date(b.date).toLocaleDateString();
                const isoStr = new Date(b.date).toISOString().slice(0, 10);
                return dateStr.toLowerCase().includes(financeSearchDate.toLowerCase()) || 
                       isoStr.includes(financeSearchDate);
              });
            }
            const now = new Date();
            list = list.filter((b) => {
              const bDate = new Date(b.date);
              if (financeTimeFilter === '30days') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                return bDate >= thirtyDaysAgo;
              }
              if (financeTimeFilter === '90days') {
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(now.getDate() - 90);
                return bDate >= ninetyDaysAgo;
              }
              if (financeTimeFilter === 'month') {
                return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
              }
              if (financeTimeFilter === 'prev_month') {
                const prev = new Date();
                prev.setMonth(now.getMonth() - 1);
                return bDate.getMonth() === prev.getMonth() && bDate.getFullYear() === prev.getFullYear();
              }
              return true; // 'all'
            });
            return list.sort((a, b) => new Date(b.date) - new Date(a.date));
          };

          const filteredBatchesList = getFilteredBatches();

          const exportToCSV = () => {
            const headers = ["Batch Date", "UID", "Gross Sales (EUR)", "Material Cost (EUR)", "Net Profit (EUR)", "Margin (%)"];
            const rows = filteredBatchesList.map((b) => {
              const details = getBatchFinancialDetails(b);
              return [
                new Date(b.date).toLocaleDateString(),
                `#${b.id.slice(0, 8).toUpperCase()}`,
                details.revenue.toFixed(2),
                details.totalCost.toFixed(2),
                details.profit.toFixed(2),
                details.margin.toFixed(1)
              ];
            });

            const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Bakery_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          const totalStats = filteredBatchesList.reduce((acc, b) => {
            const details = getBatchFinancialDetails(b);
            acc.revenue += details.revenue;
            acc.cost += details.totalCost;
            acc.profit += details.profit;
            return acc;
          }, { revenue: 0, cost: 0, profit: 0 });

          const averageMargin = totalStats.revenue > 0 ? (totalStats.profit / totalStats.revenue) * 100 : 0;

          return (
            <div className="space-y-6 no-print">
              {/* Header and Controls */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                    📈 {t('financesTitle', { defaultValue: 'Finances & Analytics' })}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t('financesSubtitle', { defaultValue: 'Track revenue, constituent material unit pricing, and net profit margins across your bakes.' })}
                  </p>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-1.5 bg-bakery-500 hover:bg-bakery-600 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-bakery-500/10 hover:shadow-bakery-500/25 transition duration-200"
                    title="Export Ledger to CSV"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Range:</span>
                    <select
                      value={financeTimeFilter}
                      onChange={(e) => setFinanceTimeFilter(e.target.value)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
                    >
                      <option value="all">📁 All Time</option>
                      <option value="month">📅 This Month</option>
                      <option value="prev_month">⏳ Last Month</option>
                      <option value="30days">🚀 Last 30 Days</option>
                      <option value="90days">🪐 Last 90 Days</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
                    <Search size={12} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search bake date..."
                      value={financeSearchDate}
                      onChange={(e) => setFinanceSearchDate(e.target.value)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none w-36"
                    />
                    {financeSearchDate && (
                      <button onClick={() => setFinanceSearchDate('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-emerald-50/10 dark:from-slate-900 dark:to-emerald-950/5 shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gross Sales</span>
                  <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">€{totalStats.revenue.toFixed(2)}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Total revenue from filtered bakes</div>
                </div>

                {/* Costs Card */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-rose-50/10 dark:from-slate-900 dark:to-rose-950/5 shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Material Expenses</span>
                  <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">€{totalStats.cost.toFixed(2)}</div>
                  <div className="text-[10px] text-rose-500 font-bold mt-1">Sum of all wholesale ingredient costs</div>
                </div>

                {/* Net Profit Card */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-sky-50/10 dark:from-slate-900 dark:to-sky-950/5 shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Net Profit</span>
                  <div className={`text-2xl font-black mt-1 ${totalStats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    €{totalStats.profit.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1">Gross sales minus ingredient costs</div>
                </div>

                {/* Profit Margin Card */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-amber-50/10 dark:from-slate-900 dark:to-amber-950/5 shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avg Profit Margin</span>
                  <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{averageMargin.toFixed(1)}%</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1">Overall profitability percentage</div>
                </div>
              </div>

              {/* Main Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chronological Bake Ledger (Left 2/3) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Chronological Bake Ledger</h3>
                    <span className="text-[10px] text-slate-400 font-bold">{filteredBatchesList.length} bakes found</span>
                  </div>

                  {filteredBatchesList.length === 0 ? (
                    <div className="glass-panel rounded-3xl p-8 text-center text-xs text-slate-500 border border-dashed dark:border-slate-800">
                      No bakes compiled in this selected time range or date search.
                    </div>
                  ) : (
                    filteredBatchesList.map((b) => {
                      const financials = getBatchFinancialDetails(b);
                      const isExpanded = expandedFinancialBatchId === b.id;

                      return (
                        <div
                          key={b.id}
                          className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition overflow-hidden"
                        >
                          {/* Card Summary Header */}
                          <div
                            onClick={() => setExpandedFinancialBatchId(isExpanded ? null : b.id)}
                            className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                                  📅 {new Date(b.date).toLocaleDateString()}
                                </h4>
                                {b.status === 'LOCKED' ? (
                                  <span className="bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-0.5 border border-red-100/40 dark:border-red-900/20">
                                    <Lock size={8} /> {t('locked')}
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-0.5 border border-slate-200/40 dark:border-slate-700/20">
                                    <Unlock size={8} /> {t('draft')}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">UID: #{b.id.slice(0, 8).toUpperCase()}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-6">
                              <div className="text-right">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Sales</span>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">€{financials.revenue.toFixed(2)}</span>
                              </div>

                              <div className="text-right">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Ingredient Cost</span>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">€{financials.totalCost.toFixed(2)}</span>
                              </div>

                              <div className="text-right">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Net Profit</span>
                                <span className={`text-xs font-black block ${financials.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                  €{financials.profit.toFixed(2)}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Margin</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${financials.profit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' : 'bg-rose-50 text-rose-600'}`}>
                                  {financials.margin.toFixed(1)}%
                                </span>
                              </div>

                              <span className="text-slate-400 font-bold ml-2">
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Costing Sheet Details */}
                          {isExpanded && (
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-6">
                              {/* 1. Itemized Cost Breakdown Sheet */}
                              <div className="space-y-2.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                  <span>🧾</span> Itemized Ingredient Cost Sheet
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {financials.breakdown.map((item) => {
                                    const percent = financials.totalCost > 0 ? (item.totalCost / financials.totalCost) * 100 : 0;
                                    return (
                                      <div
                                        key={item.name}
                                        className="p-3 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/40 shadow-sm space-y-1.5"
                                      >
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {item.type === 'flour' ? '🌾' : item.type === 'starter' ? '🧪' : item.type === 'salt' ? '🧂' : '✨'} {item.name}
                                          </span>
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
                                            €{(item.totalCost || 0).toFixed(2)}
                                          </span>
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                                          <div>
                                            Qty: <strong className="text-slate-600 dark:text-slate-300 font-mono">{((item.grams || 0) / 1000).toFixed(3)} kg</strong>
                                            <span className="mx-1 font-extrabold">•</span>
                                            Price: <strong className="font-mono">{((item.unitCost !== undefined ? item.unitCost : 1.50)).toFixed(2)} €/kg</strong>
                                          </div>
                                          <div className="font-bold text-slate-500">
                                            {(percent || 0).toFixed(1)}%
                                          </div>
                                        </div>

                                        {/* Progress Bar of Cost Contribution */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                          <div
                                            className="bg-bakery-500 h-full rounded-full"
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 2. Linked Orders and Customer Breakdown */}
                              <div className="space-y-2.5 pt-4 border-t border-slate-150 dark:border-slate-800/60">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                  <span>📦</span> Customer Orders & Sales ({(b.orders || []).length})
                                </span>

                                <div className="space-y-2">
                                  {(b.orders || []).map((ord) => {
                                    if (!ord) return null;
                                    const oTotal = ord.items ? ord.items.reduce((acc, it) => {
                                      const price = it?.productVariant?.price || 0;
                                      const qty = it?.quantity || 0;
                                      const coupon = it?.couponApplied || 0;
                                      return acc + price * Math.max(0, qty - coupon);
                                    }, 0) : 0;

                                    return (
                                      <div
                                        key={ord.id}
                                        className="p-3 rounded-2xl bg-white dark:bg-slate-900/20 border border-slate-150 dark:border-slate-800/20 text-xs flex justify-between items-center"
                                      >
                                        <div>
                                          <div className="font-bold text-slate-700 dark:text-slate-200">
                                            👤 {ord.user?.name || ord.customerName || 'Guest'}
                                            {ord.customerPhone && <span className="text-[10px] text-slate-400 font-mono ml-2">({ord.customerPhone})</span>}
                                          </div>
                                          <div className="text-[10px] text-slate-500 mt-1">
                                            {(ord.items || []).map((it, idx) => (
                                              <span key={it?.id || idx} className="mr-3">
                                                🥪 {it?.productVariant?.product?.name || 'Item'} ({it?.productVariant?.name || 'Standard'}) x {it?.quantity || 1}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-bold text-slate-700 dark:text-slate-200 block font-mono">€{oTotal.toFixed(2)}</span>
                                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-mono">{ord.status}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Ingredient Cost Configurator Card (Right 1/3) */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Wholesale Unit Cost Editor</h3>
                  </div>

                  <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">💰</span>
                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Material Costing</h4>
                      </div>

                      {!editingCosts ? (
                        <button
                          onClick={handleEditCostsToggle}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-lg transition border border-slate-200/50 dark:border-slate-700/50"
                        >
                          ✏️ Edit Costs
                        </button>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleSaveCosts}
                            className="px-3 py-1 bg-bakery-500 hover:bg-bakery-600 text-white text-[10px] font-black rounded-lg transition shadow shadow-bakery-500/10"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={() => setEditingCosts(false)}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Input your wholesale purchase cost price per kilogram (€/kg). All bakes, margins, and profit graphs calibrate dynamically upon saving.
                    </p>

                    <div className="space-y-3 pt-2">
                      {getUniqueIngredients().map((ing) => {
                        const currentVal = ingredientCosts[ing] !== undefined ? ingredientCosts[ing] : 1.50;
                        const tempVal = tempIngredientCosts[ing] !== undefined ? tempIngredientCosts[ing] : currentVal;

                        return (
                          <div
                            key={ing}
                            className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/40 shadow-sm space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                🌾 {ing}
                              </span>
                              {!editingCosts ? (
                                <span className="text-[11px] font-mono font-black text-slate-800 dark:text-slate-100">
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
                                      setTempIngredientCosts({ ...tempIngredientCosts, [ing]: e.target.value });
                                    }}
                                    className="p-1 w-16 text-center text-xs rounded-lg border dark:bg-slate-950 dark:border-slate-800 bg-white font-mono font-bold text-slate-800 dark:text-slate-100"
                                  />
                                  <span className="text-[9px] text-slate-500 font-extrabold">€/kg</span>
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

            {/* Sourdough Analytics: Sales Forecasting & Ingredient Planning Section */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-md font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>🔮</span> Intelligent Ingredient &amp; Stock Forecasting
                  </h3>
                  <p className="text-xs text-slate-500">
                    Predict wholesale flour varieties, starter quantities, and extras required by combining future bakes and active subscription trends.
                  </p>
                </div>

                {/* Preset Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  {[
                    { days: 7, label: '7 Days' },
                    { days: 14, label: '14 Days' },
                    { days: 30, label: '30 Days' },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      onClick={() => {
                        setForecastDays(preset.days);
                        fetchForecast(preset.days);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        forecastDays === preset.days
                          ? 'bg-bakery-500 text-white shadow shadow-bakery-500/25'
                          : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingForecast ? (
                <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bakery-500"></div>
                  <span className="text-xs text-slate-500 font-bold">Recalibrating artisan stock models and scaling recipe allocations...</span>
                </div>
              ) : !forecastData ? (
                <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  Select a forecast period to load ingredient planning projections.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Forecast Horizon</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block font-mono">{forecastData.days} Days</span>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Baking Days Scheduled</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block font-mono">{forecastData.batchesCount} Bakes</span>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Orders Processed</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block font-mono">{forecastData.ordersCount} Orders</span>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Standing Subscriptions</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block font-mono">{forecastData.subscriptionsCount} Active</span>
                    </div>
                  </div>

                  {/* Main Splitted Grid of Flour varieties, Core inputs, Extras */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Flour Breakdown Column */}
                    <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>🌾</span> Wholesale Flour Projections
                        </span>
                        <span className="text-[11px] font-bold font-mono text-slate-500">
                          Total: {((forecastData.summary.totalFlour || 0) / 1000).toFixed(2)} kg
                        </span>
                      </div>

                      <div className="space-y-4">
                        {(forecastData.summary.floursBreakdown || []).length === 0 ? (
                          <span className="text-xs text-slate-400 italic block py-4 text-center">No flour requirements detected.</span>
                        ) : (
                          forecastData.summary.floursBreakdown.map((fl) => {
                            const pct = forecastData.summary.totalFlour > 0 ? (fl.grams / forecastData.summary.totalFlour) * 100 : 0;
                            return (
                              <div key={fl.name} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{fl.name}</span>
                                  <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                                    {(fl.grams / 1000).toFixed(2)} kg <span className="text-[10px] text-slate-400 font-medium">({pct.toFixed(0)}%)</span>
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-amber-500 dark:bg-amber-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Middle: Core Constituent Ingredients & Extras */}
                    <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 space-y-4">
                      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>🧪</span> Core Sourdough Inputs
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-base">💧</span>
                            <div>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Water Quantity</span>
                              <span className="text-[10px] text-slate-400">Average hydration scale</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                            {((forecastData.summary.totalWater || 0) / 1000).toFixed(2)} L
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🧬</span>
                            <div>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Levain / Starter</span>
                              <span className="text-[10px] text-slate-400">Leavening agent scale</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                            {((forecastData.summary.totalStarter || 0) / 1000).toFixed(2)} kg
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🧂</span>
                            <div>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Sea Salt</span>
                              <span className="text-[10px] text-slate-400">NaCl mineral weight</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                            {((forecastData.summary.totalSalt || 0) / 1000).toFixed(2)} kg
                          </span>
                        </div>
                      </div>

                      {/* Extras Breakdown */}
                      <div className="pt-2">
                        <div className="pb-1 mb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">✨ Recipe Extras &amp; Inclusions</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(forecastData.summary.extrasBreakdown || []).length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No extra inclusions forecasted.</span>
                          ) : (
                            forecastData.summary.extrasBreakdown.map((ext) => (
                              <span
                                key={ext.name}
                                className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-800/20 font-mono shadow-sm"
                              >
                                {ext.name}: {(ext.grams / 1000).toFixed(2)} kg
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Projected Product Counts & Clipboard copy */}
                    <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <span>🍞</span> Upcoming Product Counts
                          </span>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-850">
                          {(forecastData.productQuantities || []).length === 0 ? (
                            <span className="text-xs text-slate-400 italic block py-4 text-center">No production items scheduled.</span>
                          ) : (
                            forecastData.productQuantities.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs py-1.5">
                                <div>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{item.productName}</span>
                                  <span className="text-[10px] text-slate-400 block">{item.size}</span>
                                </div>
                                <span className="font-black font-mono text-bakery-600 dark:text-bakery-400 text-sm">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Wholesaler order list copier */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => {
                            const generateCopyText = () => {
                              let txt = `=== Artisan BakEngine Wholesaler Order List ===\n`;
                              txt += `Forecast Range: ${forecastData.days} Days\n`;
                              txt += `Generated: ${new Date().toLocaleString()}\n`;
                              txt += `Scheduled Bakes: ${forecastData.batchesCount}\n`;
                              txt += `Orders Aggregated: ${forecastData.ordersCount}\n\n`;
                              
                              txt += `CORE FLOUR DETAILS:\n`;
                              if ((forecastData.summary.floursBreakdown || []).length === 0) {
                                txt += `- No flours required.\n`;
                              } else {
                                forecastData.summary.floursBreakdown.forEach(fl => {
                                  txt += `- ${fl.name}: ${(fl.grams / 1000).toFixed(2)} kg\n`;
                                });
                              }
                              txt += `\nCORE CONSTITUENT INGREDIENTS:\n`;
                              txt += `- Water: ${(forecastData.summary.totalWater / 1000).toFixed(2)} L\n`;
                              txt += `- Sourdough Starter: ${(forecastData.summary.totalStarter / 1000).toFixed(2)} kg\n`;
                              txt += `- Sea Salt: ${(forecastData.summary.totalSalt / 1000).toFixed(2)} kg\n`;
                              
                              if ((forecastData.summary.extrasBreakdown || []).length > 0) {
                                txt += `\nRECIPE EXTRAS & INCLUSIONS:\n`;
                                forecastData.summary.extrasBreakdown.forEach(ext => {
                                  txt += `- ${ext.name}: ${(ext.grams / 1000).toFixed(2)} kg\n`;
                                });
                              }
                              
                              txt += `\n==============================================`;
                              return txt;
                            };
                            
                            navigator.clipboard.writeText(generateCopyText());
                            setStatusMsg('📋 Wholesaler order list copied to clipboard!');
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-bakery-500 hover:from-amber-600 hover:to-bakery-600 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-lg shadow-bakery-500/15 active:scale-98 transition duration-200"
                        >
                          <span>📋</span> Copy Wholesaler Order List
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        })()}

        {/* 7. THERMAL LABEL PRINT SHOP SECTION (Optimized CSS Media query and standard roll previews) */}
        {activeTab === 'printing' && selectedBatch && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('labelPrintShop')}</h2>
                <p className="text-xs text-slate-500">{t('labelPrintShopDesc')}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('batches')}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  {t('backToBatches')}
                </button>
                <button
                  onClick={triggerBrowserPrint}
                  className="px-4 py-2 bg-bakery-500 hover:bg-bakery-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition"
                >
                  <Printer size={14} />
                  {t('printAllStickers', { count: selectedBatch.labels.length })}
                </button>
              </div>
            </div>

            {/* Layout simulation for Roll labels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sticker guidelines card */}
              <div className="lg:col-span-1 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800/40 no-print space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('thermalConfig')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('thermalConfigDesc')}
                </p>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/30 rounded-xl text-[11px] text-blue-800 dark:text-blue-300">
                  <span className="font-bold block">{t('bakingDateLabel')}</span>
                  {new Date(selectedBatch.batch.date).toLocaleDateString()}
                </div>
              </div>

              {/* Render Sheet layout */}
              <div className="lg:col-span-2 space-y-6 print-area">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1 p-2 bg-slate-200 dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 print-area">
                  {selectedBatch.labels.map((lbl) => (
                    <div 
                      key={lbl.labelId} 
                      className="thermal-label-sticker bg-white text-black p-4 border border-slate-400 rounded-xl max-w-[280px] w-full mx-auto flex flex-col justify-between aspect-[4/3] relative font-sans shadow"
                    >
                      <div className="border-b-2 border-black pb-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
                          <span>La Petite Farine</span>
                          <span>#{lbl.batchId}</span>
                        </div>
                        <h4 className="text-md font-extrabold mt-1 uppercase text-center tracking-tight leading-none">{lbl.productName}</h4>
                        <span className="text-[11px] font-semibold text-center block mt-0.5">{t('sizeLabel')} {lbl.variantSize}</span>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-2">
                        <div className="text-[10px] font-medium space-y-1">
                          <div>{t('clientLabel')} <span className="font-extrabold">{lbl.customerName}</span></div>
                          <div>{t('bakedLabel')} <span className="font-extrabold">{lbl.bakeDate}</span></div>
                          <div className="text-[8px] font-mono mt-1 text-slate-400">ID: {lbl.labelId}</div>
                        </div>

                        {/* Simulated QR block */}
                        <div className="w-12 h-12 border-2 border-black flex flex-col items-center justify-center p-1 bg-slate-50 select-none">
                          <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-full h-full ${
                                  (i * 3 + lbl.labelId.charCodeAt(0)) % 2 === 0 ? 'bg-black' : 'bg-transparent'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. STANDING WEEKLY SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6 no-print animate-rise">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('standingSubscriptions')}</h2>
                <p className="text-xs text-slate-500">{t('activeSubscriptionsDesc')}</p>
              </div>

              <button
                onClick={handleGenerateSubscriptions}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-bakery-500 hover:bg-bakery-600 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-bakery-500/20 transition disabled:opacity-50"
              >
                <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                {t('generateWeeklyOrders')}
              </button>
            </div>

            {/* Subscription Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/60 shadow">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('activeSubsCount')}</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {standingOrders.filter(so => so.active !== false).length}
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold block mt-1">{t('weeklyRecurringLoaves')}</span>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/60 shadow">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('weeklySubValue')}</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  ${standingOrders.reduce((sum, so) => sum + (so.active ? (so.productVariant?.price || 0) * so.quantity : 0), 0).toFixed(2)}
                </div>
                <span className="text-[10px] text-bakery-500 font-semibold block mt-1">{t('estWeeklyMrrContribution')}</span>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/60 shadow">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('totalSubscribers')}</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {new Set(standingOrders.map(so => so.userId)).size}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block mt-1">{t('loyalLocalFamilies')}</span>
              </div>
            </div>

            {/* List of active subscriptions */}
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">{t('customerName')}</th>
                      <th className="p-4">{t('itemSubscribed')}</th>
                      <th className="p-4">{t('qtyAndSlot')}</th>
                      <th className="p-4">{t('weeklyPrice')}</th>
                      <th className="p-4">{t('subscriptionStatus')}</th>
                      <th className="p-4 text-right">{t('actionsTable')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {standingOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                          {t('noStandingOrdersYet')}
                        </td>
                      </tr>
                    ) : (
                      standingOrders.map((so) => (
                        <tr key={so.id} className="hover:bg-slate-200/40 dark:hover:bg-slate-900/20 transition">
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                            <div>{so.user?.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{so.user?.email}</div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {so.productVariant?.product?.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {t('sizeLabel')} {so.productVariant?.size}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                              {t('qty')}: {so.quantity}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              🕒 {t('slotLabel')} {formatSlotLabel(so.pickupSlot)}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-bakery-600">
                            ${((so.productVariant?.price || 0) * so.quantity).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              so.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                            }`}>
                              {so.active ? t('active') : t('inactive')}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await authFetch(`/api/standing-orders/${so.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ active: !so.active })
                                  });
                                  if (res.ok) {
                                    setStatusMsg(t('standingOrderStatusUpdated'));
                                    fetchStandingOrders();
                                  }
                                } catch (err) {}
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                                so.active 
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300' 
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                              }`}
                            >
                              {so.active ? t('pauseButton') : t('activateButton')}
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(t('cancelSubscriptionConfirm'))) return;
                                try {
                                  const res = await authFetch(`/api/standing-orders/${so.id}`, {
                                    method: 'DELETE'
                                  });
                                  if (res.ok) {
                                    setStatusMsg(t('standingOrderCancelled'));
                                    fetchStandingOrders();
                                  }
                                } catch (err) {}
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition ml-2"
                              title="Delete Subscription"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 10. LOYALTY REWARDS PANEL */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6 no-print animate-rise">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('loyaltyTracker', { defaultValue: 'Loyalty Rewards' })}</h2>
              <p className="text-xs text-slate-500">{t('loyaltyTrackerDesc', { defaultValue: 'Monitor user purchase milestones and reward redemptions. For every 10 items purchased in COMPLETED orders, the customer earns 1 free loaf.' })}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {t('totalSubscribers', { defaultValue: 'Total Enrolled Customers' })}
                  </span>
                  <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">
                    {loyaltyList.length}
                  </span>
                </div>
                <span className="text-3xl">👥</span>
              </div>
              
              <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {t('loyalLocalFamilies', { defaultValue: 'Total Completed Bakes' })}
                  </span>
                  <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">
                    {loyaltyList.reduce((sum, c) => sum + c.totalItemsBought, 0)}
                  </span>
                </div>
                <span className="text-3xl">🍞</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {t('freeRemaining', { defaultValue: 'Outstanding Free Loaves' })}
                  </span>
                  <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block text-emerald-600 dark:text-emerald-400">
                    {loyaltyList.reduce((sum, c) => sum + c.freeRemaining, 0)}
                  </span>
                </div>
                <span className="text-3xl">🏆</span>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('searchByClient', { defaultValue: 'Search by customer name, phone, or email...' })}
                  value={searchLoyalty}
                  onChange={(e) => setSearchLoyalty(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 focus:ring-2 focus:ring-bakery-500/20 font-semibold"
                />
              </div>
            </div>

            {/* List Table */}
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg bg-white/20 dark:bg-slate-900/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">{t('customerName')}</th>
                      <th className="p-4">{t('emailAddr')}</th>
                      <th className="p-4">{t('phoneContact')}</th>
                      <th className="p-4 text-center">{t('totalBought')}</th>
                      <th className="p-4 text-center">{t('freeRemaining')} / {t('freeEarned')}</th>
                      <th className="p-4 text-center">{t('loyaltyProgress')}</th>
                      <th className="p-4 text-right">{t('actionsTable')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {loyaltyList.filter(c => {
                      if (!searchLoyalty) return true;
                      const q = searchLoyalty.toLowerCase();
                      return (c.name || '').toLowerCase().includes(q) ||
                             (c.email || '').toLowerCase().includes(q) ||
                             (c.phone || '').toLowerCase().includes(q);
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          {t('noResultsFound', { defaultValue: 'No customers match your search.' })}
                        </td>
                      </tr>
                    ) : (
                      loyaltyList.filter(c => {
                        if (!searchLoyalty) return true;
                        const q = searchLoyalty.toLowerCase();
                        return (c.name || '').toLowerCase().includes(q) ||
                               (c.email || '').toLowerCase().includes(q) ||
                               (c.phone || '').toLowerCase().includes(q);
                      }).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-700 dark:text-slate-300">
                          <td className="p-4 font-bold">{c.name}</td>
                          <td className="p-4 font-medium">{c.email}</td>
                          <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">{c.phone || '-'}</td>
                          <td className="p-4 text-center font-black text-slate-800 dark:text-slate-200">{c.totalItemsBought}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] ${
                              c.freeRemaining > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-500'
                            }`}>
                              {c.freeRemaining} {t('remainingLabel')} / {c.freeEarned} {t('freeEarned')}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {/* Visual stamp card preview mini progress bar */}
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-bakery-500 transition-all duration-350"
                                  style={{ width: `${c.currentProgress * 10}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-bold text-bakery-600 dark:text-bakery-400">
                                {c.currentProgress}/10 stamps
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLoyaltyUser(c);
                                  fetchLoyaltyHistory(c.id);
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold rounded-lg text-[11px] transition"
                              >
                                {t('viewHistory')}
                              </button>
                              <button
                                onClick={() => redeemLoyaltyLoaf(c.id)}
                                disabled={c.freeRemaining <= 0}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:dark:text-slate-600 text-white font-black rounded-lg text-[11px] shadow hover:shadow-emerald-500/15 transition"
                              >
                                {t('loyaltyActionRedeem')}
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

            {/* Lookup detailed history Modal */}
            {selectedLoyaltyUser && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-rise">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b dark:border-slate-800">
                    <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      {t('userLoyaltyProgress')}: {selectedLoyaltyUser.name}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedLoyaltyUser(null);
                        setLoyaltyHistory([]);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* User Metadata info */}
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('emailAddr')}</span>
                        <span className="block text-xs font-bold mt-0.5">{selectedLoyaltyUser.email}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('phoneContact')}</span>
                        <span className="block text-xs font-bold mt-0.5">{selectedLoyaltyUser.phone || '-'}</span>
                      </div>
                    </div>

                    {/* Visual Digital Loyalty Card Section */}
                    {(() => {
                      const currentUser = loyaltyList.find(u => u.id === selectedLoyaltyUser.id) || selectedLoyaltyUser;
                      return (
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                            Digital Stamp Card
                          </h4>

                          {/* Card Container - Cardboard Aesthetics */}
                          <div className="bg-gradient-to-br from-amber-50/90 to-amber-100/40 dark:from-slate-950/80 dark:to-slate-900/40 border border-amber-200/50 dark:border-amber-900/30 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                            {/* Decorative background grains or circles */}
                            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />

                            <div className="flex justify-between items-center pb-2 border-b border-amber-200/30 dark:border-slate-800">
                              <div>
                                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-500 block uppercase tracking-wider">Sourdough Stamp Card</span>
                                <span className="text-[10px] text-slate-500">Every 10 purchases = 1 Free Loaf!</span>
                              </div>
                              <span className="text-xl">🥖</span>
                            </div>

                            {/* Stamp Grid */}
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                              {Array.from({ length: 10 }).map((_, idx) => {
                                const isStamped = idx < currentUser.currentProgress;
                                return (
                                  <div
                                    key={idx}
                                    className={`aspect-square flex items-center justify-center rounded-2xl border-2 transition-all duration-300 relative ${
                                      isStamped
                                        ? 'bg-amber-100/50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow shadow-amber-400/10 scale-105 animate-bounce-short'
                                        : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-600'
                                    }`}
                                  >
                                    {isStamped ? (
                                      <span className="text-lg filter drop-shadow hover:rotate-12 transition transform duration-200 cursor-pointer">🍞</span>
                                    ) : (
                                      <span className="text-[9px] font-black font-mono select-none">{idx + 1}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Card Footer Text */}
                            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                              <span>Stamps progress: <strong className="font-mono text-amber-700 dark:text-amber-500">{currentUser.currentProgress}/10</strong></span>
                              <span>Outstanding Free Loaves: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{currentUser.freeRemaining}</strong></span>
                            </div>
                          </div>

                          {/* Admin Adjustments Controls */}
                          <div className="flex flex-wrap gap-2 justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Admin Stamp Adjustment
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => adjustManualStamps(currentUser.id, -1)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg transition active:scale-95"
                                title="Remove 1 Stamp"
                              >
                                ➖ Remove Stamp
                              </button>
                              <button
                                onClick={() => adjustManualStamps(currentUser.id, 1)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition shadow-sm shadow-amber-500/10 active:scale-95"
                                title="Add 1 Stamp"
                              >
                                ➕ Add Stamp
                              </button>
                              {currentUser.freeRemaining > 0 && (
                                <button
                                  onClick={() => redeemLoyaltyLoaf(currentUser.id)}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg transition shadow-sm shadow-emerald-500/10 active:scale-95"
                                >
                                  🏆 Redeem Free Loaf
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Ledger purchases list */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                        {t('customerLedger')}
                      </h4>

                      {loadingLoyalty ? (
                        <div className="flex justify-center py-6">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bakery-500"></div>
                        </div>
                      ) : loyaltyHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">{t('noResultsFound')}</p>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 border-b border-slate-100 dark:border-slate-850">
                              <tr className="text-[10px] text-slate-400 font-bold uppercase">
                                <th className="p-3">{t('dateLabel')}</th>
                                <th className="p-3">{t('productLabel')}</th>
                                <th className="p-3 text-center">{t('quantityLabel')}</th>
                                <th className="p-3 text-right">{t('priceLabel')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {loyaltyHistory.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                  <td className="p-3 font-mono text-[11px]">{new Date(item.date).toLocaleDateString()}</td>
                                  <td className="p-3">
                                    <span className="font-bold block">{item.productName}</span>
                                    <span className="text-[10px] text-slate-400 block">{item.size}</span>
                                  </td>
                                  <td className="p-3 text-center font-bold">{item.quantity}x</td>
                                  <td className="p-3 text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
                      <button
                        onClick={() => {
                          setSelectedLoyaltyUser(null);
                          setLoyaltyHistory([]);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 font-bold text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. DISPATCH, BAGGING CHECKLIST & CUBBY BOARD */}
        {activeTab === 'dispatch' && (() => {
          // Sync default batch if none selected
          if (!selectedDispatchBatchId && batches.length > 0) {
            setSelectedDispatchBatchId(batches[0].id);
          }

          const currentBatch = batches.find(b => b.id === selectedDispatchBatchId);
          
          // Get all orders belonging to selected batch
          const batchOrders = orders.filter(o => o.batchId === selectedDispatchBatchId);
          
          // Get unique pickup slots inside this batch for filtering
          const uniqueSlots = Array.from(new Set(batchOrders.map(o => o.pickupSlot).filter(Boolean)));
          
          // Filter orders based on selected slot and search query
          const filteredOrders = batchOrders.filter(o => {
            const matchesSlot = selectedDispatchSlot === 'all' || o.pickupSlot === selectedDispatchSlot;
            
            let nameQuery = searchDispatchQuery.toLowerCase();
            const matchesSearch = !searchDispatchQuery || 
              (o.internalCustomer || o.user?.name || '').toLowerCase().includes(nameQuery) ||
              (o.user?.email || '').toLowerCase().includes(nameQuery) ||
              (o.user?.phone || '').toLowerCase().includes(nameQuery) ||
              (o.items || []).some(item => (item.productVariant?.product?.name || '').toLowerCase().includes(nameQuery));
              
            return matchesSlot && matchesSearch;
          });

          // Calculations for stats
          const totalOrdersCount = batchOrders.length;
          
          const getCheckedInfo = (order) => {
            const meta = ordersMetadata[order.id] || { cubby: '', checkedItems: [] };
            const checkedItems = meta.checkedItems || [];
            const isBagged = order.items.length > 0 && order.items.every(item => checkedItems.includes(item.id));
            return { checkedItems, isBagged, cubby: meta.cubby || '' };
          };

          const baggedOrdersCount = batchOrders.filter(o => getCheckedInfo(o).isBagged).length;
          const completedOrdersCount = batchOrders.filter(o => o.status === 'COMPLETED').length;
          const pendingOrdersCount = totalOrdersCount - completedOrdersCount;

          return (
            <div className="space-y-6 no-print animate-rise">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                    📦 {t('dispatchBoardTitle', { defaultValue: 'No-Mistake Dispatch & Packing Board' })}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Check off baked products, allocate shelf/cubby storage, and notify customers directly via WhatsApp.
                  </p>
                </div>

                {/* Batch Selector Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500">Active Batch:</label>
                  <select
                    value={selectedDispatchBatchId}
                    onChange={(e) => {
                      setSelectedDispatchBatchId(e.target.value);
                      setSelectedDispatchSlot('all');
                    }}
                    className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-bakery-500/20"
                  >
                    {batches.length === 0 ? (
                      <option value="">No batches found</option>
                    ) : (
                      batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {new Date(b.date).toLocaleDateString()} - #{b.id.slice(0, 8).toUpperCase()} ({b.status})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Stat Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow bg-white/40 dark:bg-slate-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Batch Orders</span>
                    <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block font-mono">{totalOrdersCount}</span>
                  </div>
                  <span className="text-2xl">📋</span>
                </div>

                <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow bg-white/40 dark:bg-slate-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Bagging Completion</span>
                    <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block font-mono">
                      {baggedOrdersCount} / {totalOrdersCount}
                    </span>
                  </div>
                  <span className="text-2xl">📦</span>
                </div>

                <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow bg-white/40 dark:bg-slate-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pending Pickups</span>
                    <span className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1 block font-mono">{pendingOrdersCount}</span>
                  </div>
                  <span className="text-2xl">⏳</span>
                </div>

                <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow bg-white/40 dark:bg-slate-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Collected / Finished</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">{completedOrdersCount}</span>
                  </div>
                  <span className="text-2xl">✅</span>
                </div>
              </div>

              {/* Progress Bar of Completion */}
              <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/60 p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalOrdersCount > 0 ? (baggedOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                />
              </div>

              {/* Filters Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative max-w-sm w-full">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by customer, phone, email, or breads..."
                    value={searchDispatchQuery}
                    onChange={(e) => setSearchDispatchQuery(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 focus:ring-2 focus:ring-bakery-500/20 font-semibold"
                  />
                </div>

                {/* Pickup Slot Filters Preset Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSelectedDispatchSlot('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedDispatchSlot === 'all'
                        ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-900 bg-white dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40'
                    }`}
                  >
                    All Pickup Slots
                  </button>
                  {uniqueSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedDispatchSlot(slot)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        selectedDispatchSlot === slot
                          ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-900 bg-white dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Customer Packing Cards */}
              {filteredOrders.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center text-xs text-slate-500 border border-dashed dark:border-slate-800 bg-white/20 dark:bg-slate-900/10">
                  No orders match the selected filters or batch criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOrders.map((order) => {
                    const { checkedItems, isBagged, cubby } = getCheckedInfo(order);
                    const customerName = order.internalCustomer || order.user?.name || 'Anonymous Customer';
                    const customerPhone = order.user?.phone || '';
                    const itemsStr = order.items.map(item => `${item.quantity}x ${item.productVariant?.product?.name || 'Artisan Bread'} (${item.productVariant?.size || 'Standard'})`).join(', ');

                    const handleItemCheckToggle = (itemId) => {
                      let newChecked = [...checkedItems];
                      if (newChecked.includes(itemId)) {
                        newChecked = newChecked.filter(id => id !== itemId);
                      } else {
                        newChecked.push(itemId);
                      }
                      
                      const newMeta = {
                        cubby,
                        checkedItems: newChecked,
                        baggedAt: newChecked.length === order.items.length ? new Date().toISOString() : null
                      };
                      saveOrderMetadata(order.id, newMeta);
                    };

                    const handleCubbyChange = (newCubby) => {
                      const newMeta = {
                        cubby: newCubby,
                        checkedItems,
                        baggedAt: isBagged ? new Date().toISOString() : null
                      };
                      saveOrderMetadata(order.id, newMeta);
                    };

                    const handleWhatsAppPing = () => {
                      if (!customerPhone) {
                        setErrorMessage('Customer phone contact is not available.');
                        return;
                      }
                      
                      // Strip non-digits from phone
                      const sanitizedPhone = customerPhone.replace(/\D/g, '');
                      
                      let msg = '';
                      if (order.status === 'COMPLETED') {
                        msg = `Hi ${customerName}! Thank you for picking up your bakes today! Enjoy your bread! 🍞`;
                      } else {
                        const cubbyText = cubby ? `in Shelf Cubby *${cubby}*` : 'at our pickup shelf';
                        msg = `Hi ${customerName}! 🥖 Your Artisan BakEngine order of *${itemsStr}* is bagged and waiting for you ${cubbyText}! See you during your pickup slot (${order.pickupSlot || 'today'}). 🍞`;
                      }

                      const waUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(msg)}`;
                      window.open(waUrl, '_blank');
                    };

                    return (
                      <div
                        key={order.id}
                        className={`glass-panel rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 shadow bg-white/30 dark:bg-slate-900/20 backdrop-blur-md relative overflow-hidden ${
                          isBagged
                            ? 'border-emerald-500/50 dark:border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-400/10'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {updatingOrderIds.includes(order.id) && (
                          <div className="absolute top-0 left-0 right-0 h-1.5 animate-shimmer-brown overflow-hidden" />
                        )}
                        {/* Card Header */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black text-slate-800 dark:text-white line-clamp-1">
                                {customerName}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                Order: <strong className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</strong>
                              </span>
                            </div>

                            {/* Status Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              order.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : order.status === 'BAKED'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold">
                            <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md text-[9px] border dark:border-slate-850">
                              ⏰ {order.pickupSlot || 'No slot'}
                            </span>
                            {customerPhone && (
                              <span className="text-slate-500 font-mono">
                                📞 {customerPhone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Bagging Checklist */}
                        <div className="space-y-2 border-t border-b border-slate-150 dark:border-slate-800/60 py-3 my-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                            Packing Checklist
                          </span>
                          <div className="space-y-1.5">
                            {order.items.map((item) => {
                              const isChecked = checkedItems.includes(item.id);
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleItemCheckToggle(item.id)}
                                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2.5 ${
                                    isChecked
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/40 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-300 line-through decoration-emerald-500/35 decoration-2'
                                      : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-850 hover:bg-slate-100/50'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                    isChecked
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                                  }`}>
                                    {isChecked && <span className="text-[10px] leading-none">✓</span>}
                                  </div>
                                  <div className="flex justify-between w-full items-center">
                                    <span className="truncate">{item.productVariant?.product?.name || 'Artisan Bread'}</span>
                                    <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-850 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                      {item.productVariant?.size} x{item.quantity}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Card Footer: Cubby Input, WhatsApp Notification, Transition Button */}
                        <div className="space-y-3 pt-1">
                          {/* Cubby Slot Input */}
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-150 dark:border-slate-850">
                            <span className="text-xs">🏷️</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Cubby / Shelf:</span>
                            <input
                              type="text"
                              placeholder="e.g. A3"
                              value={cubby}
                              onChange={(e) => handleCubbyChange(e.target.value.toUpperCase())}
                              className="bg-transparent text-xs font-black font-mono border-none focus:outline-none p-0 focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 w-full"
                            />
                          </div>

                          <div className="flex gap-2">
                            {/* WhatsApp Button */}
                            <button
                              onClick={handleWhatsAppPing}
                              disabled={!customerPhone}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition ${
                                customerPhone
                                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                                  : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-transparent'
                              }`}
                              title={customerPhone ? 'Open prefilled WhatsApp message' : 'Customer phone number not available'}
                            >
                              <MessageSquare size={13} />
                              <span>Ping WA</span>
                            </button>

                            {/* State Transition Button */}
                            {order.status !== 'COMPLETED' ? (
                              <button
                                disabled={updatingOrderIds.includes(order.id)}
                                onClick={async () => {
                                  // Determine next valid state transition
                                  let nextState = 'CONFIRMED';
                                  if (order.status === 'PENDING') nextState = 'CONFIRMED';
                                  else if (order.status === 'CONFIRMED') nextState = 'IN_PRODUCTION';
                                  else if (order.status === 'IN_PRODUCTION') nextState = 'BAKED';
                                  else if (order.status === 'BAKED') nextState = 'COMPLETED';

                                  await handleOrderStatus(order.id, nextState);
                                }}
                                className={`flex-1 bg-bakery-500 hover:bg-bakery-600 text-white font-black text-xs py-2 px-3 rounded-xl transition active:scale-95 shadow-md shadow-bakery-500/10 flex items-center justify-center gap-1 ${
                                  updatingOrderIds.includes(order.id) ? 'opacity-60 cursor-not-allowed' : ''
                                }`}
                              >
                                {updatingOrderIds.includes(order.id) ? (
                                  <>
                                    <RotateCw className="w-3 h-3 animate-spin text-white" />
                                    <span>Saving...</span>
                                  </>
                                ) : order.status === 'IN_PRODUCTION' ? (
                                  <>🔥 Mark Baked</>
                                ) : order.status === 'BAKED' ? (
                                  <>✅ Complete</>
                                ) : (
                                  <>➔ Next Status</>
                                )}
                              </button>
                            ) : (
                              <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 py-2 px-3 rounded-xl text-xs font-extrabold text-center select-none flex items-center justify-center gap-1">
                                <span>🎉 Collected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'settings' && (
          <SettingsTab
            t={t}
            scheduleMode={scheduleMode}
            saveScheduleModeSetting={saveScheduleModeSetting}
            bakingDays={bakingDays}
            saveSettings={saveSettings}
            localLeadTimeHours={localLeadTimeHours}
            setLocalLeadTimeHours={setLocalLeadTimeHours}
            leadTimeHours={leadTimeHours}
            saveLeadTimeHours={saveLeadTimeHours}
            localBakeTimeOfDay={localBakeTimeOfDay}
            setLocalBakeTimeOfDay={setLocalBakeTimeOfDay}
            bakeTimeOfDay={bakeTimeOfDay}
            saveBakeTimeOfDay={saveBakeTimeOfDay}
            localStarterWasteFactor={localStarterWasteFactor}
            setLocalStarterWasteFactor={setLocalStarterWasteFactor}
            starterWasteFactor={starterWasteFactor}
            saveStarterWasteFactor={saveStarterWasteFactor}
            localDoughWasteFactor={localDoughWasteFactor}
            setLocalDoughWasteFactor={setLocalDoughWasteFactor}
            doughWasteFactor={doughWasteFactor}
            saveDoughWasteFactor={saveDoughWasteFactor}
            showFallbackDefaults={showFallbackDefaults}
            setShowFallbackDefaults={setShowFallbackDefaults}
            bakingSeasons={bakingSeasons}
            showRosterForm={showRosterForm}
            setShowRosterForm={setShowRosterForm}
            editingRosterId={editingRosterId}
            setEditingRosterId={setEditingRosterId}
            rosterName={rosterName}
            setRosterName={setRosterName}
            rosterStartDate={rosterStartDate}
            setRosterStartDate={setRosterStartDate}
            rosterEndDate={rosterEndDate}
            setRosterEndDate={setRosterEndDate}
            rosterDays={rosterDays}
            setRosterDays={setRosterDays}
            rosterTime={rosterTime}
            setRosterTime={setRosterTime}
            rosterCutoff={rosterCutoff}
            setRosterCutoff={setRosterCutoff}
            handleCreateRoster={handleCreateRoster}
            handleDeleteRoster={handleDeleteRoster}
            enabledFlours={enabledFlours}
            saveEnabledFlours={saveEnabledFlours}
            starters={starters}
            saveStartersSetting={saveStartersSetting}
            editingStarterId={editingStarterId}
            setEditingStarterId={setEditingStarterId}
            tempStarterName={tempStarterName}
            setTempStarterName={setTempStarterName}
            tempSeedParts={tempSeedParts}
            setTempSeedParts={setTempSeedParts}
            tempFlourParts={tempFlourParts}
            setTempFlourParts={setTempFlourParts}
            tempWaterParts={tempWaterParts}
            setTempWaterParts={setTempWaterParts}
            tempStarterFlours={tempStarterFlours}
            setTempStarterFlours={setTempStarterFlours}
            tempFeedingMethod={tempFeedingMethod}
            setTempFeedingMethod={setTempFeedingMethod}
            calculateBacktrackDeadline={calculateBacktrackDeadline}
            pantryStock={pantryStock}
            tempPantryStock={tempPantryStock}
            setTempPantryStock={setTempPantryStock}
            editingInventory={editingInventory}
            setEditingInventory={setEditingInventory}
            handleEditStockToggle={handleEditStockToggle}
            handleSaveStock={handleSaveStock}
            ingredientCosts={ingredientCosts}
            tempIngredientCosts={tempIngredientCosts}
            setTempIngredientCosts={setTempIngredientCosts}
            editingCosts={editingCosts}
            setEditingCosts={setEditingCosts}
            handleEditCostsToggle={handleEditCostsToggle}
            handleSaveCosts={handleSaveCosts}
            getUniqueIngredients={getUniqueIngredients}
          />
        )}
      </main>

      {/* WhatsApp notification helper modal */}
      {whatsappOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-rise">
            <div className="flex items-center justify-between mb-4 pb-2 border-b dark:border-slate-800">
              <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-emerald-500">💬</span>
                {t('whatsappHelperTitle', { defaultValue: 'WhatsApp Notification Helper' })}
              </h3>
              <button
                onClick={() => setWhatsappOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 text-xs space-y-2">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{whatsappOrder.user.name}</div>
                  <div className="text-slate-500 mt-0.5">{t('orderIdLabel', { defaultValue: 'Order ID: {id}', id: whatsappOrder.id.slice(0, 8).toUpperCase() })}</div>
                </div>

                <div className="pt-1.5 border-t dark:border-slate-800">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    📱 {t('recipientPhone', { defaultValue: 'Recipient Phone Number' })}
                  </label>
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="e.g. +385994460717"
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold text-emerald-600 dark:text-emerald-400 font-mono"
                  />
                  {!whatsappOrder.user.phone && (
                    <span className="text-[9px] text-amber-500 block mt-1 font-medium">
                      ⚠️ No phone configured on user profile. Substituted with test phone number.
                    </span>
                  )}
                </div>
              </div>

              {/* Template Buttons */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">{t('selectScriptTemplate', { defaultValue: 'Select Script Template' })}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'confirmed', label: t('orderConfirmedTemplate', { defaultValue: 'Order Confirmed' }) },
                    { id: 'baking', label: t('bakingNowTemplate', { defaultValue: 'Baking Now' }) },
                    { id: 'ready', label: t('readyForPickupTemplate', { defaultValue: 'Ready for Pickup' }) }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setWhatsappTemplate(tpl.id)}
                      className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold border transition ${
                        whatsappTemplate === tpl.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Editor */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('editPrefilledMessage', { defaultValue: 'Edit Pre-filled Text Message' })}</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl dark:bg-slate-950 dark:border-slate-800 h-28 resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setWhatsappOrder(null)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => {
                    const phone = whatsappPhone || '';
                    const cleanPhone = phone.replace(/[^0-9+]/g, ''); // strip non-numeric characters except +
                    const encodedText = encodeURIComponent(customMessage);
                    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
                    setWhatsappOrder(null);
                  }}
                  disabled={!whatsappPhone}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.022-.08-.124-.184-.245-.244-.12-.06-1.08-.534-1.246-.593-.166-.06-.286-.09-.406.09-.12.18-.46.593-.564.712-.1.12-.2.13-.36.07-.16-.06-.68-.25-1.29-.8-1.15-1.02-1.92-2.28-2.15-2.67-.22-.39-.02-.6.18-.79.18-.18.4-.41.56-.62.16-.2.22-.34.33-.56.11-.22.06-.41-.03-.56-.08-.15-.71-1.72-1.03-2.48-.3-.72-.6-1.11-.8-1.11H8.08c-.24 0-.45.09-.62.27-.18.18-.68.66-.68 1.62s.48 1.88.55 2.07.08 1.52 2.33 3.69 3.3.52.23.93.37 1.25.48.52.16 1 .14 1.37.08.41-.06 1.24-.5 1.42-1 .18-.5.18-.93.13-1-.05-.07-.18-.11-.36-.17zm2.14-11.75C17.15 1.01 14.21 0 11.18 0 5.03 0 .03 5.03.03 11.18c0 1.97.51 3.9 1.5 5.6L0 24l7.4-1.94c1.64.9 3.47 1.37 5.34 1.37 6.15 0 11.15-5.03 11.15-11.18 0-2.98-1.16-5.79-3.28-7.82zM12.4 21.64c-1.68 0-3.32-.45-4.75-1.3l-.34-.2-4.4 1.15 1.18-4.28-.22-.35c-.93-1.48-1.42-3.2-1.42-4.98 0-5.1 4.14-9.24 9.25-9.24 2.48 0 4.8.97 6.55 2.73 1.76 1.76 2.73 4.1 2.73 6.55-.02 5.1-4.16 9.23-9.27 9.23z" />
                  </svg>
                  {t('sendToWhatsapp', { defaultValue: 'Send to WhatsApp' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk WhatsApp notification modal */}
      {bulkWhatsappBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-rise">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="text-emerald-500">💬</span>
                  {t('bulkWhatsappTitle', { defaultValue: 'Bulk WhatsApp Updates' })}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {t('batchDate', { defaultValue: 'Batch Date' })}: {new Date(bulkWhatsappBatch.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setBulkWhatsappBatch(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Progress and Stage Selector */}
            <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('selectBatchStage', { defaultValue: '1. Select Update Stage' })}
                </span>
                
                {/* Progress bar */}
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>
                    {t('progress', { defaultValue: 'Sent' })}: {Object.values(bulkWhatsappSentList).filter(Boolean).length} / {getGroupedCustomersForBatch(bulkWhatsappBatch).length}
                  </span>
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ 
                        width: `${(Object.values(bulkWhatsappSentList).filter(Boolean).length / (getGroupedCustomersForBatch(bulkWhatsappBatch).length || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stage Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'confirmed', label: '1. Confirmed', desc: 'Notify received & locked', color: 'border-blue-500 text-blue-600 bg-blue-50/20' },
                  { id: 'baking', label: '2. In Process', desc: 'Mix & bake updates', color: 'border-amber-500 text-amber-600 bg-amber-50/20' },
                  { id: 'ready', label: '3. Completed / Ready', desc: 'Notify pickup instructions', color: 'border-emerald-500 text-emerald-600 bg-emerald-50/20' }
                ].map((stg) => (
                  <button
                    key={stg.id}
                    onClick={() => handleBulkWhatsappTemplateChange(stg.id)}
                    className={`p-3 text-left rounded-xl border transition flex flex-col ${
                      bulkWhatsappTemplate === stg.id
                        ? `${stg.color} ring-2 ring-offset-2 ring-current dark:ring-offset-slate-900`
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{t(stg.id, { defaultValue: stg.label })}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{t(`${stg.id}Desc`, { defaultValue: stg.desc })}</span>
                  </button>
                ))}
              </div>

              {/* Send Next Unsent Quick Action */}
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center gap-3">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  ⚡ {t('quickAction', { defaultValue: 'Quick Action' })}:
                </span>
                <button
                  onClick={handleSendNextUnsent}
                  className="flex-1 max-w-xs py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.022-.08-.124-.184-.245-.244-.12-.06-1.08-.534-1.246-.593-.166-.06-.286-.09-.406.09-.12.18-.46.593-.564.712-.1.12-.2.13-.36.07-.16-.06-.68-.25-1.29-.8-1.15-1.02-1.92-2.28-2.15-2.67-.22-.39-.02-.6.18-.79.18-.18.4-.41.56-.62.16-.2.22-.34.33-.56.11-.22.06-.41-.03-.56-.08-.15-.71-1.72-1.03-2.48-.3-.72-.6-1.11-.8-1.11H8.08c-.24 0-.45.09-.62.27-.18.18-.68.66-.68 1.62s.48 1.88.55 2.07.08 1.52 2.33 3.69 3.3.52.23.93.37 1.25.48.52.16 1 .14 1.37.08.41-.06 1.24-.5 1.42-1 .18-.5.18-.93.13-1-.05-.07-.18-.11-.36-.17zm2.14-11.75C17.15 1.01 14.21 0 11.18 0 5.03 0 .03 5.03.03 11.18c0 1.97.51 3.9 1.5 5.6L0 24l7.4-1.94c1.64.9 3.47 1.37 5.34 1.37 6.15 0 11.15-5.03 11.15-11.18 0-2.98-1.16-5.79-3.28-7.82zM12.4 21.64c-1.68 0-3.32-.45-4.75-1.3l-.34-.2-4.4 1.15 1.18-4.28-.22-.35c-.93-1.48-1.42-3.2-1.42-4.98 0-5.1 4.14-9.24 9.25-9.24 2.48 0 4.8.97 6.55 2.73 1.76 1.76 2.73 4.1 2.73 6.55-.02 5.1-4.16 9.23-9.27 9.23z" />
                  </svg>
                  {t('sendNextUnsent', { defaultValue: 'Send Next Unsent' })}
                </button>
              </div>
            </div>

            {/* List of Customers (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[45vh]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                {t('customerQueue', { defaultValue: '2. Customer Message Queue' })}
              </span>
              
              {getGroupedCustomersForBatch(bulkWhatsappBatch).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {t('noOrdersInBatch', { defaultValue: 'No orders found in this batch' })}
                </div>
              ) : (
                getGroupedCustomersForBatch(bulkWhatsappBatch).map((g) => {
                  const phone = bulkWhatsappCustomPhones[g.userId] || '';
                  const msg = bulkWhatsappCustomMessages[g.userId] || '';
                  const isSent = !!bulkWhatsappSentList[g.userId];
                  const initials = g.user?.name ? g.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                  
                  return (
                    <div 
                      key={g.userId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSent 
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500/50' 
                          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                        {/* Left Side: Avatar & Details */}
                        <div className="flex gap-3 items-start flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSent 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {isSent ? '✓' : initials}
                          </div>
                          
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                                {g.user?.name || 'Unknown User'}
                              </span>
                              {isSent && (
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                                  {t('sent', { defaultValue: 'SENT' })}
                                </span>
                              )}
                            </div>

                            {/* Aggregated Items list */}
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                🥖 {t('consolidatedItems', { defaultValue: 'Grouped Items' })}:
                              </span>
                              {g.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                                  <span>{item.quantity}x {item.productVariant?.product?.name || 'Artisan Bread'} ({item.productVariant?.size || 'Standard'})</span>
                                </div>
                              ))}
                            </div>

                            {/* Phone Input */}
                            <div className="pt-2">
                              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                📱 {t('phone', { defaultValue: 'Phone Number' })}
                              </label>
                              <input 
                                type="text"
                                value={phone}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkWhatsappCustomPhones(prev => ({ ...prev, [g.userId]: val }));
                                }}
                                className="w-full text-xs p-1.5 border rounded-lg dark:bg-slate-950 dark:border-slate-800 bg-white font-semibold font-mono text-emerald-600 dark:text-emerald-400"
                                placeholder="+385994460717"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Center/Right Side: Editable Message & Actions */}
                        <div className="w-full md:w-80 space-y-2 shrink-0">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">
                            📝 {t('editMessage', { defaultValue: 'Customize Message' })}
                          </label>
                          <textarea
                            value={msg}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkWhatsappCustomMessages(prev => ({ ...prev, [g.userId]: val }));
                            }}
                            className="w-full text-[11px] p-2.5 border rounded-xl dark:bg-slate-950 dark:border-slate-800 h-24 resize-none leading-relaxed"
                          />

                          <div className="flex justify-end gap-2">
                            {isSent && (
                              <button
                                onClick={() => {
                                  setBulkWhatsappSentList(prev => ({ ...prev, [g.userId]: false }));
                                }}
                                className="px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                {t('markUnsent', { defaultValue: 'Undo' })}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const cleanPhone = phone.replace(/[^0-9+]/g, '');
                                const encodedText = encodeURIComponent(msg);
                                window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
                                setBulkWhatsappSentList(prev => ({ ...prev, [g.userId]: true }));
                              }}
                              disabled={!phone}
                              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition ${
                                isSent
                                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              }`}
                            >
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.022-.08-.124-.184-.245-.244-.12-.06-1.08-.534-1.246-.593-.166-.06-.286-.09-.406.09-.12.18-.46.593-.564.712-.1.12-.2.13-.36.07-.16-.06-.68-.25-1.29-.8-1.15-1.02-1.92-2.28-2.15-2.67-.22-.39-.02-.6.18-.79.18-.18.4-.41.56-.62.16-.2.22-.34.33-.56.11-.22.06-.41-.03-.56-.08-.15-.71-1.72-1.03-2.48-.3-.72-.6-1.11-.8-1.11H8.08c-.24 0-.45.09-.62.27-.18.18-.68.66-.68 1.62s.48 1.88.55 2.07.08 1.52 2.33 3.69 3.3.52.23.93.37 1.25.48.52.16 1 .14 1.37.08.41-.06 1.24-.5 1.42-1 .18-.5.18-.93.13-1-.05-.07-.18-.11-.36-.17zm2.14-11.75C17.15 1.01 14.21 0 11.18 0 5.03 0 .03 5.03.03 11.18c0 1.97.51 3.9 1.5 5.6L0 24l7.4-1.94c1.64.9 3.47 1.37 5.34 1.37 6.15 0 11.15-5.03 11.15-11.18 0-2.98-1.16-5.79-3.28-7.82zM12.4 21.64c-1.68 0-3.32-.45-4.75-1.3l-.34-.2-4.4 1.15 1.18-4.28-.22-.35c-.93-1.48-1.42-3.2-1.42-4.98 0-5.1 4.14-9.24 9.25-9.24 2.48 0 4.8.97 6.55 2.73 1.76 1.76 2.73 4.1 2.73 6.55-.02 5.1-4.16 9.23-9.27 9.23z" />
                              </svg>
                              {isSent ? t('resend', { defaultValue: 'Resend' }) : t('send', { defaultValue: 'Send Message' })}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setBulkWhatsappBatch(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                {t('close', { defaultValue: 'Done & Close' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ＋ Add Internal Guest Order Modal */}
      {showInternalOrderModal && (
        <div 
          onClick={() => setShowInternalOrderModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in no-print cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-300 dark:border-slate-800/80 shadow-2xl relative overflow-hidden animate-rise my-8 bg-white dark:bg-slate-900 cursor-default"
          >
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-2xl">📝</span>
              {t('addInternalOrderTitle')}
            </h2>
 
            <form onSubmit={submitInternalOrder} className="space-y-6">
              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-bakery-600 dark:text-bakery-400 uppercase tracking-widest">
                  👤 {t('customerInfo')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-extrabold">
                      {t('guestName')} *
                    </label>
                    <div className="relative guest-name-container w-full">
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Neighbor"
                        value={internalOrderCustomer.name}
                        onChange={(e) => {
                          setInternalOrderCustomer({ ...internalOrderCustomer, name: e.target.value });
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full text-xs p-3 pr-8 border rounded-xl bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-bakery-500 focus:ring-2 focus:ring-bakery-500/20 focus:outline-none font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition"
                      />
                      {internalOrderCustomer.name && (
                        <button
                          type="button"
                          onClick={handleClearCustomerInfo}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 text-sm font-bold"
                          title="Clear customer details"
                        >
                          ✕
                        </button>
                      )}
                      
                      {/* Glassmorphic Autocomplete Dropdown */}
                      {showSuggestions && (() => {
                        const nameQuery = (internalOrderCustomer.name || '').trim().toLowerCase();
                        const suggestions = nameQuery.length >= 2 
                          ? users.filter(u => u.name && u.name.toLowerCase().includes(nameQuery)) 
                          : [];
                        if (suggestions.length === 0) return null;
                        return (
                          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-lg divide-y divide-slate-100 dark:divide-slate-900">
                            {suggestions.map((u) => {
                              const isDummy = u.email && (u.email.includes('@internal.bakery.com') || u.email.includes('@internal.'));
                              return (
                                <button
                                  key={u.id || u.email}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(u)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-bakery-500/5 dark:hover:bg-bakery-500/10 flex flex-col transition animate-rise"
                                >
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {u.name}
                                  </span>
                                  {(u.phone || (u.email && !isDummy)) && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                                      {u.phone ? `📞 ${u.phone}` : ''} {u.phone && u.email && !isDummy ? ' • ' : ''} {u.email && !isDummy ? `✉️ ${u.email}` : ''}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-extrabold">
                        {t('guestPhone')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +385912345678"
                        value={internalOrderCustomer.phone || ''}
                        onChange={(e) => setInternalOrderCustomer({ ...internalOrderCustomer, phone: e.target.value })}
                        className="w-full text-xs p-3 border rounded-xl bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-bakery-500 focus:ring-2 focus:ring-bakery-500/20 focus:outline-none font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-extrabold">
                        {t('guestEmail')}
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. guest@neighborhood.com"
                        value={internalOrderCustomer.email || ''}
                        onChange={(e) => setInternalOrderCustomer({ ...internalOrderCustomer, email: e.target.value })}
                        className="w-full text-xs p-3 border rounded-xl bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-bakery-500 focus:ring-2 focus:ring-bakery-500/20 focus:outline-none font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Order Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <h3 className="text-xs font-extrabold text-bakery-600 dark:text-bakery-400 uppercase tracking-widest">
                    🛒 {t('itemsAndQuantities')}
                  </h3>
                  <button
                    type="button"
                    onClick={addInternalOrderItemRow}
                    className="text-[10px] text-bakery-500 hover:text-bakery-600 font-extrabold flex items-center gap-0.5"
                  >
                    {t('addAnotherItem')}
                  </button>
                </div>
 
                <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                  {internalOrderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <select
                        required
                        value={item.productVariantId}
                        onChange={(e) => updateInternalOrderItemRow(idx, 'productVariantId', e.target.value)}
                        className="flex-1 text-xs p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100 focus:border-bakery-500 focus:outline-none shadow-sm transition"
                      >
                        <option value="" disabled className="text-slate-400 bg-white dark:bg-slate-950">{t('selectProductVariant')}</option>
                        {productVariantOptions.map(opt => (
                          <option key={opt.id} value={opt.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950">{opt.label}</option>
                        ))}
                      </select>
                      <div className="w-20">
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateInternalOrderItemRow(idx, 'quantity', e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg text-center font-black bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-sm text-slate-900 dark:text-slate-100 focus:border-bakery-500 focus:outline-none transition"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInternalOrderItemRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Pickup / Collection Slot */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-extrabold">
                  🕒 {t('collectionTimeSlot')}
                </label>
                <select
                  value={internalOrderSlot}
                  onChange={(e) => setInternalOrderSlot(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-bakery-500 focus:ring-2 focus:ring-bakery-500/20 focus:outline-none font-bold text-slate-900 dark:text-slate-100 shadow-sm transition"
                >
                  {upcomingDates.map((dateObj) => {
                    const isoStr = dateObj.toISOString().split('T')[0];
                    return (
                      <option key={isoStr} value={isoStr} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                        {formatBakingDate(dateObj, currentLanguage)}
                      </option>
                    );
                  })}
                </select>
              </div>
 
              {/* Total Order Cost preview */}
              <div className="bg-gradient-to-r from-amber-500/5 to-bakery-500/5 border border-amber-500/10 dark:border-bakery-500/10 rounded-2xl p-4 flex items-center justify-between text-xs shadow-inner">
                <span className="font-extrabold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  ✨ {t('totalAmount')}
                </span>
                <span className="text-base font-black text-amber-600 dark:text-bakery-400 bg-amber-500/10 dark:bg-bakery-500/10 px-3 py-1 rounded-xl border border-amber-500/20 dark:border-bakery-500/20">
                  ${internalOrderItems.reduce((sum, item) => {
                    const opt = productVariantOptions.find(o => o.id === item.productVariantId);
                    const qVal = parseInt(item.quantity) || 0;
                    return sum + (opt ? opt.price * qVal : 0);
                  }, 0).toFixed(2)}
                </span>
              </div>
 
              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInternalOrderModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-bakery-500 to-bakery-600 hover:from-bakery-600 hover:to-bakery-700 text-white font-black rounded-xl shadow-lg hover:shadow-bakery-500/20 transition text-xs uppercase tracking-wider"
                >
                  {t('submitOrder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Baking Day Modal */}
      {showRescheduleModal && rescheduleOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl relative overflow-hidden animate-rise bg-white/95 dark:bg-slate-900/95">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span>📅</span>
              {t('rescheduleOrderTitle', { defaultValue: 'Reschedule Order' })}
            </h2>

            <form onSubmit={handleRescheduleOrder} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  {rescheduleOrder.user?.name}
                </div>
                <div className="text-slate-500">
                  #{rescheduleOrder.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="text-slate-400 font-semibold mt-1">
                  {t('currentBakingDay', { defaultValue: 'Current:' })} <span className="font-bold text-slate-600 dark:text-slate-300">{formatSlotLabel(rescheduleOrder.pickupSlot)}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-extrabold">
                  {t('selectNewBakingDay', { defaultValue: 'Select New Baking Day' })}
                </label>
                <select
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 focus:border-bakery-500 focus:ring-2 focus:ring-bakery-500/20 focus:outline-none font-bold text-slate-800 dark:text-slate-100 shadow-sm transition"
                >
                  {upcomingDates.map((dateObj) => {
                    const isoStr = dateObj.toISOString().split('T')[0];
                    return (
                      <option key={isoStr} value={isoStr} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                        {formatBakingDate(dateObj, currentLanguage)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleOrder(null);
                  }}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-200 transition dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-bakery-500 to-bakery-600 hover:from-bakery-600 hover:to-bakery-700 text-white font-black rounded-xl shadow-lg hover:shadow-bakery-500/20 transition text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {loading ? t('saving', { defaultValue: 'Saving...' }) : t('confirm', { defaultValue: 'Confirm' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
