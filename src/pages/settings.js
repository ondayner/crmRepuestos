// src/pages/settings.js
import { APP_CONFIG } from '../../config/config.js';
import { showAlert, showConfirmModal, compressImage } from '../components/ui.js';
import { applyDynamicTheme, extractPaletteFromImage } from '../utils/themeManager.js';

export function renderSettings(container) {
  const currentIva = localStorage.getItem('moto_crm_iva_rate') || '16';
  const currentTheme = localStorage.getItem('moto_crm_theme_color') || '#0284c7';
  const companyName = localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre;
  const customLogo = localStorage.getItem('moto_crm_custom_logo') || '';
  
  // Recuperar paleta personalizada o usar la predeterminada
  const defaultPalette = ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  const currentPalette = JSON.parse(localStorage.getItem('moto_crm_custom_palette') || JSON.stringify(defaultPalette));

  const paletteButtonsHtml = currentPalette.map(color => {
    const isSelected = currentTheme === color ? 'ring-2 ring-white scale-105' : '';
    return `<button data-color="${color}" style="background-color: ${color};" class="h-10 rounded-xl border-2 border-white/20 hover:scale-105 transition-all shadow-sm ${isSelected}"></button>`;
  }).join('');

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto pb-10">
      
      <!-- Header -->
      <div class="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <h1 class="text-xl font-black text-[var(--text-main)]">Configuración del Sistema</h1>
        <p class="text-xs text-[var(--text-muted)]">Personaliza el IVA, los datos, el logotipo y la identidad visual de tu app</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- PARÁMETROS FISCALES Y DE NEGOCIO -->
        <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
          <h2 class="font-bold text-sm text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
            Parámetros de Facturación
          </h2>

          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Nombre del Negocio (En Recibos y Menú)</label>
            <input type="text" id="cfgCompanyName" value="${companyName}" class="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] focus:outline-none focus:border-[var(--color-brand)] font-semibold">
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Porcentaje de IVA por Defecto (%)</label>
            <input type="number" id="cfgIvaRate" step="0.1" value="${currentIva}" class="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-brand)]">
          </div>

          <button id="btnSaveConfig" class="w-full py-2.5 bg-[var(--color-brand)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md mt-2">
            Guardar Cambios Fiscales
          </button>
        </div>

        <!-- PERSONALIZACIÓN VISUAL Y LOGOTIPO (WHITE LABEL) -->
        <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
          <h2 class="font-bold text-sm text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
            Identidad Visual y Logotipo
          </h2>

          <!-- Subir Logo Personalizado -->
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

          <!-- Selector de Temas Dinámico -->
          <div class="space-y-2 pt-2">
            <label class="block text-xs font-bold uppercase text-[var(--text-muted)]">Color de Acento Principal (Sugeridos del Logo):</label>
            <div class="grid grid-cols-5 gap-3" id="paletteContainer">
              ${paletteButtonsHtml}
            </div>
          </div>

          <div id="cfgAlert" class="hidden pt-1"></div>
        </div>

      </div>

      <!-- ZONA DE PRUEBAS / RESTAURAR ESTADO ORIGINAL -->
      <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-red-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p class="text-xs text-[var(--text-muted)]">Restaura el logotipo predeterminado, los colores iniciales y borra las configuraciones locales de prueba.</p>
        </div>
        <button id="btnResetOriginal" class="w-full sm:w-auto py-2.5 px-5 bg-red-500/10 border border-red-500/30 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0">
          Volver a Estado Original
        </button>
      </div>

    </div>
  `;

  setupSettingsEvents(container);
}

function setupSettingsEvents(container) {
  document.getElementById('btnSaveConfig').onclick = () => {
    const name = document.getElementById('cfgCompanyName').value.trim();
    const iva = document.getElementById('cfgIvaRate').value.trim();

    if (!name || isNaN(iva)) {
      showAlert('Por favor ingresa datos válidos.', 'error', 'cfgAlert');
      return;
    }

    showConfirmModal(`¿Estás seguro de actualizar los parámetros fiscales a Nombre: "${name}" e IVA: "${iva}%"?`, () => {
      localStorage.setItem('moto_crm_company_name', name);
      localStorage.setItem('moto_crm_iva_rate', iva);

      document.querySelectorAll('aside h2, header h2').forEach(el => {
        if (el.id !== 'appTitle') el.textContent = name;
      });
      document.title = `${name} - CRM`;

      showAlert('¡Parámetros fiscales actualizados con éxito!', 'success', 'cfgAlert');
    });
  };

  // Delegación de eventos para los botones de color dinámicos
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

  // Subir Logo Personalizado y Extraer Paleta de Colores
  const logoFileInput = document.getElementById('cfgLogoFile');
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');

  logoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 200, 0.8);
        
        // Extraer paleta de 5 colores del logotipo subido
        const newPalette = await extractPaletteFromImage(compressedBase64);
        localStorage.setItem('moto_crm_custom_palette', JSON.stringify(newPalette));

        // Aplicar por defecto el primer color de la paleta extraída y el logo
        applyDynamicTheme(newPalette[0], compressedBase64);

        showAlert('¡Logotipo subido y paleta de colores sincronizada!', 'success', 'cfgAlert');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showAlert('Error al procesar la imagen del logotipo.', 'error', 'cfgAlert');
      }
    }
  });

  // Quitar Logo Personalizado
  btnRemoveLogo.addEventListener('click', () => {
    localStorage.removeItem('moto_crm_custom_logo');
    localStorage.removeItem('moto_crm_custom_palette');
    showAlert('Logotipo y colores restablecidos.', 'success', 'cfgAlert');
    setTimeout(() => window.location.reload(), 1000);
  });

  // Botón Volver a Estado Original
  document.getElementById('btnResetOriginal').onclick = () => {
    showConfirmModal({
      title: "¿Volver al estado original?",
      message: "Esto eliminará tu logotipo personalizado, la paleta extraída y restablecerá los valores por defecto.",
      confirmText: "Sí, Restaurar",
      onConfirm: () => {
        localStorage.removeItem('moto_crm_custom_logo');
        localStorage.removeItem('moto_crm_custom_palette');
        localStorage.removeItem('moto_crm_theme_color');
        localStorage.removeItem('moto_crm_company_name');
        localStorage.removeItem('moto_crm_iva_rate');

        applyDynamicTheme('#0284c7', null);

        showAlert('Sistema restaurado al estado original.', 'success', 'cfgAlert');
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };
}