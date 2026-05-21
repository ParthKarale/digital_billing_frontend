"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  // Toggles for our logical states
  const [role, setRole] = useState<"owner" | "employee">("owner");
  const [isExisting, setIsExisting] = useState(true);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeKey, setEmployeeKey] = useState("");
  const [employeeName, setEmployeeName] = useState(""); // For new employees

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Here is where you will connect to your Python API (api.post('/login'))
    if (role === "owner") {
      console.log(`Owner ${isExisting ? "Login" : "Signup"}:`, email, password);
      // If success, route to the main dashboard
      // router.push("/dashboard"); 
    } else {
      console.log(`Employee ${isExisting ? "Login" : "Activation"}:`, employeeKey, employeeName);
      // If success, route to the restricted inventory page
      // router.push("/inventory"); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">
          Digital Billing System
        </h2>

        {/* Role Selection Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setRole("owner")}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              role === "owner" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Owner
          </button>
          <button
            onClick={() => setRole("employee")}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              role === "employee" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- OWNER LOGIC --- */}
          {role === "owner" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* --- EMPLOYEE LOGIC --- */}
          {role === "employee" && (
            <>
              {!isExisting && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name to register key"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700">6-Digit Access Key</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={employeeKey}
                  onChange={(e) => setEmployeeKey(e.target.value.replace(/\D/g, ""))} // Forces numbers only
                  className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg"
                  placeholder="000000"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors mt-6"
          >
            {isExisting ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle New / Existing */}
        <p className="mt-6 text-center text-sm text-slate-500">
          {isExisting ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsExisting(!isExisting)}
            className="text-blue-600 hover:underline font-medium"
          >
            {isExisting ? "Set one up" : "Sign in here"}
          </button>
        </p>
      </div>
    </div>
  );
}