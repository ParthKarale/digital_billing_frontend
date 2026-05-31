"use client";

import { useState, useEffect } from "react";

// ⚠️ PASTE YOUR LIVE RENDER URL HERE (No trailing slash)
const API_URL = "https://digital-billing-backend.onrender.com";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const fetchCustomers = () => {
    fetch(`${API_URL}/customer/`)
      .then(res => res.json())
      .then(json => setCustomers(json.reverse()))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/customer/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone_number: phone,
        email: email,
        address: address || "Not Provided"
      }),
    });
    setFullName(""); setPhone(""); setEmail(""); setAddress("");
    fetchCustomers(); // Refresh the list
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">Manage Customers</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-black mb-4">Add New Customer</h2>
        <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-black mb-1">Full Name *</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-black mb-1">Phone *</label>
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-black mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-black mb-1">Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" />
          </div>
          <div className="lg:col-span-1">
            <button type="submit" className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-sm font-bold text-black">Name</th>
              <th className="px-6 py-3 text-sm font-bold text-black">Phone</th>
              <th className="px-6 py-3 text-sm font-bold text-black">Email</th>
              <th className="px-6 py-3 text-sm font-bold text-black">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {customers.map((c: any) => (
              <tr key={c.customer_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-black">{c.full_name}</td>
                <td className="px-6 py-4 text-black font-medium">{c.phone_number}</td>
                <td className="px-6 py-4 text-black font-medium">{c.email || "-"}</td>
                <td className="px-6 py-4 text-black font-medium">{c.address}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}