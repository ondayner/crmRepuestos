// src/pages/settings.js
import { APP_CONFIG } from '../../config/config.js';
import { showAlert, showConfirmModal } from '../components/ui.js';

export function renderSettings(container) {
  const currentIva = localStorage.getItem('moto_crm_iva_rate') || '16';
  const currentTheme = localStorage.getItem('moto_crm_theme_color') || '#0284c7';
  const companyName = localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre;

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto">
      
      <!-- Header -->
      <div class="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <h1 class="text-xl font-black text-[var(--text-main)]">Configuración del Sistema</h1>
        <p class="text-xs text-[var(--text-muted)]">Personaliza el IVA, el color de la interfaz y los datos del negocio</p>
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

        <!-- PERSONALIZACIÓN VISUAL (TEMAS DE COLOR) -->
        <div class="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
          <h2 class="font-bold text-sm text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
            Tema de la Interfaz
          </h2>

          <p class="text-xs text-[var(--text-muted)]">Selecciona el color de acento principal para botones y resaltados:</p>

          <div class="grid grid-cols-5 gap-3 pt-2">
            <button data-color="#0284c7" class="h-10 rounded-xl bg-sky-600 border-2 border-white/20 hover:scale-105 transition-all shadow-sm ${currentTheme === '#0284c7' ? 'ring-2 ring-white scale-105' : ''}"></button>
            <button data-color="#10b981" class="h-10 rounded-xl bg-emerald-500 border-2 border-white/20 hover:scale-105 transition-all shadow-sm ${currentTheme === '#10b981' ? 'ring-2 ring-white scale-105' : ''}"></button>
            <button data-color="#8b5cf6" class="h-10 rounded-xl bg-violet-500 border-2 border-white/20 hover:scale-105 transition-all shadow-sm ${currentTheme === '#8b5cf6' ? 'ring-2 ring-white scale-105' : ''}"></button>
            <button data-color="#f59e0b" class="h-10 rounded-xl bg-amber-500 border-2 border-white/20 hover:scale-105 transition-all shadow-sm ${currentTheme === '#f59e0b' ? 'ring-2 ring-white scale-105' : ''}"></button>
            <button data-color="#ef4444" class="h-10 rounded-xl bg-red-500 border-2 border-white/20 hover:scale-105 transition-all shadow-sm ${currentTheme === '#ef4444' ? 'ring-2 ring-white scale-105' : ''}"></button>
          </div>

          <div id="cfgAlert" class="hidden pt-2"></div>
        </div>

      </div>

    </div>
  `;

  setupSettingsEvents(container);
}

function setupSettingsEvents(container) {
  // Guardar datos fiscales con Modal de Confirmación previo
  document.getElementById('btnSaveConfig').onclick = () => {
    const name = document.getElementById('cfgCompanyName').value.trim();
    const iva = document.getElementById('cfgIvaRate').value.trim();

    if (!name || isNaN(iva)) {
      showAlert('Por favor ingresa datos válidos.', 'error', 'cfgAlert');
      return;
    }

    // Invocar el modal centralizado en ui.js
    showConfirmModal(`¿Estás seguro de actualizar los parámetros fiscales a Nombre: "${name}" e IVA: "${iva}%"?`, () => {
      localStorage.setItem('moto_crm_company_name', name);
      localStorage.setItem('moto_crm_iva_rate', iva);

      // Actualizar DOM en tiempo real (Aside y Header)
      document.querySelectorAll('aside h2, header h2').forEach(el => {
        if (el.id !== 'appTitle') el.textContent = name;
      });
      document.title = `${name} - CRM`;

      showAlert('¡Parámetros fiscales actualizados con éxito!', 'success', 'cfgAlert');
    });
  };

  // Cambio de Tema de Color
  container.querySelectorAll('[data-color]').forEach(btn => {
    btn.onclick = () => {
      const color = btn.getAttribute('data-color');
      document.documentElement.style.setProperty('--color-brand', color);
      localStorage.setItem('moto_crm_theme_color', color);
      
      container.querySelectorAll('[data-color]').forEach(b => b.classList.remove('ring-2', 'ring-white', 'scale-105'));
      btn.classList.add('ring-2', 'ring-white', 'scale-105');

      showAlert('Color de interfaz actualizado al instante.', 'success', 'cfgAlert');
    };
  });
}