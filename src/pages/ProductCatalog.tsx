import * as React from 'react';
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Product } from '../types'

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [skuSearch, setSkuSearch] = useState('')
  const [showSkuDropdown, setShowSkuDropdown] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(9)
  const [showFilters, setShowFilters] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      try {
        const response = await axios.get<Product[]>('https://sb1-xzau5n.onrender.com/api/data')
        setProducts(response.data)
      } catch (error) {
        console.error('Error al obtener productos:', error)
        setError('No se pudieron obtener los productos. Por favor, inténtelo de nuevo más tarde.')
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSkuDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (error) {
    return <div className="text-red-500 card">{error}</div>
  }

  if (products.length === 0) {
    return <div className="card">Cargando...</div>
  }

  const parseField = (field: string): string => {
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed.join(', ') : parsed
    } catch {
      return field
    }
  }

  const filteredProducts = products.filter(product => {
    const sku = product.SKU
    const group = parseField(product.GRUPO)
    
    return (
      (!skuSearch || sku.startsWith(skuSearch.toUpperCase())) &&
      (categoryFilter === '' || product.Categoria === categoryFilter) &&
      (groupFilter === '' || group.includes(groupFilter)) &&
      (manufacturerFilter === '' || parseField(product.FABRICANTE) === manufacturerFilter)
    )
  })

  const categories = ['Todas las Categorías', ...new Set(products.map(product => product.Categoria))]
  const groups = ['Todos los Grupos', ...new Set(products.map(product => parseField(product.GRUPO)))]
  const manufacturers = ['Todos los Fabricantes', ...new Set(products.map(product => parseField(product.FABRICANTE)))]

  // Get current products
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  // Get SKU suggestions
  const skuSuggestions = products
    .map(product => product.SKU)
    .filter(sku => sku.startsWith(skuSearch.toUpperCase()))
    .slice(0, 5) // Limitar a 5 sugerencias

  // Add this calculation before the return statement
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const clearFilters = () => {
    setSkuSearch('');
    setCategoryFilter('');
    setGroupFilter('');
    setManufacturerFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-medium-blue mb-4">
            Catálogo de Productos
          </h1>

        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Barra de búsqueda principal */}
          <div className="relative max-w-2xl mx-auto" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por SKU..."
                className="input w-full pl-10 pr-4 h-12 text-lg"
                value={skuSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setSkuSearch(value);
                  setShowSkuDropdown(value.length > 0);
                  setCurrentPage(1);
                }}
                onFocus={() => {
                  if (skuSearch) setShowSkuDropdown(true);
                }}
              />
              {skuSearch && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSkuSearch('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown de sugerencias mejorado */}
            {showSkuDropdown && skuSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {skuSuggestions.map((sku) => (
                  <div
                    key={sku}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                    onClick={() => {
                      setSkuSearch(sku);
                      setShowSkuDropdown(false);
                      setCurrentPage(1);
                    }}
                  >
                    <div className="font-medium text-gray-700">{sku}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de filtro */}
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            {(categoryFilter || groupFilter || manufacturerFilter) && (
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={clearFilters}
              >
                <X size={18} />
                Limpiar Filtros
              </button>
            )}
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              <select
                className="select"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category === 'Todas las Categorías' ? '' : category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {groups.map(group => (
                  <option key={group} value={group === 'Todos los Grupos' ? '' : group}>
                    {group}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={manufacturerFilter}
                onChange={(e) => {
                  setManufacturerFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer === 'Todos los Fabricantes' ? '' : manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="space-y-6">
          {/* Contador de resultados */}
          <div className="text-gray-600 text-center">
            Mostrando {Math.min(currentPage * productsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProducts.map((product, index) => (
              <div 
                key={`${product.SKU}-${index}`} 
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-medium-blue line-clamp-2">
                      {parseField(product.DESCRIPCION)}
                    </h2>
                    <div className="text-sm text-gray-500">SKU: {product.SKU}</div>
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <p className="flex justify-between">
                      <span className="font-medium">Categoría:</span>
                      <span>{product.Categoria}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium">Grupo:</span>
                      <span>{parseField(product.GRUPO)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium">Fabricante:</span>
                      <span>{parseField(product.FABRICANTE)}</span>
                    </p>
                  </div>

                  <Link 
                    to={`/analiticas/${product.SKU}`}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 mt-4"
                  >
                    Ver Analíticas
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación mejorada */}
          <div className="flex justify-center items-center gap-6 mt-8">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Anterior
            </button>
            
            <div className="text-medium-blue font-semibold flex items-center gap-2">
              <span>Página</span>
              <select
                className="select select-sm"
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
              <span>de {totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="btn btn-secondary flex items-center gap-2"
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCatalog