// Espera o carregamento completo da página antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {

  // Referências dos elementos
  const telaCadastro = document.getElementById('telaCadastro');
  const telaConfirmacao = document.getElementById('telaConfirmacao');
  const info = document.getElementById('info');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnVoltar = document.getElementById('btnVoltar');

  // Clique no botão salvar
  btnSalvar.addEventListener('click', () => {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validação simples
    if (!nome || !email) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    // Salva os dados no localStorage
    const usuario = { nome, email };
    localStorage.setItem('usuario', JSON.stringify(usuario));

    // Mostra os dados na tela de confirmação
    info.innerHTML = `
      <p><strong>Nome:</strong> ${usuario.nome}</p>
      <p><strong>Email:</strong> ${usuario.email}</p>
    `;

    // Alterna as telas
    telaCadastro.style.display = 'none';
    telaConfirmacao.style.display = 'block';
  });

  // Clique no botão voltar
  btnVoltar.addEventListener('click', () => {
    telaConfirmacao.style.display = 'none';
    telaCadastro.style.display = 'block';
  });

});
