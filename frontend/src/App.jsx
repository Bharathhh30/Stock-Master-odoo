import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Warehouses from './pages/Warehouses'
import Stock from './pages/Stock'
import Reciepts from "./pages/Reciepts";
import MoveHistory from './pages/MoveHistory';
import LowStockPanel from './components/LowStockPanel'


export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/moves" element={<MoveHistory />} />
            <Route path="/receipts" element={<Reciepts />} />
            <Route path="/moves" element={<MoveHistory />} />
            <Route path="/lowstockpanel" element={<LowStockPanel />} />


          </Routes>
        </main>
      </div>
    </div>
  )
}
