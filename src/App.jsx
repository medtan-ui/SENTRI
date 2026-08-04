import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GamificationProvider } from './context/GamificationContext'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </GamificationProvider>
    </AuthProvider>
  )
}
