// src/services/db.js
import { supabase } from '../../config/supabase.js';

export async function getProductosService() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createProductoService(producto) {
  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre: producto.nombre,
      precio_usd: producto.precio_usd,
      stock: producto.stock,
      descripcion: producto.descripcion || null,
      imagen_url: producto.imagen_url || null
    }])
    .select();

  if (error) throw error;
  return data;
}

export async function updateProductoService(id, producto) {
  const { data, error } = await supabase
    .from('productos')
    .update({
      nombre: producto.nombre,
      precio_usd: producto.precio_usd,
      stock: producto.stock,
      descripcion: producto.descripcion || null,
      imagen_url: producto.imagen_url || null
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

export async function addStockService(id, currentStock, quantityToAdd) {
  const newStock = Number(currentStock) + Number(quantityToAdd);
  const { data, error } = await supabase
    .from('productos')
    .update({ stock: newStock })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteProductoService(id) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// --- SERVICIOS DE PUNTO DE VENTA (POS) Y VENTAS ---

export async function procesarVentaService(ventaData, items) {
  // 1. Insertar la factura principal con el total calculado (incluyendo IVA)
  const { data: factura, error: errorFactura } = await supabase
    .from('facturas')
    .insert([{
      cliente_nombre: ventaData.cliente_nombre || 'Cliente Contado',
      cliente_cedula: ventaData.cliente_cedula || 'V-00000000',
      total_usd: ventaData.total_usd,
      total_bs: ventaData.total_bs,
      tasa_bcv: ventaData.tasa_bcv,
      vendedor_id: ventaData.vendedor_id || null
    }])
    .select()
    .single();

  if (errorFactura) {
    console.error('Error insertando factura:', errorFactura);
    throw errorFactura;
  }

  // 2. Insertar en 'detalles_factura'
  const detalles = items.map(item => ({
    factura_id: factura.id,
    producto_id: item.id,
    cantidad: item.cantidad
  }));

  const { error: errorDetalles } = await supabase
    .from('detalles_factura')
    .insert(detalles);

  if (errorDetalles) {
    console.error('Error insertando detalles_factura:', errorDetalles);
    throw errorDetalles;
  }

  // 3. Descontar el stock en la tabla 'productos'
  for (const item of items) {
    const nuevoStock = item.stock_actual - item.cantidad;
    const { error: errorStock } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', item.id);

    if (errorStock) {
      console.error(`Error descontando stock del producto ${item.id}:`, errorStock);
    }
  }

  return factura;
}

export async function getFacturasService() {
  const { data, error } = await supabase
    .from('facturas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo facturas:', error);
    throw error;
  }
  return data || [];
}

export async function getDetallesFacturaService(facturaId) {
  const { data, error } = await supabase
    .from('detalles_factura')
    .select(`
      id,
      cantidad,
      producto_id,
      productos (
        nombre,
        precio_usd
      )
    `)
    .eq('factura_id', facturaId);

  if (error) {
    console.error('Error obteniendo detalles de factura:', error);
    throw error;
  }
  return data || [];
}