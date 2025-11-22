import React from 'react'
import { NavLink } from 'react-router-dom'

function Item({ to, children }) {
  return (
    <NavLink to={to} className={({isActive}) =>
      `block px-4 py-2 rounded hover:bg-gray-100 ${isActive ? 'bg-white shadow' : ''}`}>
      {children}
    </NavLink>
  )
}

export default function Sidebar(){
  return (
    <aside className="w-64 bg-gray-100 border-r min-h-screen p-4">
      <div className="text-xl font-bold mb-6">StockMaster</div>
      <nav className="space-y-2">
        <Item to="/dashboard">Dashboard</Item>
        <Item to="/stock">Stock</Item>
        <Item to="/products">Products</Item>
        <Item to="/warehouses">Warehouses</Item>
        <Item to="/moves">Move History</Item>
        <Item to="/receipts">Receipts</Item>
        <Item to="/lowstockpanel">LowStockPanel</Item>
        

      </nav>
      
    </aside>
  )
}
