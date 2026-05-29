"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ⚠️ PASTE YOUR RENDER URL HERE:
const API_URL = "https://digital-billing-frontend.vercel.app/"; 

export default function DashboardPage() {
  const [data, setData] = useState({
    total_revenue: 0,
    total_bills: 0,
    low_stock_items: [],
    chart_data: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/analytics/`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch analytics", err));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Business Overview</h1>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">₹{data.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Invoices</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.total_bills}</p>
        </div>
      </div>

      {/* Chart & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Low Stock Alerts</h3>
          {data.low_stock_items.length === 0 ? (
            <p className="text-slate-500">Inventory is healthy!</p>
          ) : (
            <ul className="space-y-3">
              {data.low_stock_items.map((item: any) => (
                <li key={item.product_id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-red-600 font-bold">{item.stock_quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}