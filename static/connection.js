// Script para a janela de conexão

document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const connectionNameInput = document.getElementById('connection-name');
  const hostSelect = document.getElementById('host-select');
  const hostInput = document.getElementById('host');
  const portInput = document.getElementById('port');
  const usernameInput = document.getElementById('username');
  const identityFileInput = document.getElementById('identityFile');

  // Carrega hosts do SSH config
  async function loadSSHHosts() {
    try {
      const response = await fetch('/api/ssh-hosts');
      const hosts = await response.json();
      
      Object.keys(hosts).forEach(hostName => {
        const option = document.createElement('option');
        option.value = hostName;
        option.textContent = hostName;
        hostSelect.appendChild(option);
      });
      
      // Event listener para preencher campos quando host é selecionado
      hostSelect.addEventListener('change', () => {
        const selectedHost = hostSelect.value;
        if (selectedHost && hosts[selectedHost]) {
          const hostData = hosts[selectedHost];
          
          hostInput.value = hostData.hostname || selectedHost;
          if (hostData.port) portInput.value = hostData.port;
          if (hostData.user) usernameInput.value = hostData.user;
          if (hostData.identityfile) identityFileInput.value = hostData.identityfile;
        }
      });
    } catch (error) {
      console.error('Erro ao carregar hosts SSH:', error);
    }
  }
  
  loadSSHHosts();

  // Botão Salvar
  saveBtn.addEventListener('click', async () => {
    const connectionData = {
      name: connectionNameInput.value || hostInput.value,
      host: hostInput.value,
      port: portInput.value,
      username: usernameInput.value,
      identityFile: identityFileInput.value,
      remotePath: document.getElementById('remote-path').value,
      localPath: document.getElementById('local-path').value,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Conexão salva com sucesso!');
        if (window.opener) {
          window.opener.postMessage('connection-saved', '*');
        }
        window.close();
      } else {
        alert('Erro ao salvar conexão: ' + result.error);
      }
    } catch (error) {
      alert('Erro ao salvar conexão: ' + error.message);
    }
  });

  // Botão Cancelar
  cancelBtn.addEventListener('click', () => {
    window.close();
  });
});