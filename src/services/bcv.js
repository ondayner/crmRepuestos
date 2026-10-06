const API_BCV_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

/**
 * Obtiene la tasa oficial del BCV.
 * @returns {Promise<number>} Tasa en Bs.
 */
export async function getTasaBCV() {
  try {
    const response = await fetch(API_BCV_URL);
    if (!response.ok) throw new Error('Error al consultar la tasa oficial');
    
    const data = await response.json();
    return data.promedio; // Retorna el valor del dólar BCV
  } catch (error) {
    console.error('Error obteniendo BCV, usando tasa de respaldo:', error);
    // Tasa de respaldo por si no hay internet o falla la API
    return 36.50; 
  }
}

/**
 * Convierte un monto en USD a VES según la tasa dada.
 * @param {number} usd 
 * @param {number} tasa 
 * @returns {string} Formateado en Bs.
 */
export function formatBs(usd, tasa) {
  const totalBs = usd * tasa;
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2
  }).format(totalBs);
}