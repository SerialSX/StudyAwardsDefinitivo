document.addEventListener('DOMContentLoaded', () => {
    // 1. Cria o botão flutuante
    const btn = document.createElement('button');
    btn.id = 'theme-toggle-fab';
    btn.innerHTML = '🌙'; // Começa com a Lua
    
    // 2. Estilo do botão (Fixo no canto inferior direito)
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background-color: var(--primary-color);
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    `;

    // Efeito de clique
    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';

    document.body.appendChild(btn);

    // 3. Função de Troca
    const toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        // Troca o ícone
        btn.innerHTML = isDark ? '☀️' : '🌙';
        
        // Salva a preferência
        localStorage.setItem('tema', isDark ? 'escuro' : 'claro');
    };

    btn.addEventListener('click', toggleTheme);

    // 4. Carrega a preferência ao abrir a página
    const temaSalvo = localStorage.getItem('tema');
    if (temaSalvo === 'escuro') {
        document.body.classList.add('dark-mode');
        btn.innerHTML = '☀️';
    }
});