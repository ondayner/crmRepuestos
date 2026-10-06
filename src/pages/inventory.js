// src/pages/inventory.js
import { getProductosService, createProductoService, updateProductoService, deleteProductoService, addStockService } from '../services/db.js';
import { getTasaBCV, formatBs } from '../services/bcv.js';
import { renderAddProductModal, showConfirmModal, renderStockModal } from '../components/ui.js';

let productosCache = [];
let productosFiltrados = [];
let tasaActual = 0;
let modalControl = null;
let stockModalControl = null;

let currentPage = 1;
const itemsPerPage = 6;

export async function renderInventory(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 opacity-60">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-brand)] border-t-transparent mb-3"></div>
      <p class="text-sm">Consultando tasa BCV e inventario...</p>
    </div>
  `;

  try {
    tasaActual = await getTasaBCV();
    productosCache = await getProductosService();
    productosFiltrados = [...productosCache];
    currentPage = 1;
    
    drawInventoryUI(container);

    modalControl = renderAddProductModal({
      onSave: async (productoData, editingId) => {
        if (editingId) {
          await updateProductoService(editingId, productoData);
        } else {
          await createProductoService(productoData);
        }
        await renderInventory(container);
      }
    });

    stockModalControl = renderStockModal({
      onSave: async (id, currentStock, qty) => {
        await addStockService(id, currentStock, qty);
        await renderInventory(container);
      }
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="p-4 text-center text-red-500">Error cargando el inventario. Revisa tu conexión.</div>`;
  }
}

function drawInventoryUI(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div>
          <h1 class="text-2xl font-black text-[var(--text-main)]">Inventario de Repuestos</h1>
          <p class="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Tasa BCV hoy: <strong class="text-[var(--color-brand)] font-mono">${tasaActual.toFixed(2)} Bs/$</strong>
          </p>
        </div>
        <button id="btnOpenAddModal" class="w-full sm:w-auto py-3 px-5 bg-[var(--color-brand)] hover:opacity-90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-brand)]/20 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          <span>Agregar Repuesto</span>
        </button>
      </div>

      <div class="relative">
        <input type="text" id="searchInput" placeholder="Buscar repuesto (Ej: Tanque SBR, Cilindro, Aceite)..." class="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-4 top-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <div id="productsGrid" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${renderProductsPage()}
      </div>

      <div id="paginationControls" class="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)]">
        ${renderPaginationButtons()}
      </div>
    </div>
  `;

  setupEvents(container);
}

function renderProductsPage() {
  if (productosFiltrados.length === 0) {
    return `
      <div class="col-span-full py-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
        <p class="font-medium">No hay repuestos registrados o no coinciden con la búsqueda.</p>
      </div>
    `;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = productosFiltrados.slice(startIndex, endIndex);

  return pageItems.map(item => {
    const imgPlaceholder = 'https://placehold.co/400x300/1e293b/ffffff?text=Repuesto';
    const precioBs = formatBs(item.precio_usd, tasaActual);
    
    const stockBadgeClass = item.stock <= 2 
      ? 'bg-red-600 text-white shadow-md font-extrabold' 
      : 'bg-emerald-600 text-white shadow-md font-extrabold';

    return `
      <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between relative">
        <div>
          <div class="h-36 w-full bg-gray-100 dark:bg-gray-800 relative">
            <img src="${item.imagen_url || imgPlaceholder}" alt="${item.nombre}" class="w-full h-full object-cover" onerror="this.src='${imgPlaceholder}'">
            <span class="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] ${stockBadgeClass}">
              ${item.stock} disp.
            </span>
          </div>
          <div class="p-3 space-y-1">
            <h3 class="font-bold text-sm text-[var(--text-main)] leading-tight line-clamp-1">${item.nombre}</h3>
            ${item.descripcion ? `<p class="text-[11px] text-[var(--text-muted)] line-clamp-1">${item.descripcion}</p>` : ''}
          </div>
        </div>

        <div class="p-3 border-t border-[var(--border-color)] bg-black/5 dark:bg-white/5 flex items-center justify-between">
          <div>
            <div class="text-base font-black text-[var(--color-brand)] font-mono">$${Number(item.precio_usd).toFixed(2)}</div>
            <div class="text-[10px] text-[var(--text-muted)] font-mono">${precioBs}</div>
          </div>
          
          <!-- MENÚ DESPLEGABLE DE 3 PUNTOS -->
          <div class="relative">
            <button data-menu-toggle="${item.id}" class="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            <div id="dropdown-${item.id}" class="hidden absolute right-0 bottom-full mb-2 w-36 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-xl z-30 py-1 flex flex-col">
              <button data-add-stock-id="${item.id}" class="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Agregar Stock
              </button>
              <button data-edit-id="${item.id}" class="w-full text-left px-3 py-2 text-xs font-semibold text-blue-500 hover:bg-blue-500/10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Editar
              </button>
              <button data-delete-id="${item.id}" class="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-[var(--border-color)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPaginationButtons() {
  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage) || 1;

  return `
    <button id="btnPrevPage" ${currentPage === 1 ? 'disabled' : ''} class="py-2 px-4 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--color-brand)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
      &larr; Anterior
    </button>
    
    <span class="text-xs font-bold text-[var(--text-muted)] font-mono">
      Página ${currentPage} de ${totalPages}
    </span>

    <button id="btnNextPage" ${currentPage >= totalPages ? 'disabled' : ''} class="py-2 px-4 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--color-brand)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
      Siguiente &rarr;
    </button>
  `;
}

function updateGridAndPagination() {
  document.getElementById('productsGrid').innerHTML = renderProductsPage();
  document.getElementById('paginationControls').innerHTML = renderPaginationButtons();
  setupPaginationEvents();
}

function setupPaginationEvents() {
  const prevBtn = document.getElementById('btnPrevPage');
  const nextBtn = document.getElementById('btnNextPage');

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        updateGridAndPagination();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        updateGridAndPagination();
      }
    };
  }
}

function setupEvents(container) {
  document.getElementById('btnOpenAddModal').onclick = () => {
    if (modalControl) modalControl.open();
  };

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    productosFiltrados = productosCache.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      (p.descripcion && p.descripcion.toLowerCase().includes(term))
    );
    currentPage = 1;
    updateGridAndPagination();
  });

  setupPaginationEvents();

  container.addEventListener('click', (e) => {
    const menuToggle = e.target.closest('[data-menu-toggle]');
    if (menuToggle) {
      const id = menuToggle.getAttribute('data-menu-toggle');
      const dropdown = document.getElementById(`dropdown-${id}`);
      document.querySelectorAll('[id^="dropdown-"]').forEach(el => {
        if (el.id !== `dropdown-${id}`) el.classList.add('hidden');
      });
      dropdown.classList.toggle('hidden');
      return;
    } else {
      document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
    }

    const addStockBtn = e.target.closest('[data-add-stock-id]');
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');

    if (addStockBtn) {
      const id = addStockBtn.getAttribute('data-add-stock-id');
      const item = productosCache.find(p => p.id == id);
      if (item && stockModalControl) stockModalControl.open(item);
    }

    if (editBtn) {
      const id = editBtn.getAttribute('data-edit-id');
      const item = productosCache.find(p => p.id == id);
      if (item && modalControl) modalControl.open(item);
    }

    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-delete-id');
      const item = productosCache.find(p => p.id == id);

      showConfirmModal({
        title: "¿Eliminar Repuesto?",
        message: `¿Estás seguro de eliminar "${item?.nombre}"? Esta acción no se puede deshacer.`,
        onConfirm: async () => {
          try {
            await deleteProductoService(id);
            await renderInventory(container);
          } catch (err) {
            alert('Error eliminando producto');
          }
        }
      });
    }
  });
}