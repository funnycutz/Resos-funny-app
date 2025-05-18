// Initialisation et coordination des différents modules
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est connecté
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Utilisateur connecté:', user);
            
            // Charger les données utilisateur supplémentaires
            db.ref('users/' + user.uid).once('value').then((snapshot) => {
                const userData = snapshot.val();
                console.log('Données utilisateur:', userData);
            });
        } else {
            console.log('Utilisateur non connecté');
        }
    });
    
    // Gérer les liens de connexion/inscription par email
    if (auth.isSignInWithEmailLink(window.location.href)) {
        handleSignInLink();
    }
    
    // Autres initialisations...
});

// Fonction pour vérifier si l'utilisateur a un badge spécifique
function hasUserBadge(userId, badgeType) {
    return db.ref('users/' + userId + '/badge').once('value')
        .then(snapshot => snapshot.val() === badgeType);
}

// Fonction pour mettre à jour le badge d'un utilisateur (admin seulement)
function updateUserBadge(userId, newBadge) {
    // Ici, vous devriez vérifier que l'utilisateur actuel est un admin
    return db.ref('users/' + userId).update({ badge: newBadge });
}
