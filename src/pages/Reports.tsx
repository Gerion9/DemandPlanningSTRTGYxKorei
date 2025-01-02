import * as React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import { utils, writeFile } from 'xlsx-js-style';

interface Product {
  SKU: string;
  Stock_Seguridad: number;
  Punto_Reorden: number;
  Stock_Maximo: number;
  Pronostico: string;
  Fechas_Pronostico: string;
  Last_Sale_Date: string;
}

const Reports: React.FC = () => {
  const [data, setData] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await axios.get<Product[]>('https://sb1-xzau5n.onrender.com/api/data');
        setData(response.data);
      } catch (error) {
        console.error('Error al obtener datos:', error);
        setError('No se pudieron obtener los datos. Por favor, inténtelo de nuevo más tarde.');
      }
    };

    fetchData();
  }, []);

  const formatInventoryData = (data: Product[]) => {
    return data.map(item => ({
      SKU: item.SKU,
      'Stock de Seguridad': Math.round(Number(item.Stock_Seguridad || 0)),
      'Punto de Reorden': Math.round(Number(item.Punto_Reorden || 0)),
      'Stock Máximo': Math.round(Number(item.Stock_Maximo || 0))
    }));
  };

  const parsePronostico = (pronosticoString: string): number[] => {
    const matches = pronosticoString?.match(/\d+(\.\d+)?/g) || [];
    return matches.map(num => Math.round(Number(num)));
  };

  const formatForecastData = (data: Product[]) => {
    const monthRow: { [key: string]: string } = {
      SKU: ''
    };
    
    // Obtener y limpiar las fechas de predicción del primer producto
    const firstProduct = data[0];
    const forecastDatesStr = firstProduct.Fechas_Pronostico;
    let forecastDates = forecastDatesStr
      .replace(/DatetimeIndex\(\['/g, '')
      .replace(/\s+/g, '')
      .split("','")
      .map(d => d.trim())
      .filter(d => d);

    if (forecastDates.length > 0) {
      const lastIndex = forecastDates.length - 1;
      forecastDates[lastIndex] = forecastDates[lastIndex].replace(/'\].*$/, '');
    }

    // Crear el encabezado de meses
    let lastMonthTitle = '';
    forecastDates.forEach((date, index) => {
      const dateObj = new Date(date);
      const month = dateObj.toLocaleString('es-ES', { month: 'long' });
      const nextWeekDate = new Date(dateObj);
      nextWeekDate.setDate(nextWeekDate.getDate() + 6);
      const nextMonth = nextWeekDate.toLocaleString('es-ES', { month: 'long' });
      
      const monthTitle = month === nextMonth 
        ? month.charAt(0).toUpperCase() + month.slice(1)
        : `${month.charAt(0).toUpperCase() + month.slice(1)}→${nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1)}`;
      
      if (month !== nextMonth) {
        lastMonthTitle = monthTitle;
        monthRow[date] = monthTitle;
      } else {
        if (index > 0) {
          const prevDate = forecastDates[index - 1];
          const prevDateObj = new Date(prevDate);
          const prevMonth = prevDateObj.toLocaleString('es-ES', { month: 'long' });
          
          if (prevMonth !== month) {
            monthRow[date] = monthTitle;
            lastMonthTitle = monthTitle;
          } else {
            monthRow[date] = lastMonthTitle;
          }
        } else {
          monthRow[date] = monthTitle;
          lastMonthTitle = monthTitle;
        }
      }
    });

    // Crear los datos de productos
    const result = data.map(item => {
      const forecastValues = parsePronostico(item.Pronostico);
      
      const baseRow: { [key: string]: string | number } = {
        SKU: item.SKU,
      };

      forecastDates.forEach((date, index) => {
        baseRow[date] = Math.round(Number(forecastValues[index]));
      });

      return baseRow;
    });

    return { monthRow, result, forecastDates };
  };

  const formatMonthlyForecastData = (data: Product[]) => {
    // Get the weekly forecast data first
    const { result, forecastDates } = formatForecastData(data);
    
    // Create a map to store monthly totals and week counts for each SKU
    const monthlyTotals: { [key: string]: { [key: string]: { total: number, weeks: number } } } = {};
    
    // Process each product's weekly forecasts
    result.forEach(product => {
      const sku = product.SKU as string;
      monthlyTotals[sku] = {};
      
      // Group forecasts by month
      forecastDates.forEach((date, index) => {
        const dateObj = new Date(date);
        const monthKey = dateObj.toLocaleString('es-ES', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        const monthCapitalized = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
        
        if (!monthlyTotals[sku][monthCapitalized]) {
          monthlyTotals[sku][monthCapitalized] = { total: 0, weeks: 0 };
        }
        
        monthlyTotals[sku][monthCapitalized].total += Number(product[date] || 0);
        monthlyTotals[sku][monthCapitalized].weeks += 1;
      });
    });
    
    // Filter out months with less than 4 weeks of data
    const validMonths = new Set<string>();
    Object.values(monthlyTotals).forEach(skuData => {
      Object.entries(skuData).forEach(([month, data]) => {
        if (data.weeks >= 4) {
          validMonths.add(month);
        }
      });
    });

    const months = Array.from(validMonths).sort((a, b) => {
      const dateA = new Date(a.split(' ')[1] + ' ' + a.split(' ')[0]);
      const dateB = new Date(b.split(' ')[1] + ' ' + b.split(' ')[0]);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Convert to array format for Excel, only including complete months
    const monthlyData = Object.entries(monthlyTotals).map(([sku, monthData]) => {
      const row: { [key: string]: string | number } = { SKU: sku };
      months.forEach(month => {
        const monthData = monthlyTotals[sku][month];
        row[month] = monthData?.weeks >= 4 ? Math.round(monthData.total) : '';
      });
      return row;
    });
    
    return { monthlyData, months };
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!data.length) {
        throw new Error('No hay datos disponibles para exportar');
      }

      const workbook = utils.book_new();
      
      // Estilos mejorados
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", sz: 12 },
        fill: { fgColor: { rgb: "2B5BA1" } }, // Azul corporativo más profesional
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "FFFFFF" } },
          bottom: { style: "medium", color: { rgb: "FFFFFF" } },
          left: { style: "medium", color: { rgb: "FFFFFF" } },
          right: { style: "medium", color: { rgb: "FFFFFF" } }
        }
      };

      const dataStyle = {
        font: { name: "Calibri", sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D3D3D3" } },
          bottom: { style: "thin", color: { rgb: "D3D3D3" } },
          left: { style: "thin", color: { rgb: "D3D3D3" } },
          right: { style: "thin", color: { rgb: "D3D3D3" } }
        },
        fill: { fgColor: { rgb: "FFFFFF" } }
      };

      const numberStyle = {
        ...dataStyle,
        numFmt: "#,##0",
        font: { name: "Calibri", sz: 11, color: { rgb: "000000" } }
      };

      // Estilos para filas alternadas
      const alternateRowStyle = {
        ...dataStyle,
        fill: { fgColor: { rgb: "F5F5F5" } }
      };

      const alternateNumberStyle = {
        ...numberStyle,
        fill: { fgColor: { rgb: "F5F5F5" } }
      };

      // Primera hoja: Niveles de Inventario
      const inventorySheet = formatInventoryData(data);
      const inventoryWS = utils.json_to_sheet(inventorySheet);
      
      // Aplicar estilos mejorados a la hoja de inventario
      const inventoryRange = utils.decode_range(inventoryWS['!ref'] || 'A1');
      
      for (let C = 0; C <= inventoryRange.e.c; C++) {
        const headerCell = utils.encode_cell({ r: 0, c: C });
        inventoryWS[headerCell].s = headerStyle;

        for (let R = 1; R <= inventoryRange.e.r; R++) {
          const cell = utils.encode_cell({ r: R, c: C });
          const isAlternateRow = R % 2 === 0;
          
          if (C === 0) {
            inventoryWS[cell].s = isAlternateRow ? alternateRowStyle : dataStyle;
          } else {
            inventoryWS[cell].s = isAlternateRow ? alternateNumberStyle : numberStyle;
          }
        }
      }
      
      // Configurar anchos de columna para la hoja de inventario
      inventoryWS['!cols'] = [
        { wch: 18 }, // SKU
        { wch: 25 }, // Stock Mínimo
        { wch: 25 }, // Punto de Reorden
        { wch: 25 }, // Stock Máximo
      ];

      // Configurar altura de filas
      inventoryWS['!rows'] = [{ hpt: 25 }]; // Altura del encabezado
      
      // Agregar filtros
      inventoryWS['!autofilter'] = { ref: inventoryWS['!ref'] || 'A1' };
      
      utils.book_append_sheet(workbook, inventoryWS, "Niveles de Inventario");
      
      // Segunda hoja: Pronósticos Semanales
      const { monthRow, result, forecastDates } = formatForecastData(data);
      const forecastWS = utils.json_to_sheet([monthRow, ...result]);
      
      // Aplicar estilos mejorados a la hoja de pronósticos
      const forecastRange = utils.decode_range(forecastWS['!ref'] || 'A1');
      
      // Estilos para los encabezados de mes
      const monthHeaderStyle = {
        ...headerStyle,
        fill: { fgColor: { rgb: "1F4E79" } }, // Azul más oscuro para meses
        font: { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", sz: 12 }
      };

      // Determinar las columnas que contienen transiciones de mes
      const transitionColumns = new Set();
      Object.entries(monthRow).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes('→')) {
          transitionColumns.add(key);
        }
      });

      let currentColorBlock = true;

      // Aplicar estilos a la hoja de pronósticos
      for (let C = 0; C <= forecastRange.e.c; C++) {
        const headerCell = utils.encode_cell({ r: 0, c: C });
        forecastWS[headerCell].s = monthHeaderStyle;

        const monthCell = utils.encode_cell({ r: 1, c: C });
        const currentDate = forecastDates[C - 1];

        if (C === 0) {
          // Estilo para la columna SKU
          forecastWS[monthCell].s = {
            ...dataStyle,
            fill: { fgColor: { rgb: "DCE6F1" } },
            font: { bold: true, color: { rgb: "1F4E79" }, name: "Calibri", sz: 11 }
          };
        } else {
          // Cambiar el bloque de color cuando encontramos una transición
          if (transitionColumns.has(currentDate)) {
            currentColorBlock = !currentColorBlock;
          }

          forecastWS[monthCell].s = {
            ...dataStyle,
            fill: { fgColor: { rgb: currentColorBlock ? "DCE6F1" : "B8CCE4" } },
            font: { bold: true, color: { rgb: "1F4E79" }, name: "Calibri", sz: 11 }
          };

          // Aplicar estilos a las celdas de datos con alternancia de filas
          for (let R = 2; R <= forecastRange.e.r; R++) {
            const cell = utils.encode_cell({ r: R, c: C });
            const isAlternateRow = R % 2 === 0;
            
            forecastWS[cell].s = {
              ...numberStyle,
              fill: { 
                fgColor: { 
                  rgb: currentColorBlock 
                    ? (isAlternateRow ? "F8FAFC" : "FFFFFF") // Colores para bloques pares
                    : (isAlternateRow ? "EDF2F7" : "F4F7FA")  // Colores para bloques impares
                } 
              },
              border: {
                top: { style: "thin", color: { rgb: "D3D3D3" } },
                bottom: { style: "thin", color: { rgb: "D3D3D3" } },
                left: { style: "thin", color: { rgb: "D3D3D3" } },
                right: { style: "thin", color: { rgb: "D3D3D3" } }
              }
            };
          }
        }
      }
      
      // Configurar anchos de columna para pronósticos
      forecastWS['!cols'] = [];
      for (let i = 0; i <= forecastRange.e.c; i++) {
        const cellContent = monthRow[forecastDates[i - 1]] || '';
        let width = 12;
        
        if (i === 0) {
          width = 18; // SKU
        } else if (cellContent.includes('→')) {
          width = 25; // Transición de mes
        }
        
        forecastWS['!cols'].push({ wch: width });
      }

      // Configurar altura de filas para pronósticos
      forecastWS['!rows'] = [{ hpt: 30 }]; // Altura del encabezado de mes
      
      // Agregar filtros
      forecastWS['!autofilter'] = { ref: `A1:${utils.encode_col(forecastRange.e.c)}${forecastRange.e.r + 1}` };
      
      utils.book_append_sheet(workbook, forecastWS, "Pronósticos Semanales");
      
      // Agregar congelación de paneles
      inventoryWS['!freeze'] = { xSplit: 1, ySplit: 1 };
      forecastWS['!freeze'] = { xSplit: 1, ySplit: 2 };

      // Agregar zoom predeterminado
      inventoryWS['!sheetView'] = [{ zoomScale: 85 }];
      forecastWS['!sheetView'] = [{ zoomScale: 85 }];
      
      // Third sheet: Monthly Forecasts
      const { monthlyData, months } = formatMonthlyForecastData(data);
      const monthlyWS = utils.json_to_sheet(monthlyData);
      
      // Apply styles to monthly forecast sheet
      const monthlyRange = utils.decode_range(monthlyWS['!ref'] || 'A1');
      
      // Header style for monthly sheet
      const monthlyHeaderStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", sz: 12 },
        fill: { fgColor: { rgb: "2B5BA1" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium", color: { rgb: "FFFFFF" } },
          bottom: { style: "medium", color: { rgb: "FFFFFF" } },
          left: { style: "medium", color: { rgb: "FFFFFF" } },
          right: { style: "medium", color: { rgb: "FFFFFF" } }
        }
      };

      // Data styles for monthly sheet
      const monthlyDataStyle = {
        font: { name: "Calibri", sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D3D3D3" } },
          bottom: { style: "thin", color: { rgb: "D3D3D3" } },
          left: { style: "thin", color: { rgb: "D3D3D3" } },
          right: { style: "thin", color: { rgb: "D3D3D3" } }
        }
      };

      const monthlyNumberStyle = {
        ...monthlyDataStyle,
        numFmt: "#,##0",
        font: { name: "Calibri", sz: 11 }
      };

      // Apply styles to monthly sheet
      for (let C = 0; C <= monthlyRange.e.c; C++) {
        const headerCell = utils.encode_cell({ r: 0, c: C });
        monthlyWS[headerCell].s = monthlyHeaderStyle;

        for (let R = 1; R <= monthlyRange.e.r; R++) {
          const cell = utils.encode_cell({ r: R, c: C });
          const isAlternateRow = R % 2 === 0;
          
          if (C === 0) {
            monthlyWS[cell].s = {
              ...monthlyDataStyle,
              fill: { fgColor: { rgb: isAlternateRow ? "F5F5F5" : "FFFFFF" } }
            };
          } else {
            monthlyWS[cell].s = {
              ...monthlyNumberStyle,
              fill: { fgColor: { rgb: isAlternateRow ? "F5F5F5" : "FFFFFF" } }
            };
          }
        }
      }

      // Set column widths
      monthlyWS['!cols'] = [
        { wch: 18 }, // SKU
        ...months.map(() => ({ wch: 20 })) // Month columns
      ];

      // Set row height
      monthlyWS['!rows'] = [{ hpt: 25 }]; // Header height

      // Add filters
      monthlyWS['!autofilter'] = { ref: monthlyWS['!ref'] || 'A1' };

      // Add freeze panes
      monthlyWS['!freeze'] = { xSplit: 1, ySplit: 1 };

      // Add zoom level
      monthlyWS['!sheetView'] = [{ zoomScale: 85 }];

      // Add the monthly sheet to the workbook
      utils.book_append_sheet(workbook, monthlyWS, "Pronósticos Mensuales");
      
      // Propiedades del libro
      workbook.Props = {
        Title: "Reporte de Inventario y Pronósticos",
        Subject: "Niveles de inventario y pronósticos semanales",
        Author: "Sistema de Gestión de Inventario",
        CreatedDate: new Date()
      };
      
      // Exportar archivo
      writeFile(workbook, "reporte_inventario.xlsx");
      
    } catch (error) {
      console.error('Error al exportar:', error);
      setError('Error al generar el reporte. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="bg-gradient-to-r from-medium-blue to-blue-600 rounded-t-lg">
            <h1 className="text-3xl font-bold text-white p-6 text-center">
              Panel de Informes
            </h1>
          </div>
          
          {/* Status Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${data.length ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {data.length ? `${data.length} registros disponibles` : 'Sin datos disponibles'}
              </span>
            </div>
            {isLoading && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-medium-blue border-t-transparent rounded-full"></div>
                Cargando datos...
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Report Description Card */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Contenido del Reporte
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Inventory Levels Card */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-medium-blue mb-3">1. Niveles de Inventario</h3>
                <ul className="space-y-2 text-gray-600">
                  {['SKU del producto', 'Stock Mínimo', 'Punto de Reorden', 'Stock Máximo'].map((item, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Forecasts Card */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-medium-blue mb-3">2. Pronósticos Semanales</h3>
                <ul className="space-y-2 text-gray-600">
                  {['SKU del producto', 'Pronósticos semanales organizados por mes'].map((item, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Export Button Section */}
          <div className="flex flex-col items-center pt-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <button 
              onClick={handleExport}
              disabled={isLoading || !data.length}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-lg font-semibold
                transition-all duration-200 ease-in-out
                ${isLoading || !data.length
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-medium-blue text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              <Download size={20} />
              {isLoading ? 'Generando reporte...' : 'Exportar Reporte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;