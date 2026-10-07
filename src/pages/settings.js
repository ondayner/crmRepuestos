// src/pages/settings.js
import { APP_CONFIG } from '../../config/config.js';
import { supabase } from '../../config/supabase.js';
import { showAlert, showConfirmModal, compressImage } from '../components/ui.js';
import { applyDynamicTheme, extractPaletteFromImage } from '../utils/themeManager.js';

export function renderSettings(container) {
  const currentIva = localStorage.getItem('moto_crm_iva_rate') || '16';
  const currentTheme = localStorage.getItem('moto_crm_theme_color') || '#0284c7';
  const companyName = localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre;
  const customLogo = localStorage.getItem('moto_crm_custom_logo') || '';
  
  // Tasa BCV manual
  const manualBcv = localStorage.getItem('moto_crm_manual_bcv') || '';

  const defaultPalette = ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  const currentPalette = JSON.parse(localStorage.getItem('moto_crm_custom_palette') || JSON.stringify(defaultPalette));

  const paletteButtonsHtml = currentPalette.map(color => {
    const isSelected = currentTheme === color ? 'ring-2 ring-white scale-105' : '';
    return `<button data-color="${color}" style="background-color: ${color};" class="h-10 rounded-xl border-2 border-white/20 hover:scale-105 transition-all shadow-sm ${isSelected}"></button>`;
  }).join('');

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto pb-10">

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- PARÁMETROS FISCALES Y TASA BCV MANUAL -->
        <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
          <h2 class="font-bold text-sm text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
            Parámetros de Facturación y Tasa
          </h2>

          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Nombre del Negocio (En Recibos y Menú)</label>
            <input type="text" id="cfgCompanyName" value="${companyName}" class="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] focus:outline-none focus:border-[var(--color-brand)] font-semibold">
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Porcentaje de IVA por Defecto (%)</label>
            <input type="number" id="cfgIvaRate" step="0.1" value="${currentIva}" class="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-brand)]">
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Tasa BCV Manual (Opcional)</label>
            <input type="number" id="cfgManualBcv" step="0.01" placeholder="Ej: 36.50 (Dejar vacío para usar tasa automática)" value="${manualBcv}" class="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-brand)]">
            <p class="text-[10px] text-[var(--text-muted)]">Si se deja vacío, el sistema consultará la tasa oficial del día de forma automática.</p>
          </div>

          <button id="btnSaveConfig" class="w-full py-2.5 bg-[var(--color-brand)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md mt-2">
            Guardar Cambios Fiscales y de Tasa
          </button>
        </div>

        <!-- PERSONALIZACIÓN VISUAL Y LOGOTIPO -->
        <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
          <h2 class="font-bold text-sm text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
            Identidad Visual y Logotipo
          </h2>

          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Logotipo Personalizado de la App</label>
            <div class="flex items-center gap-4">
              <div id="logoPreviewContainer" class="w-14 h-14 rounded-2xl border border-[var(--border-color)] bg-[var(--color-brand)]/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                ${customLogo ? `<img src="${customLogo}" class="w-full h-full object-cover rounded-xl" />` : `
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-[var(--color-brand)]">
                    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0..." stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>`
                }
              </div>
              <div class="flex-1 space-y-1">
                <input type="file" id="cfgLogoFile" accept="image/*" class="w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--color-brand)] file:text-white hover:file:opacity-90 cursor-pointer">
                <button type="button" id="btnRemoveLogo" class="text-[10px] text-red-500 font-bold hover:underline ${customLogo ? '' : 'hidden'}">Quitar logo personalizado</button>
              </div>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Color de Acento Principal (Sugeridos del Logo):</label>
            <div class="grid grid-cols-5 gap-3" id="paletteContainer">
              ${paletteButtonsHtml}
            </div>
          </div>
        </div>

      </div>

      <!-- GESTIÓN DE DATOS Y RESPALDO (EXCEL / JSON) -->
      <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
        <h2 class="font-bold text-sm text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
          Gestión de Datos y Respaldo Total
        </h2>
        <p class="text-xs text-[var(--text-muted)]">Exporta reportes detallados en CSV o realiza un respaldo completo de la base de datos en formato JSON universal.</p>

        <!-- Filtro por Fechas para Ventas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/20 items-end">
          <div class="space-y-1">
            <label class="block text-[10px] font-bold uppercase text-[var(--text-muted)]">Desde (Facturas)</label>
            <input type="date" id="salesDateFrom" value="${thirtyDaysAgo}" class="w-full h-9 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-brand)]">
          </div>
          <div class="space-y-1">
            <label class="block text-[10px] font-bold uppercase text-[var(--text-muted)]">Hasta (Facturas)</label>
            <input type="date" id="salesDateTo" value="${todayStr}" class="w-full h-9 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-brand)]">
          </div>
          <button id="btnExportSales" class="h-9 px-4 bg-[var(--color-brand)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Exportar CSV Facturas
          </button>
        </div>

        <!-- Botones de Respaldo JSON y Excel Inventario -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button id="btnExportInventory" class="p-3 bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)] hover:text-white text-[var(--color-brand)] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Exportar Inventario CSV
          </button>

          <button id="btnExportJson" class="p-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-emerald-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
            Crear Respaldo Total (.JSON)
          </button>

          <button id="btnClearCache" class="p-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Limpiar Caché Local
          </button>
        </div>

        <!-- Importar Inventario Masivo CSV -->
        <div class="pt-3 border-t border-[var(--border-color)] space-y-2">
          <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Importar Inventario Masivo (Archivo .CSV)</label>
          <div class="flex items-center gap-3">
            <input type="file" id="csvFileInput" accept=".csv" class="w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--color-brand)] file:text-white hover:file:opacity-90 cursor-pointer">
            <button id="btnImportCsv" class="px-4 py-2 bg-[var(--color-brand)] text-white text-xs font-bold rounded-xl hover:opacity-90 shrink-0 shadow-md">
              Cargar y Sincronizar
            </button>
          </div>
          <p class="text-[10px] text-[var(--text-muted)]">Columnas requeridas: <code class="text-[var(--color-brand)]">nombre, precio_usd, stock</code></p>
        </div>
      </div>

      <!-- ZONA DE PRUEBAS -->
      <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-red-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 class="font-bold text-sm text-red-500 uppercase tracking-wider">Zona de Pruebas</h2>
          <p class="text-xs text-[var(--text-muted)]">Restaura el logotipo predeterminado, los colores iniciales y borra las configuraciones locales de prueba.</p>
        </div>
        <button id="btnResetOriginal" class="w-full sm:w-auto py-2.5 px-5 bg-red-500/10 border border-red-500/30 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0">
          Volver a Estado Original
        </button>
      </div>

      <div id="cfgAlert" class="hidden pt-1"></div>

    </div>
  `;

  setupSettingsEvents(container);
}

function setupSettingsEvents(container) {
  // Guardar Parámetros Fiscales y Tasa BCV Manual
  document.getElementById('btnSaveConfig').onclick = () => {
    const name = document.getElementById('cfgCompanyName').value.trim();
    const iva = document.getElementById('cfgIvaRate').value.trim();
    const manualBcv = document.getElementById('cfgManualBcv').value.trim();

    if (!name || isNaN(iva)) {
      showAlert('Por favor ingresa datos fiscales válidos.', 'error', 'cfgAlert');
      return;
    }

    showConfirmModal(`¿Estás seguro de actualizar la configuración del negocio?`, () => {
      localStorage.setItem('moto_crm_company_name', name);
      localStorage.setItem('moto_crm_iva_rate', iva);
      
      if (manualBcv) {
        localStorage.setItem('moto_crm_manual_bcv', manualBcv);
      } else {
        localStorage.removeItem('moto_crm_manual_bcv');
      }

      document.querySelectorAll('aside h2, header h2').forEach(el => {
        if (el.id !== 'appTitle') el.textContent = name;
      });
      document.title = `${name} - CRM`;

      showAlert('¡Configuración guardada con éxito!', 'success', 'cfgAlert');
    });
  };

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-color]');
    if (btn) {
      const color = btn.getAttribute('data-color');
      applyDynamicTheme(color);
      
      container.querySelectorAll('[data-color]').forEach(b => b.classList.remove('ring-2', 'ring-white', 'scale-105'));
      btn.classList.add('ring-2', 'ring-white', 'scale-105');

      showAlert('Color de interfaz actualizado al instante.', 'success', 'cfgAlert');
    }
  });

  const logoFileInput = document.getElementById('cfgLogoFile');
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');

  logoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 200, 0.8);
        const newPalette = await extractPaletteFromImage(compressedBase64);
        localStorage.setItem('moto_crm_custom_palette', JSON.stringify(newPalette));
        applyDynamicTheme(newPalette[0], compressedBase64);

        showAlert('¡Logotipo subido y paleta sincronizada!', 'success', 'cfgAlert');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showAlert('Error al procesar la imagen del logotipo.', 'error', 'cfgAlert');
      }
    }
  });

  btnRemoveLogo.addEventListener('click', () => {
    localStorage.removeItem('moto_crm_custom_logo');
    localStorage.removeItem('moto_crm_custom_palette');
    showAlert('Logotipo y colores restablecidos.', 'success', 'cfgAlert');
    setTimeout(() => window.location.reload(), 1000);
  });

  // --- EXPORTAR FACTURAS CSV ---
  document.getElementById('btnExportSales').onclick = async () => {
    const dateFrom = document.getElementById('salesDateFrom').value;
    const dateTo = document.getElementById('salesDateTo').value;

    if (!dateFrom || !dateTo) {
      showAlert('Por favor selecciona un rango de fechas válido.', 'error', 'cfgAlert');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);

      if (error) throw error;
      if (!data || data.length === 0) {
        showAlert('No hay registros de facturas en el rango seleccionado.', 'error', 'cfgAlert');
        return;
      }

      let csv = 'ID,Cliente,Cedula,Total_USD,Total_BS,Tasa_BCV,Fecha\n';
      data.forEach(v => {
        csv += `"${v.id || ''}","${v.cliente_nombre || 'General'}","${v.cliente_cedula || 'N/A'}","${v.total_usd || 0}","${v.total_bs || 0}","${v.tasa_bcv || 0}","${v.created_at || ''}"\n`;
      });

      downloadFile(csv, `reporte_facturas_${dateFrom}_al_${dateTo}.csv`, 'text/csv;charset=utf-8;');
      showAlert('¡Reporte de facturas exportado con éxito!', 'success', 'cfgAlert');
    } catch (err) {
      console.error(err);
      showAlert('Error al exportar las facturas.', 'error', 'cfgAlert');
    }
  };

  // --- EXPORTAR INVENTARIO CSV ---
  document.getElementById('btnExportInventory').onclick = async () => {
    try {
      const { data, error } = await supabase.from('productos').select('*');
      if (error) throw error;
      if (!data || data.length === 0) {
        showAlert('No hay productos en el inventario.', 'error', 'cfgAlert');
        return;
      }

      let csv = 'ID,Nombre,Precio_USD,Stock\n';
      data.forEach(p => {
        const precioReal = p.precio_usd !== undefined ? p.precio_usd : (p.precio || 0);
        csv += `"${p.id}","${p.nombre}","${precioReal}","${p.stock}"\n`;
      });

      const currentDate = new Date().toISOString().split('T')[0];
      downloadFile(csv, `inventario_repuestos_${currentDate}.csv`, 'text/csv;charset=utf-8;');
      showAlert('¡Inventario exportado con éxito!', 'success', 'cfgAlert');
    } catch (err) {
      console.error(err);
      showAlert('Error al exportar el inventario.', 'error', 'cfgAlert');
    }
  };

  // --- CREAR RESPALDO TOTAL EN JSON ---
  document.getElementById('btnExportJson').onclick = async () => {
    try {
      const [productosRes, facturasRes] = await Promise.all([
        supabase.from('productos').select('*'),
        supabase.from('facturas').select('*')
      ]);

      if (productosRes.error) throw productosRes.error;
      if (facturasRes.error) throw facturasRes.error;

      const backupData = {
        empresa: localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre,
        fecha_respaldo: new Date().toISOString(),
        configuraciones: {
          iva: localStorage.getItem('moto_crm_iva_rate'),
          tasa_bcv_manual: localStorage.getItem('moto_crm_manual_bcv')
        },
        productos: productosRes.data || [],
        facturas: facturasRes.data || []
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const currentDate = new Date().toISOString().split('T')[0];
      downloadFile(jsonString, `respaldo_total_${currentDate}.json`, 'application/json');
      showAlert('¡Respaldo total en JSON generado con éxito!', 'success', 'cfgAlert');
    } catch (err) {
      console.error(err);
      showAlert('Error al generar el respaldo JSON.', 'error', 'cfgAlert');
    }
  };

  // --- IMPORTAR INVENTARIO INTELIGENTE ---
  document.getElementById('btnImportCsv').onclick = async () => {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    if (!file) {
      showAlert('Por favor selecciona un archivo CSV primero.', 'error', 'cfgAlert');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== '');
        
        if (lines.length < 2) {
          showAlert('El archivo CSV está vacío.', 'error', 'cfgAlert');
          return;
        }

        const headerCols = lines[0].split(',').map(c => c.replace(/"/g, '').trim().toLowerCase());
        const nameIdx = headerCols.findIndex(h => h.includes('nombre'));
        const priceIdx = headerCols.findIndex(h => h.includes('precio') || h.includes('usd'));
        const stockIdx = headerCols.findIndex(h => h.includes('stock'));

        if (nameIdx === -1 || priceIdx === -1 || stockIdx === -1) {
          showAlert('El CSV debe contener: nombre, precio_usd, stock.', 'error', 'cfgAlert');
          return;
        }

        const { data: currentProducts, error: fetchError } = await supabase.from('productos').select('*');
        if (fetchError) throw fetchError;

        const productosAActualizar = [];
        const productosAInsertar = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const cols = [];
          let insideQuote = false;
          let currentVal = '';
          
          for (let char of row) {
            if (char === '"') {
              insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
              cols.push(currentVal.trim());
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          cols.push(currentVal.trim());

          const nombreCsv = cols[nameIdx]?.replace(/"/g, '').trim();
          const precio_usd = parseFloat(cols[priceIdx]?.replace(/"/g, '').trim());
          const stockCsv = parseInt(cols[stockIdx]?.replace(/"/g, '').trim(), 10);

          if (nombreCsv && !isNaN(precio_usd) && !isNaN(stockCsv)) {
            const existingProduct = currentProducts.find(p => p.nombre.toLowerCase() === nombreCsv.toLowerCase());

            if (existingProduct) {
              productosAActualizar.push({
                id: existingProduct.id,
                nombre: nombreCsv,
                precio_usd: precio_usd,
                stock: existingProduct.stock + stockCsv
              });
            } else {
              productosAInsertar.push({
                nombre: nombreCsv,
                precio_usd: precio_usd,
                stock: stockCsv
              });
            }
          }
        }

        if (productosAInsertar.length > 0) {
          const { error: insertError } = await supabase.from('productos').insert(productosAInsertar);
          if (insertError) throw insertError;
        }

        for (let prod of productosAActualizar) {
          const { error: updateError } = await supabase
            .from('productos')
            .update({ stock: prod.stock, precio_usd: prod.precio_usd })
            .eq('id', prod.id);
          
          if (updateError) throw updateError;
        }

        showAlert(`¡Sincronización exitosa! Nuevos: ${productosAInsertar.length}, Actualizados: ${productosAActualizar.length}`, 'success', 'cfgAlert');
        fileInput.value = '';
      } catch (err) {
        console.error(err);
        showAlert('Error al procesar la importación en Supabase.', 'error', 'cfgAlert');
      }
    };
    reader.readAsText(file);
  };

  document.getElementById('btnClearCache').onclick = () => {
    showConfirmModal({
      title: "¿Limpiar caché local?",
      message: "Esto borrará los datos almacenados temporalmente en el navegador, manteniendo intacta tu sesión y datos en la nube.",
      confirmText: "Sí, Limpiar",
      onConfirm: () => {
        const session = localStorage.getItem('moto_crm_session');
        const theme = localStorage.getItem('moto_crm_theme_color');
        const logo = localStorage.getItem('moto_crm_custom_logo');
        const company = localStorage.getItem('moto_crm_company_name');
        
        localStorage.clear();

        if (session) localStorage.setItem('moto_crm_session', session);
        if (theme) localStorage.setItem('moto_crm_theme_color', theme);
        if (logo) localStorage.setItem('moto_crm_custom_logo', logo);
        if (company) localStorage.setItem('moto_crm_company_name', company);

        showAlert('¡Caché local limpiada correctamente!', 'success', 'cfgAlert');
      }
    });
  };

  document.getElementById('btnResetOriginal').onclick = () => {
    showConfirmModal({
      title: "¿Volver al estado original?",
      message: "Esto eliminará tu logotipo personalizado, la paleta extraída y restablecerá los valores por defecto.",
      confirmText: "Sí, Restaurar",
      onConfirm: () => {
        localStorage.clear();
        applyDynamicTheme('#0284c7', null);
        showAlert('Sistema restaurado al estado original.', 'success', 'cfgAlert');
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}