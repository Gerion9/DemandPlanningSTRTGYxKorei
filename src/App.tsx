import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProductCatalog from './pages/ProductCatalog'
import AdvancedAnalytics from './pages/AdvancedAnalytics'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'
import { useEffect } from 'react';
import { initFaviconChange } from './utils/faviconManager';

function App() {
  useEffect(() => {
    initFaviconChange();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/icon-preview" element={
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
          <div className="space-y-8">
            <img 
              src="/src/assets/favicon.svg" 
              alt="Icon Preview" 
              className="w-64 h-64" // Tamaño grande para previsualización
            />
            <div className="flex gap-4">
              <img 
                src="/src/assets/favicon.svg" 
                alt="Icon Preview" 
                className="w-32 h-32" // Tamaño mediano
              />
              <img 
                src="/src/assets/favicon.svg" 
                alt="Icon Preview" 
                className="w-16 h-16" // Tamaño normal
              />
              <img 
                src="/src/assets/favicon.svg" 
                alt="Icon Preview" 
                className="w-8 h-8" // Tamaño favicon
              />
            </div>
          </div>
        </div>
      } />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<ProductCatalog />} />
          <Route path="analiticas/:sku" element={<AdvancedAnalytics />} />
          <Route path="analiticas" element={<AdvancedAnalytics />} />
          <Route path="informes" element={<Reports />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
