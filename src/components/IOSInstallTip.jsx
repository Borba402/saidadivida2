// iOS Safari não expõe prompt de instalação — o caminho é manual, então aqui
// "instalar" significa ensinar o passo a passo. Usado pelo banner da tela Início
// e pelo item "Instalar App" no sheet do avatar.
export default function IOSInstallTip({ onClose }) {
  return (
    <div className="ios-install-tip" onClick={onClose} role="dialog" aria-label="Como instalar no iPhone">
      <p>
        Toque em <strong>Compartilhar</strong> <span style={{ fontSize: '1.1em' }}>⎙</span>{' '}
        e depois em <strong>"Adicionar à Tela de Início"</strong>
      </p>
      <span className="ios-install-tip__close">Fechar ✕</span>
    </div>
  );
}
