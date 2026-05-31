"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setUserRole(storedRole);
  }, [pathname]); 

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    setUserRole(null);
    router.push("/login");
  };

  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col">
        
        {/* TOP NAVIGATION BAR */}
        {!isLoginPage && userRole && (
          <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-blue-600 tracking-tight">Parth's Digital Billing</span>
                </div>
                
                <div className="flex space-x-8 items-center">
                  
                  {/* --- OWNER LINKS --- */}
                  {userRole === "owner" && (
                    <>
                      <Link href="/dashboard" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">Dashboard</Link>
                      <Link href="/customers" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">Customers</Link>
                      <Link href="/inventory" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">Manage Stock</Link>
                      <Link href="/staff" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">Staff</Link>
                      <Link href="/invoices" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">History</Link>
                    </>
                  )}

                  {/* --- EMPLOYEE LINKS --- */}
                  {userRole === "employee" && (
                    <>
                      <Link href="/pos" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">Create Bill</Link>
                      <Link href="/invoices" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">History</Link>
                      <Link href="/customers" className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold transition-colors">Customers</Link>
                    </>
                  )}
                  
                  {/* LOGOUT BUTTON */}
                  <button 
                    onClick={handleLogout} 
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Page Content */}
        <main className={`${isLoginPage ? "" : "flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}`}>
          {children}
        </main>
      </body>
    </html>
  );
}