// Gestion des modals et de l'interface
document.addEventListener('DOMContentLoaded', () => {
    // Écouteurs pour les modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Écouteur pour le bouton de création de post
    document.getElementById('create-post-btn').addEventListener('click', () => {
        showModal('create-post-modal');
    });
    
    // Écouteurs pour les onglets d'authentification
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    // Gestion des options de post
    document.getElementById('add-poll-btn').addEventListener('click', togglePollContainer);
    document.getElementById('add-option-btn').addEventListener('click', addPollOption);
    
    // Fermer les modals en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Gérer le lien de connexion si présent dans l'URL
    handleSignInLink();
});

// Afficher le modal d'authentification
function showAuthModal() {
    showModal('auth-modal');
}

// Afficher un modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');
}

// Fermer un modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    document.body.classList.remove('no-scroll');
    
    // Réinitialiser le formulaire de création de post
    if (modalId === 'create-post-modal') {
        document.getElementById('post-form').reset();
        document.getElementById('poll-container').classList.add('hidden');
    }
}

// Basculer entre les onglets d'authentification
function switchAuthTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Afficher un message d'authentification
function showAuthMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('hidden', 'success', 'error');
    element.classList.add(type);
    
    // Cacher le message après 5 secondes
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// Basculer l'affichage du conteneur de sondage
function togglePollContainer() {
    const pollContainer = document.getElementById('poll-container');
    pollContainer.classList.toggle('hidden');
}

// Ajouter une option de sondage
function addPollOption() {
    const pollOptions = document.getElementById('poll-options');
    const optionCount = pollOptions.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'poll-option';
    
    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.placeholder = `Option ${optionCount}`;
    optionInput.className = 'poll-option-input';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-option-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', function() {
        pollOptions.removeChild(optionDiv);
    });
    
    optionDiv.appendChild(optionInput);
    optionDiv.appendChild(removeBtn);
    pollOptions.appendChild(optionDiv);
}

// Afficher un toast (notification)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-toast-in`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Supprimer le toast après 5 secondes
    setTimeout(() => {
        toast.classList.replace('animate-toast-in', 'animate-toast-out');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 5000);
}
