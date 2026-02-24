/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
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
  Store
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
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
}

interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  customerPhone?: string;
}

// --- Storage Helpers ---

const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// --- Components ---

const Layout = ({ children, title, showBack = true, showLogout = false }: { children: React.ReactNode, title: string, showBack?: boolean, showLogout?: boolean }) => {
  const navigate = useNavigate();
  const currentUser = storage.get<User | null>('currentUser', null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="font-semibold text-lg truncate max-w-[200px]">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{currentUser.shopName}</span>}
          {showLogout && (
            <button 
              onClick={() => {
                storage.set('currentUser', null);
                navigate('/login');
              }} 
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>
      <main className="p-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
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
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (users.find(u => u.emailOrPhone === formData.emailOrPhone)) {
        setError('User already exists');
        return;
      }
      
      const newUser = { 
        shopName: formData.shopName, 
        emailOrPhone: formData.emailOrPhone, 
        password: formData.password 
      };
      storage.set('users', [...users, newUser]);
      storage.set('currentUser', newUser);
      navigate('/');
    } else {
      const user = users.find(u => u.shopName === formData.shopName && u.password === formData.password);
      if (user) {
        storage.set('currentUser', user);
        navigate('/');
      } else {
        setError('Invalid shop name or password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col justify-center max-w-md mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
          <ShoppingBag className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">SmartShop</h1>
        <p className="text-slate-500 mt-2">Manage your business with ease</p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isSignup ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          onClick={() => { setIsSignup(false); setError(''); }}
        >
          Login
        </button>
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isSignup ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          onClick={() => { setIsSignup(true); setError(''); }}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignup && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shop Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text" 
                placeholder="Enter shop name"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={formData.shopName}
                onChange={e => setFormData({...formData, shopName: e.target.value})}
              />
            </div>
          </div>
        )}
        
        {!isSignup && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shop Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text" 
                placeholder="Enter shop name"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={formData.shopName}
                onChange={e => setFormData({...formData, shopName: e.target.value})}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{isSignup ? 'Phone or Email' : 'Password'}</label>
          {isSignup ? (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text" 
                placeholder="Enter phone or email"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={formData.emailOrPhone}
                onChange={e => setFormData({...formData, emailOrPhone: e.target.value})}
              />
            </div>
          ) : (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="password" 
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          )}
        </div>

        {isSignup && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="Create password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          </>
        )}

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button 
          type="submit"
          className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all mt-4"
        >
          {isSignup ? 'Create Account' : 'Login'}
        </button>
      </form>

      {!isSignup && (
        <div className="mt-6 text-center">
          <Link to="/forgot-password" title="Forgot Password" className="text-emerald-600 text-sm font-semibold hover:underline">
            Forgot Password?
          </Link>
        </div>
      )}
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
    const users = storage.get<User[]>('users', []);
    const user = users.find(u => u.emailOrPhone === email);
    
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
    <div className="min-h-screen bg-white p-6 flex flex-col justify-center max-w-md mx-auto">
      <div className="mb-8">
        <button onClick={() => navigate('/login')} className="mb-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
        <p className="text-slate-500 mt-1">
          {step === 1 && "Enter your registered email or phone"}
          {step === 2 && "Enter the 4-digit code shown below"}
          {step === 3 && "Create a new secure password"}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email or Phone</label>
            <input 
              required
              type="text" 
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100">
            Send OTP
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="bg-slate-100 p-4 rounded-xl text-center">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Your OTP is</p>
            <p className="text-3xl font-mono font-bold text-emerald-600 tracking-[0.5em]">{generatedOtp}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enter OTP</label>
            <input 
              required
              type="text" 
              maxLength={4}
              placeholder="0 0 0 0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-center text-2xl tracking-[0.5em]"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100">
            Verify OTP
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
            <input 
              required
              type="password" 
              placeholder="Enter new password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100">
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const products = storage.get<Product[]>('products', []);
  const lowStockItems = products.filter(p => p.quantity < 10);

  const menuItems = [
    { title: 'Add Products', icon: PlusCircle, path: '/add-products', color: 'bg-blue-500' },
    { title: 'Sell Products', icon: ShoppingCart, path: '/sell', color: 'bg-emerald-500' },
    { title: 'Monthly Sales', icon: BarChart3, path: '/sales', color: 'bg-orange-500' },
    { title: 'Add UPI ID', icon: QrCode, path: '/add-upi', color: 'bg-purple-500' },
  ];

  return (
    <Layout title="Dashboard" showBack={false} showLogout={true}>
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="bg-red-500 p-2 rounded-lg text-white">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-red-900 text-sm">Low Stock Alert</h3>
            <p className="text-red-700 text-xs mt-1">
              {lowStockItems.length} products need restocking soon.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStockItems.slice(0, 3).map(p => (
                <span key={p.id} className="bg-white/50 text-red-800 text-[10px] font-bold px-2 py-1 rounded border border-red-200">
                  {p.name} ({p.quantity})
                </span>
              ))}
              {lowStockItems.length > 3 && <span className="text-red-800 text-[10px] font-bold">+{lowStockItems.length - 3} more</span>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => navigate(item.path)}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center text-center gap-3"
          >
            <div className={`${item.color} p-4 rounded-2xl text-white shadow-lg shadow-slate-100`}>
              <item.icon size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">{item.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h3>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-xs font-medium">Total Products</p>
            <p className="text-2xl font-bold text-slate-900">{products.length}</p>
          </div>
          <div className="h-10 w-[1px] bg-slate-100"></div>
          <div>
            <p className="text-slate-500 text-xs font-medium">Out of Stock</p>
            <p className="text-2xl font-bold text-red-500">{products.filter(p => p.quantity === 0).length}</p>
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
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '' });
  const [status, setStatus] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const products = storage.get<Product[]>('products', []);
    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price)
    };
    storage.set('products', [...products, newProduct]);
    setFormData({ name: '', quantity: '', price: '' });
    setStatus('Product Added Successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <Layout title="Add Product">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Milk 1L"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
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
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
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
          </div>
          
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 mt-2">
            Add to Inventory
          </button>
          
          {status && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-center text-sm font-bold border border-emerald-100"
            >
              {status}
            </motion.div>
          )}
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Inventory</h3>
        <div className="space-y-2">
          {storage.get<Product[]>('products', []).slice(-3).reverse().map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">Stock: {p.quantity} units</p>
              </div>
              <p className="font-bold text-blue-600">₹{p.price}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

const SellProductsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState('1');
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>(storage.get<CartItem[]>('cart', []));

  useEffect(() => {
    const allProducts = storage.get<Product[]>('products', []);
    setProducts(allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase())));
  }, [search]);

  const addToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(sellQty);
    
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
      newCart = [...cart, { productId: selectedProduct.id, name: selectedProduct.name, quantity: qty, price: selectedProduct.price }];
    }

    setCart(newCart);
    storage.set('cart', newCart);
    setSelectedProduct(null);
    setSellQty('1');
    setError('');
  };

  return (
    <Layout title="Sell Products">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search products..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3 mb-24">
        {products.map(p => (
          <div key={p.id} className={`bg-white p-4 rounded-2xl border ${p.quantity < 10 ? 'border-red-100 bg-red-50/30' : 'border-slate-100'} flex justify-between items-center`}>
            <div>
              <p className="font-bold text-slate-800">{p.name}</p>
              <p className={`text-xs font-medium ${p.quantity < 10 ? 'text-red-500' : 'text-slate-500'}`}>
                Stock: {p.quantity} {p.quantity < 10 && '(Low)'}
              </p>
              <p className="text-sm font-bold text-emerald-600 mt-1">₹{p.price}</p>
            </div>
            <button 
              onClick={() => { setSelectedProduct(p); setError(''); }}
              className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg shadow-emerald-100 active:scale-90 transition-all"
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
                  <p className="text-slate-500">₹{selectedProduct.price} per unit</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-100 rounded-full">
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="font-bold text-slate-600">Quantity</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSellQty(Math.max(1, parseInt(sellQty) - 1).toString())}
                      className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-xl font-bold w-8 text-center">{sellQty}</span>
                    <button 
                      onClick={() => setSellQty((parseInt(sellQty) + 1).toString())}
                      className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                <button 
                  onClick={addToCart}
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100"
                >
                  Add to Cart • ₹{(selectedProduct.price * parseInt(sellQty)).toFixed(2)}
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
              <div className="bg-emerald-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <span className="font-bold">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400">
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
            className="mt-6 bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold"
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
          <div key={item.productId} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-800">{item.name}</h4>
              <p className="text-xs text-slate-500">{item.quantity} x ₹{item.price}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.productId)} className="text-red-400 p-1">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-slate-900">₹{total.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => navigate('/payment')}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100"
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
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
        <p className="text-slate-500 text-sm font-medium text-center mb-1">Total to Pay</p>
        <h2 className="text-4xl font-bold text-slate-900 text-center">₹{total.toFixed(2)}</h2>
      </div>

      <div className="space-y-4">
        <button 
          onClick={() => setMethod('cash')}
          className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center gap-4 ${method === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}
        >
          <div className={`p-3 rounded-2xl ${method === 'cash' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
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
      </div>

      <AnimatePresence>
        {method === 'cash' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center"
          >
            <p className="text-slate-600 mb-6">Confirm that you have received <span className="font-bold text-slate-900">₹{total.toFixed(2)}</span> in cash.</p>
            <button 
              onClick={completeSale}
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100"
            >
              Payment Received
            </button>
          </motion.div>
        )}

        {method === 'upi' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center"
          >
            <div className="bg-white p-4 rounded-2xl inline-block border border-slate-100 mb-4 shadow-sm">
              <QRCodeSVG value={upiUrl} size={200} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Scan to Pay</p>
            <p className="text-sm font-medium text-slate-600 mb-6">{upiId}</p>
            <button 
              onClick={completeSale}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-100"
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-100"
      >
        <CheckCircle2 size={48} />
      </motion.div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
      <p className="text-slate-500 mb-10">The transaction has been recorded and stock has been updated.</p>
      
      <div className="w-full space-y-4">
        <button 
          onClick={() => navigate('/send-bill')}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <Send size={20} /> Send Bill
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const SendBillPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const lastSaleId = storage.get<string>('lastSaleId', '');
  const sales = storage.get<Sale[]>('sales', []);
  const sale = sales.find(s => s.id === lastSaleId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (sale) {
      const updatedSales = sales.map(s => s.id === lastSaleId ? { ...s, customerPhone: phone } : s);
      storage.set('sales', updatedSales);
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Send size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bill Sent!</h2>
        <p className="text-slate-500 mb-10">A digital copy of the bill has been sent to <span className="font-bold text-slate-900">{phone}</span> via WhatsApp simulation.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <Layout title="Send Bill">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h3>
        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
            <input 
              required
              type="tel" 
              placeholder="Enter customer phone"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill Summary</p>
            <div className="space-y-2">
              {sale?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name} x {item.quantity}</span>
                  <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-emerald-600">₹{sale?.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100">
            Send via WhatsApp
          </button>
        </form>
      </div>
    </Layout>
  );
};

const SalesPage = () => {
  const sales = storage.get<Sale[]>('sales', []);
  const totalMonthly = sales.reduce((acc, sale) => acc + sale.total, 0);

  return (
    <Layout title="Monthly Sales">
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white mb-8 shadow-xl shadow-slate-200">
        <p className="text-slate-400 text-sm font-medium mb-1">Total Sales This Month</p>
        <h2 className="text-4xl font-bold">₹{totalMonthly.toFixed(2)}</h2>
        <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold">
          <div className="bg-emerald-400/20 p-1 rounded-full">
            <Plus size={14} />
          </div>
          <span>{sales.length} Transactions</span>
        </div>
      </div>

      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {sales.slice().reverse().map(sale => (
          <div key={sale.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-slate-900">₹{sale.total.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {new Date(sale.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-100 uppercase">
                Paid
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sale.items.map((item, idx) => (
                <span key={idx} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                  {item.name} ({item.quantity})
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

// --- Main App ---

export default function App() {
  return (
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
      </Routes>
    </Router>
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
