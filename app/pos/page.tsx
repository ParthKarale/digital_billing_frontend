"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import toast, { Toaster } from "react-hot-toast";
import { 
  ShoppingCart, User, Search, FileText, 
  Trash2, Plus, Minus, UserPlus, PackageOpen 
} from "lucide-react";

// ⚠️ PASTE YOUR LIVE RENDER URL HERE (No trailing slash)
const API_URL = "https://digital-billing-backend.onrender.com";

export default function POSPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Quick Add Customer Modal States
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  // Bill Settings
  const [discount, setDiscount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);

  const fetchInitialData = () => {
    Promise.all([
      fetch(`${API_URL}/product/`).then(res => res.json()),
      fetch(`${API_URL}/customer/`).then(res => res.json())
    ])
    .then(([productsData, customersData]) => {
      setInventory(productsData);
      setCustomers(customersData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      toast.error("Failed to load database.");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- React-Select Formatting ---
  const customerOptions = customers.map(c => ({
    value: c.customer_id.toString(),
    label: `${c.full_name} (${c.phone_number})`
  }));

  const inventoryOptions = inventory.map(p => ({
    value: p.product_id.toString(),
    label: `${p.name} - ₹${Number(p.price).toFixed(2)} ${p.stock_quantity === 0 ? '(Out of Stock)' : `(Stock: ${p.stock_quantity})`}`,
    isDisabled: p.stock_quantity === 0
  }));

  // --- Cart Functions ---
  const handleAddToCart = () => {
    if (!selectedProductId) return toast.error("Please select a product first.");
    if (quantity < 1) return toast.error("Quantity must be at least 1.");

    const product = inventory.find(p => p.product_id === Number(selectedProductId));
    if (!product) return;

    const itemPrice = Number(product.price); 
    const existingItem = cart.find(item => item.product_id === product.product_id);
    const newTotalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (newTotalQuantity > product.stock_quantity) {
      toast.error(`Only ${product.stock_quantity} total in stock!`);
      return;
    }

    if (existingItem) {
      setCart(cart.map(item => item.product_id === product.product_id 
        ? { ...item, quantity: newTotalQuantity, total_price: newTotalQuantity * itemPrice } 
        : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.product_id, 
        name: product.name, 
        quantity: quantity, 
        unit_price: itemPrice, 
        total_price: quantity * itemPrice 
      }]);
    }
    
    toast.success("Added to cart");
    setSelectedProductId("");
    setQuantity(1);
  };

  const increaseQuantity = (productId: number) => {
    const product = inventory.find(p => p.product_id === productId);
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        if (item.quantity >= product.stock_quantity) {
          toast.error("Maximum stock reached!");
          return item;
        }
        return { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price };
      }
      return item;
    }));
  };

  const decreaseQuantity = (productId: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1, total_price: (item.quantity - 1) * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
    toast.error("Item removed");
  };

  const clearCart = () => setCart([]);

  // --- Customer Quick Add ---
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return toast.error("Name and Phone are required!");

    const toastId = toast.loading("Saving customer...");
    try {
      const res = await fetch(`${API_URL}/customer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newCustName,
          phone_number: newCustPhone,
          email: newCustEmail || "",
          address: newCustAddress || "Not Provided"
        }),
      });

      if (res.ok) {
        const newlyCreated = await res.json();
        toast.success("Customer added!", { id: toastId });
        const updatedCustomers = await fetch(`${API_URL}/customer/`).then(r => r.json());
        setCustomers(updatedCustomers);
        setSelectedCustomerId(newlyCreated.customer_id.toString());
        setNewCustName(""); setNewCustPhone(""); setNewCustEmail(""); setNewCustAddress("");
        setShowCustModal(false);
      } else {
        toast.error("Failed to add customer.", { id: toastId });
      }
    } catch (err) {
      toast.error("Database connection error.", { id: toastId });
    }
  };

  // --- Math Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + Number(item.total_price), 0);
  const discountAmt = subtotal * (Number(discount) / 100);
  const taxable = subtotal - discountAmt;
  const cgstAmt = taxable * (Number(cgst) / 100);
  const sgstAmt = taxable * (Number(sgst) / 100);
  const total = taxable + cgstAmt + sgstAmt;

  const generateBill = async () => {
    if (cart.length === 0) return toast.error("Cart is empty!");
    if (!selectedCustomerId) return toast.error("Please select a customer first!");

    const toastId = toast.loading("Generating Invoice PDF...");
    const invoiceData = {
      customer_id: Number(selectedCustomerId),
      amount: total,
      discount_percent: discount,
      cgst_percent: cgst,
      sgst_percent: sgst,
      items: cart.map(c => ({
        product_id: c.product_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
        total_price: c.total_price
      }))
    };

    try {
      const res = await fetch(`${API_URL}/invoice/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      });
      if (res.ok) {
        toast.success("Invoice Generated Successfully!", { id: toastId });
        setCart([]); 
        setSelectedCustomerId(""); 
        setDiscount(0); setCgst(0); setSgst(0);
        const updatedStock = await fetch(`${API_URL}/product/`).then(r => r.json());
        setInventory(updatedStock);
      } else {
        const errData = await res.json();
        toast.error(`Error: ${errData.detail || 'Failed to generate bill'}`, { id: toastId });
      }
    } catch (err) {
      toast.error("Error communicating with server.", { id: toastId });
    }
  };

  if (loading) return <div className="p-8 text-center text-black font-bold text-lg flex items-center justify-center"><Search className="animate-spin mr-2"/> Loading Workspace...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto h-[calc(100vh-8rem)] relative">
      <Toaster position="top-right" />
      
      {/* LEFT COLUMN: Data Entry Tools */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-full overflow-hidden">
        
        {/* 1. Customer Selection Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black flex items-center"><User className="w-5 h-5 mr-2 text-blue-600"/> 1. Select Customer</h2>
            <button 
              onClick={() => setShowCustModal(true)}
              className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-lg transition-colors border border-blue-200 flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-1" /> Quick Add
            </button>
          </div>
          
          <Select
            options={customerOptions}
            value={customerOptions.find(c => c.value === selectedCustomerId) || null}
            onChange={(option) => setSelectedCustomerId(option?.value || "")}
            placeholder="Search for a customer..."
            className="text-black font-medium text-sm"
            isClearable
          />
        </div>

        {/* 2. Product Addition Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <h2 className="text-lg font-bold text-black mb-4 flex items-center"><Search className="w-5 h-5 mr-2 text-blue-600"/> 2. Add Products</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Search Inventory</label>
              <Select
                options={inventoryOptions}
                value={inventoryOptions.find(p => p.value === selectedProductId) || null}
                onChange={(option) => setSelectedProductId(option?.value || "")}
                placeholder="Type a product name..."
                className="text-black font-medium text-sm"
                isClearable
              />
            </div>
            
            <div className="w-full sm:w-24">
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Qty</label>
              <input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-4 py-[9px] text-black text-center font-bold text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold px-8 py-[10px] rounded-lg transition-colors text-sm flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
        </div>

        {/* Inventory Viewport */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 flex items-center"><PackageOpen className="w-4 h-4 mr-2"/> Quick Reference Catalog</h2>
          <div className="overflow-y-auto flex-1 pr-1 border border-slate-100 rounded-lg p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {inventory.map((p: any) => (
                <button 
                  key={p.product_id} 
                  onClick={() => {
                    setSelectedProductId(p.product_id.toString());
                    setQuantity(1);
                  }}
                  disabled={p.stock_quantity === 0}
                  className={`p-3 border rounded-lg flex flex-col justify-between text-left transition-all ${p.stock_quantity === 0 ? 'bg-slate-50 opacity-50 cursor-not-allowed' : 'bg-white hover:border-blue-500 hover:shadow-md cursor-pointer'}`}
                >
                  <span className="font-bold text-black text-xs block truncate w-full">{p.name}</span>
                  <div className="flex justify-between items-center mt-2 w-full">
                    <span className="text-blue-600 font-bold text-xs">₹{Number(p.price).toFixed(0)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock_quantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      Qty: {p.stock_quantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: The Cart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        <h2 className="text-lg font-bold text-black mb-4 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-blue-600"/> Current Order</h2>
        
        {/* Cart Item Row List */}
        <div className="flex-1 overflow-y-auto mb-6 border-b border-slate-100 pb-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center text-sm mt-10 font-medium">Your cart is empty.</p>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="font-bold text-black text-sm line-clamp-1">{c.name}</p>
                  <p className="text-slate-600 text-xs font-bold">₹{c.unit_price.toFixed(2)} each</p>
                </div>
                
                {/* Interactive Quantity Controls */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-1 py-1 mx-2 shadow-sm">
                  <button onClick={() => decreaseQuantity(c.product_id)} className="text-slate-500 hover:text-blue-600 flex items-center justify-center w-5 h-5"><Minus className="w-3 h-3" /></button>
                  <span className="text-black font-bold text-xs w-3 text-center">{c.quantity}</span>
                  <button onClick={() => increaseQuantity(c.product_id)} className="text-slate-500 hover:text-blue-600 flex items-center justify-center w-5 h-5"><Plus className="w-3 h-3" /></button>
                </div>

                <div className="flex items-center gap-1 text-right">
                  <p className="font-bold text-black text-sm w-16">₹{c.total_price.toFixed(2)}</p>
                  <button 
                    onClick={() => removeFromCart(c.product_id)} 
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="space-y-4 mb-6 text-sm shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-black font-bold">Subtotal:</span>
            <span className="font-bold text-black">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-black font-bold">Discount (%):</span>
            <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-black font-bold text-sm bg-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-black font-bold">CGST (%):</span>
            <input type="number" min="0" max="100" value={cgst} onChange={e => setCgst(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-black font-bold text-sm bg-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-black font-bold">SGST (%):</span>
            <input type="number" min="0" max="100" value={sgst} onChange={e => setSgst(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-black font-bold text-sm bg-white focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Invoice Actions */}
        <div className="pt-2 border-t border-slate-200 shrink-0">
          <div className="flex justify-between items-end mb-4">
            <span className="text-lg font-bold text-black">Total</span>
            <span className="text-2xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
          </div>

          <div className="flex space-x-3">
            <button onClick={clearCart} className="w-1/3 bg-white border border-slate-300 text-black font-bold py-3 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm">
              Clear
            </button>
            <button 
              onClick={generateBill} 
              className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm text-sm flex items-center justify-center"
            >
              <FileText className="w-4 h-4 mr-2" /> Generate Invoice
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY POP-UP MODAL */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black flex items-center"><UserPlus className="w-5 h-5 mr-2 text-blue-600"/> Add Customer</h3>
              <button onClick={() => setShowCustModal(false)} className="text-slate-400 hover:text-black font-bold text-xl px-2">×</button>
            </div>
            
            <form onSubmit={handleQuickAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Full Name *</label>
                <input type="text" required value={newCustName} onChange={e => setNewCustName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="E.g. Jane Doe" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Phone Number *</label>
                <input type="tel" required value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="E.g. 9876543210" />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Optional" />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Billing Address</label>
                <input type="text" value={newCustAddress} onChange={e => setNewCustAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Optional" />
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setShowCustModal(false)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-black font-bold py-2.5 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm shadow-sm">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}