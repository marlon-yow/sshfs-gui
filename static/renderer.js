// Este arquivo contém o código JavaScript que será executado na página

document.addEventListener('DOMContentLoaded', () => {
  const addConnectionBtn = document.getElementById('add-connection-btn');

  // Botão de adicionar conexão na coluna esquerda
  addConnectionBtn.addEventListener('click', () => {
    window.open('/connection', '_blank', 'width=500,height=600');
  });

  // Função para carregar as conexões salvas
  async function loadSavedConnections() {
    try {
      const response = await fetch('/api/connections');
      const connections = await response.json();
      displayConnections(connections);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    }
  }

  // Função para exibir as conexões
  function displayConnections(connections) {
    console.log('Conexões carregadas:', connections);

    // Atualiza a interface com as conexões
    const connectionsList = document.getElementById('connections-list');
    connectionsList.innerHTML = '';

    if (connections.length === 0) {
      // Mostra mensagem de lista vazia
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-list';
      emptyDiv.textContent = 'Nenhuma conexão encontrada';
      connectionsList.appendChild(emptyDiv);
    } else {
      // Adiciona cada conexão à lista
      connections.forEach(conn => {
        const connItem = document.createElement('div');
        connItem.className = 'connection-item';
        connItem.dataset.id = conn.id;

        const title = document.createElement('div');
        title.className = 'connection-title';

        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = 'computer';
        
        const statusIcon = document.createElement('span');
        statusIcon.className = 'material-icons status-icon';
        statusIcon.textContent = conn.mounted ? 'cloud_done' : 'cloud_off';
        statusIcon.style.color = conn.mounted ? '#4CAF50' : '#f44336';
        statusIcon.title = conn.mounted ? 'Montado' : 'Desmontado';

        title.appendChild(icon);
        title.appendChild(document.createTextNode(conn.name || conn.host));
        title.appendChild(statusIcon);

        const details = document.createElement('div');
        details.className = 'connection-details';
        details.textContent = `${conn.username}@${conn.host}:${conn.port} → ${conn.localPath}`;

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'connection-buttons';

        const connectBtn = document.createElement('button');
        connectBtn.className = 'btn-round btn-connect';
        connectBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        connectBtn.title = 'Conectar';
        connectBtn.onclick = async (e) => {
          e.stopPropagation();

          const modal = document.getElementById('feedback-modal');
          const modalMessage = document.getElementById('modal-message');

          modal.style.display = 'block';
          modalMessage.textContent = 'Conectando...';

          try {
            const response = await fetch('/api/connect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(conn)
            });

            const result = await response.json();

            if (result.success) {
              modalMessage.textContent = 'Conectado com sucesso!';
              setTimeout(() => modal.style.display = 'none', 2000);
            } else {
              modalMessage.textContent = 'Erro: ' + result.error;
              setTimeout(() => modal.style.display = 'none', 3000);
            }
          } catch (error) {
            modalMessage.textContent = 'Erro: ' + error.message;
            setTimeout(() => modal.style.display = 'none', 3000);
          }
        };

        const folderBtn = document.createElement('button');
        folderBtn.className = 'btn-round btn-folder';
        folderBtn.innerHTML = '<span class="material-icons">folder_open</span>';
        folderBtn.title = 'Abrir Pasta';
        folderBtn.onclick = (e) => {
          e.stopPropagation();
          console.log('Abrindo pasta:', conn.localPath);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-round btn-delete';
        deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
        deleteBtn.title = 'Deletar';
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          if (confirm('Deletar conexão?')) {
            try {
              const response = await fetch(`/api/connections/${conn.id}`, {
                method: 'DELETE'
              });

              const result = await response.json();

              if (result.success) {
                loadSavedConnections();
              } else {
                alert('Erro ao deletar: ' + result.error);
              }
            } catch (error) {
              alert('Erro ao deletar: ' + error.message);
            }
          }
        };

        const leftButtons = document.createElement('div');
        leftButtons.className = 'connection-buttons-left';
        leftButtons.appendChild(connectBtn);
        leftButtons.appendChild(folderBtn);

        buttonsDiv.appendChild(leftButtons);
        buttonsDiv.appendChild(deleteBtn);

        // Verifica se está montado
        //checkMountStatus(conn, connItem);

        connItem.appendChild(title);
        connItem.appendChild(details);
        connItem.appendChild(buttonsDiv);

        // Adiciona evento de clique para conectar
        connItem.addEventListener('click', () => {
          // Destaca o item selecionado
          document.querySelectorAll('.connection-item').forEach(item => {
            item.classList.remove('active');
          });
          connItem.classList.add('active');

          // Aqui você pode adicionar código para conectar via SSHFS
          console.log('Conectando a:', conn);
        });

        connectionsList.appendChild(connItem);
      });
    }
  }

  // Carrega as conexões ao iniciar
  loadSavedConnections();

  // Escuta mensagens da janela de conexão
  window.addEventListener('message', (event) => {
    if (event.data === 'connection-saved') {
      loadSavedConnections();
    }
  });
});