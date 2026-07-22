import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ModuleProgressProvider } from './context/ModuleProgressContext'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <ModuleProgressProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ModuleProgressProvider>
    </AuthProvider>
  )
}
