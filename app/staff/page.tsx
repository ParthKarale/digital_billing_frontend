"use client";

import { useState } from "react";

// ⚠️ PASTE YOUR RENDER URL HERE:
const API_URL = "https://digital-billing-frontend.vercel.app/";

export default function StaffPage() {
  const [generatedKey, setGeneratedKey] = useState("");
  const [status, setStatus] = useState("");

  const generateKey = async () => {
    // Create a random 6 digit number
    const newKey = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      const res = await fetch(`${API_URL}/api/employee/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: newKey }),
      });

      if (res.ok) {
        setGeneratedKey(newKey);
        setStatus("Key successfully saved to secure vault!");
      } else {
        setStatus("Failed to generate key.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Server connection error.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-lg font-medium text-slate-600 mb-2">Hire a New Employee</h2>
        <p className="text-slate-500 mb-8 text-sm">
          Generate a secure, one-time 6-digit access key. Give this key to your new employee so they can activate their account on the Login screen.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 mb-6">
          <span className="text-5xl font-mono font-bold tracking-[0.25em] text-blue-600">
            {generatedKey || "------"}
          </span>
        </div>

        <button onClick={generateKey} className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Generate New Key
        </button>

        {status && <p className="mt-4 font-medium text-green-600">{status}</p>}
      </div>
    </div>
  );
}