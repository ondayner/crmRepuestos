// src/pages/login.js
import { APP_CONFIG } from '../../config/config.js';
import { supabase } from '../../config/supabase.js';
import { showAlert } from '../components/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const companyName = localStorage.getItem('moto_crm_company_name') || APP_CONFIG.empresa.nombre;
  document.getElementById('appTitle').textContent = `Login - ${companyName}`;
  document.getElementById('appHeading').textContent = companyName;

  const usernameInput = document.getElementById('username');
  const pinInput = document.getElementById('pin');
  const usernameError = document.getElementById('usernameError');
  const pinError = document.getElementById('pinError');
  const submitBtn = document.getElementById('submitBtn');
  const togglePinBtn = document.getElementById('togglePinBtn');
  const rememberCheckbox = document.getElementById('rememberMe');
  const loginForm = document.getElementById('loginForm');
  const btnBiometric = document.getElementById('btnBiometric');

  const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();

  // Mostrar el botón de huella en la app nativa sin requerir que el checkbox esté marcado de entrada
  if (isNativeApp && btnBiometric) {
    btnBiometric.classList.remove('hidden');

    btnBiometric.addEventListener('click', async () => {
      try {
        const NativeBiometric = window.Capacitor?.Plugins?.NativeBiometric;
        
        if (!NativeBiometric) {
          showAlert('El plugin biométrico no está disponible.', 'error', 'loginAlert');
          return;
        }

        const result = await NativeBiometric.isAvailable();
        if (!result.isAvailable) {
          showAlert('Este dispositivo no soporta biometría o no tiene huellas.', 'warning', 'loginAlert');
          return;
        }

        const verified = await NativeBiometric.verify({
          reason: "Inicia sesión con tu huella digital",
          title: "Acceso Biométrico",
          subtitle: "Verifica tu identidad",
          description: "Coloca tu dedo en el sensor"
        });

        // Verificamos si la respuesta del plugin fue exitosa
        if (verified === true || verified?.verified === true) {
          const savedUser = localStorage.getItem('moto_crm_username');
          const savedPin = localStorage.getItem('moto_crm_pin');

          if (!savedUser || !savedPin) {
            showAlert('Por favor, inicia sesión con tu usuario y PIN una vez marcando "Recordar usuario y PIN".', 'warning', 'loginAlert');
            return;
          }

          // Autenticación automática con Supabase usando las credenciales guardadas
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', savedUser)
            .eq('pin_acceso', savedPin)
            .single();

          if (error || !data) {
            showAlert('Credenciales guardadas inválidas. Inicia sesión manualmente.', 'error', 'loginAlert');
            return;
          }

          localStorage.setItem('moto_crm_session', JSON.stringify({
            id: data.id,
            username: data.username,
            rol: data.rol
          }));

          window.location.href = 'app.html';
        }
      } catch (err) {
        console.log("Error o cancelación biométrica:", err);
        // Si el usuario cancela el recuadro de la huella, no bloqueamos la app, solo lo ignoramos
      }
    });
  }

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