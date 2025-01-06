import * as React from 'react';
import { Link, useLocation } from 'react-router-dom'
import { Home, Package, BarChart2, FileText, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, onLogout }) => {
  const location = useLocation()

  const isActive = (path: string): string => {
    return location.pathname === path ? 'bg-light-blue text-white' : 'text-dark-navy hover:bg-pale-sky-blue'
  }

  return (
    <aside className={`bg-white h-screen flex flex-col flex-shrink-0 shadow-lg transition-all duration-300 relative ${isOpen ? 'w-64' : 'w-12'}`}>
      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          {isOpen && (
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://images.squarespace-cdn.com/content/v1/5f1b0ff6550a4d7d70797c8a/744eaa17-8b53-417a-ac21-74db71817e67/Fotos+para+arti%CC%81culos.png.PNG?format=1500w" 
                alt="Logo 1" 
                className="h-12 mr-2"
              />
              <span className="text-2xl font-bold text-dark-navy">X</span>
              <img 
                src="https://www.korei.mx/imagenes/top_logo.png" 
                alt="Logo 2" 
                className="h-12 ml-2"
              />
            </div>
          )}
          {isOpen && (
            <Link to="/" className="text-2xl font-bold text-medium-blue text-center block">
              Planeación de Demanda
            </Link>
          )}
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link to="/" className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 ease-in-out ${isActive('/')}`}>
                <Home size={20} />
                {isOpen && <span>Panel de Control</span>}
              </Link>
            </li>
            <li>
              <Link to="/productos" className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 ease-in-out ${isActive('/productos')}`}>
                <Package size={20} />
                {isOpen && <span>Productos</span>}
              </Link>
            </li>
            <li>
              <Link to="/analiticas" className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 ease-in-out ${isActive('/analiticas')}`}>
                <BarChart2 size={20} />
                {isOpen && <span>Analíticas</span>}
              </Link>
            </li>
            <li>
              <Link to="/informes" className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 ease-in-out ${isActive('/informes')}`}>
                <FileText size={20} />
                {isOpen && <span>Informes</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="p-4">
        {isOpen && (
          <p className="text-sm text-dark-navy text-center mb-2">&copy; 2024 STRTGY</p>
        )}
        <button 
          onClick={onLogout}
          className={`flex items-center justify-center w-full p-2 rounded-lg transition-all duration-300 ease-in-out text-dark-navy hover:bg-pale-sky-blue ${isOpen ? '' : 'px-0'}`}
        >
          <LogOut size={20} />
          {isOpen && <span className="ml-2">Cerrar sesión</span>}
        </button>
      </div>
      <button 
        onClick={toggleSidebar} 
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-white p-1 rounded-full shadow-md hover:bg-gray-200"
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </aside>
  )
}

export default Sidebar
