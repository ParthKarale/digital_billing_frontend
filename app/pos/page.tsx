"use client";
import { useState } from "react";

// Dummy data for now
const INVENTORY = [
  { id: 1, name: "Wireless Mouse", price: 1200, stock: 45 },
  { id: 2, name: "Mechanical Keyboard", price: 3500, stock: 12 },
  { id: 3, name: "USB-C Cable", price: 400, stock: 108 },
];

export default function POSPage() {
  const [cart, setCart] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]">
      
      {/* LEFT SIDE: Inventory List */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col overflow-hidden">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Inventory</h2>
        <input type="text" placeholder="Search products by name or ID..." className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        
        <div className="overflow-y-auto pr-2 space-y-3">
          {INVENTORY.map((product) => (
            <div key={product.id} onClick={() => addToCart(product)} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all bg-white group">
              <div>
                <p className="font-semibold text-slate-800 group-hover:text-blue-700">{product.name}</p>
                <p className="text-sm text-slate-500">{product.stock} in stock</p>
              </div>
              <p className="font-bold text-slate-800">₹{product.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: The Cart */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-800 text-white">
          <h2 className="text-xl font-bold mb-1">Current Bill</h2>
          <p className="text-slate-300 text-sm">Customer: Walk-in</p>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">Cart is empty. Tap items to add.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start bg-white p-3 rounded shadow-sm border border-slate-100">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500">₹{item.price} x {item.qty}</p>
                </div>
                <p className="font-bold text-slate-700">₹{item.price * item.qty}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-medium">Total Amount</span>
            <span className="text-3xl font-bold text-blue-600">₹{cartTotal}</span>
          </div>
          <button className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm transition-all ${cartTotal > 0 ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
            Generate Invoice PDF
          </button>
        </div>
      </div>

    </div>
  );
}