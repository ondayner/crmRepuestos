// src/main.js
import { APP_CONFIG } from '../config/config.js';
import { renderLayout } from './components/layout.js';
import { renderInventory } from './pages/inventory.js';
import { renderPOS } from './pages/pos.js';
import { renderHistory } from './pages/history.js';
import { renderSettings } from './pages/settings.js';

document.addEventListener('DOMContentLoaded', () => {
  const session = localStorage.getItem('moto_crm_session');
  if (!session) {
    window.location.replace('index.html');
    return;
  }

  // Aplicar color de marca guardado en localStorage de forma global
  const savedTheme = localStorage.getItem('moto_crm_theme_color');
  if (savedTheme) {
    document.documentElement.style.setProperty('--color-brand', savedTheme);
  }

  const companyName = localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre;
  document.getElementById('appTitle').textContent = `${companyName} - CRM`;

  function loadModule(moduleId) {
    renderLayout(moduleId, loadModule);
    const contentArea = document.getElementById('app-content');

    if (moduleId === 'pos') {
      renderPOS(contentArea);
    } else if (moduleId === 'inventory') {
      renderInventory(contentArea);
    } else if (moduleId === 'history') {
      renderHistory(contentArea);
    } else if (moduleId === 'settings') {
      renderSettings(contentArea);
    } else {
      contentArea.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center animate-fade-in">
          <div class="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xl text-center">
            <h2 class="text-2xl font-bold text-[var(--color-brand)] mb-2">Módulo: ${moduleId.toUpperCase()}</h2>
            <p class="text-[var(--text-muted)]">Próximamente en la siguiente fase.</p>
          </div>
        </div>
      `;
    }
  }

  loadModule('pos');
});