"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // 1. We replace the hardcoded "owner" with dynamic state
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // This checks if we are on the login page so we can hide the navbar!
  const isLoginPage = pathname === "/login";

  // 2. When the app loads, check the browser memory for who logged in
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setUserRole(storedRole);
  }, [pathname]); // This makes it re-check whenever you change pages

  // 3. Clear memory safely when they log out
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    setUserRole(null);
    router.push("/login");
  };

  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col">
        
        {/* Only show the Navbar if we are NOT on the login page AND a role exists */}
        {!isLoginPage && userRole && (
          <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-blue-600 tracking-tight">Parth's Digital Billing</span>
                </div>
                
                <div className="flex space-x-8 items-center">
                  
                  {/* OWNER LINKS */}
                  {userRole === "owner" && (
                    <>
                      <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</Link>
                      <Link href="/inventory" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Manage Stock</Link>
                      <Link href="/staff" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Staff</Link>
                      <Link href="/invoices" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Invoice History</Link>
                    </>
                  )}

                  {/* EMPLOYEES DON'T NEED EXTRA LINKS, THEY STAY ON POS */}
                  
                  {/* LOGOUT BUTTON */}
                  <button 
                    onClick={handleLogout} 
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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