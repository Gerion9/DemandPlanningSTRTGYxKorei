import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProductCatalog from './pages/ProductCatalog'
import AdvancedAnalytics from './pages/AdvancedAnalytics'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
