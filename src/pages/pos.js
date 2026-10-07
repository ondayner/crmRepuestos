// src/pages/pos.js
import { getProductosService, procesarVentaService } from '../services/db.js';
import { getTasaBCV, formatBs } from '../services/bcv.js';
import { showAlert, setupCartDrawerEvents, initBarcodeScanner } from '../components/ui.js';

let productosCache = [];
let productosFiltrados = [];
let carrito = [];
let tasaActual = 0;
let incluirIva = true; 

// Leer IVA configurado en ajustes (por defecto 16)
function getIvaRate() {
  const saved = localStorage.getItem('moto_crm_iva_rate');
  return saved !== null ? parseFloat(saved) : 16;
}

let currentPagePOS = 1;
const itemsPerPagePOS = 8;

export async function renderPOS(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 opacity-60">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-brand)] border-t-transparent mb-3"></div>
      <p class="text-sm">Cargando Punto de Venta...</p>
    </div>
  `;

  try {
    tasaActual = await getTasaBCV();
    productosCache = await getProductosService();
    productosFiltrados = productosCache.filter(p => p.stock > 0);
    currentPagePOS = 1;
    incluirIva = true;
    
    drawPOSUI(container);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="p-4 text-center text-red-500">Error al iniciar el POS. Verifica la conexión.</div>`;
  }
}

function drawPOSUI(container) {
  const currentIvaNum = getIvaRate();

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-20 lg:pb-0 relative">
      
      <!-- CATÁLOGO DE REPUESTOS -->
      <div class="lg:col-span-7 xl:col-span-8 space-y-4 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex justify-between items-center">
            <div>
              <p class="text-xs text-[var(--text-muted)]">Tasa BCV: <span class="font-mono font-bold text-[var(--color-brand)]">${tasaActual.toFixed(2)} Bs/$</span></p>
            </div>
            <span class="text-xs bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold px-3 py-1.5 rounded-full">
              ${productosFiltrados.length} repuestos
            </span>
          </div>

          <!-- BUSCADOR Y BOTÓN DE CÁMARA PARA ESCANEAR -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input type="text" id="posSearchInput" placeholder="Busca por nombre, descripción o escanea código..." class="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] text-xs font-medium transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-4 top-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <button id="btnPosScanCamera" title="Escanear con cámara" class="px-4 py-3 bg-[var(--color-brand)] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span class="hidden sm:inline text-xs">Escanear</span>
            </button>
          </div>

          <div id="posProductsList" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${renderPOSProductCards()}
          </div>
        </div>

        <div id="posPaginationControls" class="flex items-center justify-between bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
          ${renderPOSPaginationButtons()}
        </div>
      </div>

      <!-- PANEL DE CARRITO -->
      <div id="cartDrawer" class="fixed inset-x-0 bottom-0 z-40 transform translate-y-full lg:translate-y-0 transition-transform duration-300 ease-in-out lg:static lg:col-span-5 xl:col-span-4 bg-[var(--bg-surface)] border-t lg:border border-[var(--border-color)] rounded-t-3xl lg:rounded-2xl p-5 shadow-2xl lg:shadow-lg flex flex-col justify-between max-h-[85vh] lg:max-h-none overflow-y-auto">
        
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-3">
            <h2 class="font-extrabold text-lg text-[var(--text-main)] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Orden de Venta
            </h2>
            <div class="flex items-center gap-2">
              <button id="btnEmptyCart" class="text-xs text-red-500 hover:underline font-semibold ${carrito.length === 0 ? 'hidden' : ''}">Limpiar</button>
              <button id="btnCloseCartMobile" class="lg:hidden text-[var(--text-muted)] hover:text-red-500 p-1 text-xl font-bold">&times;</button>
            </div>
          </div>

          <div id="cartItemsContainer" class="space-y-2 overflow-y-auto max-h-[160px] lg:max-h-[200px] pr-1">
            ${renderCartItems()}
          </div>
        </div>

        <div class="space-y-3 pt-3 border-t border-[var(--border-color)]">
          <!-- Switch de IVA dinámico -->
          <div class="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2.5 rounded-xl">
            <label for="ivaToggle" class="text-xs font-bold text-[var(--text-main)] cursor-pointer flex items-center gap-2">
              <span>Aplica IVA (${currentIvaNum}%)</span>
            </label>
            <input type="checkbox" id="ivaToggle" ${incluirIva ? 'checked' : ''} class="w-4 h-4 text-[var(--color-brand)] rounded focus:ring-0 cursor-pointer accent-[var(--color-brand)]">
          </div>

          <div class="space-y-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Datos del Cliente (Opcional)</span>
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="clientName" placeholder="Nombre / Razón Social" class="px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] focus:outline-none focus:border-[var(--color-brand)]">
              <input type="text" id="clientDoc" placeholder="Cédula / RIF" class="px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-brand)]">
            </div>
          </div>

          <div class="bg-black/5 dark:bg-white/5 p-3 rounded-xl space-y-1 text-xs">
            <div class="flex justify-between text-[var(--text-muted)] font-mono">
              <span>Subtotal:</span>
              <span id="subtotalUSD">$0.00</span>
            </div>
            <div class="flex justify-between text-[var(--text-muted)] font-mono">
              <span id="ivaLabelText">IVA (${currentIvaNum}%):</span>
              <span id="ivaUSD">$0.00</span>
            </div>
            <div class="flex justify-between items-center text-sm pt-1 border-t border-[var(--border-color)]">
              <span class="text-[var(--text-main)] font-bold">Total Dólares:</span>
              <span id="totalUSD" class="text-lg font-black text-[var(--color-brand)] font-mono">$0.00</span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-[var(--text-muted)]">Total Bolívares:</span>
              <span id="totalBS" class="font-bold text-[var(--text-main)] font-mono">Bs. 0,00</span>
            </div>
          </div>

          <div id="posAlert" class="hidden"></div>

          <button id="btnProcessSale" disabled class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>Procesar Venta y Descontar</span>
          </button>
        </div>

      </div>

    </div>

    <div id="mobileCartTrigger" class="lg:hidden fixed bottom-16 left-4 right-4 z-30 bg-[var(--color-brand)] text-white p-3.5 rounded-2xl shadow-2xl flex justify-between items-center cursor-pointer active:scale-95 transition-all">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        <span class="font-bold text-sm" id="mobileCartBadge">Ver Orden (0)</span>
      </div>
      <span class="font-mono font-black text-base" id="mobileCartTotal">$0.00</span>
    </div>
  `;

  setupPOSEvents(container);
  updateCartTotals();
}

function renderPOSProductCards() {
  if (productosFiltrados.length === 0) {
    return `<div class="col-span-full py-8 text-center text-xs text-[var(--text-muted)]">No hay repuestos con stock disponible.</div>`;
  }

  const startIndex = (currentPagePOS - 1) * itemsPerPagePOS;
  const endIndex = startIndex + itemsPerPagePOS;
  const pageItems = productosFiltrados.slice(startIndex, endIndex);

  return pageItems.map(item => {
    const imgPlaceholder = 'https://placehold.co/100x100/1e293b/ffffff?text=Moto';
    return `
      <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-[var(--color-brand)] transition-colors">
        <div class="flex items-center gap-3 overflow-hidden">
          <img src="${item.imagen_url || imgPlaceholder}" class="w-12 h-12 rounded-lg object-cover shrink-0" onerror="this.src='${imgPlaceholder}'">
          <div class="truncate">
            <h4 class="font-bold text-sm text-[var(--text-main)] truncate">${item.nombre}</h4>
            <p class="text-xs font-mono text-[var(--color-brand)] font-bold">$${Number(item.precio_usd).toFixed(2)}</p>
            <span class="text-[10px] text-emerald-500 font-bold">${item.stock} en stock</span>
          </div>
        </div>
        <button data-add-to-cart="${item.id}" class="py-2 px-3 bg-[var(--color-brand)] hover:opacity-90 text-white text-xs font-bold rounded-lg transition-all shrink-0 active:scale-95">
          + Agregar
        </button>
      </div>
    `;
  }).join('');
}

function renderPOSPaginationButtons() {
  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPagePOS) || 1;

  return `
    <button id="btnPrevPagePOS" ${currentPagePOS === 1 ? 'disabled' : ''} class="py-1.5 px-3 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--color-brand)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
      &larr; Anterior
    </button>
    
    <span class="text-xs font-bold text-[var(--text-muted)] font-mono">
      Pág. ${currentPagePOS} de ${totalPages}
    </span>

    <button id="btnNextPagePOS" ${currentPagePOS >= totalPages ? 'disabled' : ''} class="py-1.5 px-3 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--color-brand)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
      Siguiente &rarr;
    </button>
  `;
}

function updatePOSGridAndPagination() {
  document.getElementById('posProductsList').innerHTML = renderPOSProductCards();
  document.getElementById('posPaginationControls').innerHTML = renderPOSPaginationButtons();
  setupPOSPaginationEvents();
}

function setupPOSPaginationEvents() {
  const prevBtn = document.getElementById('btnPrevPagePOS');
  const nextBtn = document.getElementById('btnNextPagePOS');

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentPagePOS > 1) {
        currentPagePOS--;
        updatePOSGridAndPagination();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const totalPages = Math.ceil(productosFiltrados.length / itemsPerPagePOS);
      if (currentPagePOS < totalPages) {
        currentPagePOS++;
        updatePOSGridAndPagination();
      }
    };
  }
}

function renderCartItems() {
  if (carrito.length === 0) {
    return `
      <div class="py-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
        El carrito está vacío.
      </div>
    `;
  }

  return carrito.map(item => `
    <div class="flex items-center justify-between p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-xs gap-2">
      <div class="truncate flex-1">
        <h5 class="font-bold text-[var(--text-main)] truncate">${item.nombre}</h5>
        <p class="text-[10px] text-[var(--text-muted)] font-mono">$${item.precio_usd.toFixed(2)} c/u</p>
      </div>

      <div class="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-1">
        <button data-cart-minus="${item.id}" class="w-5 h-5 flex items-center justify-center font-bold text-[var(--text-main)] hover:bg-black/10 rounded">-</button>
        <span class="w-6 text-center font-mono font-bold">${item.cantidad}</span>
        <button data-cart-plus="${item.id}" class="w-5 h-5 flex items-center justify-center font-bold text-[var(--text-main)] hover:bg-black/10 rounded">+</button>
      </div>

      <span class="font-mono font-bold text-[var(--color-brand)] w-14 text-right">$${(item.precio_usd * item.cantidad).toFixed(2)}</span>

      <button data-cart-remove="${item.id}" class="text-red-500 hover:text-red-700 p-1">&times;</button>
    </div>
  `).join('');
}

function agregarProductoAlCarrito(producto) {
  if (!producto || producto.stock <= 0) {
    showAlert('El producto no tiene stock disponible.', 'warning', 'posAlert');
    return;
  }

  const existing = carrito.find(item => item.id == producto.id);
  if (existing) {
    if (existing.cantidad < producto.stock) {
      existing.cantidad++;
    } else {
      showAlert(`Límite alcanzado (${producto.stock} en stock)`, 'warning', 'posAlert');
      return;
    }
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio_usd: Number(producto.precio_usd),
      cantidad: 1,
      stock_actual: producto.stock
    });
  }
  document.getElementById('cartItemsContainer').innerHTML = renderCartItems();
  updateCartTotals();
  showAlert(`Agregado: ${producto.nombre}`, 'success', 'posAlert');
}

function procesarBusquedaOEscaneo(termino) {
  const term = termino.toLowerCase().trim();
  if (!term) return;

  // 1. Buscar coincidencia exacta por código de barras o ID
  const matchExacto = productosCache.find(p => 
    p.stock > 0 && ((p.codigo_barras && p.codigo_barras.toLowerCase() === term) || p.id == term)
  );

  if (matchExacto) {
    agregarProductoAlCarrito(matchExacto);
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) searchInput.value = '';
    productosFiltrados = productosCache.filter(p => p.stock > 0);
    currentPagePOS = 1;
    updatePOSGridAndPagination();
  } else {
    // 2. Si no es exacto, filtrar por nombre/descripción en tiempo real
    productosFiltrados = productosCache.filter(p => 
      p.stock > 0 && (p.nombre.toLowerCase().includes(term) || (p.descripcion && p.descripcion.toLowerCase().includes(term)))
    );
    currentPagePOS = 1;
    updatePOSGridAndPagination();
  }
}

function updateCartTotals() {
  const rateNum = getIvaRate();
  const subtotalUSD = carrito.reduce((sum, item) => sum + (item.precio_usd * item.cantidad), 0);
  const ivaUSD = incluirIva ? (subtotalUSD * (rateNum / 100)) : 0;
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBS = totalUSD * tasaActual;
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const subtotalUSDEl = document.getElementById('subtotalUSD');
  const ivaUSDEl = document.getElementById('ivaUSD');
  const ivaLabelText = document.getElementById('ivaLabelText');
  const totalUSDEl = document.getElementById('totalUSD');
  const totalBSEl = document.getElementById('totalBS');
  const btnProcess = document.getElementById('btnProcessSale');
  const btnEmpty = document.getElementById('btnEmptyCart');
  
  const mobileCartBadge = document.getElementById('mobileCartBadge');
  const mobileCartTotal = document.getElementById('mobileCartTotal');

  if (subtotalUSDEl) subtotalUSDEl.textContent = `$${subtotalUSD.toFixed(2)}`;
  if (ivaLabelText) ivaLabelText.textContent = `IVA (${rateNum}%):`;
  if (ivaUSDEl) ivaUSDEl.textContent = `$${ivaUSD.toFixed(2)}`;
  if (totalUSDEl) totalUSDEl.textContent = `$${totalUSD.toFixed(2)}`;
  if (totalBSEl) totalBSEl.textContent = formatBs(totalUSD, tasaActual);
  
  if (mobileCartBadge) mobileCartBadge.textContent = `Ver Orden (${totalItems})`;
  if (mobileCartTotal) mobileCartTotal.textContent = `$${totalUSD.toFixed(2)}`;

  if (btnProcess) btnProcess.disabled = carrito.length === 0;
  if (btnEmpty) btnEmpty.classList.toggle('hidden', carrito.length === 0);
}

function setupPOSEvents(container) {
  const cartDrawerControl = setupCartDrawerEvents();

  const ivaToggle = document.getElementById('ivaToggle');
  if (ivaToggle) {
    ivaToggle.addEventListener('change', (e) => {
      incluirIva = e.target.checked;
      updateCartTotals();
    });
  }

  const searchInput = document.getElementById('posSearchInput');
  
  // Soporte para entrada manual y pistolas físicas de códigos de barras (Enter)
  searchInput.addEventListener('input', (e) => {
    procesarBusquedaOEscaneo(e.target.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      procesarBusquedaOEscaneo(searchInput.value);
    }
  });

  // Botón para activar el escáner de cámara
  document.getElementById('btnPosScanCamera').onclick = () => {
    initBarcodeScanner((scannedCode) => {
      procesarBusquedaOEscaneo(scannedCode);
    });
  };

  setupPOSPaginationEvents();

  container.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      const id = addBtn.getAttribute('data-add-to-cart');
      const producto = productosCache.find(p => p.id == id);
      if (producto) agregarProductoAlCarrito(producto);
    }

    const plusBtn = e.target.closest('[data-cart-plus]');
    if (plusBtn) {
      const id = plusBtn.getAttribute('data-cart-plus');
      const item = carrito.find(i => i.id == id);
      if (item) {
        if (item.cantidad < item.stock_actual) {
          item.cantidad++;
          document.getElementById('cartItemsContainer').innerHTML = renderCartItems();
          updateCartTotals();
        } else {
          showAlert(`Solo hay ${item.stock_actual} disponibles`, 'warning', 'posAlert');
        }
      }
    }

    const minusBtn = e.target.closest('[data-cart-minus]');
    if (minusBtn) {
      const id = minusBtn.getAttribute('data-cart-minus');
      const item = carrito.find(i => i.id == id);
      if (item) {
        item.cantidad--;
        if (item.cantidad <= 0) {
          carrito = carrito.filter(i => i.id != id);
        }
        document.getElementById('cartItemsContainer').innerHTML = renderCartItems();
        updateCartTotals();
      }
    }

    const removeBtn = e.target.closest('[data-cart-remove]');
    if (removeBtn) {
      const id = removeBtn.getAttribute('data-cart-remove');
      carrito = carrito.filter(i => i.id != id);
      document.getElementById('cartItemsContainer').innerHTML = renderCartItems();
      updateCartTotals();
    }
  });

  document.getElementById('btnEmptyCart').onclick = () => {
    carrito = [];
    document.getElementById('cartItemsContainer').innerHTML = renderCartItems();
    updateCartTotals();
  };

  document.getElementById('btnProcessSale').onclick = async () => {
    if (carrito.length === 0) return;

    const session = JSON.parse(localStorage.getItem('moto_crm_session') || '{}');
    const rateNum = getIvaRate();
    const subtotalUSD = carrito.reduce((sum, item) => sum + (item.precio_usd * item.cantidad), 0);
    const ivaUSD = incluirIva ? (subtotalUSD * (rateNum / 100)) : 0;
    const totalUSD = subtotalUSD + ivaUSD;
    const totalBS = totalUSD * tasaActual;
    const clientName = document.getElementById('clientName').value.trim();
    const clientDoc = document.getElementById('clientDoc').value.trim();

    const btnProcess = document.getElementById('btnProcessSale');
    btnProcess.disabled = true;
    btnProcess.textContent = 'Procesando Venta...';

    try {
      const ventaData = {
        cliente_nombre: clientName || 'Cliente Contado',
        cliente_cedula: clientDoc || 'V-00000000',
        total_usd: totalUSD,
        total_bs: totalBS,
        tasa_bcv: tasaActual,
        vendedor_id: session.id || null
      };

      await procesarVentaService(ventaData, carrito);

      showAlert('¡Venta registrada con éxito! Stock descontado.', 'success', 'posAlert');

      carrito = [];
      document.getElementById('clientName').value = '';
      document.getElementById('clientDoc').value = '';
      document.getElementById('cartItemsContainer').innerHTML = renderCartItems();
      updateCartTotals();

      cartDrawerControl.close();

      productosCache = await getProductosService();
      productosFiltrados = productosCache.filter(p => p.stock > 0);
      currentPagePOS = 1;
      updatePOSGridAndPagination();

    } catch (err) {
      console.error(err);
      showAlert('Error al procesar la venta.', 'error', 'posAlert');
    } finally {
      btnProcess.disabled = false;
      btnProcess.textContent = 'Procesar Venta y Descontar';
    }
  };
}