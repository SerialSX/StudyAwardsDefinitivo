document.addEventListener('DOMContentLoaded', () => {

    const profileCards = document.querySelectorAll('.profile-card');

    profileCards.forEach(card => {
        card.addEventListener('click', () => {
            const profileType = card.dataset.profile;
            
            if (profileType) {
                window.location.href = `pages/login-${profileType}.html`;
            }
        });
    });

});