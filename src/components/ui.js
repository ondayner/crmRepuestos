// src/components/ui.js

/**
 * Muestra alertas temporales autolimpiables a los 3 segundos
 */
export function showAlert(message, type = 'error', containerId = null) {
  const bgColor = type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20';

  const icon = type === 'success' 
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`;

  const alertHtml = `
    <div class="flex items-center gap-2 p-3.5 rounded-xl text-sm font-medium border transition-all duration-300 ${bgColor}">
      ${icon}
      <span>${message}</span>
    </div>
  `;

  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = alertHtml;
      container.classList.remove('hidden');

      if (container.timerId) clearTimeout(container.timerId);

      container.timerId = setTimeout(() => {
        container.classList.add('hidden');
        container.innerHTML = '';
      }, 3000);
    }
  }
}

/**
 * Comprime imágenes subidas por el usuario
 */
export function compressImage(file, maxWidth = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Modal Personalizado de Confirmación
 */
export function showConfirmModal(arg1, arg2) {
  let title = "¿Estás seguro?";
  let message = "";
  let confirmText = "Sí, Guardar";
  let onConfirm = null;

  if (typeof arg1 === 'object' && arg1 !== null) {
    title = arg1.title || title;
    message = arg1.message || "";
    confirmText = arg1.confirmText || confirmText;
    onConfirm = arg1.onConfirm;
  } else {
    message = arg1 || "";
    onConfirm = arg2;
  }

  let modalEl = document.getElementById('customConfirmModal');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'customConfirmModal';
  modalEl.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in';

  modalEl.innerHTML = `
    <div class="bg-[var(--bg-surface)] w-full max-w-sm rounded-3xl border border-[var(--border-color)] shadow-2xl p-6 text-center space-y-4">
      <div class="w-12 h-12 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <div>
        <h3 class="text-base font-extrabold text-[var(--text-main)] mb-1">${title}</h3>
        <p class="text-xs text-[var(--text-muted)]">${message}</p>
      </div>
      <div class="grid grid-cols-2 gap-2 pt-2">
        <button id="btnCancelConfirm" class="py-2.5 px-4 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-all">Cancelar</button>
        <button id="btnAcceptConfirm" class="py-2.5 px-4 rounded-xl bg-[var(--color-brand)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-md">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  document.getElementById('btnCancelConfirm').onclick = () => modalEl.remove();
  document.getElementById('btnAcceptConfirm').onclick = async () => {
    modalEl.remove();
    if (onConfirm) await onConfirm();
  };
}

/**
 * Escáner de Código de Barras mediante Cámara (CDN Universal)
 */
export function initBarcodeScanner(onScanSuccess) {
  let modalEl = document.getElementById('scannerModal');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'scannerModal';
  modalEl.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  
  modalEl.innerHTML = `
    <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <h3 class="font-extrabold text-sm text-[var(--text-main)]">Escanear Código de Barras</h3>
        <button id="btnCloseScanner" class="text-[var(--text-muted)] hover:text-red-500 text-xl font-bold">&times;</button>
      </div>
      <div id="reader" class="w-full rounded-2xl overflow-hidden border border-[var(--border-color)] bg-black"></div>
      <p class="text-[10px] text-center text-[var(--text-muted)]">Apunta con la cámara de tu dispositivo al código de barras del repuesto.</p>
    </div>
  `;

  document.body.appendChild(modalEl);

  // Asegurar que el script de Html5Qrcode esté disponible de forma global
  if (typeof Html5Qrcode === 'undefined') {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.onload = () => startScanner(onScanSuccess, modalEl);
    document.head.appendChild(script);
  } else {
    startScanner(onScanSuccess, modalEl);
  }

  document.getElementById('btnCloseScanner').onclick = () => {
    if (window.activeScanner) {
      window.activeScanner.stop().then(() => modalEl.remove()).catch(() => modalEl.remove());
      window.activeScanner = null;
    } else {
      modalEl.remove();
    }
  };
}

function startScanner(onScanSuccess, modalEl) {
  const html5QrCode = new Html5Qrcode("reader");
  window.activeScanner = html5QrCode;

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 150 } },
    (decodedText) => {
      html5QrCode.stop().then(() => {
        window.activeScanner = null;
        modalEl.remove();
        onScanSuccess(decodedText);
      }).catch(err => console.error(err));
    },
    (errorMessage) => {}
  ).catch(err => {
    alert("No se pudo iniciar la cámara. Verifica los permisos de tu dispositivo.");
    modalEl.remove();
  });
}

/**
 * Modal Rápido para Reabastecer Stock
 */
export function renderStockModal({ onSave }) {
  let modalEl = document.getElementById('stockModal');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'stockModal';
  modalEl.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden';

  modalEl.innerHTML = `
    <div class="bg-[var(--bg-surface)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 relative space-y-4">
      <div class="flex justify-between items-center">
        <h3 id="stockModalTitle" class="font-bold text-lg text-[var(--text-main)]">Reabastecer Stock</h3>
        <button id="closeStockModalBtn" class="text-[var(--text-muted)] hover:text-red-500 text-xl font-bold">&times;</button>
      </div>
      <form id="stockForm" class="space-y-4" novalidate>
        <div>
          <label class="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Cantidad a ingresar *</label>
          <input type="number" min="1" id="stockAddInput" placeholder="Ej: 5" required class="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none focus:border-emerald-500">
        </div>
        <button type="submit" id="btnConfirmAddStock" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20">
          Añadir al Inventario
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modalEl);

  const form = document.getElementById('stockForm');
  const input = document.getElementById('stockAddInput');
  let currentItem = null;

  document.getElementById('closeStockModalBtn').onclick = () => modalEl.classList.add('hidden');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(input.value);
    if (!qty || qty <= 0) return;

    await onSave(currentItem.id, currentItem.stock, qty);
    modalEl.classList.add('hidden');
    form.reset();
  };

  return {
    open: (item) => {
      currentItem = item;
      document.getElementById('stockModalTitle').textContent = `Reabastecer: ${item.nombre}`;
      input.value = '';
      modalEl.classList.remove('hidden');
      input.focus();
    }
  };
}

/**
 * Modal Completo de Crear / Editar Repuesto
 */
export function renderAddProductModal({ onSave }) {
  let modalEl = document.getElementById('addProductModal');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'addProductModal';
  modalEl.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden';
  
  modalEl.innerHTML = `
    <div class="bg-[var(--bg-surface)] w-full max-w-lg rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 id="modalProductHeaderTitle" class="text-xl font-extrabold text-[var(--text-main)]">Nuevo Repuesto / Aceite</h2>
        <button id="modalCloseBtn" class="text-[var(--text-muted)] hover:text-red-500 p-2 text-2xl font-bold">&times;</button>
      </div>

      <form id="productForm" class="space-y-4" novalidate>
        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Nombre del Repuesto *</label>
          <input type="text" id="pNombre" placeholder="Ej: Tanque SBR 150" class="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] focus:outline-none transition-all">
          <span id="errNombre" class="text-xs text-red-500 font-medium hidden">El nombre es obligatorio</span>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Código de Barras (Opcional)</label>
          <div class="flex gap-2">
            <input type="text" id="pCodigoBarras" placeholder="Escanea o escribe el código..." class="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none transition-all">
            <button type="button" id="btnScanCamera" title="Escanear con cámara" class="px-4 py-2.5 bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)] hover:text-white rounded-xl transition-all flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Precio ($) *</label>
            <input type="number" step="0.01" min="0" id="pPrecio" placeholder="25.00" class="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none transition-all">
            <span id="errPrecio" class="text-xs text-red-500 font-medium hidden">Precio inválido</span>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Stock Inicial *</label>
            <input type="number" min="0" id="pStock" placeholder="4" class="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none transition-all">
            <span id="errStock" class="text-xs text-red-500 font-medium hidden">Stock inválido</span>
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Foto del Repuesto</label>
          <input type="file" id="pFileImage" accept="image/*" class="w-full text-xs text-[var(--text-muted)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--color-brand)] file:text-white hover:file:opacity-90 file:cursor-pointer cursor-pointer transition-all mb-1">
          
          <p class="text-[10px] text-[var(--text-muted)] text-center">- O ingresa una URL directamente -</p>
          <input type="url" id="pImagenUrl" placeholder="https://..." class="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] focus:outline-none transition-all">
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Descripción (Opcional)</label>
          <textarea id="pDescripcion" rows="2" placeholder="Detalles de compatibilidad, marca..." class="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] focus:outline-none resize-none transition-all"></textarea>
        </div>

        <div id="modalAlert" class="hidden"></div>

        <button type="submit" id="btnSaveProduct" disabled class="w-full py-3 bg-[var(--color-brand)] text-white font-bold rounded-xl transition-all shadow-lg shadow-[var(--color-brand)]/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
          Guardar en Inventario
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modalEl);

  const form = document.getElementById('productForm');
  const pNombre = document.getElementById('pNombre');
  const pCodigoBarras = document.getElementById('pCodigoBarras');
  const pPrecio = document.getElementById('pPrecio');
  const pStock = document.getElementById('pStock');
  const pDescripcion = document.getElementById('pDescripcion');
  const urlInput = document.getElementById('pImagenUrl');
  const errNombre = document.getElementById('errNombre');
  const errPrecio = document.getElementById('errPrecio');
  const errStock = document.getElementById('errStock');
  const saveBtn = document.getElementById('btnSaveProduct');
  const fileInput = document.getElementById('pFileImage');
  const btnScanCamera = document.getElementById('btnScanCamera');
  
  let imageBase64Compressed = null;
  let editingId = null;

  function validateField(input, errorEl, isNum = false) {
    const val = input.value.trim();
    const isValid = isNum ? (val !== '' && !isNaN(val) && Number(val) >= 0) : val !== '';

    if (isValid) {
      errorEl.classList.add('hidden');
      input.classList.remove('border-red-500', 'border-[var(--border-color)]');
      input.classList.add('border-emerald-500');
    } else {
      input.classList.remove('border-emerald-500', 'border-[var(--border-color)]');
      if (val !== '') {
        errorEl.classList.remove('hidden');
        input.classList.add('border-red-500');
      } else {
        errorEl.classList.add('hidden');
      }
    }
    checkFormValidity();
  }

  function checkFormValidity() {
    const isNombreValid = pNombre.value.trim() !== '';
    const isPrecioValid = pPrecio.value.trim() !== '' && !isNaN(pPrecio.value) && Number(pPrecio.value) >= 0;
    const isStockValid = pStock.value.trim() !== '' && !isNaN(pStock.value) && Number(pStock.value) >= 0;

    saveBtn.disabled = !(isNombreValid && isPrecioValid && isStockValid);
  }

  pNombre.addEventListener('input', () => validateField(pNombre, errNombre));
  pPrecio.addEventListener('input', () => validateField(pPrecio, errPrecio, true));
  pStock.addEventListener('input', () => validateField(pStock, errStock, true));

  btnScanCamera.onclick = () => {
    initBarcodeScanner((scannedText) => {
      pCodigoBarras.value = scannedText;
      showAlert('¡Código escaneado con éxito!', 'success', 'modalAlert');
    });
  };

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        imageBase64Compressed = await compressImage(file, 600, 0.7);
        showAlert('Imagen subida y comprimida correctamente', 'success', 'modalAlert');
      } catch (err) {
        showAlert('Error al procesar la imagen', 'error', 'modalAlert');
      }
    }
  });

  document.getElementById('modalCloseBtn').onclick = () => modalEl.classList.add('hidden');

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (saveBtn.disabled) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    const productoData = {
      nombre: pNombre.value.trim(),
      codigo_barras: pCodigoBarras.value.trim() || null,
      precio_usd: parseFloat(pPrecio.value),
      stock: parseInt(pStock.value),
      imagen_url: imageBase64Compressed || urlInput.value.trim() || null,
      descripcion: pDescripcion.value.trim() || null
    };

    try {
      await onSave(productoData, editingId);
      modalEl.classList.add('hidden');
      form.reset();
      imageBase64Compressed = null;
      editingId = null;
    } catch (err) {
      showAlert('Error al guardar repuesto', 'error', 'modalAlert');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar en Inventario';
    }
  };

  return {
    open: (itemToEdit = null) => {
      form.reset();
      document.getElementById('modalAlert').classList.add('hidden');
      imageBase64Compressed = null;

      if (itemToEdit) {
        editingId = itemToEdit.id;
        document.getElementById('modalProductHeaderTitle').textContent = 'Editar Repuesto';
        pNombre.value = itemToEdit.nombre;
        pCodigoBarras.value = itemToEdit.codigo_barras || '';
        pPrecio.value = itemToEdit.precio_usd;
        pStock.value = itemToEdit.stock;
        pDescripcion.value = itemToEdit.descripcion || '';
        urlInput.value = itemToEdit.imagen_url || '';

        if (itemToEdit.imagen_url && itemToEdit.imagen_url.startsWith('data:image')) {
          imageBase64Compressed = itemToEdit.imagen_url;
        }

        [pNombre, pPrecio, pStock].forEach(el => {
          el.classList.remove('border-red-500', 'border-[var(--border-color)]');
          el.classList.add('border-emerald-500');
        });
      } else {
        editingId = null;
        document.getElementById('modalProductHeaderTitle').textContent = 'Nuevo Repuesto / Aceite';
        [pNombre, pPrecio, pStock].forEach(el => {
          el.classList.remove('border-emerald-500', 'border-red-500');
          el.classList.add('border-[var(--border-color)]');
        });
      }

      checkFormValidity();
      modalEl.classList.remove('hidden');
    },
    close: () => modalEl.classList.add('hidden')
  };
}

export function setupCartDrawerEvents() {
  const cartDrawer = document.getElementById('cartDrawer');
  const mobileCartTrigger = document.getElementById('mobileCartTrigger');
  const btnCloseCartMobile = document.getElementById('btnCloseCartMobile');

  if (mobileCartTrigger && cartDrawer) {
    mobileCartTrigger.onclick = () => cartDrawer.classList.remove('translate-y-full');
  }
  if (btnCloseCartMobile && cartDrawer) {
    btnCloseCartMobile.onclick = () => cartDrawer.classList.add('translate-y-full');
  }

  return {
    close: () => {
      if (cartDrawer) cartDrawer.classList.add('translate-y-full');
    },
    open: () => {
      if (cartDrawer) cartDrawer.classList.remove('translate-y-full');
    }
  };
}

export function renderInvoiceModal() {
  let modalEl = document.getElementById('invoiceModal');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'invoiceModal';
  modalEl.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden animate-fade-in';

  modalEl.innerHTML = `
    <div class="bg-[var(--bg-surface)] w-full max-w-sm rounded-3xl border border-[var(--border-color)] shadow-2xl p-5 relative max-h-[90vh] flex flex-col justify-between space-y-4">
      <div class="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
        <div>
          <h3 class="font-extrabold text-base text-[var(--text-main)]">Recibo de Venta</h3>
          <p class="text-[10px] text-[var(--text-muted)]">Comprobante de operación</p>
        </div>
        <button id="closeInvoiceModalBtn" class="text-[var(--text-muted)] hover:text-red-500 text-xl font-bold p-1">&times;</button>
      </div>

      <div id="invoiceModalContent" class="space-y-3 overflow-y-auto pr-1 text-xs"></div>

      <div class="pt-2">
        <button id="btnPrintInvoice" class="w-full py-3 bg-[var(--color-brand)] hover:opacity-90 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[var(--color-brand)]/20 flex justify-center items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          <span>Imprimir / Guardar Recibo</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const closeModalBtn = document.getElementById('closeInvoiceModalBtn');
  const btnPrint = document.getElementById('btnPrintInvoice');
  let currentFactura = null;
  let currentDetalles = [];

  closeModalBtn.onclick = () => modalEl.classList.add('hidden');

  btnPrint.onclick = () => {
    if (!currentFactura) return;
    printReceiptIsolated(currentFactura, currentDetalles);
  };

  return {
    open: (factura, detalles) => {
      currentFactura = factura;
      currentDetalles = detalles;

      const contentEl = document.getElementById('invoiceModalContent');
      const fecha = new Date(factura.created_at).toLocaleString('es-VE', {
        dateStyle: 'short',
        timeStyle: 'short'
      });

      const subtotalBase = detalles.reduce((sum, d) => {
        const precioUsd = d.productos ? Number(d.productos.precio_usd) : 0;
        return sum + (precioUsd * d.cantidad);
      }, 0);

      const itemsHtml = detalles.map(d => {
        const nombre = d.productos ? d.productos.nombre : 'Producto Desconocido';
        const precioUsd = d.productos ? Number(d.productos.precio_usd) : 0;
        const subtotal = precioUsd * d.cantidad;

        return `
          <div class="flex justify-between text-xs py-1.5 border-b border-dashed border-[var(--border-color)]">
            <div>
              <span class="font-bold text-[var(--color-brand)]">${d.cantidad}x</span> ${nombre}
            </div>
            <span class="font-mono font-bold">$${subtotal.toFixed(2)}</span>
          </div>
        `;
      }).join('');

      const totalUsd = Number(factura.total_usd);
      const ivaCalculado = Math.max(0, totalUsd - subtotalBase);

      contentEl.innerHTML = `
        <div class="space-y-3 font-mono">
          <div class="text-[10px] text-[var(--text-muted)] flex justify-between border-b border-[var(--border-color)] pb-2">
            <span>Fecha: ${fecha}</span>
            <span>Tasa BCV: ${Number(factura.tasa_bcv).toFixed(2)} Bs</span>
          </div>

          <div class="bg-black/5 dark:bg-white/5 p-3 rounded-xl space-y-0.5 text-xs">
            <p class="font-bold text-[var(--text-main)]">Cliente: ${factura.cliente_nombre}</p>
            <p class="text-[var(--text-muted)]">C.I / RIF: ${factura.cliente_cedula}</p>
          </div>

          <div>
            <p class="font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">Detalle de Compra:</p>
            ${itemsHtml || '<p class="text-[10px] text-[var(--text-muted)]">Sin detalles registrados</p>'}
          </div>

          <div class="pt-2 border-t border-[var(--border-color)] space-y-1">
            <div class="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Subtotal:</span>
              <span>$${subtotalBase.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-xs text-[var(--text-muted)]">
              <span>IVA:</span>
              <span>$${ivaCalculado.toFixed(2)}</span>
            </div>
            <div class="flex justify-between font-bold text-sm text-[var(--text-main)] pt-1 border-t border-[var(--border-color)]">
              <span>Total USD:</span>
              <span class="text-[var(--color-brand)]">$${totalUsd.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Total Bolívares:</span>
              <span>Bs. ${Number(factura.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      `;

      modalEl.classList.remove('hidden');
    },
    close: () => modalEl.classList.add('hidden')
  };
}

function printReceiptIsolated(factura, detalles) {
  const fecha = new Date(factura.created_at).toLocaleString('es-VE');
  const tasaBCV = Number(factura.tasa_bcv) || 1;
  const companyName = localStorage.getItem('moto_crm_company_name') || 'MOTO REPUESTOS MVP';

  const itemsHtml = detalles.map(d => {
    const nombre = d.productos ? d.productos.nombre : 'Producto';
    const precioUsd = d.productos ? Number(d.productos.precio_usd) : 0;
    const subtotalUsd = precioUsd * d.cantidad;
    const subtotalBs = subtotalUsd * tasaBCV;

    return `
      <tr>
        <td style="padding: 6px 0; vertical-align: top;">
          <div style="font-weight: bold;">${d.cantidad}x ${nombre}</div>
          <div style="font-size: 9px; color: #666;">$${precioUsd.toFixed(2)} c/u</div>
        </td>
        <td style="padding: 6px 0; text-align: right; vertical-align: top; font-family: monospace;">
          <div style="font-weight: bold;">$${subtotalUsd.toFixed(2)}</div>
          <div style="font-size: 10px; color: #444;">Bs. ${subtotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
        </td>
      </tr>
    `;
  }).join('');

  const subtotalBaseUSD = detalles.reduce((sum, d) => {
    const pUsd = d.productos ? Number(d.productos.precio_usd) : 0;
    return sum + (pUsd * d.cantidad);
  }, 0);

  const totalUSD = Number(factura.total_usd);
  const ivaUSD = Math.max(0, totalUSD - subtotalBaseUSD);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Recibo - ${companyName}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            font-size: 11px; 
            color: #000; 
            padding: 25px 20px; 
            max-width: 320px; 
            margin: 0 auto; 
          }
          .header-center { text-align: center; }
          h2 { margin: 0 0 2px 0; font-size: 16px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
          .sub { margin: 0 0 8px 0; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
          .meta-center { font-size: 11px; text-align: center; color: #333; margin-bottom: 6px; line-height: 1.4; }
          .divider { border-bottom: 1px dashed #bbb; margin: 10px 0; }
          .info { font-size: 11px; margin-bottom: 6px; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .total-box { border-top: 2px solid #000; padding-top: 6px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header-center">
          <h2>${companyName}</h2>
          <div class="sub">Comprobante de Venta</div>
          <div class="meta-center">
            <div><strong>Fecha:</strong> ${fecha}</div>
            <div><strong>Tasa BCV:</strong> ${tasaBCV.toFixed(2)} Bs/$</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="info">
          <div><strong>Cliente:</strong> ${factura.cliente_nombre}</div>
          <div><strong>C.I / RIF:</strong> ${factura.cliente_cedula}</div>
        </div>

        <div class="divider"></div>

        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Subtotal:</span>
          <span style="font-family: monospace;">$${subtotalBaseUSD.toFixed(2)} / Bs. ${(subtotalBaseUSD * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>
        
        <div style="font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>IVA:</span>
          <span style="font-family: monospace;">$${ivaUSD.toFixed(2)} / Bs. ${(ivaUSD * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>

        <div class="total-box">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
            <span>TOTAL USD:</span>
            <span style="font-family: monospace;">$${totalUSD.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-top: 3px;">
            <span>TOTAL BS:</span>
            <span style="font-family: monospace;">Bs. ${Number(factura.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 250);
}