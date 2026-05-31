"use client";

import { useState, useEffect } from "react";

// ⚠️ PASTE YOUR LIVE RENDER URL HERE (No trailing slash)
const API_URL = "https://digital-billing-backend.onrender.com";

export default function POSPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States for Cart Entry
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
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddToCart = () => {
    if (!selectedProductId) return alert("Please select a product first.");
    if (quantity < 1) return alert("Quantity must be at least 1.");

    const product = inventory.find(p => p.product_id === Number(selectedProductId));
    if (!product) return;

    const itemPrice = Number(product.price); 
    const existingItem = cart.find(item => item.product_id === product.product_id);
    
    const newTotalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (newTotalQuantity > product.stock_quantity) {
      alert(`Cannot add ${quantity} more! Only ${product.stock_quantity} total in stock.`);
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

    setSelectedProductId("");
    setQuantity(1);
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return alert("Name and Phone are required!");

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
        alert("Customer added successfully!");
        
        // Refresh customer list from database
        const updatedCustomers = await fetch(`${API_URL}/customer/`).then(r => r.json());
        setCustomers(updatedCustomers);
        
        // Automatically select the brand new customer in the dropdown!
        setSelectedCustomerId(newlyCreated.customer_id.toString());
        
        // Clear modal form and close overlay
        setNewCustName(""); setNewCustPhone(""); setNewCustEmail(""); setNewCustAddress("");
        setShowCustModal(false);
      } else {
        alert("Failed to add customer. Check your backend server.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to database.");
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => setCart([]);

  // Math Calculations
  const subtotal = cart.reduce((sum, item) => sum + Number(item.total_price), 0);
  const discountAmt = subtotal * (Number(discount) / 100);
  const taxable = subtotal - discountAmt;
  const cgstAmt = taxable * (Number(cgst) / 100);
  const sgstAmt = taxable * (Number(sgst) / 100);
  const total = taxable + cgstAmt + sgstAmt;

  const generateBill = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!selectedCustomerId) return alert("Please select a customer first!");

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
        alert("Bill Generated Successfully!");
        setCart([]); 
        setSelectedCustomerId(""); 
        setDiscount(0); setCgst(0); setSgst(0);
        const updatedStock = await fetch(`${API_URL}/product/`).then(r => r.json());
        setInventory(updatedStock);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.detail || 'Failed to generate bill'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error communicating with server.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold text-lg">Loading Workspace...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto h-[calc(100vh-8rem)] relative">
      
      {/* LEFT COLUMN: Data Entry Tools */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-full overflow-hidden">
        
        {/* 1. Customer Selection Card with Pop-up Button */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black">1. Select Customer</h2>
            <button 
              onClick={() => setShowCustModal(true)}
              className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
            >
              + Quick Add New Customer
            </button>
          </div>
          
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-black bg-white focus:ring-2 focus:ring-blue-500 font-bold text-sm"
          >
            <option value="">-- Search and select customer --</option>
            {customers.map((c: any) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.full_name} ({c.phone_number})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Product Addition Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <h2 className="text-lg font-bold text-black mb-4">2. Add Products</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Search Inventory</label>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-black bg-white focus:ring-2 focus:ring-blue-500 font-bold text-sm"
              >
                <option value="">-- Choose a product --</option>
                {inventory.map((p: any) => (
                  <option key={p.product_id} value={p.product_id} disabled={p.stock_quantity === 0}>
                    {p.name} - ₹{Number(p.price).toFixed(2)} {p.stock_quantity === 0 ? '(Out of Stock)' : `(Stock: ${p.stock_quantity})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-24">
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Qty</label>
              <input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-black text-center font-bold text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Inventory Viewport (Below drop-downs to view full listing with scroll) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Quick Reference Catalog</h2>
          <div className="overflow-y-auto flex-1 pr-1 border border-slate-100 rounded-lg p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {inventory.map((p: any) => (
                <div key={p.product_id} className="p-3 border rounded-lg bg-slate-50 flex flex-col justify-between">
                  <span className="font-bold text-black text-xs block truncate">{p.name}</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-blue-600 font-bold text-xs">₹{Number(p.price).toFixed(0)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock_quantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-black'}`}>
                      Qty: {p.stock_quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: The Cart & Math Summary */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        <h2 className="text-lg font-bold text-black mb-4">Current Order</h2>
        
        {/* Cart Item Row List */}
        <div className="flex-1 overflow-y-auto mb-6 border-b border-slate-100 pb-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center text-sm mt-10 font-medium">Your cart is empty.</p>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="font-bold text-black text-sm">{c.name}</p>
                  <p className="text-slate-600 text-xs mt-0.5 font-bold">{c.quantity} x ₹{c.unit_price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-black text-sm">₹{c.total_price.toFixed(2)}</p>
                  <button 
                    onClick={() => removeFromCart(c.product_id)} 
                    className="text-red-500 hover:text-red-700 text-sm font-bold ml-1 bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                  >
                    ×
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
            <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-black font-bold text-sm bg-white" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-black font-bold">CGST (%):</span>
            <input type="number" min="0" max="100" value={cgst} onChange={e => setCgst(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-black font-bold text-sm bg-white" />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600 ml-4 font-medium">
            <span>+ CGST Amount:</span>
            <span>₹{cgstAmt.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-black font-bold">SGST (%):</span>
            <input type="number" min="0" max="100" value={sgst} onChange={e => setSgst(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-black font-bold text-sm bg-white" />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600 ml-4 font-medium">
            <span>+ SGST Amount:</span>
            <span>₹{sgstAmt.toFixed(2)}</span>
          </div>
        </div>

        {/* Invoice Actions */}
        <div className="pt-2 border-t border-slate-200 shrink-0">
          <div className="flex justify-between items-end mb-4">
            <span className="text-lg font-bold text-black">Total</span>
            <span className="text-2xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
          </div>

          <div className="flex space-x-3">
            <button onClick={clearCart} className="w-1/3 bg-white border border-slate-300 text-black font-bold py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm">
              Clear Cart
            </button>
            <button 
              onClick={generateBill} 
              className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm text-sm"
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY POP-UP MODAL: Quick Add Customer */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black">Add New Customer Profile</h3>
              <button 
                onClick={() => setShowCustModal(false)}
                className="text-slate-400 hover:text-black font-bold text-xl px-2"
              >
                ×
              </button>
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
                <button 
                  type="button"
                  onClick={() => setShowCustModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}