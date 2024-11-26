import * as React from 'react';
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Download, Search } from 'lucide-react'
import { Product } from '../types'

const Reports: React.FC = () => {
  const [data, setData] = useState<Product[]>([])
  const [selectedSKUs, setSelectedSKUs] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await axios.get<Product[]>('https://sb1-xzau5n.onrender.com/api/data')
        setData(response.data)
      } catch (error) {
        console.error('Error al obtener datos:', error)
        setError('No se pudieron obtener los datos. Por favor, inténtelo de nuevo más tarde.')
      }
    }

    fetchData()
  }, [])

  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    const selectedData = data.filter(item => selectedSKUs.includes(item.SKU))
    const exportData = selectedData.map(item => {
      const exportItem: Partial<Product> = {}
      selectedFields.forEach(field => {
        exportItem[field as keyof Product] = item[field as keyof Product]
      })
      return exportItem
    })

    let content: string
    let fileName: string
    let mimeType: string

    switch (format) {
      case 'csv':
        content = convertToCSV(exportData)
        fileName = 'reporte.csv'
        mimeType = 'text/csv'
        break
      case 'excel':
        content = convertToExcel(exportData)
        fileName = 'reporte.xlsx'
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      case 'json':
        content = JSON.stringify(exportData, null, 2)
        fileName = 'reporte.json'
        mimeType = 'application/json'
        break
      default:
        console.error('Formato no soportado')
        return
    }

    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
  }

  const convertToCSV = (data: Partial<Product>[]): string => {
    const header = Object.keys(data[0] || {}).join(',')
    const rows = data.map(item => Object.values(item).join(','))
    return [header, ...rows].join('\n')
  }

  const convertToExcel = (data: Partial<Product>[]): string => {
    const header = Object.keys(data[0] || {}).join('\t')
    const rows = data.map(item => Object.values(item).join('\t'))
    return [header, ...rows].join('\n')
  }

  const handleSKUChange = (sku: string) => {
    setSelectedSKUs(prev => 
      prev.includes(sku) ? prev.filter(item => item !== sku) : [...prev, sku]
    )
  }

  const handleFieldChange = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) ? prev.filter(item => item !== field) : [...prev, field]
    )
  }

  const handleSelectAllSKUs = () => {
    setSelectedSKUs(data.map(item => item.SKU))
  }

  const handleDeselectAllSKUs = () => {
    setSelectedSKUs([])
  }

  const filteredSKUs = data
    .filter(item => item.SKU.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(item => item.SKU)

  const fieldTranslations: { [key: string]: string } = {
    'SKU': 'SKU',
    'Categoria': 'Categoría',
    'Categoria_No_Seleccionados': 'Categoría No Seleccionados',
    'Metodo': 'Método',
    'Demanda_Media_Semanal': 'Demanda Media Semanal',
    'Desviacion_Estandar': 'Desviación Estándar',
    'CV': 'CV (Coeficiente de Variación)',
    'Lead_Time_semanas': 'Tiempo de Entrega (semanas)',
    'Lead_Time_STD_semanas': 'Desviación Estándar del Tiempo de Entrega (semanas)',
    'MOQ': 'Cantidad Mínima de Pedido',
    'Nivel_de_Servicio': 'Nivel de Servicio',
    'Z': 'Z (Valor Z)',
    'Stock_Seguridad': 'Stock de Seguridad',
    'Punto_Reorden': 'Punto de Reorden',
    'Stock_Maximo': 'Stock Máximo',
    'Promedio_Ventas': 'Promedio de Ventas',
    'Pronostico': 'Pronóstico',
    'Fechas_Pronostico': 'Fechas de Pronóstico',
    'Total_Quantity_Sold': 'Cantidad Total Vendida',
    'Total_Sales': 'Ventas Totales',
    'First_Sale_Date': 'Fecha de Primera Venta',
    'Last_Sale_Date': 'Fecha de Última Venta',
    'DESCRIPCION': 'Descripción',
    'GRUPO': 'Grupo',
    'FABRICANTE': 'Fabricante',
    'Weekly_Sales': 'Ventas Semanales'
  }

  if (error) {
    return <div className="text-red-500 card">{error}</div>
  }

  if (data.length === 0) {
    return <div className="card">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-medium-blue mb-8 text-center shadow-sm bg-white py-4 rounded-lg">Informes</h1>
      <div className="card space-y-6">
        <h2 className="text-2xl font-bold text-medium-blue">Exportar Datos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-medium-blue">Seleccionar SKUs:</h3>
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Buscar SKUs..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="mb-4 flex space-x-2">
              <button
                onClick={handleSelectAllSKUs}
                className="btn btn-secondary text-sm"
              >
                Seleccionar Todos
              </button>
              <button
                onClick={handleDeselectAllSKUs}
                className="btn btn-secondary text-sm"
              >
                Deseleccionar Todos
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto border p-2 rounded">
              {filteredSKUs.map(sku => (
                <div key={sku} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`sku-${sku}`}
                    checked={selectedSKUs.includes(sku)}
                    onChange={() => handleSKUChange(sku)}
                    className="mr-2"
                  />
                  <label htmlFor={`sku-${sku}`}>{sku}</label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-medium-blue">Seleccionar Campos:</h3>
            <div className="max-h-60 overflow-y-auto border p-2 rounded">
              {Object.keys(data[0] || {}).filter(field => field !== 'id').map(field => (
                <div key={field} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`field-${field}`}
                    checked={selectedFields.includes(field)}
                    onChange={() => handleFieldChange(field)}
                    className="mr-2"
                  />
                  <label htmlFor={`field-${field}`}>{fieldTranslations[field] || field}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button className="btn btn-primary flex items-center" onClick={() => handleExport('csv')}>
            <Download size={20} className="mr-2" />
            Exportar como CSV
          </button>
          <button className="btn btn-primary flex items-center" onClick={() => handleExport('excel')}>
            <Download size={20} className="mr-2" />
            Exportar como Excel
          </button>
          <button className="btn btn-primary flex items-center" onClick={() => handleExport('json')}>
            <Download size={20} className="mr-2" />
            Exportar como JSON
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports