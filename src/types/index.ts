export interface Product {
  SKU: string;
  DESCRIPCION: string;
  Categoria: string;
  GRUPO: string;
  FABRICANTE: string;
  Demanda_Media_Semanal: number;
  Total_Quantity_Sold: number;
  Total_Sales: number;
  Stock_Seguridad: number;
  Punto_Reorden: number;
  Stock_Maximo: number;
  CV: number;
  Fechas_Pronostico: string;
  Pronostico: string;
  Weekly_Sales: string;
  Categoria_No_Seleccionados?: string;
  Metodo?: string;
  [key: string]: string | number | undefined;
}