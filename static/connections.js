// Função para obter todas as conexões salvas
async function getSavedConnections() {
  try {
    const response = await fetch('/api/connections');
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar conexões:', error);
    return [];
  }
}

// Função para salvar uma conexão
async function saveConnection(connectionData) {
  try {
    connectionData.id = Date.now().toString();
    
    const response = await fetch('/api/connections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connectionData)
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao salvar conexão:', error);
    return false;
  }
}

// Função para remover uma conexão
async function removeConnection(connectionId) {
  try {
    const response = await fetch(`/api/connections/${connectionId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao remover conexão:', error);
    return false;
  }
}