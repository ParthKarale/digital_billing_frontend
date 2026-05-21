"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome back, Boss</h1>
          <p className="text-slate-500 mt-1">Here is what is happening with your store today.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition">
          Download Daily Report
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Today's Revenue</p>
          <p className="text-3xl font-bold text-slate-800">₹24,500</p>
          <p className="text-sm text-emerald-600 font-medium mt-2">↑ 12% from yesterday</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Invoices Generated</p>
          <p className="text-3xl font-bold text-slate-800">42</p>
          <p className="text-sm text-slate-400 font-medium mt-2">Avg. ₹583 per invoice</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Low Stock Alerts</p>
          <p className="text-3xl font-bold text-slate-800">3 Items</p>
          <p className="text-sm text-red-500 font-medium mt-2">Requires immediate attention</p>
        </div>
      </div>

      {/* Placeholder for future charts/graphs */}
      <div className="bg-white h-96 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
        <p className="text-slate-400 font-medium">Sales Chart (Integrating Next...)</p>
      </div>
    </div>
  );
}