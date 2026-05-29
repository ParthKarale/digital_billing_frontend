"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ⚠️ PASTE YOUR RENDER URL HERE (No trailing slash!):
const API_URL = "https://digital-billing-backend.onrender.com";

export default function LoginPage() {
  const router = useRouter();
  
  // Toggles for logical states
  const [role, setRole] = useState<"owner" | "employee">("owner");
  const [isExisting, setIsExisting] = useState(true);

  // Shared States
  const [companyName, setCompanyName] = useState("");

  // Owner States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // Employee States
  const [employeeKey, setEmployeeKey] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (role === "owner") {
        if (isExisting) {
          // --- OWNER LOGIN ---
          const res = await fetch(`${API_URL}/api/owner/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          
          if (!res.ok) throw new Error("Invalid email or password");
          
          localStorage.setItem("userRole", "owner");
          router.push("/dashboard"); 

        } else {
          // --- OWNER SIGNUP ---
          const res = await fetch(`${API_URL}/api/owner/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, companyName, companyPhone, companyAddress })
          });
          
          if (!res.ok) throw new Error("Email might already be registered");
          
          localStorage.setItem("userRole", "owner");
          router.push("/dashboard"); 
        }
      } else {
        if (isExisting) {
          // --- EMPLOYEE LOGIN ---
          const res = await fetch(`${API_URL}/api/employee/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeKey })
          });
          
          if (!res.ok) throw new Error("Invalid or inactive access key");
          
          localStorage.setItem("userRole", "employee");
          router.push("/pos"); 

        } else {
          // --- EMPLOYEE ACTIVATION ---
          const res = await fetch(`${API_URL}/api/employee/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeName, employeeKey })
          });
          
          if (!res.ok) throw new Error("Invalid key, or key has already been claimed");
          
          localStorage.setItem("userRole", "employee");
          router.push("/pos"); 
        }
      }
    } catch (err: any) {
      alert(err.message); // Show a popup if login/signup fails
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-black mb-6">
          Parth's Digital Billing
        </h2>

        {/* Role Selection Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setRole("owner")}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              role === "owner" ? "bg-white shadow text-blue-600" : "text-black hover:text-gray-700"
            }`}
          >
            Owner
          </button>
          <button
            type="button"
            onClick={() => setRole("employee")}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              role === "employee" ? "bg-white shadow text-blue-600" : "text-black hover:text-gray-700"
            }`}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- OWNER LOGIC --- */}
          {role === "owner" && (
            <>
              {!isExisting && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-black">Company Name</label>
                    <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Company Phone</label>
                    <input type="tel" required value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Company Address</label>
                    <textarea required value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" rows={2} />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-black">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
              </div>
            </>
          )}

          {/* --- EMPLOYEE LOGIC --- */}
          {role === "employee" && (
            <>
              {!isExisting && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-black">Your Full Name</label>
                    <input type="text" required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-black">6-Digit Access Key</label>
                <input type="text" required maxLength={6} value={employeeKey} onChange={(e) => setEmployeeKey(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-center tracking-widest text-lg" />
              </div>
            </>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors mt-6">
            {isExisting ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black">
          {isExisting ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsExisting(!isExisting)} className="text-blue-600 hover:underline font-medium">
            {isExisting ? "Set one up" : "Sign in here"}
          </button>
        </p>
      </div>
    </div>
  );
}