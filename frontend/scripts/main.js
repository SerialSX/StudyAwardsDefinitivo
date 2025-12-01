/* frontend/scripts/main.js */
document.addEventListener('DOMContentLoaded', () => {

    // 1. Botões de Navegação (Cards)
    const profileButtons = document.querySelectorAll('.btn-profile');
    profileButtons.forEach(button => {
        button.addEventListener('click', () => {
            const profileType = button.dataset.profile;
            if (profileType) {
                window.location.href = `pages/login-${profileType}.html`;
            }
        });
    });

    // 2. Lógica do Modal de Cadastro (Pop-up)
    const modal = document.getElementById('modal-cadastro');
    const btnAbrir = document.getElementById('btn-abrir-cadastro');
    const btnFechar = document.getElementById('btn-fechar-cadastro');

    if (btnAbrir && modal) {
        btnAbrir.addEventListener('click', (e) => {
            e.preventDefault(); // Evita o link #
            modal.classList.add('open'); // Abre com animação
        });
    }

    if (btnFechar && modal) {
        btnFechar.addEventListener('click', () => {
            modal.classList.remove('open'); // Fecha
        });
    }

    // Fecha se clicar fora do card (no borrado)
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
});