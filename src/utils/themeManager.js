// src/utils/themeManager.js

/**
 * Aplica globalmente el color de acento y el logotipo personalizado en la app y en el head
 */
export function applyDynamicTheme(brandColor = null, customLogoUrl = null) {
  const savedColor = brandColor || localStorage.getItem('moto_crm_theme_color') || '#0284c7';
  const savedLogo = customLogoUrl !== undefined ? customLogoUrl : localStorage.getItem('moto_crm_custom_logo');

  // 1. Aplicar color de marca en la raíz del documento
  document.documentElement.style.setProperty('--color-brand', savedColor);
  localStorage.setItem('moto_crm_theme_color', savedColor);

  if (customLogoUrl !== null) {
    if (customLogoUrl) {
      localStorage.setItem('moto_crm_custom_logo', customLogoUrl);
    } else {
      localStorage.removeItem('moto_crm_custom_logo');
    }
  }

  // 2. Construir favicon dinámico optimizado para el Head
  let faviconHref = '';
  if (savedLogo) {
    // Favicon en base64 limpio optimizado para el head
    faviconHref = savedLogo;
  } else {
    faviconHref = `data:image/svg+xml;utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915' stroke='${encodeURIComponent(savedColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='${encodeURIComponent(savedColor)}' fill-opacity='0.25'/%3E%3Ccircle cx='12' cy='12' r='3' stroke='${encodeURIComponent(savedColor)}' stroke-width='2' fill='%230f172a'/%3E%3C/svg%3E`;
  }

  // Forzar actualización total del link icon en el Head
  let link = document.querySelector("link[rel*='icon']");
  if (link) {
    link.parentNode.removeChild(link);
  }
  
  const newLink = document.createElement('link');
  newLink.type = savedLogo ? 'image/png' : 'image/svg+xml';
  newLink.rel = 'icon';
  newLink.href = faviconHref;
  document.getElementsByTagName('head')[0].appendChild(newLink);
}

/**
 * Extrae una paleta de 5 colores distintos basados en la imagen usando Canvas
 */
export function extractPaletteFromImage(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 60;
      canvas.height = 60;
      ctx.drawImage(img, 0, 0, 60, 60);

      const colors = [];
      const step = 12;
      for (let y = 6; y < 60; y += step) {
        for (let x = 6; x < 60; x += step) {
          const data = ctx.getImageData(x, y, 1, 1).data;
          const r = data[0], g = data[1], b = data[2];
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 20 && brightness < 235) {
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            if (!colors.includes(hex)) {
              colors.push(hex);
            }
          }
        }
      }

      const defaults = ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
      while (colors.length < 5) {
        colors.push(defaults[colors.length % defaults.length]);
      }

      resolve(colors.slice(0, 5));
    };
    img.onerror = () => resolve(['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']);
  });
}