import React, { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import { Download } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Product } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const AdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<Product[]>([])
  const [selectedSKU, setSelectedSKU] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get<Product[]>('https://sb1-xzau5n.onrender.com/api/data')
        setData(response.data)
        setSelectedSKU(response.data[0]?.SKU || '')
      } catch (error) {
        console.error('Error al obtener datos:', error)
        setError('No se pudieron obtener los datos. Por favor, inténtelo de nuevo más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedProduct = useMemo(() => {
    return data.find(product => product.SKU === selectedSKU)
  }, [data, selectedSKU])

  const parseDates = (dateString: string): string[] => {
    const matches = dateString?.match(/\d{4}-\d{2}-\d{2}/g) || []
    return matches
  }

  const parsePronostico = (pronosticoString: string): number[] => {
    const matches = pronosticoString?.match(/\d+(\.\d+)?/g) || []
    return matches.map(Number)
  }

  const parseWeeklySales = (weeklySalesString: string): { date: Date; quantity: number }[] => {
    try {
      const salesData = JSON.parse(weeklySalesString)
      return salesData.map((item: { Date: string; CANTIDAD: number }) => ({
        date: new Date(item.Date),
        quantity: item.CANTIDAD
      }))
    } catch (error) {
      console.error('Error al analizar datos de ventas semanales:', error)
      return []
    }
  }

  const { chartData, chartOptions } = useMemo(() => {
    if (!selectedProduct) return { chartData: null, chartOptions: null }

    const weeklySales = parseWeeklySales(selectedProduct.Weekly_Sales)
    const forecastDates = parseDates(selectedProduct.Fechas_Pronostico)
    const forecastValues = parsePronostico(selectedProduct.Pronostico)

    const allDates = [...new Set([...weeklySales.map(sale => sale.date.toISOString().split('T')[0]), ...forecastDates])]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    const chartData = {
      labels: allDates.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Ventas Históricas',
          data: allDates.map(date => {
            const sale = weeklySales.find(s => s.date.toISOString().split('T')[0] === date)
            return sale ? sale.quantity : null
          }),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Pronóstico',
          data: allDates.map(date => {
            const index = forecastDates.indexOf(date)
            return index !== -1 ? forecastValues[index] : null
          }),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'Stock de Seguridad',
          data: Array(allDates.length).fill(selectedProduct.Stock_Seguridad),
          borderColor: 'rgba(255, 206, 86, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Punto de Reorden',
          data: Array(allDates.length).fill(selectedProduct.Punto_Reorden),
          borderColor: 'rgba(153, 102, 255, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Stock Máximo',
          data: Array(allDates.length).fill(selectedProduct.Stock_Maximo),
          borderColor: 'rgba(54, 162, 235, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
    }

    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Ventas Históricas vs Pronóstico - SKU: ${selectedProduct.SKU}`,
          font: {
            size: 16,
            weight: 'bold',
          },
          color: '#145da0',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Fecha'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Cantidad'
          }
        }
      }
    }

    return { chartData, chartOptions }
  }, [selectedProduct])

  const handleDownloadChart = () => {
    if (chartRef.current) {
      const link = document.createElement('a')
      link.download = `grafica_${selectedSKU}.png`
      link.href = chartRef.current.toBase64Image()
      link.click()
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 card">Cargando...</div>
  }

  if (error) {
    return <div className="text-red-500 card">{error}</div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-medium-blue mb-8 text-center shadow-sm bg-white py-4 rounded-lg">Analíticas Avanzadas</h1>
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <select
          className="select flex-grow w-full sm:w-auto"
          value={selectedSKU}
          onChange={(e) => setSelectedSKU(e.target.value)}
        >
          {data.map(product => (
            <option key={product.SKU} value={product.SKU}>{product.SKU}</option>
          ))}
        </select>
        <button
          onClick={handleDownloadChart}
          className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
          title="Descargar gráfica"
        >
          <Download size={20} className="mr-2" />
          Descargar Gráfica
        </button>
      </div>
      {selectedProduct && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">Clasificación de Demanda</h2>
              <p className="text-lg break-words">{selectedProduct.Categoria_No_Seleccionados}</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">Método de Pronóstico</h2>
              <p className="text-lg break-words">{selectedProduct.Metodo}</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">Coeficiente de Variación (CV)</h2>
              <p className="text-lg">{selectedProduct.CV.toFixed(2)}</p>
            </div>
          </div>
          {chartData && chartOptions && (
            <div className="card">
              <div className="h-96">
                <Line ref={chartRef} options={chartOptions} data={chartData} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">Stock de Seguridad</h2>
              <p className="text-lg">{selectedProduct.Stock_Seguridad.toFixed(2)}</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">Punto de Reorden</h2>
              <p className="text-lg">{selectedProduct.Punto_Reorden.toFixed(2)}</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">Nivel Máximo de Stock</h2>
              <p className="text-lg">{selectedProduct.Stock_Maximo.toFixed(2)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdvancedAnalytics