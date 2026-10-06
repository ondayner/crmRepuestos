// src/components/layout.js
import { APP_CONFIG } from '../../config/config.js';

export function renderLayout(activeModule = 'pos', onNavigateCallback) {
  const root = document.getElementById('layout-root');
  const session = JSON.parse(localStorage.getItem('moto_crm_session') || '{}');
  const currentCompanyName = localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre;

  const navItems = [
    { 
      id: 'pos', 
      name: 'Vender', 
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1 md:mr-3 md:mb-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>` 
    },
    { 
      id: 'inventory', 
      name: 'Inventario', 
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1 md:mr-3 md:mb-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>` 
    },
    { 
      id: 'history', 
      name: 'Historial', 
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1 md:mr-3 md:mb-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` 
    },
    { 
      id: 'settings', 
      name: 'Ajustes', 
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1 md:mr-3 md:mb-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>` 
    }
  ];

  const sidebarLinksHtml = navItems.map(item => {
    const isActive = item.id === activeModule;
    const activeClass = isActive 
      ? 'bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/20' 
      : 'text-[var(--text-muted)] hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand)]';
    
    return `
      <button data-module="${item.id}" class="nav-btn-pc w-full flex items-center p-3 rounded-xl transition-all duration-200 font-medium ${activeClass}">
        ${item.icon} <span>${item.name}</span>
      </button>
    `;
  }).join('');

  const bottomNavLinksHtml = navItems.map(item => {
    const isActive = item.id === activeModule;
    const activeClass = isActive 
      ? 'text-[var(--color-brand)]' 
      : 'text-[var(--text-muted)] hover:text-[var(--color-brand)]';
    
    return `
      <li class="w-1/4 flex justify-center">
        <button data-module="${item.id}" class="nav-btn-mobile flex flex-col items-center p-1.5 w-full transition-colors duration-200 ${activeClass}">
          ${item.icon}
          <span class="text-[9px] font-bold tracking-wide">${item.name}</span>
        </button>
      </li>
    `;
  }).join('');

  root.innerHTML = `
    <!-- SIDEBAR COMPONENT (PC) -->
    <aside class="hidden md:flex flex-col w-64 h-full bg-[var(--bg-surface)] border-r border-[var(--border-color)] shadow-xl z-20">
      <div class="p-6 border-b border-[var(--border-color)] flex items-center gap-3">
        <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-brand)] text-white shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>
        </div>
        <h2 class="text-xl font-extrabold text-[var(--color-brand)] truncate">${currentCompanyName}</h2>
      </div>

      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        ${sidebarLinksHtml}
      </nav>

      <div class="p-4 border-t border-[var(--border-color)]">
        <div class="flex items-center justify-between mb-4 px-2">
          <span class="text-sm font-semibold truncate">${session.username || 'Usuario'}</span>
          <span class="text-xs bg-[var(--color-brand)]/20 text-[var(--color-brand)] px-2 py-1 rounded-full font-bold uppercase tracking-wider">${session.rol || 'Rol'}</span>
        </div>
        <button id="btnLogoutPC" class="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Salir
        </button>
      </div>
    </aside>

    <!-- ÁREA DE CONTENIDO Y HEADER/FOOTER MÓVIL -->
    <main class="flex-1 h-full relative flex flex-col overflow-hidden">
      <header class="md:hidden flex-none bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-color)] p-4 flex justify-between items-center z-10 pt-safe">
        <h2 class="text-lg font-extrabold text-[var(--color-brand)] truncate">${currentCompanyName}</h2>
        <button id="btnLogoutMobile" class="text-[var(--text-muted)] hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </header>

      <div id="app-content" class="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto"></div>

      <nav class="md:hidden flex-none absolute bottom-0 left-0 right-0 bg-[var(--bg-surface)]/95 backdrop-blur-xl border-t border-[var(--border-color)] shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] z-20 pb-safe">
        <ul class="flex justify-around items-center h-16 px-1">
          ${bottomNavLinksHtml}
        </ul>
      </nav>
    </main>
  `;

  document.querySelectorAll('.nav-btn-pc, .nav-btn-mobile').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetModule = btn.getAttribute('data-module');
      if (onNavigateCallback) onNavigateCallback(targetModule);
    });
  });

  const handleLogout = () => {
    localStorage.removeItem('moto_crm_session');
    window.location.replace('index.html');
  };

  document.getElementById('btnLogoutPC')?.addEventListener('click', handleLogout);
  document.getElementById('btnLogoutMobile')?.addEventListener('click', handleLogout);
}