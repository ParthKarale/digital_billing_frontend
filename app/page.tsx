"use client";

import { useState, useEffect } from "react";
import api from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Customer { customer_id: number; full_name: string; phone_number: string; address: string; email: string; }
interface Product { product_id: number; name: string; price: number; stock_quantity: number; }
interface CartItem { product_id: number; name: string; price: number; quantity: number; }
interface Invoice { invoice_id: number; customer_id: number; amount: number; local_file_path: string; created_at: string; }

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("billing");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [stats, setStats] = useState({ total_revenue: 0, total_bills: 0, low_stock_items: [], chart_data: [] });

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");

  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const [showProdDropdown, setShowProdDropdown] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [discount, setDiscount] = useState<number>(0);
  const [cgst, setCgst] = useState<number>(9);
  const [sgst, setSgst] = useState<number>(9);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchData = async () => {
    try {
      const custRes = await api.get("/customer/"); setCustomers(custRes.data);
      const prodRes = await api.get("/product/"); setProducts(prodRes.data);
      const invRes = await api.get("/invoice/"); setInvoices(invRes.data);
      const statsRes = await api.get("/analytics/"); setStats(statsRes.data);
    } catch (error) { console.error("Failed to fetch data", error); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post("/customer/", { full_name: customerName, phone_number: phoneNumber, address: address, email: email }); setStatusMessage("Customer added successfully."); setCustomerName(""); setPhoneNumber(""); setAddress(""); setEmail(""); fetchData(); } catch (error) { setStatusMessage("Error: Phone number might already exist."); } };
  const handleCreateProduct = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post("/product/", { name: productName, price: parseFloat(productPrice), stock_quantity: parseInt(productStock) }); setStatusMessage("Inventory updated."); setProductName(""); setProductPrice(""); setProductStock(""); fetchData(); } catch (error) { setStatusMessage("Error adding product."); } };
  const handleDeleteCustomer = async (id: number) => { if (!window.confirm("Are you sure you want to delete this customer?")) return; try { await api.delete(`/customer/${id}`); setStatusMessage("Customer deleted."); fetchData(); } catch (error: any) { setStatusMessage(`Error: ${error.response?.data?.detail || "Could not delete."}`); } };
  const handleDeleteProduct = async (id: number) => { if (!window.confirm("Are you sure you want to delete this product?")) return; try { await api.delete(`/product/${id}`); setStatusMessage("Product deleted."); fetchData(); } catch (error: any) { setStatusMessage(`Error: ${error.response?.data?.detail || "Could not delete."}`); } };
  const handleDeleteInvoice = async (id: number) => { if (!window.confirm("Are you sure you want to delete this invoice?")) return; try { await api.delete(`/invoice/${id}`); setStatusMessage("Bill deleted."); fetchData(); } catch (error) { setStatusMessage("Error deleting bill."); } };

  const addToCart = () => { if (!selectedProductId || !selectedQuantity) return; const product = products.find(p => p.product_id.toString() === selectedProductId); if (!product) return; const quantity = parseInt(selectedQuantity); if (quantity > product.stock_quantity) { setStatusMessage(`Not enough stock. Only ${product.stock_quantity} left.`); return; } setCart([...cart, { product_id: product.product_id, name: product.name, price: product.price, quantity }]); setSelectedProductId(""); setProdSearch(""); setSelectedQuantity("1"); setStatusMessage(""); };
  const removeFromCart = (indexToRemove: number) => { setCart(cart.filter((_, index) => index !== indexToRemove)); };

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountAmt = subtotal * (discount / 100);
  const taxableAmt = subtotal - discountAmt;
  const cgstAmt = taxableAmt * (cgst / 100);
  const sgstAmt = taxableAmt * (sgst / 100);
  const grandTotal = taxableAmt + cgstAmt + sgstAmt;

  const handleGenerateBill = async () => { if (!selectedCustomerId || cart.length === 0) { setStatusMessage("Please select a customer and add items."); return; } setStatusMessage("Generating Bill..."); try { const payload = { customer_id: parseInt(selectedCustomerId), amount: grandTotal, discount_percent: discount, cgst_percent: cgst, sgst_percent: sgst, status: "Completed", items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity })) }; await api.post("/invoice/", payload); const customer = customers.find(c => c.customer_id.toString() === selectedCustomerId); if(customer) sendWhatsApp(customer.phone_number, customer.full_name, grandTotal, "Latest"); setStatusMessage("Bill Generated successfully."); setCart([]); setSelectedCustomerId(""); setCustSearch(""); setDiscount(0); fetchData(); } catch (error) { setStatusMessage("Error generating bill."); } };
const sendWhatsApp = (phone: string, name: string, amount: number, invoiceId: string | number) => { 
    let formattedPhone = phone.replace(/\D/g, ""); 
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone; 
    
    // Write the message normally
    const rawMessage = `Hello ${name},

Thank you for shopping with us!

🧾 *Invoice No:* ${invoiceId}
💰 *Total Amount:* Rs. ${amount.toFixed(2)}

We hope to see you again soon! Have a great day.`;

    // Safely encode it for the internet so the # and emojis don't break it
    const encodedMessage = encodeURIComponent(rawMessage);
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank"); 
  };
  const filteredCustomers = customers.filter(c => c.full_name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone_number.includes(custSearch));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()));

  // Soft, clean Navigation Button Component
  const NavButton = ({ id, label }: { id: string, label: string }) => (
    <button 
      onClick={() => {setActiveTab(id); setStatusMessage(""); if (id === "analytics" || id === "history") fetchData();}} 
      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id 
          ? "bg-blue-600 text-white" 
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      
      {/* CLEAN NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Parth's Digital Billing</h1>
          
          <div className="flex flex-wrap gap-2 items-center">
            <NavButton id="billing" label="Create Bill" />
            <NavButton id="history" label="History" />
            <NavButton id="customers" label="Customers" />
            <NavButton id="inventory" label="Inventory" />
            <NavButton id="analytics" label="Analytics" />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* SOFTER STATUS MESSAGES */}
        {statusMessage && ( 
          <div className={`p-4 rounded-xl text-sm font-medium animate-in fade-in ${statusMessage.includes("Error") || statusMessage.includes("Cannot") ? "bg-red-50 text-red-700 border border-red-100" : (statusMessage.includes("Generating") ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100")}`}>
            {statusMessage}
          </div> 
        )}

        {/* ========================================== */}
        {/* 📊 ANALYTICS TAB (Clean & Soft) */}
        {/* ========================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Soft KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-slate-500 font-medium text-sm">Total Revenue</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">₹{stats.total_revenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-slate-500 font-medium text-sm">Total Bills Generated</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total_bills}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                <h3 className="text-slate-500 font-medium text-sm">Low Stock Alerts</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.low_stock_items.length} Items</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Clean Chart */}
              <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-6 text-slate-700">Recent Revenue Trend</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} dx={-10} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Clean Alerts List */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Restock Needed</h3>
                <div className="space-y-3 overflow-y-auto max-h-72 pr-2 flex-grow">
                  {stats.low_stock_items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <p>Inventory is fully stocked.</p>
                    </div>
                  ) : (
                    stats.low_stock_items.map((item: any) => (
                      <div key={item.product_id} className="flex justify-between items-center p-3 border border-red-100 rounded-lg bg-red-50/50">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="text-red-600 text-sm font-semibold">{item.stock_quantity} left</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* CREATE BILL TAB (Clean) */}
        {/* ========================================== */}
        {activeTab === "billing" && ( 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold mb-4 text-slate-700">1. Select Customer</h2>
                <div className="relative">
                  <input type="text" placeholder="Search name or phone..." value={custSearch} onChange={(e) => {setCustSearch(e.target.value); setShowCustDropdown(true);}} onFocus={() => setShowCustDropdown(true)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                  {showCustDropdown && custSearch.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length === 0 ? ( <div className="p-3 text-slate-400 text-sm">No customers found.</div> ) : (
                        filteredCustomers.map(c => (
                          <div key={c.customer_id} onClick={() => {setSelectedCustomerId(c.customer_id.toString()); setCustSearch(`${c.full_name} (${c.phone_number})`); setShowCustDropdown(false);}} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                            <div className="font-medium text-slate-800">{c.full_name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{c.phone_number} • {c.address}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold mb-4 text-slate-700">2. Add Products</h2>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-[2] relative w-full">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Search Inventory</label>
                    <input type="text" placeholder="Search product..." value={prodSearch} onChange={(e) => {setProdSearch(e.target.value); setShowProdDropdown(true);}} onFocus={() => setShowProdDropdown(true)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                    {showProdDropdown && prodSearch.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? ( <div className="p-3 text-slate-400 text-sm">No products found.</div> ) : (
                          filteredProducts.map(p => (
                            <div key={p.product_id} onClick={() => {setSelectedProductId(p.product_id.toString()); setProdSearch(p.name); setShowProdDropdown(false);}} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center">
                              <span className="font-medium text-slate-800">{p.name}</span>
                              <div className="text-right">
                                <div className="text-sm text-slate-800">₹{p.price}</div>
                                <div className={`text-xs ${p.stock_quantity > 0 ? "text-slate-500" : "text-red-500"}`}>{p.stock_quantity} in stock</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full md:w-auto">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Quantity</label>
                    <input type="number" min="1" value={selectedQuantity} onChange={(e) => setSelectedQuantity(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                  </div>

                  <button onClick={addToCart} className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg mt-6 transition-colors">Add</button>
                </div>
              </div>
            </div>

            {/* Sidebar Cart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-24 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-slate-700 border-b border-slate-100 pb-3">Current Order</h2>
              
              <div className="min-h-[150px] max-h-[300px] overflow-y-auto space-y-2 mb-6 pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-8 text-sm">
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} x ₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800 text-sm">₹{item.price * item.quantity}</span>
                        <button onClick={() => removeFromCart(index)} className="text-slate-400 hover:text-red-500 font-bold text-lg leading-none">&times;</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Math Box */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2 text-sm text-slate-600 mb-6">
                <div className="flex justify-between"><span>Subtotal:</span><span className="font-medium text-slate-800">₹{subtotal.toFixed(2)}</span></div>
                
                <div className="flex justify-between items-center">
                  <span>Discount (%):</span>
                  <input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-16 p-1 border border-slate-300 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                {discount > 0 && <div className="flex justify-between text-red-500 text-xs"><span>- Discount:</span><span>- ₹{discountAmt.toFixed(2)}</span></div>}
                
                <div className="flex justify-between items-center mt-1">
                  <span>CGST (%):</span>
                  <input type="number" min="0" max="100" value={cgst} onChange={(e) => setCgst(Number(e.target.value))} className="w-16 p-1 border border-slate-300 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                {cgst > 0 && <div className="flex justify-between text-slate-500 text-xs"><span>+ CGST:</span><span>+ ₹{cgstAmt.toFixed(2)}</span></div>}
                
                <div className="flex justify-between items-center">
                  <span>SGST (%):</span>
                  <input type="number" min="0" max="100" value={sgst} onChange={(e) => setSgst(Number(e.target.value))} className="w-16 p-1 border border-slate-300 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                {sgst > 0 && <div className="flex justify-between text-slate-500 text-xs"><span>+ SGST:</span><span>+ ₹{sgstAmt.toFixed(2)}</span></div>}
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-slate-600 font-medium">Total</span>
                <span className="text-2xl font-bold text-slate-800">₹{grandTotal.toFixed(2)}</span>
              </div>
              
              <button onClick={handleGenerateBill} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
                Generate Invoice
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* HISTORY TAB */}
        {/* ========================================== */}
        {activeTab === "history" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold mb-6 text-slate-700">Invoice Archive</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-3 font-medium">Bill No.</th><th className="p-3 font-medium">Customer Details</th><th className="p-3 font-medium">Total Amount</th><th className="p-3 font-medium text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const customer = customers.find(c => c.customer_id === inv.customer_id);
                    return ( 
                      <tr key={inv.invoice_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-500">#{inv.invoice_id}</td>
                        <td className="p-3"><div className="font-medium text-slate-800">{customer?.full_name || `Unknown`}</div><div className="text-xs text-slate-500">{customer?.phone_number || ""}</div></td>
                        <td className="p-3 font-medium text-slate-800">₹{inv.amount}</td>
                        <td className="p-3 flex justify-end gap-3">
                          {inv.local_file_path && <a href={`http://localhost:8000/${inv.local_file_path}`} target="_blank" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">PDF</a>}
                          {customer && <button onClick={() => sendWhatsApp(customer.phone_number, customer.full_name, inv.amount, inv.invoice_id)} className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors">WhatsApp</button>}
                          <button onClick={() => handleDeleteInvoice(inv.invoice_id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                        </td>
                      </tr> 
                    ) 
                  })} 
                  {invoices.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">No invoices generated yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* CUSTOMERS TAB */}
        {/* ========================================== */}
        {activeTab === "customers" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-6 text-slate-700">Register Customer</h2>
              <form onSubmit={handleCreateCustomer} className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1"><label className="block text-sm font-medium text-slate-600 mb-1">Full Name *</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all" required /></div>
                  <div className="flex-1"><label className="block text-sm font-medium text-slate-600 mb-1">Phone Number *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all" required /></div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-[2]"><label className="block text-sm font-medium text-slate-600 mb-1">Address *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all" required /></div>
                  <div className="flex-1"><label className="block text-sm font-medium text-slate-600 mb-1">Email (Optional)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
                </div>
                <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg mt-2 w-full md:w-auto self-end transition-colors">Save Customer</button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 text-slate-700">Directory</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Address</th><th className="p-3 font-medium text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => ( 
                      <tr key={c.customer_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-800">{c.full_name}</td>
                        <td className="p-3 text-slate-600">{c.phone_number}</td>
                        <td className="p-3 text-slate-500">{c.address}</td>
                        <td className="p-3 text-right"><button onClick={() => handleDeleteCustomer(c.customer_id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button></td>
                      </tr> 
                    ))} 
                    {customers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">No customers registered.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* INVENTORY TAB */}
        {/* ========================================== */}
        {activeTab === "inventory" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 text-slate-700">Stock Management</h2>
              <form onSubmit={handleCreateProduct} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-[2] w-full"><label className="block text-sm font-medium text-slate-600 mb-1">Product Name</label><input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all" required /></div>
                <div className="flex-1 w-full"><label className="block text-sm font-medium text-slate-600 mb-1">Unit Price (₹)</label><input type="number" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all" required /></div>
                <div className="flex-1 w-full"><label className="block text-sm font-medium text-slate-600 mb-1">Quantity</label><input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all" required /></div>
                <button type="submit" className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition-colors whitespace-nowrap">Save Product</button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 text-slate-700">Master Inventory</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-3 font-medium">SKU ID</th><th className="p-3 font-medium">Product</th><th className="p-3 font-medium">Price</th><th className="p-3 font-medium">Stock</th><th className="p-3 font-medium text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => ( 
                      <tr key={p.product_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-500">#{p.product_id}</td>
                        <td className="p-3 font-medium text-slate-800">{p.name}</td>
                        <td className="p-3 text-slate-800">₹{p.price}</td>
                        <td className="p-3"><span className={`${p.stock_quantity > 10 ? 'text-slate-600' : 'text-red-600 font-medium'}`}>{p.stock_quantity} Units</span></td>
                        <td className="p-3 text-right"><button onClick={() => handleDeleteProduct(p.product_id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button></td>
                      </tr> 
                    ))} 
                    {products.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">Warehouse is empty.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}