import { supabase } from './supabase';

const USER_KEY = 'saidadivida_user_id';

// ==========================================
// OPERAÇÕES DE USUÁRIO E ÂNCORA
// ==========================================

export async function criarUsuario(apelido) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({ apelido })
    .select('id_usuario')
    .single();

  if (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
  return data.id_usuario;
}

export function obterUsuarioLocalId() {
  const id = localStorage.getItem(USER_KEY);
  return id ? parseInt(id, 10) : null;
}

export function salvarUsuarioLocalId(idUsuario) {
  localStorage.setItem(USER_KEY, idUsuario.toString());
}

// ==========================================
// OPERAÇÕES DE PERFIL FINANCEIRO
// ==========================================

export async function salvarPerfil(idUsuario, dadosPerfil) {
  const { data, error } = await supabase
    .from('perfil_financeiro')
    .upsert({
      id_usuario: idUsuario,
      renda_mensal: dadosPerfil.renda_mensal,
      dia_recebimento: dadosPerfil.dia_recebimento,
      tem_renda_extra: dadosPerfil.tem_renda_extra,
      valor_renda_extra: dadosPerfil.valor_renda_extra,
      disponibilidade_extra: dadosPerfil.disponibilidade_extra,
      data_preenchimento: new Date().toISOString()
    }, { onConflict: 'id_usuario' })
    .select('id_perfil')
    .single();

  if (error) {
    console.error('Erro ao salvar perfil:', error);
    throw error;
  }
  return data.id_perfil;
}

export async function obterPerfil(idUsuario) {
  const { data, error } = await supabase
    .from('perfil_financeiro')
    .select('*')
    .eq('id_usuario', idUsuario)
    .maybeSingle();

  if (error) {
    console.error('Erro ao obter perfil:', error);
    throw error;
  }
  if (!data) return null;
  return {
    id: data.id_perfil,
    id_usuario: data.id_usuario,
    renda_mensal: Number(data.renda_mensal),
    dia_recebimento: data.dia_recebimento,
    tem_renda_extra: data.tem_renda_extra,
    valor_renda_extra: Number(data.valor_renda_extra),
    disponibilidade_extra: data.disponibilidade_extra,
    data_preenchimento: data.data_preenchimento
  };
}

// ==========================================
// OPERAÇÕES DE GASTOS
// ==========================================

export async function criarGasto(idPerfil, gasto) {
  const { data, error } = await supabase
    .from('gastos')
    .insert({
      id_perfil: idPerfil,
      categoria: gasto.categoria,
      valor: gasto.valor,
      tipo: gasto.tipo
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar gasto:', error);
    throw error;
  }
  return {
    id: data.id_gasto,
    id_perfil: data.id_perfil,
    categoria: data.categoria,
    valor: Number(data.valor),
    tipo: data.tipo
  };
}

export async function removerGasto(idGasto) {
  const { error } = await supabase
    .from('gastos')
    .delete()
    .eq('id_gasto', idGasto);

  if (error) {
    console.error('Erro ao remover gasto:', error);
    throw error;
  }
  return true;
}

export async function listarGastosPorPerfil(idPerfil) {
  const { data, error } = await supabase
    .from('gastos')
    .select('*')
    .eq('id_perfil', idPerfil);

  if (error) {
    console.error('Erro ao listar gastos:', error);
    throw error;
  }
  return (data || []).map(g => ({
    id: g.id_gasto,
    id_perfil: g.id_perfil,
    categoria: g.categoria,
    valor: Number(g.valor),
    tipo: g.tipo
  }));
}

// ==========================================
// OPERAÇÕES DE DÍVIDAS
// ==========================================

export async function criarDivida(idPerfil, divida) {
  const { data, error } = await supabase
    .from('dividas')
    .insert({
      id_perfil: idPerfil,
      descricao: divida.descricao,
      valor_total: divida.valor_total,
      juros_mensal: divida.juros_mensal,
      parcelas_restantes: divida.parcelas_restantes
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar dívida:', error);
    throw error;
  }
  return {
    id: data.id_divida,
    id_perfil: data.id_perfil,
    descricao: data.descricao,
    valor_total: Number(data.valor_total),
    juros_mensal: Number(data.juros_mensal),
    parcelas_restantes: data.parcelas_restantes
  };
}

export async function removerDivida(idDivida) {
  const { error } = await supabase
    .from('dividas')
    .delete()
    .eq('id_divida', idDivida);

  if (error) {
    console.error('Erro ao remover dívida:', error);
    throw error;
  }
  return true;
}

export async function listarDividasPorPerfil(idPerfil) {
  const { data, error } = await supabase
    .from('dividas')
    .select('*')
    .eq('id_perfil', idPerfil);

  if (error) {
    console.error('Erro ao listar dívidas:', error);
    throw error;
  }
  return (data || []).map(d => ({
    id: d.id_divida,
    id_perfil: d.id_perfil,
    descricao: d.descricao,
    valor_total: Number(d.valor_total),
    juros_mensal: Number(d.juros_mensal),
    parcelas_restantes: d.parcelas_restantes
  }));
}

// ==========================================
// OPERAÇÕES DE PLANOS
// ==========================================

export async function salvarPlano(idPerfil, plano) {
  const { data, error } = await supabase
    .from('planos_gerados')
    .insert({
      id_perfil: idPerfil,
      valor_economia_mensal: plano.valor_economia_mensal,
      meses_para_quitar: plano.meses_para_quitar,
      meses_com_renda_extra: plano.meses_com_renda_extra,
      recomendacoes: plano.recomendacoes,
      data_geracao: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar plano:', error);
    throw error;
  }
  return {
    id: data.id_plano,
    id_perfil: data.id_perfil,
    valor_economia_mensal: Number(data.valor_economia_mensal),
    meses_para_quitar: data.meses_para_quitar,
    meses_com_renda_extra: data.meses_com_renda_extra,
    data_geracao: data.data_geracao,
    recomendacoes: data.recomendacoes
  };
}

export async function listarPlanosPorPerfil(idPerfil) {
  const { data, error } = await supabase
    .from('planos_gerados')
    .select('*')
    .eq('id_perfil', idPerfil)
    .order('data_geracao', { ascending: false });

  if (error) {
    console.error('Erro ao listar planos:', error);
    throw error;
  }
  return (data || []).map(p => ({
    id: p.id_plano,
    id_perfil: p.id_perfil,
    valor_economia_mensal: Number(p.valor_economia_mensal),
    meses_para_quitar: p.meses_para_quitar,
    meses_com_renda_extra: p.meses_com_renda_extra,
    data_geracao: p.data_geracao,
    recomendacoes: p.recomendacoes
  }));
}

// ==========================================
// RESUMO DO PERFIL
// ==========================================

export async function obterResumoPerfil(idPerfil) {
  const [resumoRes, perfilRes] = await Promise.all([
    supabase.from('vw_resumo_perfil').select('*').eq('id_perfil', idPerfil).maybeSingle(),
    supabase.from('perfil_financeiro').select('tem_renda_extra, valor_renda_extra').eq('id_perfil', idPerfil).maybeSingle()
  ]);

  if (resumoRes.error) {
    console.error('Erro ao obter resumo do perfil (view):', resumoRes.error);
    throw resumoRes.error;
  }
  
  if (!resumoRes.data) return null;

  const resumo = resumoRes.data;
  const perfilExtra = perfilRes.data || { tem_renda_extra: false, valor_renda_extra: 0 };

  return {
    id_perfil: resumo.id_perfil,
    apelido: resumo.apelido || 'Anônimo',
    renda_mensal: Number(resumo.renda_mensal),
    tem_renda_extra: perfilExtra.tem_renda_extra,
    valor_renda_extra: Number(perfilExtra.valor_renda_extra),
    total_essencial: Number(resumo.total_essencial),
    total_nao_essencial: Number(resumo.total_nao_essencial),
    total_dividas: Number(resumo.total_dividas)
  };
}

// ==========================================
// LIMPEZA DE DADOS
// ==========================================

export async function limparDadosUsuario(idUsuario) {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id_usuario', idUsuario);

  if (error) {
    console.error('Erro ao limpar dados do usuário:', error);
    throw error;
  }

  localStorage.removeItem(USER_KEY);
  return true;
}
