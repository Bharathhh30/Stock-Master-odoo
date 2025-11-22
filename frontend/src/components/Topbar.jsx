import React from 'react'

export default function Topbar(){
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div className="text-lg font-medium">Inventory Dashboard</div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">User</div>
      </div>
    </header>
  )
}
