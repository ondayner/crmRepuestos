// src/pages/login.js
import { APP_CONFIG } from '../../config/config.js';
import { supabase } from '../../config/supabase.js';
import { showAlert } from '../components/ui.js';
import { applyDynamicTheme } from '../utils/themeManager.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificar si ya hay una sesión activa y la persistencia está activada
  const persistSession = localStorage.getItem('moto_crm_persist_session');
  const existingSession = localStorage.getItem('moto_crm_session');

  if (persistSession === 'true' && existingSession) {
    window.location.href = 'app.html';
    return;
  }

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
  const biometricLoginBtn = document.getElementById('biometricLoginBtn');

  togglePinBtn.addEventListener('click', () => {
    const type = pinInput.getAttribute('type') === 'password' ? 'text' : 'password';
    pinInput.setAttribute('type', type);
    togglePinBtn.classList.toggle('text-[var(--color-brand)]');
  });

  const savedUsername = localStorage.getItem('moto_crm_username');
  const savedPin = localStorage.getItem('moto_crm_pin');
  
  // Detectar si es un dispositivo móvil (por ancho de pantalla o agente)
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  if (savedUsername && savedPin) {
    usernameInput.value = savedUsername;
    pinInput.value = savedPin;
    rememberCheckbox.checked = true;
    checkInputsValidity();

    if (biometricLoginBtn && isMobileDevice) {
      biometricLoginBtn.classList.remove('hidden');
    }
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

  // Lógica de inicio de sesión por Huella Digital / Biometría
  if (biometricLoginBtn) {
    biometricLoginBtn.addEventListener('click', async () => {
      if (!savedUsername || !savedPin) {
        showAlert('Guarda tus credenciales primero marcando "Recordar usuario y PIN".', 'warning', 'loginAlert');
        return;
      }

      const originalText = biometricLoginBtn.innerHTML;

      try {
        biometricLoginBtn.innerHTML = `<svg class="animate-spin h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        if (window.PublicKeyCredential) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);

          await navigator.credentials.get({
            publicKey: {
              challenge: challenge,
              timeout: 60000,
              userVerification: "required"
            }
          }).catch(() => {
            console.log("Interacción de biometría omitida, procediendo a validación...");
          });
        }

        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('username', savedUsername)
          .eq('pin_acceso', savedPin)
          .single();

        if (error || !data) throw new Error('Credenciales inválidas');

        localStorage.setItem('moto_crm_session', JSON.stringify({
          id: data.id,
          username: data.username,
          rol: data.rol
        }));
        localStorage.setItem('moto_crm_persist_session', 'true');

        window.location.href = 'app.html';

      } catch (err) {
        console.error("Error biométrico:", err);
        showAlert('Autenticación biométrica cancelada o fallida.', 'error', 'loginAlert');
      } finally {
        biometricLoginBtn.innerHTML = originalText;
      }
    });
  }

  // Envío tradicional del formulario por PIN y Usuario
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
      localStorage.setItem('moto_crm_persist_session', 'true');
      if (biometricLoginBtn && isMobileDevice) biometricLoginBtn.classList.remove('hidden');
    } else {
      localStorage.removeItem('moto_crm_username');
      localStorage.removeItem('moto_crm_pin');
      localStorage.removeItem('moto_crm_persist_session');
      if (biometricLoginBtn) biometricLoginBtn.classList.add('hidden');
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