import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, AlertTriangle, CheckCircle2, ShoppingCart, PlusCircle, Scan, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Layout, storage, Product, CartItem } from './App';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 150 }
    };

    const startScanner = async () => {
      try {
        console.log("Requesting camera devices...");
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);

        if (devices && devices.length > 0) {
          // Use the first available camera (usually the back one on mobile if sorted correctly)
          // Or specifically look for a back camera
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') || 
            device.label.toLowerCase().includes('environment')
          );
          
          const cameraId = backCamera ? backCamera.id : devices[0].id;
          console.log(`Starting scanner with camera ID: ${cameraId}`);

          if (!isMounted.current) return;

          await html5QrCode.start(
            cameraId, 
            config,
            (decodedText) => {
              console.log(`Scan successful: ${decodedText}`);
              setStatus("Detected!");
              alert(`Barcode Scanned: ${decodedText}`);
              onScan(decodedText);
              // We don't stop here, we let the parent handle it or the user close it
            },
            (errorMessage) => {
              // parse error, ignore
            }
          );
          setStatus("Scanning...");
        } else {
          // Fallback to environment facing mode
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              console.log(`Scan successful: ${decodedText}`);
              setStatus("Detected!");
              alert(`Barcode Scanned: ${decodedText}`);
              onScan(decodedText);
            },
            () => {}
          );
          setStatus("Scanning...");
        }
      } catch (err) {
        console.error("Unable to start scanning", err);
        setError("Camera access denied or not found. Please ensure you have granted camera permissions.");
        setStatus("Error");
        alert("Camera permission blocked or not found.");
      }
    };

    startScanner();

    return () => {
      isMounted.current = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        console.log("Stopping scanner on unmount...");
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900">Barcode Scanner</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase">{status}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 relative bg-slate-900 min-h-[300px] flex items-center justify-center">
          <div id="reader" className="w-full"></div>
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 z-10">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <p className="text-white font-medium mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="p-4 text-center bg-slate-50">
          <p className="text-xs text-slate-500">Position barcode within the frame</p>
        </div>
      </div>
    </div>
  );
};

export const ScanProductsPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'found' | 'new'>('idle');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(storage.get<CartItem[]>('cart', []));
  const [newProductForm, setNewProductForm] = useState({ name: '', price: '', quantity: '' });

  const handleScan = (barcode: string) => {
    setScannedBarcode(barcode);
    const allProducts = storage.get<Product[]>('products', []);
    const foundProduct = allProducts.find(p => p.barcode === barcode);
    
    if (foundProduct) {
      setProduct(foundProduct);
      setStatus('found');
    } else {
      setStatus('new');
    }
    setShowScanner(false);
  };

  const addToCart = (p: Product) => {
    const existingItem = cart.find(item => item.productId === p.id);
    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map(item => 
        item.productId === p.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cart, { 
        productId: p.id, 
        name: p.name, 
        price: p.price, 
        quantity: 1, 
        unit: p.unit || 'units',
        barcode: p.barcode 
      }];
    }
    setCart(updatedCart);
    storage.set('cart', updatedCart);
    alert(`${p.name} added to cart!`);
    setStatus('idle');
    setScannedBarcode('');
    setProduct(null);
    setShowScanner(true);
  };

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price || !newProductForm.quantity) {
      alert('Please fill all fields');
      return;
    }

    const price = parseFloat(newProductForm.price);
    const qty = parseInt(newProductForm.quantity);

    if (price < 0 || qty < 0) {
      alert('Price and Quantity cannot be negative');
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: newProductForm.name,
      price: price,
      quantity: qty,
      unit: 'pieces',
      barcode: scannedBarcode
    };

    const allProducts = storage.get<Product[]>('products', []);
    const updatedProducts = [...allProducts, newProduct];
    storage.set('products', updatedProducts);
    
    addToCart(newProduct);
    setNewProductForm({ name: '', price: '', quantity: '' });
  };

  return (
    <Layout title="Scan Products">
      <div className="max-w-2xl mx-auto">
        {showScanner && (
          <BarcodeScanner 
            onScan={handleScan} 
            onClose={() => navigate('/')}
          />
        )}

        {status === 'found' && product && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Product Found!</h2>
                <p className="text-slate-500 font-medium">Barcode: {scannedBarcode}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                  <p className="text-slate-500 font-medium">Stock: {product.quantity} {product.unit}</p>
                </div>
                <p className="text-3xl font-bold text-emerald-600">₹{product.price}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => addToCart(product)}
                className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart size={24} />
                Add to Cart
              </button>
              <button 
                onClick={() => {
                  setStatus('idle');
                  setShowScanner(true);
                }}
                className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Scan Next
              </button>
            </div>
          </motion.div>
        )}

        {status === 'new' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <PlusCircle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">New Product</h2>
                <p className="text-slate-500 font-medium">Barcode {scannedBarcode} not found</p>
              </div>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Product Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                  placeholder="e.g. Coca Cola 500ml"
                  value={newProductForm.name}
                  onChange={e => setNewProductForm({...newProductForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                    placeholder="0.00"
                    value={newProductForm.price}
                    onChange={e => setNewProductForm({...newProductForm, price: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Initial Stock</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                    placeholder="0"
                    value={newProductForm.quantity}
                    onChange={e => setNewProductForm({...newProductForm, quantity: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  Save & Add to Cart
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setShowScanner(true);
                  }}
                  className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};
