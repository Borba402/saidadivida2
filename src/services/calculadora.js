export const TAXA_CORTE_NAO_ESSENCIAL = 0.70;
export const LIMITE_MESES = 600;

/**
 * Calcula o plano financeiro baseando-se no resumo do perfil e na lista de dívidas.
 * 
 * @param {Object} resumoPerfil - Objeto com { renda_mensal, total_essencial, total_nao_essencial, tem_renda_extra, valor_renda_extra }
 * @param {Array} dividas - Array de objetos { id, descricao, valor_total, juros_mensal, parcelas_restantes }
 * @returns {Object} { economia_mensal, valor_disponivel, meses_para_quitar, meses_com_renda_extra, recomendacoes }
 */
export function gerarPlano(resumoPerfil, dividas) {
  const { renda_mensal, total_essencial, total_nao_essencial, tem_renda_extra, valor_renda_extra } = resumoPerfil;

  // 1. Cálculos base
  const economia_mensal = total_nao_essencial * TAXA_CORTE_NAO_ESSENCIAL;
  const valor_disponivel = renda_mensal - total_essencial - (total_nao_essencial * (1 - TAXA_CORTE_NAO_ESSENCIAL));

  // 2. Simulação sem renda extra
  let meses_para_quitar = null;
  if (valor_disponivel > 0) {
    meses_para_quitar = simularQuitarDividas(valor_disponivel, dividas);
  }

  // 3. Simulação com renda extra (se houver)
  let meses_com_renda_extra = null;
  const pagamento_extra = valor_disponivel + (tem_renda_extra ? valor_renda_extra : 0);
  if (tem_renda_extra && pagamento_extra > 0) {
    meses_com_renda_extra = simularQuitarDividas(pagamento_extra, dividas);
  }

  // Se o pagamento for maior mas a base já resolveu, ou se a base falha mas a extra resolve
  if (!tem_renda_extra) {
     meses_com_renda_extra = meses_para_quitar;
  }

  // 4. Recomendações
  const recomendacoes = gerarRecomendacoes(resumoPerfil, dividas, valor_disponivel, meses_para_quitar);

  return {
    valor_economia_mensal: economia_mensal,
    valor_disponivel,
    meses_para_quitar,
    meses_com_renda_extra,
    recomendacoes: recomendacoes.join('\n')
  };
}

/**
 * Simula a quitação de dívidas pelo método avalanche.
 * @param {number} pagamentoMensal - Valor disponível para pagar dívidas a cada mês.
 * @param {Array} dividasOriginais - Lista de dívidas.
 * @returns {number|null} Número de meses para quitar tudo, ou null se não for possível.
 */
export function simularQuitarDividas(pagamentoMensal, dividasOriginais) {
  if (dividasOriginais.length === 0) return 0;
  if (pagamentoMensal <= 0) return null;

  // Clona as dívidas para não alterar o array original
  let dividasSimulacao = dividasOriginais.map(d => ({
    ...d,
    saldo: d.valor_total
  }));

  let meses = 0;
  
  while (dividasSimulacao.reduce((acc, curr) => acc + curr.saldo, 0) > 0 && meses < LIMITE_MESES) {
    meses += 1;
    let jurosDoMes = 0;

    // Aplica juros em cada dívida
    for (let i = 0; i < dividasSimulacao.length; i++) {
      if (dividasSimulacao[i].saldo > 0) {
        const juros = dividasSimulacao[i].saldo * (dividasSimulacao[i].juros_mensal / 100);
        dividasSimulacao[i].saldo += juros;
        jurosDoMes += juros;
      }
    }

    // Se o pagamento mensal for sistematicamente menor que os juros gerados, nunca vai quitar
    if (pagamentoMensal <= jurosDoMes && meses > 1) {
        // Para evitar loops muito longos quando é óbvio que a dívida está crescendo
        const saldoTotal = dividasSimulacao.reduce((acc, curr) => acc + curr.saldo, 0);
        const jurosTotalAtual = dividasSimulacao.reduce((acc, curr) => acc + (curr.saldo * curr.juros_mensal / 100), 0);
        if (pagamentoMensal < jurosTotalAtual) return null;
    }

    let pagamentoRestante = pagamentoMensal;

    // Ordena pelo método avalanche: juros_mensal decrescente.
    // Em caso de empate, prioriza a de menor saldo para liquidar logo.
    dividasSimulacao.sort((a, b) => {
      if (b.juros_mensal !== a.juros_mensal) {
        return b.juros_mensal - a.juros_mensal;
      }
      return a.saldo - b.saldo;
    });

    for (let i = 0; i < dividasSimulacao.length; i++) {
      if (dividasSimulacao[i].saldo > 0 && pagamentoRestante > 0) {
        const abate = Math.min(pagamentoRestante, dividasSimulacao[i].saldo);
        dividasSimulacao[i].saldo -= abate;
        pagamentoRestante -= abate;
      }
      if (pagamentoRestante <= 0) break;
    }
  }

  if (meses >= LIMITE_MESES) return null;
  return meses;
}

/**
 * Gera recomendações textuais baseadas em regras de negócio.
 */
function gerarRecomendacoes(resumoPerfil, dividas, valor_disponivel, meses_para_quitar) {
  const recs = [];
  const { renda_mensal, total_nao_essencial, tem_renda_extra } = resumoPerfil;

  if (total_nao_essencial > 0.25 * renda_mensal) {
    recs.push("Dica: Seus gastos não-essenciais ultrapassam 25% da sua renda. Considere cortar supérfluos para acelerar a quitação.");
  }

  const temJurosAltos = dividas.some(d => d.juros_mensal >= 8);
  if (temJurosAltos) {
    recs.push("Alerta: Você possui dívidas com juros muito altos (≥ 8% a.m.). Sugerimos fortemente buscar renegociação ou portabilidade para outro banco.");
  }

  if (!tem_renda_extra && valor_disponivel > 0 && valor_disponivel < (renda_mensal * 0.1)) {
    recs.push("Sugestão: Sua folga mensal está baixa. Buscar uma fonte de renda extra pode trazer mais alívio ao seu orçamento.");
  }

  if (valor_disponivel <= 0) {
    recs.push("Urgente: Seu orçamento atual está no vermelho. O valor que sobra não é suficiente para pagar as dívidas básicas. É essencial reduzir gastos ou aumentar sua renda.");
  } else if (meses_para_quitar === null) {
    recs.push("Urgente: O seu valor disponível não cobre nem os juros mensais das suas dívidas. Elas continuarão crescendo. Você precisa de um plano de contingência imediato.");
  }

  recs.push("Incentivo: O primeiro passo você já deu! Mantenha a disciplina e acompanhe seu plano mês a mês para sair das dívidas.");

  return recs;
}
