import { useState, useSyncExternalStore } from 'react';

const BANNER_KEY = 'sdd-install-banner-dismissed';

function bannerDispensado() {
  try { return localStorage.getItem(BANNER_KEY) === '1'; } catch { return false; }
}
function marcarBannerDispensado() {
  try { localStorage.setItem(BANNER_KEY, '1'); } catch { /* modo privado */ }
}

// O evento beforeinstallprompt é capturado pelo script inline do index.html (dispara
// antes de qualquer componente montar). Aqui só lemos esse estado e avisamos a UI.
const bus = (typeof window !== 'undefined' && window.__sddInstall) || { event: null, installed: false };

const listeners = new Set();
let snapshot = { podeInstalar: !!bus.event, instalado: bus.installed };

function atualizar() {
  const proximo = { podeInstalar: !!bus.event, instalado: bus.installed };
  // useSyncExternalStore compara por identidade: só troca o objeto se algo mudou
  if (proximo.podeInstalar !== snapshot.podeInstalar || proximo.instalado !== snapshot.instalado) {
    snapshot = proximo;
    // Instalou: não voltamos a oferecer nem se o usuário reabrir pelo navegador
    if (proximo.instalado) marcarBannerDispensado();
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('sdd:install-change', atualizar);
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getSnapshot = () => snapshot;

/** iPadOS 13+ se identifica como "Macintosh"; o toque é o que o distingue de um Mac. */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iphone = /iPad|iPhone|iPod/.test(ua);
  const ipadComoMac = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  return iphone || ipadComoMac;
}

/** Já rodando instalado — no iOS antigo só `navigator.standalone` responde. */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

/**
 * Dispara o prompt nativo. O evento é de uso único: descartamos antes de aguardar o
 * desfecho, então tanto "accepted" quanto "dismissed" deixam de oferecer o botão
 * (antes, um "dismissed" deixava um botão morto que não fazia mais nada).
 */
export async function promptInstall() {
  const evento = bus.event;
  if (!evento) return 'unavailable';
  bus.event = null;
  atualizar();
  evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome;
}

export function usePwaInstall() {
  const { podeInstalar, instalado } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const ios = isIOS();
  return {
    instalado,
    ios,
    // No iOS não há prompt programático: oferecemos a instrução manual.
    podeOferecer: !instalado && !isStandalone() && (podeInstalar || ios),
    promptInstall,
  };
}

/**
 * Banner de descoberta na tela Início. Some ao ser dispensado (localStorage) e
 * depois de instalar — mas o caminho pelo sheet do avatar continua disponível,
 * então dispensar não fecha a porta.
 */
export function useInstallBanner() {
  const { podeOferecer, ios, promptInstall: instalar } = usePwaInstall();
  const [dispensado, setDispensado] = useState(bannerDispensado);
  return {
    visivel: podeOferecer && !dispensado,
    ios,
    instalar,
    dispensar: () => { marcarBannerDispensado(); setDispensado(true); },
  };
}
