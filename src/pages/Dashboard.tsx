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
import { motion } from 'framer-motion'
import { ClockIcon, TrendingUpIcon, PackageIcon, DollarSignIcon } from 'lucide-react'

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
  const userName = localStorage.getItem('userName') || 'Usuario'

  // Función para capitalizar el nombre
  const formatName = (name: string) => {
    return name.toLowerCase().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

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
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="bg-red-50 text-red-500 rounded-lg p-8 text-center m-6 shadow-lg"
      >
        {error}
      </motion.div>
    )
  }

  if (data.length === 0) {
    return <LoadingPlaceholder />
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
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Inter',
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Top 10 Productos',
        color: '#145da0',
        font: {
          size: 18,
          weight: 'bold',
          family: 'Inter'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#145da0',
        bodyColor: '#051d40',
        borderColor: '#145da0',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#051d40',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(5, 29, 64, 0.1)'
        },
        ticks: {
          color: '#051d40',
          callback: (value) => value.toLocaleString()
        }
      }
    }
  }


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-medium-blue"
      >
        <h2 className="text-2xl font-semibold text-medium-blue">
          ¡Bienvenida/o{userName !== 'ADMIN' ? `, ${formatName(userName)}` : ' al sistema'}!
        </h2>
        <p className="text-gray-600 mt-2">
          {userName === 'ADMIN' 
            ? 'Tienes acceso completo a todas las funcionalidades del sistema.'
            : 'Aquí encontrarás un resumen de los indicadores más importantes.'}
        </p>
      </motion.div>

      <motion.h1 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-4xl font-bold text-medium-blue mb-8 text-center shadow-sm bg-white py-4 rounded-lg"
      >
        Panel de Control
      </motion.h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Última Actualización"
          value="20/12/2024"
          icon={<ClockIcon className="w-6 h-6" />}
        />
        <KPICard
          title="Demanda Media Semanal"
          value={(data.reduce((acc, item) => acc + item.Demanda_Media_Semanal, 0) / data.length).toFixed(2)}
          icon={<TrendingUpIcon className="w-6 h-6" />}
        />
        <KPICard
          title="Cantidad Total Vendida"
          value={data.reduce((acc, item) => acc + item.Total_Quantity_Sold, 0).toLocaleString()}
          icon={<PackageIcon className="w-6 h-6" />}
        />
        <KPICard
          title="Ventas Totales"
          value={`$${data.reduce((acc, item) => acc + item.Total_Sales, 0).toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}`}
          icon={<DollarSignIcon className="w-6 h-6" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top 10 por Demanda Media Semanal"
          chart={
            <Bar 
              options={chartOptions} 
              data={createChartData(sortedByDemand, 'Demanda Media Semanal', 'Demanda_Media_Semanal')} 
            />
          }
        />
        <ChartCard
          title="Top 10 por Cantidad Vendida"
          chart={
            <Bar 
              options={chartOptions} 
              data={createChartData(sortedByQuantity, 'Cantidad Vendida', 'Total_Quantity_Sold')} 
            />
          }
        />
      </div>
      
      <ChartCard
        title="Top 10 por Ventas Totales"
        chart={
          <Bar 
            options={chartOptions} 
            data={createChartData(sortedBySales, 'Ventas Totales', 'Total_Sales')} 
          />
        }
        className="col-span-full"
      />
    </motion.div>
  )
}

// Componente de loading simplificado
const LoadingPlaceholder: React.FC = () => (
  <div className="space-y-6 p-6">
    {/* Placeholder para el título */}
    <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
    
    {/* Placeholders para las KPI cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
    
    {/* Placeholders para los gráficos */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
    <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
  </div>
)

// KPICard mejorado
const KPICard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({
  title,
  value,
  icon
}) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="bg-white rounded-xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-shadow"
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-blue-800">{title}</h2>
      <div className="text-blue-600">
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-800 truncate">{value}</p>
  </motion.div>
)

// ChartCard mejorado
const ChartCard: React.FC<{ 
  title: string; 
  chart: React.ReactNode;
  className?: string;
}> = ({ title, chart, className }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${className}`}
  >
    <h3 className="text-2xl font-semibold mb-6 text-blue-800 text-center">{title}</h3>
    {chart}
  </motion.div>
)

export default Dashboard
