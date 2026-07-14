import {
  UtensilsCrossed, Home, Car, HeartPulse,
  BookOpen, Music2, Shirt, Wrench, CreditCard, MoreHorizontal,
} from 'lucide-react';

/**
 * Fonte única de verdade para categorias do app.
 * Chave = valor exato armazenado em itens_compromisso.categoria
 */
export const CATEGORIES = {
  'Alimentação': { icon: UtensilsCrossed, color: '#f59e0b', bg: '#f59e0b18' },
  'Moradia':     { icon: Home,            color: '#3b82f6', bg: '#3b82f618' },
  'Transporte':  { icon: Car,             color: '#8b5cf6', bg: '#8b5cf618' },
  'Saúde':       { icon: HeartPulse,      color: '#ef4444', bg: '#ef444418' },
  'Educação':    { icon: BookOpen,        color: '#06b6d4', bg: '#06b6d418' },
  'Lazer':       { icon: Music2,          color: '#ec4899', bg: '#ec489918' },
  'Vestuário':   { icon: Shirt,           color: '#f97316', bg: '#f9731618' },
  'Serviços':    { icon: Wrench,          color: '#6b7280', bg: '#6b728018' },
  'Dívidas':     { icon: CreditCard,      color: '#dc2626', bg: '#dc262618' },
  'Outros':      { icon: MoreHorizontal,  color: '#9ca3af', bg: '#9ca3af18' },
};

const FALLBACK = { icon: MoreHorizontal, color: '#9ca3af', bg: '#9ca3af18' };

export function getCategory(name) {
  return CATEGORIES[name] ?? FALLBACK;
}
