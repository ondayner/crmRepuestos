// src/pages/login.js
import { APP_CONFIG } from '../../config/config.js';
import { supabase } from '../../config/supabase.js';
import { showAlert } from '../components/ui.js';
import { applyDynamicTheme } from '../utils/themeManager.js';

document.addEventListener('DOMContentLoaded', () => {
  // Aplicar tema dinámico y logo personalizado en el Login
  applyDynamicTheme();

  const companyName = localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre;
  const customLogo = localStorage.getItem('moto_crm_custom_logo') || '';

  document.getElementById('appTitle').textContent = `Login - ${companyName}`;
  document.getElementById('appHeading').textContent = companyName;

  // Renderizar logo en la tarjeta de login de forma dinámica
  const loginLogoContainer = document.getElementById('loginLogoContainer');
  if (loginLogoContainer) {
    if (customLogo) {
      loginLogoContainer.innerHTML = `<img src="${customLogo}" class="w-full h-full object-cover rounded-xl" />`;
    } else {
      loginLogoContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
          <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" fill="currentColor" fill-opacity="0.2"/>
          <circle cx="12" cy="12" r="3" fill="var(--bg-surface)" stroke="currentColor" stroke-width="2"/>
        </svg>
      `;
    }
  }

  const usernameInput = document.getElementById('username');
  const pinInput = document.getElementById('pin');
  const usernameError = document.getElementById('usernameError');
  const pinError = document.getElementById('pinError');
  const submitBtn = document.getElementById('submitBtn');
  const togglePinBtn = document.getElementById('togglePinBtn');
  const rememberCheckbox = document.getElementById('rememberMe');
  const loginForm = document.getElementById('loginForm');

  togglePinBtn.addEventListener('click', () => {
    const type = pinInput.getAttribute('type') === 'password' ? 'text' : 'password';
    pinInput.setAttribute('type', type);
    togglePinBtn.classList.toggle('text-[var(--color-brand)]');
  });

  const savedUsername = localStorage.getItem('moto_crm_username');
  const savedPin = localStorage.getItem('moto_crm_pin');
  
  if (savedUsername && savedPin) {
    usernameInput.value = savedUsername;
    pinInput.value = savedPin;
    rememberCheckbox.checked = true;
    checkInputsValidity();
  }

  function checkInputsValidity() {
    const isUserValid = usernameInput.value.trim() !== '';
    const isPinValid = pinInput.value.trim() !== '';

    if (isUserValid) usernameError.classList.add('hidden');
    if (isPinValid) pinError.classList.add('hidden');

    submitBtn.disabled = !(isUserValid && isPinValid);
  }

  usernameInput.addEventListener('input', checkInputsValidity);
  pinInput.addEventListener('input', checkInputsValidity);
  
  checkInputsValidity();

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userVal = usernameInput.value.trim();
    const pinVal = pinInput.value.trim();

    let hasError = false;

    if (!userVal) {
      usernameError.classList.remove('hidden');
      hasError = true;
    }
    if (!pinVal) {
      pinError.classList.remove('hidden');
      hasError = true;
    }

    if (hasError) return;

    if (rememberCheckbox.checked) {
      localStorage.setItem('moto_crm_username', userVal);
      localStorage.setItem('moto_crm_pin', pinVal);
    } else {
      localStorage.removeItem('moto_crm_username');
      localStorage.removeItem('moto_crm_pin');
    }

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span>Verificando...</span>`;
    submitBtn.disabled = true;

    document.getElementById('loginAlert')?.classList.add('hidden');

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', userVal)
        .eq('pin_acceso', pinVal)
        .single();

      if (error || !data) throw new Error('Credenciales inválidas');

      localStorage.setItem('moto_crm_session', JSON.stringify({
        id: data.id,
        username: data.username,
        rol: data.rol
      }));

      window.location.href = 'app.html';

    } catch (err) {
      console.error("Error en login:", err);
      showAlert('Usuario o PIN incorrecto.', 'error', 'loginAlert');
      pinInput.value = '';
      checkInputsValidity();
      pinInput.focus();
    } finally {
      submitBtn.innerHTML = originalBtnText;
    }
  });
});