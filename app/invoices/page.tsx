"use client";

import { useState, useEffect } from "react";

// ⚠️ PASTE YOUR LIVE RENDER URL HERE (No trailing slash)
const API_URL = "https://digital-billing-backend.onrender.com";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/invoice/`)
      .then(res => res.json())
      .then(json => {
        // Reverse so the newest invoices show at the top
        setInvoices(json.reverse());
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading invoice history...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoice History</h1>
          <p className="text-slate-500 mt-1">View all past transactions and download receipts.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Invoice #</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Total Amount</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Tax / Discount</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoices.map((inv: any) => (
              <tr key={inv.invoice_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">#{inv.invoice_id}</td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(inv.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">₹{inv.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {inv.discount_percent > 0 && <span className="block text-green-600">-{inv.discount_percent}% Disc</span>}
                  {(inv.cgst_percent > 0 || inv.sgst_percent > 0) && (
                    <span className="block text-slate-400">+{inv.cgst_percent + inv.sgst_percent}% GST</span>
                  )}
                  {inv.discount_percent === 0 && inv.cgst_percent === 0 && inv.sgst_percent === 0 && "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  {inv.local_file_path ? (
                    <a 
                      href={`${API_URL}/${inv.local_file_path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      View PDF
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">No PDF</span>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No invoices have been generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}