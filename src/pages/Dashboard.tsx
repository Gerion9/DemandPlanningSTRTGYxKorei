import * as React from 'react';
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Product } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const Dashboard: React.FC = () => {
  const [data, setData] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

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

  if (error) {
    return <div className="text-red-500 card">{error}</div>
  }

  if (data.length === 0) {
    return <div className="card">Cargando...</div>
  }

  const sortedByDemand = [...data].sort((a, b) => b.Demanda_Media_Semanal - a.Demanda_Media_Semanal).slice(0, 10)
  const sortedByQuantity = [...data].sort((a, b) => b.Total_Quantity_Sold - a.Total_Quantity_Sold).slice(0, 10)
  const sortedBySales = [...data].sort((a, b) => b.Total_Sales - a.Total_Sales).slice(0, 10)

  const createChartData = (sortedData: Product[], label: string, dataKey: keyof Product) => ({
    labels: sortedData.map(item => item.SKU),
    datasets: [
      {
        label: label,
        data: sortedData.map(item => item[dataKey] as number),
        backgroundColor: 'rgba(20, 93, 160, 0.6)',
        borderColor: 'rgba(5, 29, 64, 1)',
        borderWidth: 1,
      },
    ],
  })

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 10 Productos',
        color: '#145da0',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#051d40',
        },
      },
      y: {
        ticks: {
          color: '#051d40',
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-medium-blue mb-8 text-center shadow-sm bg-white py-4 rounded-lg">Panel de Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-medium-blue text-center">Demanda Media Semanal Promedio</h2>
          <p className="text-3xl font-bold text-dark-navy text-center truncate">
            {(data.reduce((acc, item) => acc + item.Demanda_Media_Semanal, 0) / data.length).toFixed(2)}
          </p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-medium-blue text-center">Cantidad Total Vendida</h2>
          <p className="text-3xl font-bold text-dark-navy text-center truncate">
            {data.reduce((acc, item) => acc + item.Total_Quantity_Sold, 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-medium-blue text-center">Ventas Totales</h2>
          <p className="text-3xl font-bold text-dark-navy text-center truncate">
            ${data.reduce((acc, item) => acc + item.Total_Sales, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <div className="card">
        <h3 className="text-2xl font-semibold mb-4 text-medium-blue text-center">Top 10 por Demanda Media Semanal</h3>
        <Bar options={chartOptions} data={createChartData(sortedByDemand, 'Demanda Media Semanal', 'Demanda_Media_Semanal')} />
      </div>
      <div className="card">
        <h3 className="text-2xl font-semibold mb-4 text-medium-blue text-center">Top 10 por Cantidad Vendida</h3>
        <Bar options={chartOptions} data={createChartData(sortedByQuantity, 'Cantidad Vendida', 'Total_Quantity_Sold')} />
      </div>
      <div className="card">
        <h3 className="text-2xl font-semibold mb-4 text-medium-blue text-center">Top 10 por Ventas Totales</h3>
        <Bar options={chartOptions} data={createChartData(sortedBySales, 'Ventas Totales', 'Total_Sales')} />
      </div>
    </div>
  )
}

export default Dashboard