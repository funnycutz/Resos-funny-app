// Gestion de l'authentification
document.addEventListener('DOMContentLoaded', () => {
    // Écouteurs pour les boutons d'authentification
    document.getElementById('signin-btn').addEventListener('click', showAuthModal);
    document.getElementById('signup-btn').addEventListener('click', showAuthModal);
    document.getElementById('google-signin').addEventListener('click', signInWithGoogle);
    document.getElementById('google-signup').addEventListener('click', signInWithGoogle);
    document.getElementById('signout-btn').addEventListener('click', signOut);
    
    // Écouteurs pour les formulaires
    document.getElementById('email-signin-form').addEventListener('submit', handleEmailSignIn);
    document.getElementById('email-signup-form').addEventListener('submit', handleEmailSignUp);
    
    // Observer l'état d'authentification
    auth.onAuthStateChanged(handleAuthStateChange);
});

// Connexion avec Google
function signInWithGoogle(e) {
    e.preventDefault();
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            // Vérifier si c'est un nouvel utilisateur
            if (result.additionalUserInfo.isNewUser) {
                // Créer le profil utilisateur dans la base de données
                createUserProfile(result.user, result.user.displayName || 'Utilisateur Google');
            }
            closeModal('auth-modal');
        })
        .catch((error) => {
            showAuthMessage('signin-message', error.message, 'error');
        });
}

// Inscription avec email (passwordless)
function handleEmailSignUp(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    
    const actionCodeSettings = {
        url: window.location.origin + '/complete-signup?username=' + encodeURIComponent(username),
        handleCodeInApp: true
    };
    
    auth.sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            // Stocker l'email et le username dans le localStorage
            window.localStorage.setItem('emailForSignUp', email);
            window.localStorage.setItem('usernameForSignUp', username);
            
            showAuthMessage('signup-message', 'Un lien d\'inscription a été envoyé à votre email!', 'success');
        })
        .catch((error) => {
            showAuthMessage('signup-message', error.message, 'error');
        });
}

// Connexion avec email (passwordless)
function handleEmailSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    
    const actionCodeSettings = {
        url: window.location.origin + '/complete-signin',
        handleCodeInApp: true
    };
    
    auth.sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            // Stocker l'email dans le localStorage
            window.localStorage.setItem('emailForSignIn', email);
            
            showAuthMessage('signin-message', 'Un lien de connexion a été envoyé à votre email!', 'success');
        })
        .catch((error) => {
            showAuthMessage('signin-message', error.message, 'error');
        });
}

// Déconnexion
function signOut() {
    auth.signOut()
        .then(() => {
            console.log('Utilisateur déconnecté');
        })
        .catch((error) => {
            console.error('Erreur de déconnexion:', error);
        });
}

// Gérer le changement d'état d'authentification
function handleAuthStateChange(user) {
    if (user) {
        // Utilisateur connecté
        document.getElementById('auth-buttons').classList.add('hidden');
        document.getElementById('user-profile').classList.remove('hidden');
        
        // Mettre à jour l'affichage du profil
        updateUserProfile(user);
        
        // Vérifier si l'utilisateur a un profil dans la base de données
        checkUserProfile(user);
    } else {
        // Utilisateur non connecté
        document.getElementById('auth-buttons').classList.remove('hidden');
        document.getElementById('user-profile').classList.add('hidden');
    }
}

// Vérifier le lien de connexion/inscription
function handleSignInLink() {
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
            // Demander à l'utilisateur son email
            email = prompt('Veuillez fournir votre email pour confirmation');
        }
        
        auth.signInWithEmailLink(email, window.location.href)
            .then((result) => {
                // Supprimer l'email du localStorage
                window.localStorage.removeItem('emailForSignIn');
                
                // Vérifier si c'est une inscription
                const username = window.localStorage.getItem('usernameForSignUp');
                if (username) {
                    createUserProfile(result.user, username);
                    window.localStorage.removeItem('usernameForSignUp');
                }
            })
            .catch((error) => {
                console.error('Erreur de connexion avec email:', error);
            });
    }
}

// Créer un profil utilisateur dans la base de données
function createUserProfile(user, username) {
    const userRef = db.ref('users/' + user.uid);
    
    userRef.set({
        username: username,
        email: user.email,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        badge: 'member', // Badge par défaut
        avatarUrl: user.photoURL || 'https://via.placeholder.com/150'
    });
}

// Vérifier et mettre à jour le profil utilisateur
function checkUserProfile(user) {
    const userRef = db.ref('users/' + user.uid);
    
    userRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            // Créer un profil si inexistant
            createUserProfile(user, user.displayName || 'Nouvel utilisateur');
        }
    });
}

// Mettre à jour l'affichage du profil utilisateur
function updateUserProfile(user) {
    const userRef = db.ref('users/' + user.uid);
    
    userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        
        if (userData) {
            // Mettre à jour l'avatar
            const avatar = document.getElementById('user-avatar');
            avatar.src = userData.avatarUrl || user.photoURL || 'https://via.placeholder.com/40';
            
            // Mettre à jour le nom d'utilisateur avec le badge
            const usernameDisplay = document.getElementById('username-display');
            usernameDisplay.innerHTML = userData.username;
            
            // Ajouter le badge si nécessaire
            if (userData.badge && userData.badge !== 'member') {
                const badgeElement = document.createElement('span');
                badgeElement.className = `user-badge ${userData.badge}`;
                badgeElement.textContent = getBadgeDisplayName(userData.badge);
                usernameDisplay.appendChild(badgeElement);
                
                // Appliquer le style selon le badge
                applyBadgeStyle(usernameDisplay, userData.badge);
            }
        }
    });
}

// Obtenir le nom d'affichage du badge
function getBadgeDisplayName(badgeType) {
    const badges = {
        'developer': 'Developer',
        'creator': 'Creator',
        'partner': 'Partner',
        'member': 'Member'
    };
    return badges[badgeType] || '';
}

// Appliquer le style selon le badge
function applyBadgeStyle(element, badgeType) {
    // Supprimer toutes les classes de badge existantes
    element.classList.remove('badge-developer', 'badge-creator', 'badge-partner', 'badge-member');
    
    // Ajouter la classe correspondante
    element.classList.add(`badge-${badgeType}`);
}
