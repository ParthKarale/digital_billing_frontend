"use client";

import { useState, useEffect } from "react";

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

  // Bill Settings
  const [discount, setDiscount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);

  useEffect(() => {
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

    // Reset selection after adding
    setSelectedProductId("");
    setQuantity(1);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

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
        // Refresh inventory to get new stock levels
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

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Workspace...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      {/* LEFT COLUMN: Data Entry */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Customer Selection Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">1. Select Customer</h2>
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
          >
            <option value="">-- Search and select customer --</option>
            {customers.map((c: any) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.full_name} ({c.phone_number})
              </option>
            ))}
          </select>
        </div>

        {/* Product Addition Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">2. Add Products</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-600 mb-1">Search Inventory</label>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
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
              <label className="block text-sm font-medium text-slate-600 mb-1">Qty</label>
              <input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 text-center font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-slate-800 text-white font-semibold px-8 py-3 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: The Cart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-8rem)] sticky top-24">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Current Order</h2>
        
        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto mb-6 border-b border-slate-100 pb-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center text-sm mt-10">Your cart is empty.</p>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{c.quantity} x ₹{c.unit_price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-slate-800 text-sm">₹{c.total_price.toFixed(2)}</p>
                  <button onClick={() => removeFromCart(c.product_id)} className="text-red-400 hover:text-red-600 text-lg font-bold px-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove">×</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Math Calculations (Matching your screenshot) */}
        <div className="space-y-4 mb-6 text-sm">
          
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Subtotal:</span>
            <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Discount (%):</span>
            <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-slate-700" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">CGST (%):</span>
            <input type="number" min="0" max="100" value={cgst} onChange={e => setCgst(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-slate-700" />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 ml-4">
            <span>+ CGST Amount:</span>
            <span>+ ₹{cgstAmt.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">SGST (%):</span>
            <input type="number" min="0" max="100" value={sgst} onChange={e => setSgst(Number(e.target.value))} className="w-20 border border-slate-300 rounded text-center py-1 text-slate-700" />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 ml-4">
            <span>+ SGST Amount:</span>
            <span>+ ₹{sgstAmt.toFixed(2)}</span>
          </div>

        </div>

        {/* Grand Total & Button */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex justify-between items-end mb-6">
            <span className="text-lg font-bold text-slate-800">Total</span>
            <span className="text-2xl font-bold text-slate-900">₹{total.toFixed(2)}</span>
          </div>

          <button 
            onClick={generateBill} 
            className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
}