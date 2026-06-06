import { gerarPlano, simularQuitarDividas } from './src/services/calculadora.js';

console.log("=== INICIANDO TESTE DA CALCULADORA ===");

// Cenário Controlado
const resumoPerfil = {
  renda_mensal: 3000,
  total_essencial: 1500,
  total_nao_essencial: 800,
  tem_renda_extra: true,
  valor_renda_extra: 500
};

const dividas = [
  { id: 1, descricao: 'Cartão', valor_total: 1000, juros_mensal: 10, parcelas_restantes: 12 }, // Juros alto (Alta prioridade)
  { id: 2, descricao: 'Carro', valor_total: 5000, juros_mensal: 2, parcelas_restantes: 48 }   // Juros baixo (Baixa prioridade)
];

// Cálculo esperado no papel (baseado na calculadora):
// TAXA_CORTE = 0.70
// economia_mensal = 800 * 0.7 = 560
// valor_disponivel = 3000 - 1500 - (800 * 0.3) = 1500 - 240 = 1260
console.log("Valor disponível esperado: 1260");

const plano = gerarPlano(resumoPerfil, dividas);
console.log("\n--- Resultado do Plano ---");
console.log(`Economia Mensal: ${plano.valor_economia_mensal}`);
console.log(`Valor Disponível: ${plano.valor_disponivel}`);
console.log(`Meses para quitar (sem extra): ${plano.meses_para_quitar}`);
console.log(`Meses para quitar (com extra): ${plano.meses_com_renda_extra}`);
console.log(`Recomendações:\n${plano.recomendacoes}`);

// Teste de Caso de Borda: Pagamento não cobre os juros
const perfilRuim = {
  renda_mensal: 2000,
  total_essencial: 1900,
  total_nao_essencial: 100, // Sobra mto pouco, valor disp = 2000 - 1900 - 30 = 70.
  tem_renda_extra: false,
  valor_renda_extra: 0
};
// Juros da divida de 1000 a 10% é 100. Valor disp 70 < 100. Nunca vai pagar.
const planoRuim = gerarPlano(perfilRuim, dividas);
console.log("\n--- Resultado Plano Caso de Borda ---");
console.log(`Meses para quitar (esperado null): ${planoRuim.meses_para_quitar}`);

console.log("\n=== TESTE CONCLUÍDO ===");
