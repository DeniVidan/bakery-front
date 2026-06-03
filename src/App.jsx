import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import { 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Clock, 
  AlertCircle
} from 'lucide-react';

function ApplicationRouter() {
  const { user, loading, login, register, loginWithGoogleMock } = useAuth();
  const { t, LanguageSwitcher } = useLanguage();
  
  // Login / signup local state
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Handle local Auth Submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (isRegister && !name) {
      setErrorMsg(t('fullNameRequired', { defaultValue: 'Please specify your full name.' }) === 'fullNameRequired' ? 'Please specify your full name.' : t('fullNameRequired'));
      return;
    }
    if (!email || !password) {
      setErrorMsg(t('fieldsRequired', { defaultValue: 'Email and password fields are required.' }) === 'fieldsRequired' ? 'Email and password fields are required.' : t('fieldsRequired'));
      return;
    }

    try {
      setSubmitting(true);
      if (isRegister) {
        await register(name, email, password);
        setStatusMsg(t('registerSuccess', { defaultValue: 'Your account was successfully registered and is now in PENDING status.' }) === 'registerSuccess' ? 'Your account was successfully registered and is now in PENDING status.' : t('registerSuccess'));
      } else {
        await login(email, password);
      }
    } catch (err) {
      setErrorMsg(t('authFailed', { defaultValue: 'Authentication failed. Please verify credentials.' }) === 'authFailed' ? 'Authentication failed. Please verify credentials.' : t('authFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Google Sign-In Simulation
  const triggerGoogleOAuth = async () => {
    setErrorMsg('');
    try {
      setSubmitting(true);
      const mockProfile = {
        name: isRegister ? 'Gourmet Sourdough Fan' : 'Gourmet Sourdough Fan',
        email: email || 'sourdoughfan@google.com',
        id: 'google-oauth-' + Math.floor(Math.random() * 100000),
        picture: ''
      };
      await loginWithGoogleMock(mockProfile);
      if (isRegister) {
        setStatusMsg(t('googleRegisterSuccess', { defaultValue: 'Google registration complete! Status is PENDING.' }) === 'googleRegisterSuccess' ? 'Google registration complete! Status is PENDING.' : t('googleRegisterSuccess'));
      }
    } catch (err) {
      setErrorMsg(t('googleFailed', { defaultValue: 'Google Sign-In failed to verify.' }) === 'googleFailed' ? 'Google Sign-In failed to verify.' : t('googleFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading Splash Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 select-none">
        <span className="text-5xl animate-bounce">🍞</span>
        <h2 className="text-xl font-extrabold text-bakery-400 mt-4 uppercase tracking-widest animate-pulse">
          {t('laminatingDough')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{t('connectingOven')}</p>
      </div>
    );
  }

  // 2. Unauthenticated Login / Register card
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-amber-50/50 via-slate-100 to-amber-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-bakery-950/20 flex items-center justify-center p-4 relative">
        
        {/* Floating Language Switcher top right */}
        <div className="absolute top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>

        <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden animate-rise mt-8">
          
          {/* Logo */}
          <div className="text-center mb-6">
            <span className="text-4xl">🍞</span>
            <h2 className="text-2xl font-extrabold tracking-tight text-bakery-800 dark:text-bakery-400 mt-2">
              {t('laPetiteFarine')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('microbakeryMgmt')}</p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">{t('fullName')}</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-3 pl-10 border rounded-xl dark:bg-slate-950 dark:border-slate-800 focus:border-bakery-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">{t('emailAddr')}</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. customer@bakery.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-3 pl-10 border rounded-xl dark:bg-slate-950 dark:border-slate-800 focus:border-bakery-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">{t('password')}</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-3 pl-10 border rounded-xl dark:bg-slate-950 dark:border-slate-800 focus:border-bakery-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-r from-bakery-500 to-bakery-600 hover:from-bakery-600 hover:to-bakery-700 text-white font-extrabold py-3 rounded-xl shadow-lg hover:shadow-bakery-500/20 transition disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {submitting ? t('laminatingDough') : isRegister ? t('registerAccount') : t('authenticateSession')}
            </button>
          </form>

          {/* Google Sign-In Option */}
          <div className="mt-4">
            <button
              onClick={triggerGoogleOAuth}
              type="button"
              className="w-full border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 1 12 1 7.24 1 3.23 3.76 1.34 7.78l3.85 2.99C6.1 7.77 8.82 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.07 2.66-2.3 3.49l3.58 2.78c2.1-1.94 3.78-4.79 3.78-8.42z"/>
                <path fill="#FBBC05" d="M5.19 10.77a7.18 7.18 0 010-4.54L1.34 3.24a11.95 7.15 0 000 10.53l3.85-3z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.58-2.78c-.99.66-2.26 1.05-4.38 1.05-3.18 0-5.9-2.73-6.86-5.73L1.29 16.63C3.18 20.24 7.19 23 12 23z"/>
              </svg>
              <span>{isRegister ? t('registerWithGoogle') : t('signInWithGoogle')}</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setStatusMsg('');
              }}
              className="text-bakery-600 dark:text-bakery-400 font-bold hover:underline"
            >
              {isRegister ? t('alreadyRegistered') : t('newBakeryClient')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. User account is in PENDING state (Invited user verification splash)
  if (user.role !== 'ADMIN' && user.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 select-none relative">
        
        {/* Floating Language Switcher top right */}
        <div className="absolute top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>

        <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-slate-800 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <Clock size={48} className="mx-auto text-amber-500 animate-pulse" />
          <h2 className="text-xl font-extrabold tracking-tight text-bakery-400 uppercase">
            {t('awaitingApproval')}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('awaitingApprovalDesc', { name: user.name })}
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-500">
            {t('assignedStatus')}: <span className="text-amber-500 font-bold uppercase">{user.status}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2.5 rounded-xl transition"
          >
            {t('checkStatusAgain')}
          </button>
        </div>
      </div>
    );
  }

  // 4. User account is REJECTED
  if (user.role !== 'ADMIN' && user.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative">
        
        {/* Floating Language Switcher top right */}
        <div className="absolute top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>

        <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-slate-800 text-center space-y-4 shadow-2xl">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-extrabold text-red-500 uppercase">
            {t('accessRestricted')}
          </h2>
          <p className="text-xs text-slate-400">
            {t('accessRestrictedDesc')}
          </p>
        </div>
      </div>
    );
  }

  // 5. Admin Dashboard
  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // 6. Approved Customer Dashboard
  return <CustomerDashboard />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ApplicationRouter />
      </AuthProvider>
    </LanguageProvider>
  );
}
