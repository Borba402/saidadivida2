import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';
import { join } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = join(process.cwd(), 'Guia-Configuracao-SaiDaDivida.pdf');

const html = /* html */`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    font-family: 'Inter', Arial, sans-serif;
    background: #0a0a0a;
    color: #f0f0f0;
    font-size: 13px;
    line-height: 1.55;
  }

  /* ── PAGE BREAKS ── */
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 60px 64px;
    position: relative;
    page-break-after: always;
    background: #0a0a0a;
    overflow: hidden;
  }
  .page:last-child { page-break-after: avoid; }

  /* ── COVER ── */
  .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 1123px;
    background: linear-gradient(145deg, #0f0f0f 0%, #141414 60%, #0a0a0a 100%);
    text-align: center;
    gap: 0;
  }
  .cover-badge {
    background: rgba(163,230,53,0.12);
    border: 1px solid rgba(163,230,53,0.35);
    color: #a3e635;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 6px 18px;
    border-radius: 999px;
    margin-bottom: 28px;
    display: inline-block;
  }
  .cover-logo {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -0.04em;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #f0f0f0 40%, #a3e635 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cover-title {
    font-size: 20px;
    font-weight: 600;
    color: #9ca3af;
    margin-bottom: 48px;
  }
  .cover-divider {
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #a3e635, #84cc16);
    border-radius: 999px;
    margin: 0 auto 48px;
  }
  .cover-description {
    font-size: 14px;
    color: #6b7280;
    max-width: 440px;
    line-height: 1.7;
    margin-bottom: 56px;
  }
  .cover-steps {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 60px;
  }
  .cover-step-chip {
    background: #141414;
    border: 1px solid #1e1e1e;
    border-radius: 10px;
    padding: 14px 20px;
    text-align: center;
    width: 158px;
  }
  .cover-step-num {
    font-size: 22px;
    font-weight: 800;
    color: #a3e635;
    display: block;
  }
  .cover-step-lbl {
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
    line-height: 1.4;
  }
  .cover-footer {
    font-size: 11px;
    color: #374151;
    position: absolute;
    bottom: 40px;
    left: 0; right: 0;
    text-align: center;
  }

  /* ── SECTION PAGES ── */
  .step-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid #1e1e1e;
  }
  .step-num {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #a3e635, #84cc16);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 900;
    color: #0a0a0a;
    flex-shrink: 0;
  }
  .step-title { font-size: 22px; font-weight: 800; color: #f0f0f0; }
  .step-subtitle { font-size: 13px; color: #6b7280; margin-top: 3px; }

  /* ── BROWSER MOCKUP ── */
  .browser {
    background: #141414;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    overflow: hidden;
    margin: 20px 0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  .browser-bar {
    background: #1a1a1a;
    border-bottom: 1px solid #2a2a2a;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .browser-dots { display: flex; gap: 5px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-r { background: #ef4444; }
  .dot-y { background: #f59e0b; }
  .dot-g { background: #22c55e; }
  .browser-url {
    background: #111;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 10.5px;
    color: #9ca3af;
    flex: 1;
    font-family: monospace;
  }
  .browser-body { padding: 16px; }

  /* ── VERCEL UI MOCK ── */
  .vercel-layout { display: flex; gap: 14px; }
  .vercel-sidebar {
    width: 160px;
    flex-shrink: 0;
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 8px;
    padding: 10px 0;
  }
  .vercel-nav {
    padding: 6px 12px;
    font-size: 11px;
    color: #6b7280;
    border-radius: 0;
    cursor: default;
  }
  .vercel-nav.active {
    background: rgba(163,230,53,0.1);
    color: #a3e635;
    font-weight: 600;
  }
  .vercel-main { flex: 1; }
  .vercel-section-title {
    font-size: 14px;
    font-weight: 700;
    color: #f0f0f0;
    margin-bottom: 12px;
  }
  .env-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: center;
  }
  .env-key {
    background: #111;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 11px;
    font-family: monospace;
    color: #a3e635;
    width: 200px;
  }
  .env-val {
    background: #111;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 11px;
    font-family: monospace;
    color: #9ca3af;
    flex: 1;
  }
  .env-row.highlighted .env-key { border-color: #a3e635; box-shadow: 0 0 0 2px rgba(163,230,53,0.15); }
  .env-row.highlighted .env-val { border-color: #a3e635; box-shadow: 0 0 0 2px rgba(163,230,53,0.15); }

  /* ── GOOGLE CLOUD MOCK ── */
  .gcloud-header {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 8px 8px 0 0;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }
  .gcloud-nav { color: #9ca3af; }
  .gcloud-nav .active { color: #f0f0f0; font-weight: 600; }
  .breadcrumb { color: #6b7280; }
  .gcloud-body {
    background: #111;
    border: 1px solid #2a2a2a;
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 16px;
  }
  .gcloud-form-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
  }
  .gcloud-label { font-size: 11px; color: #9ca3af; }
  .gcloud-input {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    padding: 7px 10px;
    font-size: 11px;
    color: #f0f0f0;
    font-family: monospace;
  }
  .gcloud-input.highlighted { border-color: #4285F4; box-shadow: 0 0 0 2px rgba(66,133,244,0.2); }
  .btn-google-mock {
    background: #4285F4;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 8px;
    display: inline-block;
  }

  /* ── SUPABASE MOCK ── */
  .supabase-layout { display: flex; gap: 0; }
  .supabase-sidebar {
    width: 150px;
    background: #0f0f0f;
    border: 1px solid #1e1e1e;
    border-right: none;
    border-radius: 8px 0 0 8px;
    padding: 10px 0;
  }
  .supabase-nav {
    padding: 6px 12px;
    font-size: 11px;
    color: #6b7280;
  }
  .supabase-nav.active { color: #3ecf8e; font-weight: 600; background: rgba(62,207,142,0.08); }
  .supabase-main {
    flex: 1;
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 0 8px 8px 0;
    padding: 14px;
  }
  .provider-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
  }
  .provider-info { display: flex; align-items: center; gap: 10px; }
  .provider-icon {
    width: 28px;
    height: 28px;
    background: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .toggle {
    width: 36px;
    height: 20px;
    background: #a3e635;
    border-radius: 10px;
    position: relative;
  }
  .toggle::after {
    content: '';
    position: absolute;
    right: 3px;
    top: 3px;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
  }
  .toggle.off { background: #2a2a2a; }
  .toggle.off::after { left: 3px; right: auto; }

  /* ── CALLOUT BOXES ── */
  .callout {
    border-radius: 10px;
    padding: 14px 16px;
    margin: 14px 0;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .callout-info { background: rgba(59,130,246,0.08); border-left: 3px solid #3b82f6; }
  .callout-warn { background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; }
  .callout-tip  { background: rgba(163,230,53,0.07); border-left: 3px solid #a3e635; }
  .callout-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .callout-text { font-size: 12px; color: #9ca3af; line-height: 1.6; }
  .callout-text strong { color: #f0f0f0; }

  /* ── STEP LIST ── */
  .steps-list { margin: 16px 0; }
  .step-item {
    display: flex;
    gap: 14px;
    margin-bottom: 18px;
    align-items: flex-start;
  }
  .step-circle {
    width: 26px;
    height: 26px;
    background: rgba(163,230,53,0.12);
    border: 1.5px solid rgba(163,230,53,0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    color: #a3e635;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .step-content { flex: 1; }
  .step-label { font-size: 13px; font-weight: 600; color: #f0f0f0; margin-bottom: 3px; }
  .step-detail { font-size: 12px; color: #6b7280; line-height: 1.55; }

  /* ── CODE BLOCK ── */
  .code {
    background: #0f0f0f;
    border: 1px solid #1e1e1e;
    border-radius: 8px;
    padding: 12px 16px;
    font-family: 'Courier New', monospace;
    font-size: 11.5px;
    color: #a3e635;
    margin: 10px 0;
    line-height: 1.7;
  }
  .code .cmt { color: #4b5563; }
  .code .key { color: #f0f0f0; }
  .code .val { color: #a3e635; }

  /* ── ARROW ── */
  .arrow-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(163,230,53,0.1);
    border: 1px solid rgba(163,230,53,0.25);
    color: #a3e635;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    margin: 0 4px;
  }

  /* ── RESULT PAGE ── */
  .result-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 20px;
  }
  .result-card {
    background: #141414;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    padding: 20px;
  }
  .result-icon { font-size: 28px; margin-bottom: 10px; }
  .result-title { font-size: 13px; font-weight: 700; color: #f0f0f0; margin-bottom: 6px; }
  .result-desc { font-size: 11.5px; color: #6b7280; line-height: 1.6; }
  .result-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    font-size: 11px;
    font-weight: 700;
    color: #22c55e;
  }

  /* ── PAGE NUMBER ── */
  .page-footer {
    position: absolute;
    bottom: 32px;
    left: 64px;
    right: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    color: #374151;
    border-top: 1px solid #1a1a1a;
    padding-top: 12px;
  }
  .page-footer .brand { color: #a3e635; font-weight: 700; }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════ -->
<!-- CAPA -->
<!-- ══════════════════════════════════════════════ -->
<div class="page cover">
  <div class="cover-badge">Guia de Configuração</div>
  <div class="cover-logo">SaiDaDívida</div>
  <div class="cover-title">Passo a passo para colocar o app no ar</div>
  <div class="cover-divider"></div>
  <div class="cover-description">
    Este guia cobre tudo que você precisa configurar manualmente
    para que o app funcione 100% em produção na Vercel,
    incluindo banco de dados e login com Google.
  </div>

  <div class="cover-steps">
    <div class="cover-step-chip">
      <span class="cover-step-num">01</span>
      <span class="cover-step-lbl">Variáveis de Ambiente<br>na Vercel</span>
    </div>
    <div class="cover-step-chip">
      <span class="cover-step-num">02</span>
      <span class="cover-step-lbl">Criar credenciais no<br>Google Cloud</span>
    </div>
    <div class="cover-step-chip">
      <span class="cover-step-num">03</span>
      <span class="cover-step-lbl">Ativar Google OAuth<br>no Supabase</span>
    </div>
    <div class="cover-step-chip">
      <span class="cover-step-num">04</span>
      <span class="cover-step-lbl">Verificar e testar<br>tudo funcionando</span>
    </div>
  </div>

  <div class="cover-footer">
    SaiDaDívida · github.com/Borba402/Saidadivida · Gerado automaticamente
  </div>
</div>


<!-- ══════════════════════════════════════════════ -->
<!-- PASSO 1 — VERCEL -->
<!-- ══════════════════════════════════════════════ -->
<div class="page">
  <div class="step-header">
    <div class="step-num">1</div>
    <div>
      <div class="step-title">Variáveis de Ambiente na Vercel</div>
      <div class="step-subtitle">Conecta o app ao banco de dados Supabase · Obrigatório para funcionar</div>
    </div>
  </div>

  <div class="callout callout-warn">
    <div class="callout-icon">⚠️</div>
    <div class="callout-text">
      <strong>Sem este passo o app abre em branco.</strong> As variáveis de ambiente dizem ao app onde está o banco de dados e qual chave usar.
    </div>
  </div>

  <div class="steps-list">
    <div class="step-item">
      <div class="step-circle">1</div>
      <div class="step-content">
        <div class="step-label">Acesse o painel da Vercel</div>
        <div class="step-detail">Vá em <strong>vercel.com</strong> → clique no seu projeto <strong>Saidadivida</strong></div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">2</div>
      <div class="step-content">
        <div class="step-label">Navegue até Environment Variables</div>
        <div class="step-detail">No menu do projeto: <span class="arrow-badge">Settings</span> → <span class="arrow-badge">Environment Variables</span></div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">3</div>
      <div class="step-content">
        <div class="step-label">Adicione as duas variáveis abaixo</div>
        <div class="step-detail">Clique em <strong>Add New</strong> para cada uma. Os valores estão no painel do Supabase em <strong>Settings → API</strong>.</div>
      </div>
    </div>
  </div>

  <!-- Mockup Vercel -->
  <div class="browser">
    <div class="browser-bar">
      <div class="browser-dots">
        <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
      </div>
      <div class="browser-url">vercel.com/borba402/saidadivida/settings/environment-variables</div>
    </div>
    <div class="browser-body">
      <div class="vercel-layout">
        <div class="vercel-sidebar">
          <div class="vercel-nav">General</div>
          <div class="vercel-nav">Domains</div>
          <div class="vercel-nav">Integrations</div>
          <div class="vercel-nav active">⚡ Environment Variables</div>
          <div class="vercel-nav">Functions</div>
          <div class="vercel-nav">Security</div>
        </div>
        <div class="vercel-main">
          <div class="vercel-section-title">Environment Variables</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:14px;">
            Adicione as variáveis e selecione os environments (Production + Preview + Development)
          </div>

          <div class="env-row highlighted">
            <div class="env-key">VITE_SUPABASE_URL</div>
            <div class="env-val">https://xxxxxxxxxxxx.supabase.co</div>
          </div>
          <div class="env-row highlighted">
            <div class="env-key">VITE_SUPABASE_ANON_KEY</div>
            <div class="env-val">eyJhbGciOiJIUzI1NiIsInR5cCI6...</div>
          </div>

          <div style="margin-top:14px;display:flex;gap:8px;">
            <div style="background:#a3e635;color:#0a0a0a;font-size:11px;font-weight:700;padding:6px 14px;border-radius:6px;">Save</div>
            <div style="background:#1a1a1a;border:1px solid #2a2a2a;color:#9ca3af;font-size:11px;padding:6px 14px;border-radius:6px;">Cancel</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="callout callout-info">
    <div class="callout-icon">ℹ️</div>
    <div class="callout-text">
      <strong>Onde achar os valores?</strong> Acesse <strong>supabase.com/dashboard</strong> → selecione seu projeto → <strong>Settings → API</strong>. Copie o <em>Project URL</em> e a chave <em>anon public</em>.
    </div>
  </div>

  <div class="steps-list" style="margin-top:16px;">
    <div class="step-item">
      <div class="step-circle">4</div>
      <div class="step-content">
        <div class="step-label">Forçar um novo deploy</div>
        <div class="step-detail">Vá em <span class="arrow-badge">Deployments</span> → clique nos 3 pontos do último deploy → <strong>Redeploy</strong>. Aguarde o status mudar para <strong style="color:#22c55e;">Ready</strong>.</div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="brand">SaiDaDívida</span>
    <span>Passo 1 de 4 — Variáveis de Ambiente</span>
    <span>pág. 2</span>
  </div>
</div>


<!-- ══════════════════════════════════════════════ -->
<!-- PASSO 2 — GOOGLE CLOUD -->
<!-- ══════════════════════════════════════════════ -->
<div class="page">
  <div class="step-header">
    <div class="step-num">2</div>
    <div>
      <div class="step-title">Criar Credenciais no Google Cloud</div>
      <div class="step-subtitle">Necessário apenas para o botão "Entrar com o Google" · O login por apelido já funciona</div>
    </div>
  </div>

  <div class="callout callout-tip">
    <div class="callout-icon">💡</div>
    <div class="callout-text">
      <strong>Pode pular este passo</strong> se não quiser o login com Google. O app funciona normalmente com o login por apelido (anônimo).
    </div>
  </div>

  <div class="steps-list">
    <div class="step-item">
      <div class="step-circle">1</div>
      <div class="step-content">
        <div class="step-label">Acesse o Google Cloud Console</div>
        <div class="step-detail">Vá em <strong>console.cloud.google.com</strong> e faça login com sua conta Google.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">2</div>
      <div class="step-content">
        <div class="step-label">Crie um projeto (ou use um existente)</div>
        <div class="step-detail">Clique em <span class="arrow-badge">Select a Project</span> → <span class="arrow-badge">New Project</span> → nomeie como <strong>SaiDaDivida</strong> → Create.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">3</div>
      <div class="step-content">
        <div class="step-label">Crie as credenciais OAuth 2.0</div>
        <div class="step-detail">Menu lateral: <span class="arrow-badge">APIs & Services</span> → <span class="arrow-badge">Credentials</span> → <span class="arrow-badge">+ Create Credentials</span> → <strong>OAuth 2.0 Client ID</strong></div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">4</div>
      <div class="step-content">
        <div class="step-label">Configure a tela de consentimento</div>
        <div class="step-detail">Se pedido, configure o <strong>OAuth Consent Screen</strong>: selecione <strong>External</strong> → preencha nome do app (<em>SaiDaDívida</em>) e e-mail de suporte → Save.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">5</div>
      <div class="step-content">
        <div class="step-label">Adicione os redirect URIs autorizados</div>
        <div class="step-detail">Em <strong>Authorized redirect URIs</strong>, adicione <strong>exatamente</strong> a URL abaixo:</div>
      </div>
    </div>
  </div>

  <div class="code">
    <span class="cmt"># Cole esta URL no campo "Authorized redirect URIs"</span><br>
    https://<span class="val">SEU_PROJETO_ID</span>.supabase.co/auth/v1/callback
  </div>

  <!-- Mockup Google Cloud -->
  <div class="browser" style="margin-top:14px;">
    <div class="browser-bar">
      <div class="browser-dots">
        <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
      </div>
      <div class="browser-url">console.cloud.google.com/apis/credentials/oauthclient</div>
    </div>
    <div class="browser-body" style="padding:0;">
      <div class="gcloud-header">
        <span class="gcloud-nav">APIs & Services</span>
        <span style="color:#6b7280;margin:0 4px;">›</span>
        <span class="gcloud-nav active">Credentials</span>
        <span style="color:#6b7280;margin:0 4px;">›</span>
        <span class="gcloud-nav active">Create OAuth Client ID</span>
      </div>
      <div class="gcloud-body">
        <div class="gcloud-form-row">
          <div class="gcloud-label">Application type</div>
          <div class="gcloud-input">Web application</div>
        </div>
        <div class="gcloud-form-row">
          <div class="gcloud-label">Name</div>
          <div class="gcloud-input">SaiDaDívida Web Client</div>
        </div>
        <div class="gcloud-form-row">
          <div class="gcloud-label" style="color:#4285F4;font-weight:600;">Authorized redirect URIs ← adicione aqui</div>
          <div class="gcloud-input highlighted">https://PROJETO.supabase.co/auth/v1/callback</div>
        </div>
        <div class="btn-google-mock">Create</div>
      </div>
    </div>
  </div>

  <div class="callout callout-warn" style="margin-top:14px;">
    <div class="callout-icon">📋</div>
    <div class="callout-text">
      <strong>Salve o Client ID e Client Secret</strong> que aparecem após criar. Você vai precisar deles no próximo passo.
    </div>
  </div>

  <div class="page-footer">
    <span class="brand">SaiDaDívida</span>
    <span>Passo 2 de 4 — Google Cloud Console</span>
    <span>pág. 3</span>
  </div>
</div>


<!-- ══════════════════════════════════════════════ -->
<!-- PASSO 3 — SUPABASE OAUTH -->
<!-- ══════════════════════════════════════════════ -->
<div class="page">
  <div class="step-header">
    <div class="step-num">3</div>
    <div>
      <div class="step-title">Ativar Google OAuth no Supabase</div>
      <div class="step-subtitle">Cole as credenciais do Google Cloud no painel do Supabase</div>
    </div>
  </div>

  <div class="steps-list">
    <div class="step-item">
      <div class="step-circle">1</div>
      <div class="step-content">
        <div class="step-label">Acesse o painel do Supabase</div>
        <div class="step-detail">Vá em <strong>supabase.com/dashboard</strong> → selecione o projeto do SaiDaDívida.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">2</div>
      <div class="step-content">
        <div class="step-label">Vá em Authentication → Providers</div>
        <div class="step-detail">No menu lateral: <span class="arrow-badge">Authentication</span> → <span class="arrow-badge">Providers</span> → localize <strong>Google</strong> na lista.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">3</div>
      <div class="step-content">
        <div class="step-label">Habilite o toggle do Google</div>
        <div class="step-detail">Clique no botão de liga/desliga ao lado de <strong>Google</strong> para ativar o provider.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">4</div>
      <div class="step-content">
        <div class="step-label">Cole o Client ID e Client Secret</div>
        <div class="step-detail">Preencha os dois campos com os valores copiados do Google Cloud no passo anterior. Clique <strong>Save</strong>.</div>
      </div>
    </div>
  </div>

  <!-- Mockup Supabase -->
  <div class="browser">
    <div class="browser-bar">
      <div class="browser-dots">
        <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
      </div>
      <div class="browser-url">supabase.com/dashboard/project/xxx/auth/providers</div>
    </div>
    <div class="browser-body">
      <div class="supabase-layout">
        <div class="supabase-sidebar">
          <div class="supabase-nav">Table Editor</div>
          <div class="supabase-nav">SQL Editor</div>
          <div class="supabase-nav active">🔐 Authentication</div>
          <div class="supabase-nav" style="padding-left:22px;font-size:10px;">→ Providers</div>
          <div class="supabase-nav">Storage</div>
          <div class="supabase-nav">Settings</div>
        </div>
        <div class="supabase-main">
          <div style="font-size:12px;font-weight:700;color:#f0f0f0;margin-bottom:12px;">Auth Providers</div>

          <div class="provider-row">
            <div class="provider-info">
              <div class="provider-icon">🔑</div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#f0f0f0;">Email</div>
                <div style="font-size:10px;color:#6b7280;">Enabled</div>
              </div>
            </div>
            <div class="toggle"></div>
          </div>

          <div class="provider-row" style="border-color:#a3e635;box-shadow:0 0 0 1px rgba(163,230,53,0.2);">
            <div class="provider-info">
              <div class="provider-icon">G</div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#f0f0f0;">Google ← ative aqui</div>
                <div style="font-size:10px;color:#a3e635;">Cole Client ID + Secret abaixo</div>
              </div>
            </div>
            <div class="toggle"></div>
          </div>

          <div style="margin-top:12px;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:8px;padding:12px;">
            <div class="gcloud-form-row">
              <div class="gcloud-label" style="color:#9ca3af;">Client ID (do Google Cloud)</div>
              <div class="gcloud-input highlighted">123456789-abcdef.apps.googleusercontent.com</div>
            </div>
            <div class="gcloud-form-row">
              <div class="gcloud-label" style="color:#9ca3af;">Client Secret (do Google Cloud)</div>
              <div class="gcloud-input highlighted">GOCSPX-xxxxxxxxxxxxxxxx</div>
            </div>
            <div style="background:#3ecf8e;color:#0a0a0a;font-size:11px;font-weight:700;padding:6px 16px;border-radius:6px;display:inline-block;margin-top:4px;">Save</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="callout callout-info" style="margin-top:14px;">
    <div class="callout-icon">ℹ️</div>
    <div class="callout-text">
      <strong>URL de redirect do Supabase para o Google:</strong> no campo <em>Authorized redirect URIs</em> do Google Cloud, use exatamente:<br>
      <code style="background:#111;padding:2px 6px;border-radius:4px;color:#a3e635;font-size:11px;">
        https://SEU_PROJETO_ID.supabase.co/auth/v1/callback
      </code>
    </div>
  </div>

  <div class="page-footer">
    <span class="brand">SaiDaDívida</span>
    <span>Passo 3 de 4 — Supabase OAuth</span>
    <span>pág. 4</span>
  </div>
</div>


<!-- ══════════════════════════════════════════════ -->
<!-- PASSO 4 — VERIFICAÇÃO -->
<!-- ══════════════════════════════════════════════ -->
<div class="page">
  <div class="step-header">
    <div class="step-num">4</div>
    <div>
      <div class="step-title">Verificar e Testar</div>
      <div class="step-subtitle">Confirme que tudo está funcionando corretamente em produção</div>
    </div>
  </div>

  <div class="steps-list">
    <div class="step-item">
      <div class="step-circle">1</div>
      <div class="step-content">
        <div class="step-label">Confirme o deploy na Vercel</div>
        <div class="step-detail">Acesse <strong>vercel.com → seu projeto → Deployments</strong>. O último deploy deve estar com status <strong style="color:#22c55e;">✓ Ready</strong>. Se estiver <em>Building</em>, aguarde.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">2</div>
      <div class="step-content">
        <div class="step-label">Abra o app e teste o login por apelido</div>
        <div class="step-detail">Acesse a URL do app na Vercel. A tela de login deve abrir. Insira um apelido e clique em <strong>Começar Planejamento</strong>. Se carregar o app, o Supabase está conectado.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">3</div>
      <div class="step-content">
        <div class="step-label">Teste o login com Google (se configurado)</div>
        <div class="step-detail">Clique em <strong>Entrar com o Google</strong>. Deve abrir o pop-up de autenticação do Google. Após login, o app carrega automaticamente com seu nome.</div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-circle">4</div>
      <div class="step-content">
        <div class="step-label">Teste as funcionalidades principais</div>
        <div class="step-detail">Cadastre o perfil → adicione gastos → adicione dívidas → clique em <strong>Calcular Plano</strong>. Navegue pelo Kanban, Analytics e Timer Foco.</div>
      </div>
    </div>
  </div>

  <div style="margin:20px 0 16px;font-size:13px;font-weight:700;color:#f0f0f0;">O que foi entregue no app</div>

  <div class="result-grid">
    <div class="result-card">
      <div class="result-icon">🎨</div>
      <div class="result-title">Dark Mode + Sidebar</div>
      <div class="result-desc">Interface refeita em dark mode profundo com detalhes em Lime Green. Sidebar lateral com collapse e mobile bottom nav.</div>
      <div class="result-status">✓ Pronto</div>
    </div>
    <div class="result-card">
      <div class="result-icon">📊</div>
      <div class="result-title">Kanban Financeiro</div>
      <div class="result-desc">Dívidas organizadas em 4 colunas com drag-and-drop. Status persiste entre sessões via localStorage.</div>
      <div class="result-status">✓ Pronto</div>
    </div>
    <div class="result-card">
      <div class="result-icon">📈</div>
      <div class="result-title">Analytics com Recharts</div>
      <div class="result-desc">Projeção de saldo (AreaChart), produtividade semanal e histórico de planos (BarChart). 4 KPIs em destaque.</div>
      <div class="result-status">✓ Pronto</div>
    </div>
    <div class="result-card">
      <div class="result-icon">⏱️</div>
      <div class="result-title">Timer Foco (Pomodoro)</div>
      <div class="result-desc">25min foco / 5min pausa com anel SVG animado. +100 XP por sessão. Sistema de nível com barra de progresso.</div>
      <div class="result-status">✓ Pronto</div>
    </div>
    <div class="result-card">
      <div class="result-icon">💰</div>
      <div class="result-title">Painel de Balanço</div>
      <div class="result-desc">Saldo em tempo real: Renda − Gastos = Saldo Restante. Atualiza conforme gastos são adicionados.</div>
      <div class="result-status">✓ Pronto</div>
    </div>
    <div class="result-card">
      <div class="result-icon">🔐</div>
      <div class="result-title">Login com Google</div>
      <div class="result-desc">OAuth via supabase.auth.signInWithOAuth. Cria usuário automaticamente após primeiro login.</div>
      <div class="result-status" style="color:#f59e0b;">⚙ Requer config. Passos 2-3</div>
    </div>
  </div>

  <div class="callout callout-tip" style="margin-top:20px;">
    <div class="callout-icon">🚀</div>
    <div class="callout-text">
      <strong>Tudo commitado e no GitHub.</strong> Qualquer push na branch <code style="background:#111;padding:1px 6px;border-radius:4px;color:#a3e635;">main</code> dispara deploy automático na Vercel. O banco de dados Supabase não precisou de alterações — XP e Kanban usam localStorage.
    </div>
  </div>

  <div class="page-footer">
    <span class="brand">SaiDaDívida</span>
    <span>Passo 4 de 4 — Verificação · Fim do guia</span>
    <span>pág. 5</span>
  </div>
</div>

</body>
</html>`;

async function main() {
  console.log('Iniciando Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Gerando PDF...');
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  console.log(`PDF gerado: ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });
