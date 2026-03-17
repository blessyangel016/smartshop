/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Package,
  BookText,
  ShoppingBag, 
  PlusCircle, 
  ShoppingCart, 
  BarChart3, 
  QrCode, 
  AlertTriangle, 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Send,
  LogOut,
  User,
  Lock,
  Phone,
  Store,
  Trash2,
  Edit2,
  Book,
  History,
  Settings,
  Scan,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- Types ---

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  barcode?: string;
}

interface User {
  shopName: string;
  emailOrPhone: string;
  password?: string;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  barcode?: string;
}

interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  customerPhone?: string;
}

interface DuePayment {
  id: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  originalTotal: number;
  date: string;
  status: 'pending' | 'paid';
}

// --- Storage Helpers ---

const USER_SCOPED_KEYS = ['products', 'sales', 'upi_id', 'cart', 'lastSaleId', 'due_payments'];

const getScopedKey = (key: string) => {
  if (!USER_SCOPED_KEYS.includes(key)) return key;
  
  const currentUserStr = localStorage.getItem('currentUser');
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser && currentUser.emailOrPhone) {
        // Use emailOrPhone as a unique prefix for user data
        return `user_${currentUser.emailOrPhone}_${key}`;
      }
    } catch (e) {
      // Fallback to original key if parsing fails
    }
  }
  return key;
};

const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    const scopedKey = getScopedKey(key);
    const item = localStorage.getItem(scopedKey);
    return item ? JSON.parse(item) : defaultValue;
  },
  set: (key: string, value: any) => {
    const scopedKey = getScopedKey(key);
    localStorage.setItem(scopedKey, JSON.stringify(value));
  }
};

// --- Barcode Scanner Component ---

const BarcodeScanner = ({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        setScannedCode(decodedText);
        scanner.clear().catch(e => console.error(e));
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Scan Barcode</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <Plus className="rotate-45" size={20} />
          </button>
        </div>
        
        {!scannedCode ? (
          <>
            <div id="reader" className="w-full"></div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500">Place the product barcode inside the box to scan.</p>
            </div>
          </>
        ) : (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Scanned Barcode</p>
              <p className="text-2xl font-bold text-slate-900 font-mono tracking-wider">{scannedCode}</p>
            </div>
            <button 
              onClick={() => {
                onScan(scannedCode);
                onClose();
              }}
              className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} /> Confirm Product
            </button>
            <button 
              onClick={() => setScannedCode(null)}
              className="text-sm text-slate-400 font-bold hover:text-slate-600"
            >
              Scan Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Confirmation Dialog Component ---

const ConfirmationDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  type = "danger"
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel: () => void,
  confirmText?: string,
  cancelText?: string,
  type?: "danger" | "warning" | "info"
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-sm rounded-[2rem] overflow-hidden relative z-10 shadow-2xl p-8 text-center border border-slate-100"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
          }`}>
            {type === 'danger' ? <Trash2 size={32} /> : <AlertTriangle size={32} />}
          </div>
          
          <h3 className="text-xl font-bold text-secondary mb-2">{title}</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">{message}</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${
                type === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100' : 'btn-primary'
              }`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- Components ---

const MotionBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-20 -left-20 w-96 h-96 bg-sky-100/40 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/3 -right-20 w-80 h-80 bg-emerald-100/30 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 20, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-20 left-1/4 w-72 h-72 bg-orange-50/50 rounded-full blur-[100px]"
      />
    </div>
  );
};

const Layout = ({ children, title, showBack = true, showSettings = false }: { children: React.ReactNode, title: string, showBack?: boolean, showSettings?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = storage.get<User | null>('currentUser', null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { title: 'Dukaan', icon: Store, path: '/' },
    { title: 'Add Products', icon: PlusCircle, path: '/add-products' },
    { title: 'Sell Product', icon: ShoppingCart, path: '/sell' },
    { title: 'Sales', icon: BarChart3, path: '/sales' },
    { title: 'Due Book', icon: BookText, path: '/due-book' },
    { title: 'Add UPI ID', icon: QrCode, path: '/add-upi' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Store size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-secondary">SmartShop</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                location.pathname === item.path 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-secondary'
              }`}
            >
              <item.icon size={20} />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                    <Store size={24} />
                  </div>
                  <span className="font-bold text-xl text-secondary">SmartShop</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      location.pathname === item.path 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-secondary'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.title}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-all"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl text-slate-600"
            >
              <Store size={20} />
            </button>
            {showBack && (
              <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all active:scale-90 text-slate-600">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="font-bold text-xl tracking-tight text-secondary truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{currentUser.shopName}</span>
                <span className="text-[10px] text-slate-400 font-medium">{currentUser.emailOrPhone}</span>
              </div>
            )}
            <button 
              onClick={() => navigate('/settings')} 
              className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-xl transition-all active:scale-90 border border-transparent hover:border-slate-200"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>
        
        <main className="p-6 lg:p-10 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// --- Pages ---

const LoginPage = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = storage.get<User[]>('users', []);

    if (isSignup) {
      const input = formData.emailOrPhone.trim();
      const isNumeric = /^\d+$/.test(input);

      // Validation
      if (isNumeric) {
        if (input.length !== 10) {
          setError('Mobile number must be exactly 10 digits');
          return;
        }
      } else {
        if (!input.toLowerCase().includes('@gmail.com')) {
          setError('Email must contain @gmail.com');
          return;
        }
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const shopName = formData.shopName.trim();
      if (users.find(u => u.shopName.toLowerCase() === shopName.toLowerCase())) {
        setError('Shop name already taken');
        return;
      }
      if (users.find(u => u.emailOrPhone === input)) {
        setError('User already exists with this email/phone');
        return;
      }
      
      const newUser = { 
        shopName: shopName, 
        emailOrPhone: input, 
        password: formData.password 
      };
      storage.set('users', [...users, newUser]);
      storage.set('currentUser', newUser);
      navigate('/');
    } else {
      const identifier = formData.shopName.trim();
      const user = users.find(u => 
        (u.shopName.toLowerCase() === identifier.toLowerCase() || u.emailOrPhone === identifier) && 
        u.password === formData.password
      );
      if (user) {
        storage.set('currentUser', user);
        navigate('/');
      } else {
        setError('Invalid shop name, email/phone or password');
      }
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col justify-center items-center relative overflow-hidden bg-background">
      <MotionBackground />
      
      <div className="w-full max-w-md glass-card p-8 rounded-[2rem] relative z-10 shadow-xl">
        <div className="mb-10 text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200"
          >
            <ShoppingBag className="text-white" size={48} />
          </motion.div>
          <h1 className="text-4xl font-bold text-secondary tracking-tight">SmartShop</h1>
          <p className="text-slate-500 mt-3 font-medium">Elevate your business management</p>
        </div>

        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-200/50">
          <button 
            onClick={() => { setIsSignup(false); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${!isSignup ? 'bg-white shadow-md text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsSignup(true); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isSignup ? 'bg-white shadow-md text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignup && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Shop Name</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="Your Shop Name"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={formData.shopName}
                  onChange={e => setFormData({...formData, shopName: e.target.value})}
                />
              </div>
            </div>
          )}
          
          {!isSignup && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Shop Name / Email / Phone</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="Enter your credentials"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={formData.shopName}
                  onChange={e => setFormData({...formData, shopName: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              {isSignup ? 'Email or Phone' : 'Password'}
            </label>
            {isSignup ? (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="email@gmail.com or phone"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={formData.emailOrPhone}
                  onChange={e => setFormData({...formData, emailOrPhone: e.target.value})}
                />
              </div>
            ) : (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            )}
          </div>

          {isSignup && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2"
            >
              <AlertTriangle size={16} />
              {error}
            </motion.div>
          )}

          <button type="submit" className="w-full btn-primary py-4 text-lg mt-4 shadow-xl shadow-blue-200">
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {!isSignup && (
          <div className="mt-8 text-center">
            <Link to="/forgot-password" class="text-sm font-bold text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const input = email.trim();
    const users = storage.get<User[]>('users', []);
    const user = users.find(u => u.emailOrPhone === input);
    
    if (user) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setStep(2);
      setError('');
    } else {
      setError('User not found');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      setStep(3);
      setError('');
    } else {
      setError('Invalid OTP');
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    const users = storage.get<User[]>('users', []);
    const updatedUsers = users.map(u => u.emailOrPhone === email ? { ...u, password: newPassword } : u);
    storage.set('users', updatedUsers);
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 flex flex-col justify-center items-center relative overflow-hidden transition-colors duration-300">
      <MotionBackground />
      
      <div className="w-full max-w-md glass-card p-8 rounded-[2rem] relative z-10 shadow-xl">
        <div className="mb-10">
          <button 
            onClick={() => navigate('/login')} 
            className="mb-6 p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 text-slate-600 border border-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-secondary tracking-tight">Reset Password</h1>
          <p className="text-slate-500 mt-2 font-medium">
            {step === 1 && "Enter your registered email or phone"}
            {step === 2 && "Enter the 4-digit code shown below"}
            {step === 3 && "Create a new secure password"}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email or Phone</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="e.g. 9876543210"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            <button type="submit" className="w-full btn-primary py-4 text-lg shadow-xl shadow-blue-100">
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-8">
            <div className="bg-slate-50/50 border border-slate-200/50 p-6 rounded-3xl text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-3">Verification Code</p>
              <p className="text-4xl font-mono font-bold text-primary tracking-[0.3em]">{generatedOtp}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">Enter OTP</label>
              <input 
                required
                type="text" 
                maxLength={4}
                placeholder="0 0 0 0"
                className="w-full px-4 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center text-3xl font-bold tracking-[0.5em] transition-all"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
            </div>
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            <button type="submit" className="w-full btn-primary py-4 text-lg shadow-xl shadow-blue-100">
              Verify OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="w-full btn-primary py-4 text-lg shadow-xl shadow-blue-100">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const products = storage.get<Product[]>('products', []);
  const sales = storage.get<Sale[]>('sales', []);
  const lowStockItems = products.filter(p => p.quantity < 10);

  const slowMovingItems = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productSales: Record<string, number> = {};
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate >= thirtyDaysAgo) {
        sale.items.forEach(item => {
          productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        });
      }
    });

    return products.filter(p => {
      const sold = productSales[p.id] || 0;
      return sold < 5;
    }).map(p => ({ ...p, sold: productSales[p.id] || 0 }));
  }, [products, sales]);

  useEffect(() => {
    if (slowMovingItems.length > 0) {
      const topSlow = slowMovingItems[0];
      const hasAlerted = sessionStorage.getItem(`alert_slow_${topSlow.id}`);
      if (!hasAlerted) {
        sessionStorage.setItem(`alert_slow_${topSlow.id}`, 'true');
      }
    }
  }, [slowMovingItems]);

  const today = new Date();
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.getDate() === today.getDate() &&
           saleDate.getMonth() === today.getMonth() &&
           saleDate.getFullYear() === today.getFullYear();
  }).reduce((acc, sale) => acc + sale.total, 0);

  const menuItems = [
    { title: 'Add Products', icon: PlusCircle, path: '/add-products', color: 'bg-primary' },
    { title: 'Sell Products', icon: ShoppingCart, path: '/sell', color: 'bg-accent' },
    { title: 'Sales', icon: BarChart3, path: '/sales', color: 'bg-warning' },
    { title: 'Due Book', icon: BookText, path: '/due-book', color: 'bg-red-500' },
    { title: 'Add UPI ID', icon: QrCode, path: '/add-upi', color: 'bg-purple-500' },
  ];

  return (
    <Layout title="Dukaan" showBack={false} showSettings={true}>
      <div className="mb-8 ml-1">
        <h2 className="text-2xl font-bold text-slate-900">Namaste!</h2>
        <p className="text-slate-500">Manage your dukaan easily.</p>
      </div>

      {lowStockItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm"
        >
          <div className="bg-red-500 p-3 rounded-xl text-white shadow-lg">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-red-900 text-sm">Low Stock Alert</h3>
            <p className="text-red-700 text-xs mt-1 font-medium">
              {lowStockItems.length} products need restocking soon.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lowStockItems.slice(0, 3).map(p => (
                <span key={p.id} className="bg-white text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 shadow-sm">
                  {p.name} ({p.quantity})
                </span>
              ))}
              {lowStockItems.length > 3 && <span className="text-red-800 text-[10px] font-bold self-center">+{lowStockItems.length - 3} more</span>}
            </div>
          </div>
        </motion.div>
      )}

      {slowMovingItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm"
        >
          <div className="bg-warning p-3 rounded-xl text-white shadow-lg shadow-warning/20">
            <History size={20} />
          </div>
          <div>
            <h3 className="font-bold text-warning text-sm">Slow Moving Products</h3>
            <p className="text-warning/80 text-xs mt-1 font-medium">
              {slowMovingItems.length} products have low sales in the last 30 days.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {slowMovingItems.slice(0, 3).map(p => (
                <span key={p.id} className="bg-white text-warning text-[10px] font-bold px-2.5 py-1 rounded-lg border border-warning/20 shadow-sm">
                  {p.name} ({p.sold} sold)
                </span>
              ))}
              {slowMovingItems.length > 3 && <span className="text-warning/80 text-[10px] font-bold self-center">+{slowMovingItems.length - 3} more</span>}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => navigate(item.path)}
            className="dashboard-card flex flex-col items-center text-center gap-4 group"
          >
            <div className={`${item.color} p-5 rounded-2xl text-white shadow-lg shadow-blue-100/50 transition-transform duration-300 group-hover:scale-110`}>
              <item.icon size={32} />
            </div>
            <span className="font-bold text-secondary text-sm tracking-tight">{item.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-5 ml-1">Quick Insights</h3>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex justify-between items-center shadow-md">
          <div className="text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Inventory</p>
            <p className="text-2xl font-bold text-secondary">{products.length}</p>
          </div>
          <div className="h-12 w-[1px] bg-slate-100"></div>
          <div className="text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Today's Revenue</p>
            <p className="text-2xl font-bold text-accent">₹{todaySales.toFixed(0)}</p>
          </div>
          <div className="h-12 w-[1px] bg-slate-100"></div>
          <div className="text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Low Stock</p>
            <p className="text-2xl font-bold text-red-500">{products.filter(p => p.quantity < 10).length}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const AddUpiPage = () => {
  const navigate = useNavigate();
  const [upiId, setUpiId] = useState(storage.get<string>('upi_id', ''));
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.set('upi_id', upiId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="UPI Settings">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
          <QrCode size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Accept UPI Payments</h2>
        <p className="text-slate-500 text-sm mb-6">Enter your UPI ID to generate QR codes for customers at checkout.</p>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your UPI ID</label>
            <input 
              required
              type="text" 
              placeholder="e.g. shopname@okicici"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 flex items-center justify-center gap-2">
            {saved ? <><CheckCircle2 size={20} /> Saved</> : 'Save UPI ID'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

const AddProductsPage = () => {
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '', unit: 'packets', barcode: '' });
  const [status, setStatus] = useState('');
  const [products, setProducts] = useState<Product[]>(storage.get<Product[]>('products', []));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isEditScanning, setIsEditScanning] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);

  const units = ['packets', 'kg', 'litres', 'grams', 'ml', 'pieces', 'dozen', 'box'];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price),
      unit: formData.unit,
      barcode: formData.barcode
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    storage.set('products', updatedProducts);
    setFormData({ name: '', quantity: '', price: '', unit: 'packets', barcode: '' });
    setStatus('Product Added Successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleDelete = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    storage.set('products', updatedProducts);
    setItemToDelete(null);
  };

  const handleUpdateProduct = (id: string) => {
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, name: editName || p.name, price: parseFloat(editPrice) || 0, quantity: parseInt(editQuantity) || 0, unit: editUnit || p.unit, barcode: editBarcode || p.barcode } : p
    );
    setProducts(updatedProducts);
    storage.set('products', updatedProducts);
    setEditingId(null);
    setEditName('');
    setEditPrice('');
    setEditQuantity('');
    setEditUnit('');
    setEditBarcode('');
  };

  return (
    <Layout title="Add Product">
      <ConfirmationDialog 
        isOpen={!!itemToDelete}
        title="Delete Product?"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={() => itemToDelete && handleDelete(itemToDelete.id)}
        onCancel={() => setItemToDelete(null)}
      />
      {showScanner && (
        <BarcodeScanner 
          onScan={(data) => {
            if (isEditScanning) {
              setEditBarcode(data);
            } else {
              setFormData({ ...formData, barcode: data });
            }
          }} 
          onClose={() => {
            setShowScanner(false);
            setIsEditScanning(false);
          }} 
        />
      )}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md transition-colors">
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Milk 1L"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode (Optional)</label>
            <div className="space-y-3">
              <button 
                type="button"
                onClick={() => {
                  setIsEditScanning(false);
                  setShowScanner(true);
                }}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <Scan size={20} />
                Scan Product
              </button>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Or enter barcode manually"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.barcode}
                  onChange={e => setFormData({...formData, barcode: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
              <input 
                required
                type="number" 
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (₹)</label>
            <input 
              required
              type="number" 
              step="0.01" 
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>
          
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 mt-2 active:scale-[0.98] transition-all">
            Add to Inventory
          </button>
          
          {status && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-accent/10 text-accent p-3 rounded-xl text-center text-sm font-bold border border-accent/20"
            >
              {status}
            </motion.div>
          )}
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Inventory Management</h3>
        <div className="space-y-3">
          {products.slice().reverse().map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group min-h-[80px] transition-all shadow-md hover:shadow-lg">
              {editingId === p.id ? (
                <div className="flex flex-col gap-2 w-full">
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Product Name"
                    autoFocus
                  />
                  <div className="space-y-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsEditScanning(true);
                        setShowScanner(true);
                      }}
                      className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200 text-xs"
                    >
                      <Scan size={14} />
                      Scan Barcode
                    </button>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={editBarcode}
                      onChange={e => setEditBarcode(e.target.value)}
                      placeholder="Barcode"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Qty:</span>
                      <input 
                        type="number" 
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={editQuantity}
                        onChange={e => setEditQuantity(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Unit:</span>
                      <select 
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value)}
                      >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Price:</span>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdateProduct(p.id)}
                      className="bg-accent text-white p-2 rounded-xl hover:bg-accent/80 transition-colors shadow-sm"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500">Stock: {p.quantity} {p.unit || 'units'}</p>
                      {p.barcode && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-slate-200"><Scan size={8} /> {p.barcode}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-blue-600">₹{p.price}</p>
                      <button 
                        onClick={() => { 
                          setEditingId(p.id); 
                          setEditName(p.name);
                          setEditPrice(p.price.toString()); 
                          setEditQuantity(p.quantity.toString()); 
                          setEditUnit(p.unit || 'units');
                          setEditBarcode(p.barcode || '');
                        }}
                        className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setItemToDelete(p)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">No products in inventory</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

const SellProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState('1');
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>(storage.get<CartItem[]>('cart', []));
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const allProducts = storage.get<Product[]>('products', []);
    setProducts(allProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.barcode && p.barcode.includes(search))
    ));
  }, [search]);

  const handleBarcodeScan = (barcode: string) => {
    const allProducts = storage.get<Product[]>('products', []);
    const product = allProducts.find(p => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
      setSearch('');
    } else {
      alert('Product not found for barcode: ' + barcode);
    }
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(sellQty);
    
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (qty > selectedProduct.quantity) {
      setError(`Only ${selectedProduct.quantity} in stock!`);
      return;
    }

    const existingItem = cart.find(item => item.productId === selectedProduct.id);
    let newCart;
    if (existingItem) {
      if (existingItem.quantity + qty > selectedProduct.quantity) {
        setError(`Total in cart exceeds stock!`);
        return;
      }
      newCart = cart.map(item => item.productId === selectedProduct.id ? { ...item, quantity: item.quantity + qty } : item);
    } else {
      newCart = [...cart, { productId: selectedProduct.id, name: selectedProduct.name, quantity: qty, price: selectedProduct.price, unit: selectedProduct.unit, barcode: selectedProduct.barcode }];
    }

    setCart(newCart);
    storage.set('cart', newCart);
    setSelectedProduct(null);
    setSellQty('1');
    setError('');
  };

  return (
    <Layout title="Sell Products">
      {showScanner && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
      <div className="relative mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search products or scan..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent shadow-md"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-600 shadow-md hover:bg-slate-50 transition-all"
        >
          <Scan size={24} />
        </button>
      </div>

      <div className="space-y-3 mb-24">
        {products.map(p => (
          <div key={p.id} className={`bg-white p-4 rounded-2xl border ${p.quantity < 10 ? 'border-red-100 bg-red-50/30' : 'border-slate-100'} flex justify-between items-center`}>
            <div>
              <p className="font-bold text-slate-800">{p.name}</p>
              <p className={`text-xs font-medium ${p.quantity < 10 ? 'text-red-500' : 'text-slate-500'}`}>
                Stock: {p.quantity} {p.unit} {p.quantity < 10 && '(Low)'}
              </p>
              <p className="text-sm font-bold text-accent mt-1">₹{p.price}</p>
            </div>
            <button 
              onClick={() => { setSelectedProduct(p); setError(''); }}
              className="bg-accent text-white p-3 rounded-xl shadow-lg shadow-accent/20 active:scale-90 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-400">No products found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedProduct.name}</h3>
                  <p className="text-slate-500">₹{selectedProduct.price} per {selectedProduct.unit}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-100 rounded-full text-slate-600">
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="font-bold text-slate-600">Quantity ({selectedProduct.unit})</span>
                  <input 
                    type="number"
                    min="1"
                    className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-lg outline-none focus:ring-2 focus:ring-accent"
                    value={sellQty}
                    onChange={e => setSellQty(e.target.value)}
                  />
                </div>

                {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                <button 
                  onClick={addToCart}
                  className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20"
                >
                  Add to Cart • ₹{(selectedProduct.price * (parseInt(sellQty) || 0)).toFixed(2)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-40">
          <button 
            onClick={() => navigate('/cart')}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl shadow-2xl flex items-center justify-between group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-accent text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <span className="font-bold">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-accent">
                ₹{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
              </span>
              <ArrowLeft className="rotate-180" size={20} />
            </div>
          </button>
        </div>
      )}
    </Layout>
  );
};

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(storage.get<CartItem[]>('cart', []));

  const removeItem = (id: string) => {
    const newCart = cart.filter(item => item.productId !== id);
    setCart(newCart);
    storage.set('cart', newCart);
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <Layout title="Your Cart">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShoppingCart size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Cart is empty</h2>
          <p className="text-slate-500 mt-2">Add some products to start selling</p>
          <button 
            onClick={() => navigate('/sell')}
            className="mt-6 bg-accent text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-accent/20"
          >
            Go to Shop
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Cart">
      <div className="space-y-4 mb-32">
        {cart.map(item => (
          <div key={item.productId} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-md">
            <div>
              <h4 className="font-bold text-slate-900">{item.name}</h4>
              <p className="text-xs text-slate-500">{item.quantity} {item.unit} x ₹{item.price}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.productId)} className="text-red-400 p-1 hover:bg-red-50 rounded-lg transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-slate-900">₹{total.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => navigate('/payment')}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </Layout>
  );
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const cart = storage.get<CartItem[]>('cart', []);
  const upiId = storage.get<string>('upi_id', '');
  const currentUser = storage.get<User | null>('currentUser', null);
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const [method, setMethod] = useState<'none' | 'cash' | 'upi'>('none');

  const completeSale = () => {
    // Reduce stock
    const products = storage.get<Product[]>('products', []);
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem) {
        return { ...p, quantity: p.quantity - cartItem.quantity };
      }
      return p;
    });
    storage.set('products', updatedProducts);

    // Save sale
    const sales = storage.get<Sale[]>('sales', []);
    const newSale: Sale = {
      id: Date.now().toString(),
      items: cart,
      total: total,
      date: new Date().toISOString()
    };
    storage.set('sales', [...sales, newSale]);
    storage.set('lastSaleId', newSale.id);

    // Clear cart
    storage.set('cart', []);
    
    navigate('/success');
  };

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(currentUser?.shopName || 'SmartShop')}&am=${total.toFixed(2)}&cu=INR`;

  return (
    <Layout title="Payment">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md mb-6 transition-colors">
        <p className="text-slate-500 text-sm font-medium text-center mb-1">Total to Pay</p>
        <h2 className="text-4xl font-bold text-slate-900 text-center">₹{total.toFixed(2)}</h2>
      </div>

      <div className="space-y-4">
        <button 
          onClick={() => setMethod('cash')}
          className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center gap-4 ${method === 'cash' ? 'border-accent bg-accent/5' : 'border-slate-100 bg-white'}`}
        >
          <div className={`p-3 rounded-2xl ${method === 'cash' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>
            <ShoppingBag size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900">Cash Payment</p>
            <p className="text-xs text-slate-500">Collect cash from customer</p>
          </div>
        </button>

        <button 
          onClick={() => {
            if (!upiId) {
              alert('Please add a UPI ID in settings first!');
              navigate('/add-upi');
              return;
            }
            setMethod('upi');
          }}
          className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center gap-4 ${method === 'upi' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-white'}`}
        >
          <div className={`p-3 rounded-2xl ${method === 'upi' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
            <QrCode size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900">UPI Scanner</p>
            <p className="text-xs text-slate-500">Customer scans QR code</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/due-payment')}
          className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center gap-4 border-slate-100 bg-white hover:bg-slate-50`}
        >
          <div className={`p-3 rounded-2xl bg-slate-100 text-slate-500`}>
            <Book size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900">Due Payment</p>
            <p className="text-xs text-slate-500">Add to customer's due book</p>
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {method === 'cash' && (
          <motion.div 
            key="cash-confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center"
          >
            <p className="text-slate-600 mb-6">Confirm that you have received <span className="font-bold text-slate-900">₹{total.toFixed(2)}</span> in cash.</p>
            <button 
              onClick={completeSale}
              className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 active:scale-[0.98] transition-all"
            >
              Payment Received
            </button>
          </motion.div>
        )}

        {method === 'upi' && (
          <motion.div 
            key="upi-qr"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center"
          >
            <div className="bg-white p-4 rounded-2xl inline-block border border-slate-100 mb-4 shadow-sm">
              <QRCodeSVG value={upiUrl} size={200} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Scan to Pay</p>
            <p className="text-sm font-medium text-slate-600 mb-6">{upiId}</p>
            <button 
              onClick={completeSale}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-100 active:scale-[0.98] transition-all"
            >
              Payment Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

const SuccessPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto transition-colors">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-accent/20"
      >
        <CheckCircle2 size={48} />
      </motion.div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
      <p className="text-slate-500 mb-10">The transaction has been recorded and stock has been updated.</p>
      
      <div className="w-full space-y-4">
        <button 
          onClick={() => navigate('/send-bill')}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Send size={20} /> Send Bill
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold active:scale-[0.98] transition-all"
        >
          Back to Dukaan
        </button>
      </div>
    </div>
  );
};

const SendBillPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const lastSaleId = storage.get<string>('lastSaleId', '');
  const sales = storage.get<Sale[]>('sales', []);
  const sale = sales.find(s => s.id === lastSaleId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }
    setError('');
    if (sale) {
      const updatedSales = sales.map(s => s.id === lastSaleId ? { ...s, customerPhone: phone } : s);
      storage.set('sales', updatedSales);
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto transition-colors">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Send size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bill Sent!</h2>
        <p className="text-slate-500 mb-10">A digital copy of the bill has been sent to <span className="font-bold text-slate-900">{phone}</span> via WhatsApp simulation.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-accent text-white py-4 rounded-2xl font-bold"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <Layout title="Send Bill">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md transition-colors">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h3>
        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
            <input 
              required
              type="tel" 
              placeholder="10 digit mobile number"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={phone}
              onChange={e => {
                setPhone(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill Summary</p>
            <div className="space-y-2">
              {sale?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name} x {item.quantity} {item.unit}</span>
                  <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-accent">₹{sale?.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

          <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all">
            Send via WhatsApp
          </button>
        </form>
      </div>
    </Layout>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(storage.get<User>('currentUser', null));
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Mobile, 2: OTP, 3: New Password
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleStartReset = () => {
    setShowPasswordReset(true);
    setResetStep(1);
    setError('');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile === user?.emailOrPhone) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setResetStep(2);
      setError('');
      // Simulate sending OTP
      console.log(`OTP for ${mobile}: ${code}`);
    } else {
      setError('Mobile number does not match registered number');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      setResetStep(3);
      setError('');
    } else {
      setError('Invalid OTP');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const users = storage.get<User[]>('users', []);
    const updatedUsers = users.map(u => 
      u.emailOrPhone === user?.emailOrPhone ? { ...u, password: newPassword } : u
    );
    storage.set('users', updatedUsers);
    
    const updatedUser = { ...user!, password: newPassword };
    storage.set('currentUser', updatedUser);
    setUser(updatedUser);
    
    setShowPasswordReset(false);
    alert('Password updated successfully!');
  };

  return (
    <Layout title="Settings">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="bg-primary/5 p-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Store size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-secondary">{user?.shopName}</h2>
                <p className="text-slate-500 text-sm">Shop Settings & Credentials</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shop Name</label>
                <p className="text-lg font-bold text-secondary">{user?.shopName}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mobile Number</label>
                <p className="text-lg font-bold text-secondary">{user?.emailOrPhone}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <p className="text-lg font-bold text-secondary">••••••••</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={handleStartReset}
                className="flex items-center gap-2 text-primary font-bold hover:underline"
              >
                <Lock size={18} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
          <h3 className="text-red-900 font-bold mb-2 flex items-center gap-2">
            <LogOut size={18} />
            Logout
          </h3>
          <p className="text-red-700 text-sm mb-4">Sign out of your account on this device.</p>
          <button 
            onClick={() => {
              storage.set('currentUser', null);
              navigate('/login');
            }}
            className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-xl font-bold hover:bg-red-50 transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>

      {showPasswordReset && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-secondary">Change Password</h3>
              <button onClick={() => setShowPasswordReset(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {resetStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-slate-500 text-sm">Enter your registered mobile number to receive an OTP.</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Enter mobile number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <button type="submit" className="w-full btn-primary py-3 rounded-xl">Send OTP</button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center mb-4">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Simulated OTP</p>
                  <p className="text-3xl font-mono font-bold text-primary tracking-[0.2em]">{generatedOtp}</p>
                </div>
                <p className="text-slate-500 text-sm">Enter the 4-digit OTP shown above.</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Enter OTP</label>
                  <input 
                    required
                    type="text" 
                    maxLength={4}
                    placeholder="0000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center text-2xl tracking-[0.5em] font-bold"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <button type="submit" className="w-full btn-primary py-3 rounded-xl">Verify OTP</button>
                <p className="text-center text-xs text-slate-400">Didn't receive? <button type="button" onClick={handleSendOtp} className="text-primary font-bold">Resend</button></p>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-slate-500 text-sm">Create a new strong password for your shop.</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <button type="submit" className="w-full btn-primary py-3 rounded-xl">Update Password</button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

const SalesPage = () => {
  const [view, setView] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const sales = storage.get<Sale[]>('sales', []);
  
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (view === 'daily') {
        return saleDate.getDate() === currentDay && saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      } else if (view === 'monthly') {
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      } else {
        return saleDate.getFullYear() === currentYear;
      }
    });
  }, [sales, view, currentDay, currentMonth, currentYear]);

  const totalSales = filteredSales.reduce((acc, sale) => acc + sale.total, 0);

  return (
    <Layout title="Sales Overview">
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'daily' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          onClick={() => setView('daily')}
        >
          Daily
        </button>
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          onClick={() => setView('monthly')}
        >
          Monthly
        </button>
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          onClick={() => setView('yearly')}
        >
          Yearly
        </button>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white mb-8 shadow-xl shadow-slate-200 border border-slate-800">
        <p className="text-slate-400 text-sm font-medium mb-1">
          Total {view === 'daily' ? 'Daily' : view === 'monthly' ? 'Monthly' : 'Yearly'} Sales
        </p>
        <h2 className="text-4xl font-bold">₹{totalSales.toFixed(2)}</h2>
        <div className="mt-6 flex items-center gap-2 text-accent text-sm font-bold">
          <div className="bg-accent/20 p-1 rounded-full">
            <Plus size={14} />
          </div>
          <span>{filteredSales.length} Transactions</span>
        </div>
      </div>

      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        {view === 'daily' ? 'Daily' : view === 'monthly' ? 'Monthly' : 'Yearly'} Transactions
      </h3>
      <div className="space-y-3">
        {filteredSales.slice().reverse().map(sale => (
          <div key={sale.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-slate-900">₹{sale.total.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {new Date(sale.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-1 rounded-full border border-accent/20 uppercase">
                Paid
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sale.items.map((item, idx) => (
                <span key={idx} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                  {item.name} ({item.quantity} {item.unit})
                </span>
              ))}
            </div>
            {sale.customerPhone && (
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                <User size={12} />
                <span>Customer: {sale.customerPhone}</span>
              </div>
            )}
          </div>
        ))}
        {sales.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-400">No sales recorded yet</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

const DuePaymentPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const cart = storage.get<CartItem[]>('cart', []);
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSendBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 10 || !/^\d+$/.test(formData.phone)) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }
    setSent(true);
  };

  const addToDueBook = () => {
    const duePayments = storage.get<DuePayment[]>('due_payments', []);
    const newDue: DuePayment = {
      id: Date.now().toString(),
      customerName: formData.name,
      customerPhone: formData.phone,
      items: cart,
      total: total,
      originalTotal: total,
      date: new Date().toISOString(),
      status: 'pending'
    };

    // Update stock
    const products = storage.get<Product[]>('products', []);
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      return cartItem ? { ...p, quantity: p.quantity - cartItem.quantity } : p;
    });

    storage.set('products', updatedProducts);
    storage.set('due_payments', [...duePayments, newDue]);
    storage.set('cart', []);
    navigate('/due-book');
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Send size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bill Sent!</h2>
        <p className="text-slate-500 mb-10">Digital bill sent to <span className="font-bold text-slate-900">{formData.phone}</span></p>
        <button 
          onClick={addToDueBook}
          className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20"
        >
          Add due payment to due book
        </button>
      </div>
    );
  }

  return (
    <Layout title="Due Payment">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h3>
        <form onSubmit={handleSendBill} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</label>
            <input 
              required
              type="text" 
              placeholder="Enter customer name"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
            <input 
              required
              type="tel" 
              placeholder="10 digit mobile number"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill Summary</p>
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name} x {item.quantity} {item.unit}</span>
                  <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-lg">
                <span>Total Due</span>
                <span className="text-red-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

          <button type="submit" className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20">
            Send Bill & Continue
          </button>
        </form>
      </div>
    </Layout>
  );
};

const DueBookPage = () => {
  const [dues, setDues] = useState<DuePayment[]>(storage.get<DuePayment[]>('due_payments', []));
  const [activePartialId, setActivePartialId] = useState<string | null>(null);
  const [activeFullId, setActiveFullId] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{ type: 'full' | 'partial', phone: string, amount?: number, remaining?: number } | null>(null);

  const validatePhone = (phone: string) => {
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Mobile number must be exactly 10 digits');
      return false;
    }
    setError('');
    return true;
  };

  const markAsPaid = (id: string, phone: string) => {
    if (!validatePhone(phone)) return;
    const due = dues.find(d => d.id === id);
    if (!due) return;
    
    const updatedDues = dues.map(d => d.id === id ? { ...d, status: 'paid' as const, total: 0, customerPhone: phone } : d);
    setDues(updatedDues);
    storage.set('due_payments', updatedDues);
    setConfirmation({ type: 'full', phone });
    setActiveFullId(null);
  };

  const handlePartialPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartialId) return;
    if (!validatePhone(paymentPhone)) return;
    
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const due = dues.find(d => d.id === activePartialId);
    if (!due) return;

    if (amount >= due.total) {
      markAsPaid(activePartialId, paymentPhone);
      setActivePartialId(null);
      setPartialAmount('');
      setPaymentPhone('');
      return;
    }

    const remaining = due.total - amount;
    const updatedDues = dues.map(d => d.id === activePartialId ? { ...d, total: remaining, customerPhone: paymentPhone } : d);
    
    setDues(updatedDues);
    storage.set('due_payments', updatedDues);
    setConfirmation({ type: 'partial', phone: paymentPhone, amount, remaining });
    setActivePartialId(null);
    setPartialAmount('');
    setPaymentPhone('');
  };

  const deleteDue = (id: string) => {
    const updatedDues = dues.filter(d => d.id !== id);
    setDues(updatedDues);
    storage.set('due_payments', updatedDues);
  };

  const pendingDues = dues.filter(d => d.status === 'pending');
  const totalPending = pendingDues.reduce((acc, d) => acc + d.total, 0);

  if (confirmation) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
          <Send size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirmation Sent!</h2>
        {confirmation.type === 'full' ? (
          <p className="text-slate-500 mb-10">
            Message sent to <span className="font-bold text-slate-900">{confirmation.phone}</span>: 
            "Your due has been fully paid. Thank you!"
          </p>
        ) : (
          <p className="text-slate-500 mb-10">
            Message sent to <span className="font-bold text-slate-900">{confirmation.phone}</span>: 
            "Payment of <span className="font-bold text-slate-900">₹{confirmation.amount?.toFixed(2)}</span> received. 
            Remaining balance: <span className="font-bold text-red-600">₹{confirmation.remaining?.toFixed(2)}</span>"
          </p>
        )}
          <button 
          onClick={() => setConfirmation(null)}
          className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20"
        >
          Back to Due Book
        </button>
      </div>
    );
  }

  return (
    <Layout title="Due Book">
      <div className="bg-red-600 p-8 rounded-[2.5rem] text-white mb-8 shadow-xl shadow-red-100 border border-red-500/20">
        <p className="text-red-100 text-sm font-medium mb-1">Total Outstanding Dues</p>
        <h2 className="text-4xl font-bold">₹{totalPending.toFixed(2)}</h2>
        <div className="mt-6 flex items-center gap-2 text-red-100 text-sm font-bold">
          <div className="bg-white/20 p-1 rounded-full">
            <AlertTriangle size={14} />
          </div>
          <span>{pendingDues.length} Pending Payments</span>
        </div>
      </div>

      <div className="space-y-4">
        {dues.slice().reverse().map(due => (
          <div key={due.id} className={`bg-white p-5 rounded-3xl border ${due.status === 'paid' ? 'opacity-60 grayscale' : 'border-slate-100 shadow-md'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{due.customerName}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone size={10} /> {due.customerPhone}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600 text-lg">₹{due.total.toFixed(2)}</p>
                {due.originalTotal > due.total && due.total > 0 && (
                  <p className="text-[10px] text-slate-400 line-through">Original: ₹{due.originalTotal.toFixed(2)}</p>
                )}
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {new Date(due.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {due.items.map((item, idx) => (
                <span key={idx} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                  {item.name} ({item.quantity} {item.unit || 'units'})
                </span>
              ))}
            </div>

            {activePartialId === due.id ? (
              <form onSubmit={handlePartialPayment} className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Mobile Number</p>
                  <input 
                    type="tel" 
                    placeholder="10 digit mobile number"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                    value={paymentPhone}
                    onChange={e => setPaymentPhone(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Enter Paid Amount</p>
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      type="number" 
                      step="0.01"
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                      value={partialAmount}
                      onChange={e => setPartialAmount(e.target.value)}
                    />
                    <button type="submit" className="bg-accent text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-accent/20">
                      Confirm
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setActivePartialId(null);
                        setError('');
                      }}
                      className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold">{error}</p>}
              </form>
            ) : activeFullId === due.id ? (
              <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Mobile Number</p>
                  <input 
                    type="tel" 
                    placeholder="10 digit mobile number"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={paymentPhone}
                    onChange={e => setPaymentPhone(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => markAsPaid(due.id, paymentPhone)}
                    className="flex-1 bg-accent text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-accent/20"
                  >
                    Confirm Full Payment
                  </button>
                  <button 
                    onClick={() => {
                      setActiveFullId(null);
                      setError('');
                    }}
                    className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm"
                  >
                    Cancel
                  </button>
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold">{error}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {due.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => {
                          setActiveFullId(due.id);
                          setPaymentPhone(due.customerPhone);
                        }}
                        className="flex-1 bg-accent text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                      >
                        <CheckCircle2 size={16} /> Mark Paid
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} /> Already Paid
                    </div>
                  )}
                  <button 
                    onClick={() => deleteDue(due.id)}
                    className="p-2.5 bg-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {due.status === 'pending' && (
                  <button 
                    onClick={() => {
                      setActivePartialId(due.id);
                      setPaymentPhone(due.customerPhone);
                    }}
                    className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <Plus size={16} /> Partial Payment
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {dues.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-400">No due payments recorded</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

// --- Main App ---

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/add-upi" element={<ProtectedRoute><AddUpiPage /></ProtectedRoute>} />
          <Route path="/add-products" element={<ProtectedRoute><AddProductsPage /></ProtectedRoute>} />
          <Route path="/sell" element={<ProtectedRoute><SellProductsPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
          <Route path="/send-bill" element={<ProtectedRoute><SendBillPage /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          <Route path="/due-payment" element={<ProtectedRoute><DuePaymentPage /></ProtectedRoute>} />
          <Route path="/due-book" element={<ProtectedRoute><DueBookPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const currentUser = storage.get<User | null>('currentUser', null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;
  return <>{children}</>;
}
