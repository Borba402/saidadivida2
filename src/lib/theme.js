// Aplicado primeiro em index.html (script inline, antes do paint).
// Este módulo só lê/atualiza o estado já definido no boot — sem duplicar a decisão de tema.

export function getCurrentTheme() {
  return document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
}

export function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.classList.toggle('theme-light', theme === 'light');
}
