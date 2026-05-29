"use client";

import { useState, useEffect } from "react";

// ⚠️ PASTE YOUR RENDER URL HERE:
const API_URL = "https://digital-billing-backend.onrender.com";

export default function POSPage() {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bill Settings
  const [discount, setDiscount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/product/`)
      .then(res => res.json())
      .then(json => {
        setInventory(json);
        setLoading(false);
      });
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      setCart(cart.map(item => item.product_id === product.product_id 
        ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price } 
        : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.product_id, 
        name: product.name, 
        quantity: 1, 
        unit_price: product.price, 
        total_price: product.price 
      }]);
    }
  };

  // Math Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmt = subtotal * (discount / 100);
  const taxable = subtotal - discountAmt;
  const total = taxable + (taxable * (cgst / 100)) + (taxable * (sgst / 100));

  const generateBill = async () => {
    if (cart.length === 0) return alert("Cart is empty!");

    const invoiceData = {
      customer_id: 1, // Fallback customer ID for now
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
      }
    } catch (err) {
      console.error(err);
      alert("Error generating bill.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Cash Register...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      
      {/* LEFT: Product Selection */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Select Items</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {inventory.map((prod: any) => (
            <button 
              key={prod.product_id}
              onClick={() => addToCart(prod)}
              disabled={prod.stock_quantity === 0}
              className={`p-4 rounded-lg border text-left transition-colors ${prod.stock_quantity === 0 ? 'bg-slate-100 opacity-50' : 'bg-white hover:border-blue-500 hover:shadow-md'}`}
            >
              <h3 className="font-semibold text-slate-800">{prod.name}</h3>
              <p className="text-blue-600 font-bold">₹{Number(prod.price).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Stock: {prod.stock_quantity}</p>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: The Cart */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-full">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Current Bill</h2>
        
        <div className="flex-1 overflow-y-auto mb-4 border-b border-slate-200 pb-4 space-y-3">
          {cart.length === 0 && <p className="text-slate-400 text-center mt-10">Cart is empty</p>}
          {cart.map((c, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-medium text-slate-800">{c.name}</p>
                <p className="text-slate-500">{c.quantity} x ₹{c.unit_price}</p>
              </div>
              <p className="font-bold text-slate-800">₹{c.total_price.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Taxes & Totals */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 block">Disc %</label>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full border p-1 rounded text-center text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block">CGST %</label>
              <input type="number" min="0" value={cgst} onChange={e => setCgst(Number(e.target.value))} className="w-full border p-1 rounded text-center text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block">SGST %</label>
              <input type="number" min="0" value={sgst} onChange={e => setSgst(Number(e.target.value))} className="w-full border p-1 rounded text-center text-sm" />
            </div>
          </div>

          <div className="flex justify-between items-end pt-4 border-t border-slate-200">
            <span className="text-lg font-bold text-slate-800">Total</span>
            <span className="text-2xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={generateBill} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Generate Bill
        </button>
      </div>
    </div>
  );
}