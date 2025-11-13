document.addEventListener('DOMContentLoaded', () => {

    //botões
    const profileButtons = document.querySelectorAll('.btn-profile');

    profileButtons.forEach(button => {
        //botão do Card
        button.addEventListener('click', () => {
            const profileType = button.dataset.profile;
            
            if (profileType) {
                //Manda para a página de login
                window.location.href = `pages/login-${profileType}.html`;
            }
        });
    });

});