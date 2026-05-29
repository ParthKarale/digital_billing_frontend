"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userRole: string = "owner"; // Change to "employee" to test the other view
  
  // This checks if we are on the login page so we can hide the navbar!
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col">
        
        {/* Only show the Navbar if we are NOT on the login page */}
        {!isLoginPage && (
          <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0 flex items-center">
                  {/* Fixed the Name! */}
                  <span className="text-xl font-bold text-blue-600 tracking-tight">Parth's Digital Billing</span>
                </div>
                
                <div className="flex space-x-8">
                  {userRole === "owner" && (
                    <>
                      <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</Link>
                      <Link href="/inventory" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Manage Stock</Link>
                      <Link href="/staff" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Staff</Link>
                      {/* ADD THIS NEW LINE: */}
                      <Link href="/invoices" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Invoice History</Link>
                    </>
                  )}
                  {userRole === "employee" && (
                    <Link href="/pos" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Point of Sale</Link>
                  )}
                  <Link href="/login" className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Logout
                  </Link>
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