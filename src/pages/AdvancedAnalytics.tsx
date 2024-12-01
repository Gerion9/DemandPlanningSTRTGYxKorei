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
import zoomPlugin from 'chartjs-plugin-zoom';
import { useParams, useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
)

const AdvancedAnalytics: React.FC = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Product[]>([])
  const [selectedSKU, setSelectedSKU] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chartRef = useRef<any>(null)
  const [isFullScreen, setIsFullScreen] = useState(false);

  const calculateTotalSales = (weeklySalesString: string): number => {
    try {
      const salesData = JSON.parse(weeklySalesString);
      return salesData.reduce((total: number, item: { CANTIDAD: number }) => total + item.CANTIDAD, 0);
    } catch (error) {
      console.error('Error calculating total sales:', error);
      return 0;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<Product[]>('https://sb1-xzau5n.onrender.com/api/data')
      setData(response.data)
      
      if (sku) {
        const skuExists = response.data.some(product => product.SKU === sku)
        if (skuExists) {
          setSelectedSKU(sku)
        } else {
          const defaultSKU = response.data[0]?.SKU
          if (defaultSKU) {
            navigate(`/analiticas/${defaultSKU}`, { replace: true })
            setSelectedSKU(defaultSKU)
          }
        }
      } else if (response.data.length > 0) {
        const defaultSKU = response.data[0].SKU
        navigate(`/analiticas/${defaultSKU}`, { replace: true })
        setSelectedSKU(defaultSKU)
      }
    } catch (error) {
      console.error('Error al obtener datos:', error)
      setError('No se pudieron obtener los datos. Por favor, inténtelo de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (data.length > 0 && sku) {
      const skuExists = data.some(product => product.SKU === sku)
      if (skuExists) {
        setSelectedSKU(sku)
      }
      setLoading(false)
    }
  }, [sku, data])

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

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 20
          }
        },
        title: {
          display: true,
          text: `Ventas Históricas vs Pronóstico - SKU: ${selectedProduct.SKU}`,
          font: {
            size: 18,
            weight: 'bold'
          },
          padding: 20
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#334155',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          bodySpacing: 8,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            title: (tooltipItems: any) => {
              return `Fecha: ${tooltipItems[0].label}`;
            },
            label: (context: any) => {
              let label = context.dataset.label || '';
              let value = context.parsed.y;
              
              if (label === 'Ventas Históricas' && value !== null) {
                return `📊 ${label}: ${value.toFixed(2)} unidades`;
              }
              if (label === 'Pronóstico' && value !== null) {
                return `🎯 ${label}: ${value.toFixed(2)} unidades`;
              }
              if (label === 'Stock de Seguridad') {
                return `🛡️ ${label}: ${value.toFixed(2)} unidades`;
              }
              if (label === 'Punto de Reorden') {
                return `⚡ ${label}: ${value.toFixed(2)} unidades`;
              }
              if (label === 'Stock Máximo') {
                return `📦 ${label}: ${value.toFixed(2)} unidades`;
              }
              return null;
            }
          }
        },
        zoom: {
          limits: {
            y: {
              min: 0,
              max: selectedProduct.Stock_Maximo * 1.2,
            }
          },
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
            drag: {
              enabled: true,
              backgroundColor: 'rgba(75, 192, 192, 0.3)',
              borderColor: 'rgba(75, 192, 192, 0.8)',
              borderWidth: 1,
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Fecha',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            },
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          title: {
            display: true,
            text: 'Cantidad',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            }
          },
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      hover: {
        mode: 'index',
        intersect: false
      }
    } as ChartOptions<'line'>

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

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleSkuChange = (newSku: string) => {
    navigate(`/analiticas/${newSku}`)
    setSelectedSKU(newSku)
  }

  const sortedProducts = useMemo(() => {
    return [...data]
      .filter(product => {
        const totalSales = calculateTotalSales(product.Weekly_Sales);
        return totalSales > 1;
      })
      .sort((a, b) => {
        const totalSalesA = calculateTotalSales(a.Weekly_Sales);
        const totalSalesB = calculateTotalSales(b.Weekly_Sales);
        return totalSalesB - totalSalesA;
      });
  }, [data]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 card">Cargando...</div>
  }

  if (error) {
    return <div className="text-red-500 card">{error}</div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-medium-blue mb-8 text-center shadow-sm bg-white py-4 rounded-lg">Analíticas Avanzadas</h1>
      
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4 text-medium-blue flex items-center">
          <span className="mr-2">🏷️</span>
          Seleccionar Producto (SKU)
        </h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <select
            className="select flex-grow w-full sm:w-auto text-lg font-medium"
            value={selectedSKU}
            onChange={(e) => handleSkuChange(e.target.value)}
          >
            {sortedProducts.map(product => {
              const totalSales = calculateTotalSales(product.Weekly_Sales);
              return (
                <option key={product.SKU} value={product.SKU}>
                  {`${product.SKU} (Ventas totales: ${totalSales.toFixed(0)})`}
                </option>
              );
            })}
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
      </div>

      {selectedProduct && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">
                📈 Tipo de Demanda
              </h2>
              <p className="text-lg break-words">{selectedProduct.Categoria_No_Seleccionados}</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">
                🎯 Método de Pronóstico
              </h2>
              <p className="text-lg break-words">{selectedProduct.Metodo}</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">
                📊 Coeficiente de Variación
              </h2>
              <p className="text-lg">
                {selectedProduct.CV.toFixed(2)}
                <span className="text-sm text-gray-500 ml-2">(CV)</span>
              </p>
            </div>
          </div>



          {chartData && chartOptions && (
            <div className={`card transition-all duration-300 ${
              isFullScreen ? 'fixed inset-0 z-50 bg-white m-0 rounded-none overflow-y-auto p-4' : ''
            }`}>
              {isFullScreen && (
                <button
                  onClick={toggleFullScreen}
                  className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  aria-label="Cerrar vista completa"
                >
                  <svg 
                    className="w-6 h-6 text-gray-600" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}


              <div className={`relative ${isFullScreen ? 'h-[calc(100vh-300px)]' : 'h-[600px]'}`}>
                <Line 
                  ref={chartRef} 
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        ...chartOptions.plugins?.legend,
                        position: 'top',
                      }
                    },
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        ...chartOptions.scales?.x,
                        ticks: {
                          ...chartOptions.scales?.x?.ticks,
                          maxRotation: 45,
                          minRotation: 45,
                        }
                      }
                    }
                  }} 
                  data={chartData} 
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 sticky bottom-4">
                <button 
                  className="btn btn-secondary flex items-center gap-2"
                  onClick={toggleFullScreen}
                >
                  {isFullScreen ? (
                    <>
                      <span>🔽</span>
                      Minimizar Gráfica
                    </>
                  ) : (
                    <>
                      <span>🔼</span>
                      Expandir Gráfica
                    </>
                  )}
                </button>
                <button 
                  className="btn btn-secondary flex items-center gap-2"
                  onClick={resetZoom}
                >
                  <span>↩️</span>
                  Restablecer Vista
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">
                🛡️ Stock de Seguridad
              </h2>
              <p className="text-lg">
                {selectedProduct.Stock_Seguridad.toFixed(2)}
                <span className="text-sm text-gray-500 ml-2">unidades</span>
              </p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">
                ⚡ Punto de Reorden
              </h2>
              <p className="text-lg">
                {selectedProduct.Punto_Reorden.toFixed(2)}
                <span className="text-sm text-gray-500 ml-2">unidades</span>
              </p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2 text-medium-blue">
                📦 Stock Máximo
              </h2>
              <p className="text-lg">
                {selectedProduct.Stock_Maximo.toFixed(2)}
                <span className="text-sm text-gray-500 ml-2">unidades</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdvancedAnalytics
