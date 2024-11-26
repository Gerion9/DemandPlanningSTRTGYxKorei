import * as React from 'react';
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Product } from '../types'

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(9)

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
    const description = parseField(product.DESCRIPCION).toLowerCase()
    return description.includes(searchTerm.toLowerCase()) &&
      (categoryFilter === '' || product.Categoria === categoryFilter)
  })

  const categories = ['Todas las Categorías', ...new Set(products.map(product => product.Categoria))]

  // Get current products
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-medium-blue mb-8 text-center shadow-sm bg-white py-4 rounded-lg">Catálogo de Productos</h1>
      <div className="flex space-x-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="input w-full pl-10"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <select
          className="select"
          value={categoryFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
        >
          {categories.map(category => (
            <option key={category} value={category === 'Todas las Categorías' ? '' : category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProducts.map((product, index) => (
          <div key={`${product.SKU}-${index}`} className="card hover:scale-105">
            <h2 className="text-xl font-semibold mb-2 text-medium-blue">{parseField(product.DESCRIPCION)}</h2>
            <p><strong>SKU:</strong> {product.SKU}</p>
            <p><strong>Categoría:</strong> {product.Categoria}</p>
            <p><strong>Grupo:</strong> {parseField(product.GRUPO)}</p>
            <p><strong>Fabricante:</strong> {parseField(product.FABRICANTE)}</p>
            <Link 
              to={`/analiticas?sku=${product.SKU}`} 
              className="btn btn-primary mt-4 inline-block"
            >
              Ver Analíticas
            </Link>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-secondary mr-2"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={indexOfLastProduct >= filteredProducts.length}
          className="btn btn-secondary"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

export default ProductCatalog