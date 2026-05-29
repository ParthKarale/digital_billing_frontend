"use client";

import { useState, useEffect } from "react";

// ⚠️ PASTE YOUR RENDER URL HERE:
const API_URL = "https://YOUR-BACKEND-NAME.onrender.com";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const fetchProducts = () => {
    fetch(`${API_URL}/product/`)
      .then(res => res.json())
      .then(json => setProducts(json))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/product/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: parseFloat(price),
        stock_quantity: parseInt(stock),
      }),
    });
    setName(""); setPrice(""); setStock("");
    fetchProducts(); // Refresh the list
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Manage Inventory</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleAddProduct} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
            <input type="number" required min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <input type="number" required min="1" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Add Stock</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Product Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Price</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">In Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((item: any) => (
              <tr key={item.product_id}>
                <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                <td className="px-6 py-4 text-slate-600">₹{item.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-slate-600">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${item.stock_quantity <= 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {item.stock_quantity}
                  </span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No products in inventory yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}