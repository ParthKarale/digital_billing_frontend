"use client";

import { useState, useEffect } from "react";

// ⚠️ PASTE YOUR LIVE RENDER URL HERE (No trailing slash)
const API_URL = "https://digital-billing-backend.onrender.com";

export default function POSPage() {
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);

  // Bill Settings
  const [discount, setDiscount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);

  useEffect(() => {
    // Fetch both products and customers at the same time
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

  const addToCart = (product: any) => {
    // 1. FORCE THE PRICE TO BE A PURE NUMBER TO PREVENT CRASHES
    const itemPrice = Number(product.price); 

    const existing = cart.find(item => item.product_id === product.product_id);
    
    if (existing) {
      // Prevent adding more than what is in stock
      if (existing.quantity >= product.stock_quantity) {
        alert("Cannot add more! Out of stock.");
        return;
      }
      setCart(cart.map(item => item.product_id === product.product_id 
        ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * itemPrice } 
        : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.product_id, 
        name: product.name, 
        quantity: 1, 
        unit_price: itemPrice, 
        total_price: itemPrice 
      }]);
    }
  };

  const clearCart = () => setCart([]);

  // Math Calculations (Safely forcing everything to Numbers)
  const subtotal = cart.reduce((sum, item) => sum + Number(item.total_price), 0);
  const discountAmt = subtotal * (Number(discount) / 100);
  const taxable = subtotal - discountAmt;
  const total = taxable + (taxable * (Number(cgst) / 100)) + (taxable * (Number(sgst) / 100));

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
        setCart([]); // Clear cart for next customer
        setSelectedCustomerId(""); 
        setDiscount(0);
        setCgst(0);
        setSgst(0);
        // Refresh inventory to show updated stock
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

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Cash Register...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      
      {/* LEFT: Product Selection */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Select Items</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {inventory.map((prod: any) => (
            <button 
              key={prod.product_id}
              onClick={() => addToCart(prod)}
              disabled={prod.stock_quantity === 0}
              className={`p-4 rounded-lg border text-left transition-all ${
                prod.stock_quantity === 0 
                ? 'bg-slate-50 opacity-50 cursor-not-allowed border-slate-200' 
                : 'bg-white hover:border-blue-500 hover:shadow-md border-slate-200'
              }`}
            >
              <h3 className="font-semibold text-slate-800 line-clamp-1">{prod.name}</h3>
              <p className="text-blue-600 font-bold mt-1">₹{Number(prod.price).toFixed(2)}</p>
              <p className={`text-xs mt-2 font-medium ${prod.stock_quantity <= 5 ? 'text-red-500' : 'text-slate-500'}`}>
                Stock: {prod.stock_quantity}
              </p>
            </button>
          ))}
          {inventory.length === 0 && (
            <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
              No products available. Ask the owner to add inventory.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: The Cart & Customer Link */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-[calc(100vh-8rem)] sticky top-24">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Current Bill</h2>
        
        {/* Customer Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Link to Customer
          </label>
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Customer --</option>
            {customers.map((c: any) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.full_name} ({c.phone_number})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto mb-4 border-y border-slate-200 py-4 space-y-4">
          {cart.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Cart is empty. Select items to begin.
            </div>
          )}
          {cart.map((c, i) => (
            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{c.quantity} x ₹{Number(c.unit_price).toFixed(2)}</p>
              </div>
              <p className="font-bold text-slate-800">₹{Number(c.total_price).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Taxes & Totals */}
        <div className="space-y-3 mb-6 bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 font-medium">Subtotal</span>
            <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Disc %</label>
              <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full border border-slate-200 p-1.5 rounded-md text-center text-sm focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">CGST %</label>
              <input type="number" min="0" max="100" value={cgst} onChange={e => setCgst(Number(e.target.value))} className="w-full border border-slate-200 p-1.5 rounded-md text-center text-sm focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">SGST %</label>
              <input type="number" min="0" max="100" value={sgst} onChange={e => setSgst(Number(e.target.value))} className="w-full border border-slate-200 p-1.5 rounded-md text-center text-sm focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-between items-end pt-3 border-t border-slate-100 mt-2">
            <span className="text-lg font-bold text-slate-800">Total</span>
            <span className="text-2xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button onClick={clearCart} className="w-1/3 bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-50 transition-colors">
            Clear
          </button>
          <button onClick={generateBill} className="w-2/3 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            Generate Bill
          </button>
        </div>
      </div>
    </div>
  );
}