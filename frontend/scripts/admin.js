/* frontend/scripts/admin.js */

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('admin-form');
    const resultadoContainer = document.getElementById('resultado-container');
    const codigoDisplay = document.getElementById('codigo-gerado');
    const btnCopy = document.getElementById('btn-copy');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o reload da página

            // 1. Simula um "Loading"
            const btnSubmit = form.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerText;
            btnSubmit.innerText = "Gerando...";
            btnSubmit.disabled = true;

            // 2. Simula tempo de processamento (1 segundo)
            setTimeout(() => {
                // 3. GERA UM CÓDIGO FAKE (Ex: INST-A1B2)
                const prefixo = "INST-";
                const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
                const codigoFake = prefixo + aleatorio;

                // 4. Mostra na tela
                codigoDisplay.textContent = codigoFake;
                resultadoContainer.style.display = 'block'; // Revela a caixa verde

                // 5. Feedback Visual
                Swal.fire({
                    title: 'Sucesso!',
                    text: `Instituição cadastrada. Código: ${codigoFake}`,
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });

                // Restaura o botão
                btnSubmit.innerText = textoOriginal;
                btnSubmit.disabled = false;

                // Opcional: Limpa os campos para parecer real
                // document.getElementById('nomeInst').value = '';
                // document.getElementById('emailAdmin').value = '';
                
            }, 1000);
        });
    }

    // Lógica de Copiar para Área de Transferência
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const codigo = codigoDisplay.textContent;
            navigator.clipboard.writeText(codigo).then(() => {
                const Toast = Swal.mixin({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
                });
                Toast.fire({ icon: 'success', title: 'Copiado!' });
            });
        });
    }
});