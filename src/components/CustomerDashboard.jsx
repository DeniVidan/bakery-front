import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShoppingBag, 
  Trash2, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  ChefHat, 
  History, 
  Utensils, 
  LogOut, 
  User, 
  Sunset,
  AlertCircle,
  RotateCw,
  ChevronDown
} from 'lucide-react';

const generateUpcomingDates = (bakingDays = ['Tuesday', 'Saturday'], count = 6, leadTimeHours = 72, bakeTimeOfDay = '06:00', seasons = []) => {
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

  for (let i = 0; i < 30 && result.length < count; i++) {
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
    let activeBakeTime = bakeTimeOfDay;
    let activeCutoff = leadTimeHours;

    if (activeSeason) {
      activeBakingDays = activeSeason.bakingDays || [];
      activeBakeTime = activeSeason.bakeTime || bakeTimeOfDay;
      if (activeSeason.cutoffHours !== undefined && activeSeason.cutoffHours !== null && activeSeason.cutoffHours !== '') {
        activeCutoff = parseInt(activeSeason.cutoffHours, 10);
      }
    }

    const targetDays = activeBakingDays.map(d => daysMap[d]).filter(d => d !== undefined);
    const dayOfWeek = current.getDay();

    if (targetDays.includes(dayOfWeek)) {
      let startHours = 6;
      let startMinutes = 0;
      if (activeBakeTime && activeBakeTime.includes(':')) {
        const parts = activeBakeTime.split(':');
        startHours = parseInt(parts[0], 10) || 6;
        startMinutes = parseInt(parts[1], 10) || 0;
      }

      const bakeStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), startHours, startMinutes, 0, 0);
      const deadline = new Date(bakeStart.getTime() - activeCutoff * 60 * 60 * 1000);

      if (new Date() < deadline) {
        result.push(new Date(bakeStart));
      }
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

export default function CustomerDashboard() {
  const { user, logout, authFetch, refreshUser } = useAuth();
  const { t, LanguageSwitcher, currentLanguage } = useLanguage();
  const [menu, setMenu] = useState(null);

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

  const [orders, setOrders] = useState([]);
  const [standingOrders, setStandingOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // menu | orders | profile
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderMessage, setOrderMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [phone, setPhone] = useState('');
  const [profileName, setProfileName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bakingDays, setBakingDays] = useState(['Tuesday', 'Saturday']);
  const [bakingSeasons, setBakingSeasons] = useState([]);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [saveAsStandingOrder, setSaveAsStandingOrder] = useState(false);
  const [leadTimeHours, setLeadTimeHours] = useState(72);
  const [bakeTimeOfDay, setBakeTimeOfDay] = useState('06:00');
  const [loyaltyStatus, setLoyaltyStatus] = useState(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  const [prevQty, setPrevQty] = useState(0);
  const [badgeAnimate, setBadgeAnimate] = useState(false);
  const [flashBasket, setFlashBasket] = useState(false);

  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (totalQty !== prevQty) {
      setBadgeAnimate(true);
      const timer = setTimeout(() => setBadgeAnimate(false), 400);
      setPrevQty(totalQty);
      return () => clearTimeout(timer);
    }
  }, [totalQty, prevQty]);

  const scrollToBasket = () => {
    const el = document.getElementById('shopping-basket-drawer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setFlashBasket(true);
      setTimeout(() => setFlashBasket(false), 1500);
    }
  };

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setProfileName(user.name || '');
    }
  }, [user]);

  const fetchLoyaltyStatus = async () => {
    try {
      setLoadingLoyalty(true);
      const res = await authFetch('/api/loyalty/status');
      if (res.ok) {
        const data = await res.json();
        setLoyaltyStatus(data);
      }
    } catch (err) {
      console.error('Error fetching loyalty status:', err);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  const fetchStandingOrders = async () => {
    try {
      const res = await authFetch('/api/standing-orders');
      if (res.ok) {
        const data = await res.json();
        setStandingOrders(data.standingOrders);
      }
    } catch (err) {
      console.error('Error fetching standing orders:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchStandingOrders();
      fetchLoyaltyStatus();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setOrderMessage('');
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone })
      });
      const data = await res.json();
      if (res.ok) {
        setOrderMessage(t('profileUpdatedSuccess', { defaultValue: 'Profile updated successfully!' }));
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        setErrorMessage(data.error || t('profileUpdatedFailed', { defaultValue: 'Failed to update profile' }));
      }
    } catch (err) {
      setErrorMessage(t('profileUpdateError', { defaultValue: 'Could not connect to update profile.' }));
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await authFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        const hours = data.settings && data.settings.leadTimeHours ? parseInt(data.settings.leadTimeHours, 10) : 72;
        const bakeTime = data.settings && data.settings.bakeTimeOfDay ? data.settings.bakeTimeOfDay : '06:00';
        setLeadTimeHours(hours);
        setBakeTimeOfDay(bakeTime);

        let mode = 'advanced';
        if (data.settings && data.settings.scheduleMode) {
          mode = data.settings.scheduleMode;
        }

        let activeSeasons = [];
        if (mode !== 'easy' && data.settings && data.settings.bakingSeasons) {
          try {
            activeSeasons = JSON.parse(data.settings.bakingSeasons);
            setBakingSeasons(activeSeasons);
          } catch (e) {
            console.error('Error parsing bakingSeasons setting:', e);
          }
        }
        
        if (data.settings && data.settings.bakingDays) {
          const parsed = JSON.parse(data.settings.bakingDays);
          setBakingDays(parsed);
          const dates = generateUpcomingDates(parsed, 6, hours, bakeTime, activeSeasons);
          setUpcomingDates(dates);
          if (dates.length > 0) {
            setSelectedSlot(dates[0].toISOString().split('T')[0]);
          }
        } else {
          const dates = generateUpcomingDates(['Tuesday', 'Saturday'], 6, hours, bakeTime, activeSeasons);
          setUpcomingDates(dates);
          if (dates.length > 0) {
            setSelectedSlot(dates[0].toISOString().split('T')[0]);
          }
        }
      } else {
        const dates = generateUpcomingDates(['Tuesday', 'Saturday'], 6, 72, '06:00', []);
        setUpcomingDates(dates);
        if (dates.length > 0) {
          setSelectedSlot(dates[0].toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      const dates = generateUpcomingDates(['Tuesday', 'Saturday'], 6, 72, '06:00', []);
      setUpcomingDates(dates);
      if (dates.length > 0) {
        setSelectedSlot(dates[0].toISOString().split('T')[0]);
      }
    }
  };

  // Load menu, orders and subscriptions
  useEffect(() => {
    fetchMenu();
    fetchOrders();
    fetchStandingOrders();
    fetchSettings();
    fetchLoyaltyStatus();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoadingMenu(true);
      const res = await authFetch('/api/menu/current');
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await authFetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Add to Cart
  const addToCart = (product, variant) => {
    const existing = cart.find(item => item.variant.id === variant.id);
    if (existing) {
      setCart(cart.map(item => 
        item.variant.id === variant.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, variant, quantity: 1, couponApplied: 0 }]);
    }
  };

  // Remove from Cart
  const removeFromCart = (variantId) => {
    setCart(cart.filter(item => item.variant.id !== variantId));
  };

  // Change quantity
  const updateQty = (variantId, amount) => {
    setCart(cart.map(item => {
      if (item.variant.id === variantId) {
        const newQty = item.quantity + amount;
        const newCouponApplied = Math.min(item.couponApplied || 0, newQty > 0 ? newQty : 0);
        return newQty > 0 ? { ...item, quantity: newQty, couponApplied: newCouponApplied } : item;
      }
      return item;
    }));
  };

  const applyCoupon = (variantId) => {
    const totalApplied = cart.reduce((sum, item) => sum + (item.couponApplied || 0), 0);
    const maxAvailable = loyaltyStatus?.freeRemaining || 0;
    if (totalApplied >= maxAvailable) return;

    setCart(cart.map(item => {
      if (item.variant.id === variantId) {
        if ((item.couponApplied || 0) < item.quantity) {
          return { ...item, couponApplied: (item.couponApplied || 0) + 1 };
        }
      }
      return item;
    }));
  };

  const removeCoupon = (variantId) => {
    setCart(cart.map(item => {
      if (item.variant.id === variantId) {
        if ((item.couponApplied || 0) > 0) {
          return { ...item, couponApplied: (item.couponApplied || 0) - 1 };
        }
      }
      return item;
    }));
  };

  // Calculate cart totals (deducting coupon applied items)
  const totalCartPrice = cart.reduce((acc, item) => acc + (item.variant.price * (item.quantity - (item.couponApplied || 0))), 0);

  // Submit Order
  const submitOrder = async () => {
    if (cart.length === 0) return;
    setErrorMessage('');
    setOrderMessage('');

    const payload = {
      pickupSlot: selectedSlot,
      items: cart.map(item => ({
        productVariantId: item.variant.id,
        quantity: item.quantity,
        couponApplied: item.couponApplied || 0
      }))
    };

    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        if (saveAsStandingOrder) {
          try {
            await Promise.all(cart.map(item => 
              authFetch('/api/standing-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productVariantId: item.variant.id,
                  quantity: item.quantity,
                  pickupSlot: selectedSlot
                })
              })
            ));
            fetchStandingOrders();
          } catch (err) {
            console.error('Failed to register subscription templates:', err);
          }
        }

        setOrderMessage(saveAsStandingOrder 
          ? t('orderAndSubLockedIn', { defaultValue: 'Order & Weekly Subscription locked in! Welcome to our regular club.' }) 
          : t('orderSubmittedSuccess', { defaultValue: 'Order submitted successfully! Our bakers are getting ready.' })
        );
        setCart([]);
        setIsCartExpanded(false);
        setSaveAsStandingOrder(false);
        fetchOrders();
        fetchLoyaltyStatus(); // Dynamic sync
        // Switch to orders tab to see status
        setTimeout(() => setActiveTab('orders'), 1200);
      } else {
        setErrorMessage(data.error || t('orderSubmitFailed', { defaultValue: 'Failed to submit order' }));
      }
    } catch (err) {
      setErrorMessage(t('orderSubmitError', { defaultValue: 'Could not connect to the baking engine. Try again.' }));
    }
  };

  // Status mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'IN_PRODUCTION': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
      case 'BAKED': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'CONFIRMED': return 2;
      case 'IN_PRODUCTION': return 3;
      case 'BAKED': return 4;
      case 'COMPLETED': return 5;
      default: return 1;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-amber-50/50 via-slate-100 to-amber-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-bakery-950/20">
      {/* Header bar */}
      <header className="sticky top-0 z-40 glass-panel border-b px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl">🍞</span>
          <div>
            <h1 className="text-sm sm:text-lg lg:text-xl font-extrabold tracking-tight text-bakery-800 dark:text-bakery-400">
              {t('laPetiteFarine')}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden xs:block">{t('artisanMicrobakery', { defaultValue: 'Artisan Microbakery' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-bakery-100 dark:bg-bakery-900/30 border border-bakery-200 dark:border-bakery-800/40">
            <User size={13} className="text-bakery-600 dark:text-bakery-400" />
            <span className="text-xs font-semibold text-bakery-800 dark:text-bakery-300 hidden sm:inline">
              {user?.name}
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500 text-white hidden md:inline">
              {t('approved', { defaultValue: 'Approved' })}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 sm:p-2 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition"
            title={t('logout')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 ${cart.length > 0 ? 'pb-32 lg:pb-8' : ''}`}>
        {/* Navigation tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition duration-200 ${
                activeTab === 'menu'
                  ? 'bg-bakery-500 text-white shadow-md shadow-bakery-500/10'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-850'
              }`}
            >
              <Utensils size={14} className="sm:w-4 sm:h-4" />
              {t('weeklyMenu')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition duration-200 relative ${
                activeTab === 'orders'
                  ? 'bg-bakery-500 text-white shadow-md shadow-bakery-500/10'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-850'
              }`}
            >
              <History size={14} className="sm:w-4 sm:h-4" />
              {t('myOrders')}
              {orders.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition duration-200 relative ${
                activeTab === 'profile'
                  ? 'bg-bakery-500 text-white shadow-md shadow-bakery-500/10'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-850'
              }`}
            >
              <User size={14} className="sm:w-4 sm:h-4" />
              {t('mySubscriptionsProfile')}
              {standingOrders.filter(so => so.active).length > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {standingOrders.filter(so => so.active).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/60 w-fit self-start md:self-auto">
            <Sunset size={14} className="text-bakery-500 animate-pulse" />
            {t('bakingNextMonday', { defaultValue: 'Baking next: Monday Morning' })}
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === 'menu' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu items list */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ChefHat className="text-bakery-500" />
                {t('bakedFreshOnDemand', { defaultValue: 'Baked Fresh on Demand' })}
              </h2>

              {loadingMenu ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bakery-500"></div>
                </div>
              ) : !menu || menu.products.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
                  <ShoppingBag size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="font-semibold">{t('menuNotPublished', { defaultValue: "The bakers haven't published this week's menu yet." })}</p>
                  <p className="text-xs">{t('checkBackSoonLoaves', { defaultValue: 'Check back soon for freshly rolled loaves!' })}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menu.products.map((product) => (
                    <div 
                      key={product.id} 
                      className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-bakery-300 dark:hover:border-bakery-800/40 transition duration-300 animate-rise"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{product.name}</h3>
                          <span className="text-xl">🥖</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{t('availableSizes', { defaultValue: 'Available Sizes' })}</span>
                        <div className="grid grid-cols-1 gap-2">
                          {product.variants.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => addToCart(product, v)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-bakery-50/50 dark:bg-bakery-950/20 hover:bg-bakery-500 hover:text-white transition group border border-bakery-100 dark:border-bakery-900/10 text-left text-xs"
                            >
                              <div className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-white">
                                {v.size}
                              </div>
                              <div className="font-bold text-bakery-600 dark:text-bakery-400 group-hover:text-white flex items-center gap-1.5">
                                ${v.price.toFixed(2)}
                                <span className="bg-bakery-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold group-hover:bg-white group-hover:text-bakery-600">+</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Cart Drawer */}
            <div id="shopping-basket-drawer" className="lg:col-span-1">
              <div className={`sticky top-20 glass-panel rounded-3xl p-6 border transition-all duration-700 shadow-xl ${
                flashBasket 
                  ? 'ring-4 ring-bakery-500 ring-offset-2 dark:ring-offset-slate-950 scale-[1.02] border-bakery-500 shadow-bakery-500/20' 
                  : 'border-slate-200 dark:border-slate-800/40'
              }`}>
                <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-bakery-500" />
                    {t('myBakingBasket', { defaultValue: 'My Baking Basket' })}
                  </span>
                  {cart.length > 0 && (
                    <span className="bg-bakery-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </h2>

                {orderMessage && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle size={16} />
                    {orderMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errorMessage}
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    <ShoppingBag size={36} className="mx-auto text-slate-300 mb-3" />
                    {t('cartEmpty', { defaultValue: 'Your basket is empty. Select fresh sourdough loaves from the menu!' })}
                    <p className="mt-1">{t('cartEmptyDesc', { defaultValue: "Add variants from the menu on the left to start building your bake order." })}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Available Coupons Banner */}
                    {loyaltyStatus && loyaltyStatus.freeRemaining > 0 && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/20 rounded-2xl text-xs relative overflow-hidden animate-rise">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl shrink-0">🎁</span>
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-amber-800 dark:text-amber-400">
                              {t('couponsAvailableTitle', { defaultValue: 'Available Loyalty Coupons' })}
                            </h4>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              {t('couponsAvailableDesc', { defaultValue: 'You have {count} free loaf coupon(s) ready to redeem! Apply them inline on your basket items below.', count: (loyaltyStatus?.freeRemaining || 0) - cart.reduce((sum, i) => sum + (i.couponApplied || 0), 0) })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Item list */}
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                      {cart.map((item) => {
                        const totalAppliedCoupons = cart.reduce((sum, i) => sum + (i.couponApplied || 0), 0);
                        const remainingCouponsToUse = (loyaltyStatus?.freeRemaining || 0) - totalAppliedCoupons;
                        const hasApplied = item.couponApplied > 0;
                        const canApply = remainingCouponsToUse > 0 && item.couponApplied < item.quantity;

                        return (
                          <div key={item.variant.id} className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 text-xs space-y-2.5">
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold truncate text-slate-800 dark:text-slate-100">{item.product.name}</h4>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">{item.variant.size}</span>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                                {/* Quantity controls */}
                                <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5">
                                  <button 
                                    onClick={() => updateQty(item.variant.id, -1)}
                                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold text-xs hover:bg-white dark:hover:bg-slate-700 rounded transition"
                                  >
                                    -
                                  </button>
                                  <span className="w-5 sm:w-6 text-center font-bold text-xs">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQty(item.variant.id, 1)}
                                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold text-xs hover:bg-white dark:hover:bg-slate-700 rounded transition"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Price */}
                                <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[36px] sm:min-w-[48px] text-right text-[11px] sm:text-xs">
                                  {hasApplied ? (
                                    <div className="flex flex-col items-end">
                                      <span className="line-through text-slate-400 text-[10px]">
                                        ${(item.variant.price * item.quantity).toFixed(2)}
                                      </span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] sm:text-xs">
                                        {item.quantity === item.couponApplied 
                                          ? t('freeLabel', { defaultValue: 'FREE' }) 
                                          : `$${(item.variant.price * (item.quantity - item.couponApplied)).toFixed(2)}`}
                                      </span>
                                    </div>
                                  ) : (
                                    `$${(item.variant.price * item.quantity).toFixed(2)}`
                                  )}
                                </span>

                                {/* Delete button */}
                                <button
                                  onClick={() => removeFromCart(item.variant.id)}
                                  className="text-slate-400 hover:text-red-500 transition p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Inline Coupon Controls */}
                            {(hasApplied || canApply) && (
                              <div className="border-t border-dashed border-slate-100 dark:border-slate-800/60 pt-2 flex flex-wrap items-center justify-between gap-2">
                                {hasApplied ? (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/25 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                                    <span>🎁</span>
                                    <span>{t('appliedCouponPill', { defaultValue: 'Coupon Applied' })} (x{item.couponApplied})</span>
                                    <button 
                                      onClick={() => removeCoupon(item.variant.id)}
                                      className="ml-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center font-bold text-[9px] transition"
                                      title="Remove Coupon"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : <div />}

                                {canApply && (
                                  <button
                                    onClick={() => applyCoupon(item.variant.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow shadow-amber-500/10 hover:shadow-amber-500/25 transition active:scale-95 ml-auto"
                                  >
                                    <span>🎁</span>
                                    <span>{t('applyCouponBtn', { defaultValue: 'Use Coupon' })}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Checkout Details & Slot Selector */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          🕒 {t('collectionTimeSlot', { defaultValue: 'Select Collection Time Slot' })}
                        </label>
                        <select
                          value={selectedSlot}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-100 font-semibold"
                        >
                          {upcomingDates.map((date) => {
                            const yyyymmdd = date.toISOString().split('T')[0];
                            return (
                              <option key={yyyymmdd} value={yyyymmdd}>
                                {formatBakingDate(date, currentLanguage)}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveAsStandingOrder}
                          onChange={(e) => setSaveAsStandingOrder(e.target.checked)}
                          className="w-4 h-4 rounded text-bakery-500 border-slate-300 mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-extrabold text-amber-800 dark:text-amber-400 block">{t('recurringWeeklySubscription', { defaultValue: 'Weekly Subscription' })}</span>
                          <span className="text-[10px] text-slate-500 block leading-relaxed mt-0.5">
                            {t('saveAsStandingOrderDesc', { defaultValue: "Save as my repeating Weekly Standing Order! We will auto-book this for you every week if these items are active." })}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Order summary */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{t('itemsCount', { defaultValue: 'Items Count' })}</span>
                        <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-base font-extrabold text-slate-800 dark:text-slate-100">
                        <span>{t('totalAmount', { defaultValue: 'Total Amount:' })}</span>
                        <span>${totalCartPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Place order button */}
                    <button
                      onClick={submitOrder}
                      className="w-full mt-4 bg-gradient-to-r from-bakery-500 to-bakery-600 text-white font-extrabold py-3 rounded-xl shadow-lg hover:shadow-bakery-500/25 transition duration-300 text-xs uppercase font-black tracking-wider"
                    >
                      {saveAsStandingOrder ? t('lockInAndSubscribe', { defaultValue: 'Lock In & Subscribe' }) : t('lockOrderSubmit', { defaultValue: 'Lock In Order' })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Order History Section with Interactive Progress Meters */
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <History className="text-bakery-500" />
              {t('orderStatusHistory', { defaultValue: 'Order Status & History' })}
            </h2>

            {loadingOrders ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bakery-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
                <Clock size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="font-semibold">{t('noOrdersPlaced')}</p>
                <p className="text-xs">{t('noOrdersPlacedDesc', { defaultValue: 'Once you request bread, progress will be live-tracked here!' })}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const step = getStatusStep(order.status);
                  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const totalPrice = order.items.reduce((sum, item) => sum + (item.productVariant.price * (item.quantity - (item.couponApplied || 0))), 0);

                  return (
                    <div 
                      key={order.id} 
                      className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800/40 relative"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                              {t('orderHash')}: #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {t('bakingBatch', { defaultValue: 'Baking Batch' })}: {order.batch ? `${t('locked', { defaultValue: 'Locked' })} - ${new Date(order.batch.date).toLocaleDateString()}` : t('queuedAwaitingBatching', { defaultValue: 'Queued (Awaiting Batching)' })}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('orderedOn')}: {new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="text-sm font-bold text-bakery-600 dark:text-bakery-400">${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Horizontal Tracker */}
                      <div className="mb-6 px-4">
                        <div className="relative">
                          {/* Progress Line */}
                          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full">
                            <div 
                              className="h-full bg-bakery-500 transition-all duration-500" 
                              style={{ width: `${((step - 1) / 4) * 100}%` }}
                            />
                          </div>

                          {/* Steps circles */}
                          <div className="relative z-10 flex justify-between items-center">
                            {[
                              { label: t('pendingStatus', { defaultValue: 'Pending' }), icon: Clock },
                              { label: t('confirmedStatus', { defaultValue: 'Confirmed' }), icon: CheckCircle },
                              { label: t('inOvenStatus', { defaultValue: 'In Oven' }), icon: ChefHat },
                              { label: t('bakedStatus', { defaultValue: 'Baked' }), icon: Utensils },
                              { label: t('readyStatus', { defaultValue: 'Ready' }), icon: TrendingUp }
                            ].map((s, idx) => {
                              const isActive = step >= (idx + 1);
                              const Icon = s.icon;

                              return (
                                <div key={idx} className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                    isActive 
                                      ? 'bg-bakery-500 text-white ring-4 ring-bakery-100 dark:ring-bakery-950/40' 
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                  }`}>
                                    <Icon size={14} />
                                  </div>
                                  <span className={`text-[9px] sm:text-[10px] font-extrabold mt-1.5 text-center max-w-[64px] sm:max-w-none leading-tight ${
                                    isActive ? 'text-bakery-600 dark:text-bakery-400' : 'text-slate-400'
                                  }`}>
                                    {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Details of items ordered */}
                      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">{t('orderDetailsCount', { defaultValue: 'Order Details ({count} items)', count: itemsCount })}</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center gap-2.5 text-xs border-b border-slate-100 dark:border-slate-800/40 pb-2.5 last:border-0 last:pb-0">
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.productVariant.product.name}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{item.productVariant.size}</span>
                                {item.couponApplied > 0 && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    🎁 {t('freeLoafBadge', { defaultValue: 'FREE LOAF' })} (x{item.couponApplied})
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">
                                {t('qty', { defaultValue: 'Qty' })}: {item.quantity}
                                {item.couponApplied > 0 && (
                                  <span className="block text-[10px] font-medium text-slate-400 line-through text-right">
                                    ${(item.productVariant.price * item.quantity).toFixed(2)}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-rise">
            {/* Left side: Profile details & Loyalty Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact details */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800/40 shadow-xl space-y-4">
                <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-800">
                  {t('myProfileDetails', { defaultValue: 'My Profile Details' })}
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full text-xs p-3 border rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-white dark:text-slate-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {t('emailAddr')}
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full text-xs p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {t('phoneContact')}
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +33612345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full text-xs p-3 border rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-white dark:text-slate-100 font-semibold"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      {t('phoneContactDesc', { defaultValue: 'Enables the baker to ping you directly on WhatsApp when your loaf is fresh in the oven!' })}
                    </span>
                  </div>

                  {orderMessage && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      {orderMessage}
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-500" />
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-bakery-500 hover:bg-bakery-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md transition"
                  >
                    {t('saveProfileDetails')}
                  </button>
                </form>
              </div>

              {/* Loyalty Stamp Card */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800/40 shadow-xl space-y-4 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-700/5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h2 className="text-md font-bold text-slate-800 dark:text-slate-200">
                      {t('loyaltyRewardsTitle', { defaultValue: '🏆 Sourdough Loyalty Card' })}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('stampCardSubtitle', { defaultValue: 'For every 10 sourdough loaves you buy, the next 1 is on us!' })}
                    </p>
                  </div>
                </div>
                
                {/* Visual Stamp Card Grid */}
                <div className="grid grid-cols-5 gap-3 py-4">
                  {Array.from({ length: 10 }).map((_, index) => {
                    const isStamped = loyaltyStatus && index < loyaltyStatus.currentProgress;
                    return (
                      <div 
                        key={index}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 relative transition-all duration-300 ${
                          isStamped 
                            ? 'bg-gradient-to-br from-bakery-100 to-bakery-200/50 dark:from-bakery-950/30 dark:to-bakery-900/10 border-bakery-500 text-bakery-600 dark:text-bakery-400 shadow-md shadow-bakery-500/10 scale-100 rotate-3' 
                            : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800/60 text-slate-300 dark:text-slate-700 scale-95'
                        }`}
                      >
                        {isStamped ? (
                          <span className="text-2xl animate-bounce" style={{ animationDuration: '2s', animationDelay: `${index * 100}ms` }}>🍞</span>
                        ) : (
                          <span className="text-xs font-bold select-none">{index + 1}</span>
                        )}
                        {isStamped && (
                          <span className="absolute -top-1 -right-1 bg-bakery-500 text-white rounded-full text-[8px] w-4 h-4 flex items-center justify-center font-bold border border-white dark:border-slate-900">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stamp card stats & messages */}
                {loyaltyStatus && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-center text-bakery-700 dark:text-bakery-400">
                      {loyaltyStatus.freeRemaining > 0 ? (
                        <span className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1.5 rounded-full inline-block animate-pulse">
                          🎉 {loyaltyStatus.freeRemaining} {loyaltyStatus.freeRemaining === 1 ? t('freeLoafCount', { defaultValue: 'Free loaf' }) : t('freeLoavesCount', { defaultValue: 'Free loaves' })} {t('remainingLabel', { defaultValue: 'Remaining' })}!
                        </span>
                      ) : (
                        <span>{t('stampsRemaining', { defaultValue: '{stamps} stamps to your next free loaf!', stamps: loyaltyStatus.stampsToNextFree })}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 leading-relaxed italic border-t border-slate-100 dark:border-slate-800/45 pt-2.5">
                      {t('claimInstruction', { defaultValue: 'Show this screen to the baker to redeem your free loaf!' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Loyalty stats, bread ledger & active subscriptions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Loyalty Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t('totalBought', { defaultValue: 'Total Bought' }), value: loyaltyStatus?.totalItemsBought || 0, icon: '🍞' },
                  { label: t('freeEarned', { defaultValue: 'Free Earned' }), value: loyaltyStatus?.freeEarned || 0, icon: '🏆' },
                  { label: t('freeRedeemed', { defaultValue: 'Redeemed' }), value: loyaltyStatus?.freeRedeemed || 0, icon: '🍽️' },
                  { label: t('freeRemaining', { defaultValue: 'Remaining' }), value: loyaltyStatus?.freeRemaining || 0, icon: '⭐' }
                ].map((stat, idx) => (
                  <div key={idx} className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800/40 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="z-10">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{stat.label}</span>
                      <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                        {loadingLoyalty ? '...' : stat.value}
                      </span>
                    </div>
                    <span className="text-2xl opacity-20 select-none z-0">{stat.icon}</span>
                  </div>
                ))}
              </div>

              {/* Bread Ledger */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800/40 shadow-xl space-y-4">
                <div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-200">
                    {t('customerLedger', { defaultValue: 'My Bread Ledger' })}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t('customerLedgerDesc', { defaultValue: 'A record of your completed purchases:' })}
                  </p>
                </div>

                {loadingLoyalty ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bakery-500"></div>
                  </div>
                ) : !loyaltyStatus || loyaltyStatus.purchaseLedger.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                    {t('noOrdersPlacedDesc', { defaultValue: 'Once you request bread, progress will be live-tracked here!' })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          <th className="py-2">{t('dateLabel', { defaultValue: 'Date' })}</th>
                          <th className="py-2">{t('productLabel', { defaultValue: 'Product' })}</th>
                          <th className="py-2 text-center">{t('quantityLabel', { defaultValue: 'Qty' })}</th>
                          <th className="py-2 text-right">{t('priceLabel', { defaultValue: 'Price' })}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                        {loyaltyStatus.purchaseLedger.map((item, idx) => (
                          <tr key={idx} className="text-slate-700 dark:text-slate-300">
                            <td className="py-2.5 font-mono text-[11px]">{new Date(item.date).toLocaleDateString()}</td>
                            <td className="py-2.5">
                              <span className="font-semibold block">{item.productName}</span>
                              <span className="text-[10px] text-slate-400 block">{item.size}</span>
                            </td>
                            <td className="py-2.5 text-center font-bold">{item.quantity}x</td>
                            <td className="py-2.5 text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Standing Subscriptions list */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {t('activeSubscriptionsCustomer', { defaultValue: 'My Weekly Bread Subscriptions' })}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t('activeSubscriptionsCustomerDesc', { defaultValue: 'Your active repeating weekly orders. Our bakers automatically prepare these bakes every cycle!' })}
                    </p>
                  </div>
                </div>

                {standingOrders.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center text-slate-500 border border-slate-200 dark:border-slate-800/60">
                    <RotateCw size={48} className="mx-auto text-slate-300 mb-4 animate-spin" style={{ animationDuration: '6s' }} />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {t('noActiveSubsCustomer', { defaultValue: "You don't have any active weekly subscriptions yet." })}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {standingOrders.map((so) => (
                      <div 
                        key={so.id} 
                        className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/40 hover:shadow-lg transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              so.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                            }`}>
                              {so.active ? t('active', { defaultValue: 'Active Subscription' }) : t('paused', { defaultValue: 'Paused' })}
                            </span>
                            <span className="font-mono text-xs font-bold text-bakery-600">
                              ${((so.productVariant?.price || 0) * so.quantity).toFixed(2)} / wk
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mt-3">
                            {so.productVariant?.product?.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {t('sizeLabel', { defaultValue: 'Size' })}: {so.productVariant?.size}
                          </p>

                          <div className="mt-4 space-y-1.5 text-xs text-slate-500 border-t pt-3">
                            <div className="flex justify-between">
                              <span>{t('qty', { defaultValue: 'Quantity' })}:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{so.quantity}x</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('collectionSlot', { defaultValue: 'Scheduled Slot' })}:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{formatSlotLabel(so.pickupSlot)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                          <button
                            onClick={async () => {
                              try {
                                const res = await authFetch(`/api/standing-orders/${so.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ active: !so.active })
                                });
                                if (res.ok) {
                                  fetchStandingOrders();
                                }
                              } catch (err) {}
                            }}
                            className={`px-3 py-1.5 rounded-lg border transition ${
                              so.active 
                                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300' 
                                : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white shadow'
                            }`}
                          >
                            {so.active ? t('pauseButton', { defaultValue: 'Pause' }) : t('activateButton', { defaultValue: 'Activate' })}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(t('cancelSubscriptionConfirm', { defaultValue: 'Are you sure you want to cancel this weekly subscription?' }))) return;
                              try {
                                const res = await authFetch(`/api/standing-orders/${so.id}`, {
                                  method: 'DELETE'
                                });
                                if (res.ok) {
                                  fetchStandingOrders();
                                }
                              } catch (err) {}
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:text-red-400 transition"
                          >
                            {t('cancel', { defaultValue: 'Cancel' })}
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
      </main>

      {/* Mobile Sticky Floating Basket Bar / Expandable Bottom Sheet */}
      {cart.length > 0 && (
        <>
          {/* Backdrop Blur Overlay when cart is expanded */}
          {isCartExpanded && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in pointer-events-auto"
              onClick={() => setIsCartExpanded(false)}
            />
          )}

          {/* Bottom Sheet Modal */}
          <div 
            className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-tr from-slate-50 via-white to-amber-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-bakery-950/20 border-t border-slate-200 dark:border-slate-800 rounded-t-[2.5rem] shadow-2xl transition-transform duration-300 transform ${
              isCartExpanded ? 'translate-y-0 pointer-events-auto animate-slide-up' : 'translate-y-full pointer-events-none'
            }`}
            style={{ maxHeight: '92vh' }}
          >
            {/* Grab / Drag Handle */}
            <div 
              className="flex justify-center py-3.5 cursor-pointer"
              onClick={() => setIsCartExpanded(false)}
            >
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Expanded Cart Content */}
            <div className="px-5 sm:px-6 pb-8 overflow-y-auto" style={{ maxHeight: '84vh' }}>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-bakery-500" />
                  {t('myBakingBasket', { defaultValue: 'My Baking Basket' })}
                  <span className="bg-bakery-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                    {totalQty}
                  </span>
                </h2>
                <button 
                  onClick={() => setIsCartExpanded(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {orderMessage && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle size={16} />
                  {orderMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  {errorMessage}
                </div>
              )}

              {/* Coupons Banner */}
              {loyaltyStatus && loyaltyStatus.freeRemaining > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/20 rounded-2xl text-xs relative overflow-hidden animate-rise">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0">🎁</span>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-amber-800 dark:text-amber-400">
                        {t('couponsAvailableTitle', { defaultValue: 'Available Loyalty Coupons' })}
                      </h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {t('couponsAvailableDesc', { defaultValue: 'You have {count} free loaf coupon(s) ready to redeem! Apply them inline on your basket items below.', count: (loyaltyStatus?.freeRemaining || 0) - cart.reduce((sum, i) => sum + (i.couponApplied || 0), 0) })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Itemized List */}
              <div className="space-y-3 mb-4">
                {cart.map((item) => {
                  const totalAppliedCoupons = cart.reduce((sum, i) => sum + (i.couponApplied || 0), 0);
                  const remainingCouponsToUse = (loyaltyStatus?.freeRemaining || 0) - totalAppliedCoupons;
                  const hasApplied = item.couponApplied > 0;
                  const canApply = remainingCouponsToUse > 0 && item.couponApplied < item.quantity;

                  return (
                    <div key={item.variant.id} className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 text-xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold truncate text-slate-800 dark:text-slate-100">{item.product.name}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">{item.variant.size}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {/* Quantity controls */}
                          <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5">
                            <button 
                              onClick={() => updateQty(item.variant.id, -1)}
                              className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-white dark:hover:bg-slate-700 rounded transition"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                            <button 
                              onClick={() => updateQty(item.variant.id, 1)}
                              className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-white dark:hover:bg-slate-700 rounded transition"
                            >
                              +
                            </button>
                          </div>

                          {/* Price */}
                          <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[42px] text-right text-xs">
                            {hasApplied ? (
                              <div className="flex flex-col items-end">
                                <span className="line-through text-slate-400 text-[10px]">
                                  ${(item.variant.price * item.quantity).toFixed(2)}
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                                  {item.quantity === item.couponApplied 
                                    ? t('freeLabel', { defaultValue: 'FREE' }) 
                                    : `$${(item.variant.price * (item.quantity - item.couponApplied)).toFixed(2)}`}
                                </span>
                              </div>
                            ) : (
                              `$${(item.variant.price * item.quantity).toFixed(2)}`
                            )}
                          </span>

                          {/* Delete button */}
                          <button
                            onClick={() => removeFromCart(item.variant.id)}
                            className="text-slate-400 hover:text-red-500 transition p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Inline Coupon Controls */}
                      {(hasApplied || canApply) && (
                        <div className="border-t border-dashed border-slate-100 dark:border-slate-800/60 pt-2 flex flex-wrap items-center justify-between gap-2">
                          {hasApplied ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/25 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                              <span>🎁</span>
                              <span>{t('appliedCouponPill', { defaultValue: 'Coupon Applied' })} (x{item.couponApplied})</span>
                              <button 
                                onClick={() => removeCoupon(item.variant.id)}
                                className="ml-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center font-bold text-[9px] transition"
                                title="Remove Coupon"
                              >
                                ✕
                              </button>
                            </div>
                          ) : <div />}

                          {canApply && (
                            <button
                              onClick={() => applyCoupon(item.variant.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow shadow-amber-500/10 hover:shadow-amber-500/25 transition active:scale-95 ml-auto"
                            >
                              <span>🎁</span>
                              <span>{t('applyCouponBtn', { defaultValue: 'Use Coupon' })}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Slot Selector & Subscription */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    🕒 {t('collectionTimeSlot', { defaultValue: 'Select Collection Time Slot' })}
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-100 font-semibold"
                  >
                    {upcomingDates.map((date) => {
                      const yyyymmdd = date.toISOString().split('T')[0];
                      return (
                        <option key={yyyymmdd} value={yyyymmdd}>
                          {formatBakingDate(date, currentLanguage)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAsStandingOrder}
                    onChange={(e) => setSaveAsStandingOrder(e.target.checked)}
                    className="w-4 h-4 rounded text-bakery-500 border-slate-300 mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-extrabold text-amber-800 dark:text-amber-400 block">{t('recurringWeeklySubscription', { defaultValue: 'Weekly Subscription' })}</span>
                    <span className="text-[10px] text-slate-500 block leading-relaxed mt-0.5">
                      {t('saveAsStandingOrderDesc', { defaultValue: "Save as my repeating Weekly Standing Order! We will auto-book this for you every week if these items are active." })}
                    </span>
                  </div>
                </label>
              </div>

              {/* Summary */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{t('itemsCount', { defaultValue: 'Items Count' })}</span>
                  <span>{totalQty}</span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-slate-800 dark:text-slate-100">
                  <span>{t('totalAmount', { defaultValue: 'Total Amount:' })}</span>
                  <span>${totalCartPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={submitOrder}
                className="w-full mt-4 bg-gradient-to-r from-bakery-500 to-bakery-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-bakery-500/25 transition duration-300 text-xs uppercase font-black tracking-wider"
              >
                {saveAsStandingOrder ? t('lockInAndSubscribe', { defaultValue: 'Lock In & Subscribe' }) : t('lockOrderSubmit', { defaultValue: 'Lock In Order' })}
              </button>
            </div>
          </div>

          {/* Compact Sticky Summary Bar (Visible only when sheet is collapsed) */}
          {!isCartExpanded && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-slate-100/90 via-slate-100/95 to-transparent dark:from-slate-950/90 dark:via-slate-950/95 dark:to-transparent backdrop-blur-md pointer-events-none">
              <div className="max-w-md mx-auto pointer-events-auto">
                <button
                  onClick={() => setIsCartExpanded(true)}
                  className="w-full flex items-center justify-between animate-shimmer-brown animate-warm-glow text-white font-black text-xs uppercase tracking-wider py-4 px-5 sm:px-6 rounded-2xl shadow-2xl border border-bakery-500/30 animate-basket-slide"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative bg-white/10 p-2 rounded-xl border border-white/20">
                      <ShoppingBag size={18} className="animate-pulse text-amber-100" />
                      <span className={`absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-extrabold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm ${badgeAnimate ? 'animate-badge-pop' : ''}`}>
                        {totalQty}
                      </span>
                    </div>
                    <div className="text-left leading-tight">
                      <span className="block font-black text-[12px] tracking-wide text-white">{t('myBakingBasket', { defaultValue: 'My Baking Basket' })}</span>
                      <span className="block text-[10px] text-amber-100 normal-case font-medium mt-0.5">{t('clickToReviewCheckout', { defaultValue: 'Tap to review & checkout' })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition duration-200 px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs font-black tracking-wide">${totalCartPrice.toFixed(2)}</span>
                    <span className="text-sm font-black">→</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
