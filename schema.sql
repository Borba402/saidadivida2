create type tipo_gasto as enum ('essencial', 'nao_essencial');
create type disponibilidade_extra_enum as enum ('nenhuma', 'baixa', 'media', 'alta');

create table usuarios (
  id_usuario    bigint generated always as identity primary key,
  apelido       varchar(50) not null,
  data_cadastro timestamptz not null default now()
);

create table perfil_financeiro (
  id_perfil             bigint generated always as identity primary key,
  id_usuario            bigint not null references usuarios(id_usuario) on delete cascade,
  renda_mensal          numeric(10,2) not null check (renda_mensal >= 0),
  dia_recebimento       int not null check (dia_recebimento between 1 and 31),
  tem_renda_extra       boolean not null default false,
  valor_renda_extra     numeric(10,2) not null default 0 check (valor_renda_extra >= 0),
  disponibilidade_extra disponibilidade_extra_enum not null default 'nenhuma',
  data_preenchimento    timestamptz not null default now(),
  unique (id_usuario)
);

create table gastos (
  id_gasto  bigint generated always as identity primary key,
  id_perfil bigint not null references perfil_financeiro(id_perfil) on delete cascade,
  categoria varchar(50) not null,
  valor     numeric(10,2) not null check (valor >= 0),
  tipo      tipo_gasto not null
);

create table dividas (
  id_divida          bigint generated always as identity primary key,
  id_perfil          bigint not null references perfil_financeiro(id_perfil) on delete cascade,
  descricao          varchar(100) not null,
  valor_total        numeric(10,2) not null check (valor_total >= 0),
  juros_mensal       numeric(5,2)  not null default 0 check (juros_mensal >= 0),
  parcelas_restantes int not null check (parcelas_restantes >= 0)
);

create table planos_gerados (
  id_plano              bigint generated always as identity primary key,
  id_perfil             bigint not null references perfil_financeiro(id_perfil) on delete cascade,
  valor_economia_mensal numeric(10,2) not null,
  meses_para_quitar     int,
  meses_com_renda_extra int,
  data_geracao          timestamptz not null default now(),
  recomendacoes         text
);

create or replace view vw_resumo_perfil as
select
  p.id_perfil, u.apelido, p.renda_mensal,
  coalesce(sum(g.valor) filter (where g.tipo = 'essencial'),     0) as total_essencial,
  coalesce(sum(g.valor) filter (where g.tipo = 'nao_essencial'), 0) as total_nao_essencial,
  (select coalesce(sum(d.valor_total),0) from dividas d where d.id_perfil = p.id_perfil) as total_dividas
from perfil_financeiro p
join usuarios u on u.id_usuario = p.id_usuario
left join gastos g on g.id_perfil = p.id_perfil
group by p.id_perfil, u.apelido, p.renda_mensal;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- Projeto acadêmico de DEMONSTRAÇÃO, sem autenticação (sem login/CPF).
-- O acesso é feito pela chave pública (anon). Para não deixar as tabelas
-- abertas por acidente, o RLS é HABILITADO e definimos políticas
-- PERMISSIVAS explícitas para o papel anon. Em um ambiente de produção
-- com dados reais, estas políticas seriam restritas a auth.uid().
-- =====================================================================

alter table usuarios            enable row level security;
alter table perfil_financeiro   enable row level security;
alter table gastos              enable row level security;
alter table dividas             enable row level security;
alter table planos_gerados      enable row level security;

create policy "demo_acesso_total_usuarios"   on usuarios          for all using (true) with check (true);
create policy "demo_acesso_total_perfil"     on perfil_financeiro for all using (true) with check (true);
create policy "demo_acesso_total_gastos"     on gastos            for all using (true) with check (true);
create policy "demo_acesso_total_dividas"    on dividas           for all using (true) with check (true);
create policy "demo_acesso_total_planos"     on planos_gerados    for all using (true) with check (true);
