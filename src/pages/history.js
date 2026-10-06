// src/pages/history.js
import { getFacturasService, getDetallesFacturaService } from '../services/db.js';
import { renderInvoiceModal } from '../components/ui.js';

let facturasCache = [];
let facturasFiltradas = [];
let currentPageHistory = 1;
let invoiceModalHandler = null;

function getItemsPerPage() {
  return window.innerWidth < 768 ? 3 : 5;
}

export async function renderHistory(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 opacity-60">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-brand)] border-t-transparent mb-3"></div>
      <p class="text-sm">Cargando Historial de Ventas...</p>
    </div>
  `;

  try {
    facturasCache = await getFacturasService();
    facturasFiltradas = [...facturasCache];
    currentPageHistory = 1;
    invoiceModalHandler = renderInvoiceModal();

    drawHistoryUI(container);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="p-4 text-center text-red-500">Error al cargar el historial de ventas.</div>`;
  }
}

function drawHistoryUI(container) {
  container.innerHTML = `
    <div class="space-y-4">
      
      <div class="bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-xl-center">
        <div>
          <h1 class="text-xl font-black text-[var(--text-main)]">Historial de Ventas</h1>
          <p class="text-xs text-[var(--text-muted)]">Filtra por fecha, cliente o C.I / RIF</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 w-full xl:w-auto items-center">
          <div class="sm:col-span-4 xl:w-44">
            <input type="date" id="historyDateInput" style="color-scheme: dark;" class="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] focus:outline-none focus:border-[var(--color-brand)] font-mono transition-all">
          </div>

          <div class="relative sm:col-span-6 xl:w-64">
            <input type="text" id="historySearchInput" placeholder="Buscar cliente o C.I / RIF..." class="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div class="sm:col-span-2 xl:w-20">
            <button id="btnClearHistoryFilters" class="w-full h-10 px-3 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-all flex justify-center items-center">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div class="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden flex flex-col justify-between">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
              <tr>
                <th class="p-3">Fecha / Hora</th>
                <th class="p-3">Cliente</th>
                <th class="p-3">Cédula / RIF</th>
                <th class="p-3">Total USD</th>
                <th class="p-3">Total Bs</th>
                <th class="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody id="historyTableBody" class="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
              ${renderHistoryRows()}
            </tbody>
          </table>
        </div>

        <div id="historyPaginationControls" class="p-3 border-t border-[var(--border-color)] flex items-center justify-between">
          ${renderHistoryPaginationButtons()}
        </div>
      </div>

    </div>
  `;

  setupHistoryEvents(container);
}

function renderHistoryRows() {
  if (facturasFiltradas.length === 0) {
    return `
      <tr>
        <td colSpan="6" class="p-6 text-center text-[var(--text-muted)]">No se encontraron facturas registradas.</td>
      </tr>
    `;
  }

  const itemsPerPage = getItemsPerPage();
  const startIndex = (currentPageHistory - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = facturasFiltradas.slice(startIndex, endIndex);

  return pageItems.map(f => {
    const fecha = new Date(f.created_at).toLocaleString('es-VE', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    return `
      <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <td class="p-3 font-mono font-medium">${fecha}</td>
        <td class="p-3 font-bold truncate max-w-[120px]">${f.cliente_nombre}</td>
        <td class="p-3 font-mono">${f.cliente_cedula}</td>
        <td class="p-3 font-mono font-bold text-[var(--color-brand)]">$${Number(f.total_usd).toFixed(2)}</td>
        <td class="p-3 font-mono font-bold">Bs. ${Number(f.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
        <td class="p-3 text-center">
          <button data-view-invoice="${f.id}" class="px-2.5 py-1 bg-[var(--color-brand)]/10 text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white rounded-lg transition-colors font-bold text-[11px]">
            Ver Recibo
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderHistoryPaginationButtons() {
  const itemsPerPage = getItemsPerPage();
  const totalPages = Math.ceil(facturasFiltradas.length / itemsPerPage) || 1;

  return `
    <button id="btnPrevPageHistory" ${currentPageHistory === 1 ? 'disabled' : ''} class="py-1 px-3 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--color-brand)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
      &larr; Anterior
    </button>
    
    <span class="text-xs font-bold text-[var(--text-muted)] font-mono">
      Pág. ${currentPageHistory} de ${totalPages}
    </span>

    <button id="btnNextPageHistory" ${currentPageHistory >= totalPages ? 'disabled' : ''} class="py-1 px-3 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--color-brand)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
      Siguiente &rarr;
    </button>
  `;
}

function updateHistoryTableAndPagination() {
  document.getElementById('historyTableBody').innerHTML = renderHistoryRows();
  document.getElementById('historyPaginationControls').innerHTML = renderHistoryPaginationButtons();
  setupHistoryPaginationEvents();
}

function setupHistoryPaginationEvents() {
  const prevBtn = document.getElementById('btnPrevPageHistory');
  const nextBtn = document.getElementById('btnNextPageHistory');

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentPageHistory > 1) {
        currentPageHistory--;
        updateHistoryTableAndPagination();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const itemsPerPage = getItemsPerPage();
      const totalPages = Math.ceil(facturasFiltradas.length / itemsPerPage);
      if (currentPageHistory < totalPages) {
        currentPageHistory++;
        updateHistoryTableAndPagination();
      }
    };
  }
}

function setupHistoryEvents(container) {
  const searchInput = document.getElementById('historySearchInput');
  const dateInput = document.getElementById('historyDateInput');
  const btnClear = document.getElementById('btnClearHistoryFilters');

  function applyFilters() {
    const textTerm = searchInput.value.toLowerCase().trim();
    const selectedDate = dateInput.value;

    facturasFiltradas = facturasCache.filter(f => {
      const matchText = f.cliente_nombre.toLowerCase().includes(textTerm) ||
                        f.cliente_cedula.toLowerCase().includes(textTerm);

      let matchDate = true;
      if (selectedDate) {
        const facturaDate = new Date(f.created_at).toISOString().split('T')[0];
        matchDate = facturaDate === selectedDate;
      }

      return matchText && matchDate;
    });

    currentPageHistory = 1;
    updateHistoryTableAndPagination();
  }

  searchInput.addEventListener('input', applyFilters);
  dateInput.addEventListener('change', applyFilters);

  btnClear.onclick = () => {
    searchInput.value = '';
    dateInput.value = '';
    facturasFiltradas = [...facturasCache];
    currentPageHistory = 1;
    updateHistoryTableAndPagination();
  };

  setupHistoryPaginationEvents();

  container.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('[data-view-invoice]');
    if (viewBtn) {
      const id = viewBtn.getAttribute('data-view-invoice');
      const factura = facturasCache.find(f => f.id == id);

      if (factura) {
        try {
          const detalles = await getDetallesFacturaService(id);
          invoiceModalHandler.open(factura, detalles);
        } catch (err) {
          console.error('Error al abrir recibo:', err);
        }
      }
    }
  });
}