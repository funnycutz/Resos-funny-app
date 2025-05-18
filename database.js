// Gestion des posts et interactions
document.addEventListener('DOMContentLoaded', () => {
    // Écouteur pour le formulaire de post
    document.getElementById('post-form').addEventListener('submit', createPost);
    
    // Charger les posts
    loadPosts();
});

// Créer un nouveau post
function createPost(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        showToast('Vous devez être connecté pour créer un post', 'error');
        return;
    }
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const hasPoll = document.getElementById('poll-container').classList.contains('hidden') ? false : true;
    
    let pollOptions = [];
    if (hasPoll) {
        const optionInputs = document.querySelectorAll('.poll-option-input');
        optionInputs.forEach(input => {
            if (input.value.trim() !== '') {
                pollOptions.push(input.value.trim());
            }
        });
        
        if (pollOptions.length < 2) {
            showToast('Un sondage doit avoir au moins 2 options', 'error');
            return;
        }
    }
    
    // Récupérer les données utilisateur
    db.ref('users/' + user.uid).once('value').then(snapshot => {
        const userData = snapshot.val();
        
        // Créer l'objet post
        const postData = {
            title: title,
            content: content,
            authorId: user.uid,
            authorName: userData.username,
            authorBadge: userData.badge || 'member',
            authorAvatar: userData.avatarUrl || user.photoURL || 'https://via.placeholder.com/150',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            likes: 0,
            dislikes: 0,
            comments: {}
        };
        
        // Ajouter les options de sondage si nécessaire
        if (hasPoll && pollOptions.length >= 2) {
            postData.poll = {
                options: pollOptions.reduce((acc, option, index) => {
                    acc[index] = {
                        text: option,
                        votes: 0
                    };
                    return acc;
                }, {}),
                totalVotes: 0
            };
        }
        
        // Envoyer le post à la base de données
        const newPostKey = db.ref('posts').push().key;
        const updates = {};
        updates['/posts/' + newPostKey] = postData;
        updates['/user-posts/' + user.uid + '/' + newPostKey] = true;
        
        db.ref().update(updates)
            .then(() => {
                showToast('Post créé avec succès!', 'success');
                closeModal('create-post-modal');
            })
            .catch(error => {
                showToast('Erreur lors de la création du post: ' + error.message, 'error');
            });
    });
}

// Charger les posts
function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    
    db.ref('posts').orderByChild('createdAt').on('value', snapshot => {
        postsContainer.innerHTML = '';
        
        snapshot.forEach(childSnapshot => {
            const post = childSnapshot.val();
            post.id = childSnapshot.key;
            renderPost(post, postsContainer);
        });
    });
}

// Afficher un post
function renderPost(post, container) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.postId = post.id;
    
    // Formatage de la date
    const postDate = new Date(post.createdAt);
    const dateString = postDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Badge de l'auteur
    let badgeHtml = '';
    if (post.authorBadge && post.authorBadge !== 'member') {
        badgeHtml = `<span class="user-badge ${post.authorBadge}">${getBadgeDisplayName(post.authorBadge)}</span>`;
    }
    
    // Options de sondage si existantes
    let pollHtml = '';
    if (post.poll) {
        pollHtml = `
            <div class="poll">
                <h4>Sondage:</h4>
                <div class="poll-options">
                    ${Object.entries(post.poll.options).map(([key, option]) => `
                        <div class="poll-option">
                            <button class="btn-vote" data-post-id="${post.id}" data-option-id="${key}">
                                ${option.text}
                            </button>
                            <div class="poll-result">
                                <div class="poll-bar" style="width: ${post.poll.totalVotes > 0 ? (option.votes / post.poll.totalVotes * 100) : 0}%"></div>
                                <span class="poll-percentage">${post.poll.totalVotes > 0 ? Math.round(option.votes / post.poll.totalVotes * 100) : 0}%</span>
                                <span class="poll-count">(${option.votes} votes)</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="poll-total">Total votes: ${post.poll.totalVotes}</div>
            </div>
        `;
    }
    
    // Boutons d'interaction
    const interactionButtons = `
        <div class="post-interactions">
            <button class="btn-like" data-post-id="${post.id}">
                <i class="fas fa-heart"></i> ${post.likes || 0}
            </button>
            <button class="btn-dislike" data-post-id="${post.id}">
                <i class="fas fa-thumbs-down"></i> ${post.dislikes || 0}
            </button>
            <button class="btn-comment" data-post-id="${post.id}">
                <i class="fas fa-comment"></i> Commenter
            </button>
        </div>
    `;
    
    // Section de commentaires
    const commentsHtml = `
        <div class="post-comments hidden" id="comments-${post.id}">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            <form class="comment-form" data-post-id="${post.id}">
                <input type="text" placeholder="Ajouter un commentaire..." required>
                <button type="submit"><i class="fas fa-paper-plane"></i></button>
            </form>
        </div>
    `;
    
    // Construction du HTML complet du post
    postElement.innerHTML = `
        <div class="post-header">
            <img src="${post.authorAvatar}" alt="${post.authorName}" class="post-author-avatar">
            <div class="post-author-info">
                <span class="post-author-name ${post.authorBadge ? 'badge-' + post.authorBadge : ''}">
                    ${post.authorName}
                    ${badgeHtml}
                </span>
                <span class="post-date">${dateString}</span>
            </div>
        </div>
        <div class="post-content">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            ${pollHtml}
        </div>
        ${interactionButtons}
        ${commentsHtml}
    `;
    
    container.appendChild(postElement);
    
    // Charger les commentaires
    loadComments(post.id);
    
    // Ajouter les écouteurs d'événements
    setupPostInteractions(postElement, post.id);
}

// Configurer les interactions du post
function setupPostInteractions(postElement, postId) {
    // Like/Dislike
    postElement.querySelector('.btn-like').addEventListener('click', () => handleReaction(postId, 'likes'));
    postElement.querySelector('.btn-dislike').addEventListener('click', () => handleReaction(postId, 'dislikes'));
    
    // Commentaires
    const commentBtn = postElement.querySelector('.btn-comment');
    const commentsSection = postElement.querySelector('.post-comments');
    
    commentBtn.addEventListener('click', () => {
        commentsSection.classList.toggle('hidden');
    });
    
    // Formulaire de commentaire
    const commentForm = postElement.querySelector('.comment-form');
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addComment(postId, commentForm.querySelector('input').value);
        commentForm.reset();
    });
    
    // Vote pour le sondage
    if (postElement.querySelector('.poll')) {
        postElement.querySelectorAll('.btn-vote').forEach(btn => {
            btn.addEventListener('click', function() {
                const optionId = this.getAttribute('data-option-id');
                voteInPoll(postId, optionId);
            });
        });
    }
}

// Gérer les réactions (like/dislike)
function handleReaction(postId, reactionType) {
    const user = auth.currentUser;
    if (!user) {
        showToast('Vous devez être connecté pour réagir', 'error');
        return;
    }
    
    const userReactionRef = db.ref(`post-reactions/${postId}/${user.uid}`);
    const postRef = db.ref(`posts/${postId}/${reactionType}`);
    
    // Vérifier si l'utilisateur a déjà réagi
    userReactionRef.once('value').then(snapshot => {
        const currentReaction = snapshot.val();
        
        if (currentReaction === reactionType) {
            // L'utilisateur annule sa réaction
            userReactionRef.remove();
            postRef.transaction(current => (current || 0) - 1);
        } else {
            // L'utilisateur ajoute ou change sa réaction
            userReactionRef.set(reactionType);
            
            // Si l'utilisateur avait une réaction différente, la diminuer
            if (currentReaction) {
                db.ref(`posts/${postId}/${currentReaction}`).transaction(current => (current || 0) - 1);
            }
            
            // Augmenter la nouvelle réaction
            postRef.transaction(current => (current || 0) + 1);
        }
    });
}

// Ajouter un commentaire
function addComment(postId, commentText) {
    const user = auth.currentUser;
    if (!user) {
        showToast('Vous devez être connecté pour commenter', 'error');
        return;
    }
    
    db.ref('users/' + user.uid).once('value').then(snapshot => {
        const userData = snapshot.val();
        
        const commentData = {
            text: commentText,
            authorId: user.uid,
            authorName: userData.username,
            authorBadge: userData.badge || 'member',
            authorAvatar: userData.avatarUrl || user.photoURL || 'https://via.placeholder.com/150',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        const newCommentKey = db.ref(`post-comments/${postId}`).push().key;
        const updates = {};
        updates[`/post-comments/${postId}/${newCommentKey}`] = commentData;
        
        db.ref().update(updates)
            .then(() => {
                showToast('Commentaire ajouté!', 'success');
            })
            .catch(error => {
                showToast('Erreur lors de l\'ajout du commentaire: ' + error.message, 'error');
            });
    });
}

// Charger les commentaires d'un post
function loadComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    db.ref(`post-comments/${postId}`).orderByChild('createdAt').on('value', snapshot => {
        commentsList.innerHTML = '';
        
        if (!snapshot.exists()) {
            commentsList.innerHTML = '<p class="no-comments">Aucun commentaire pour le moment.</p>';
            return;
        }
        
        snapshot.forEach(childSnapshot => {
            const comment = childSnapshot.val();
            renderComment(comment, commentsList);
        });
    });
}

// Afficher un commentaire
function renderComment(comment, container) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    
    // Formatage de la date
    const commentDate = new Date(comment.createdAt);
    const dateString = commentDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Badge de l'auteur
    let badgeHtml = '';
    if (comment.authorBadge && comment.authorBadge !== 'member') {
        badgeHtml = `<span class="user-badge ${comment.authorBadge}">${getBadgeDisplayName(comment.authorBadge)}</span>`;
    }
    
    commentElement.innerHTML = `
        <div class="comment-header">
            <img src="${comment.authorAvatar}" alt="${comment.authorName}" class="comment-author-avatar">
            <div class="comment-author-info">
                <span class="comment-author-name ${comment.authorBadge ? 'badge-' + comment.authorBadge : ''}">
                    ${comment.authorName}
                    ${badgeHtml}
                </span>
                <span class="comment-date">${dateString}</span>
            </div>
        </div>
        <div class="comment-content">
            <p>${comment.text}</p>
        </div>
    `;
    
    container.appendChild(commentElement);
}

// Voter dans un sondage
function voteInPoll(postId, optionId) {
    const user = auth.currentUser;
    if (!user) {
        showToast('Vous devez être connecté pour voter', 'error');
        return;
    }
    
    const userVoteRef = db.ref(`poll-votes/${postId}/${user.uid}`);
    const optionRef = db.ref(`posts/${postId}/poll/options/${optionId}/votes`);
    const totalVotesRef = db.ref(`posts/${postId}/poll/totalVotes`);
    
    // Vérifier si
