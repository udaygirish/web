// Load and display blog posts
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    setupModal();
});

function loadPosts() {
    const postsGrid = document.getElementById('posts-grid');

    BLOG_CONFIG.posts.forEach(post => {
        const postCard = createPostCard(post);
        postsGrid.appendChild(postCard);
    });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.onclick = () => loadPost(post);

    card.innerHTML = `
        <div class="post-meta">
            <span class="post-date">${formatDate(post.date)}</span>
            <span class="post-author">${post.author}</span>
        </div>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-excerpt">${post.excerpt}</p>
        <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
    `;

    return card;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function loadPost(post) {
    const modal = document.getElementById('post-modal');
    const content = document.getElementById('post-content');

    try {
        const response = await fetch(BLOG_CONFIG.postsFolder + post.file);
        if (!response.ok) throw new Error('Post not found');

        let markdown = await response.text();
        
        // Strip Jekyll front matter if present
        if (markdown.trim().startsWith('---')) {
            const parts = markdown.split('---');
            if (parts.length >= 3) {
                markdown = parts.slice(2).join('---').trim();
            }
        }
        
        const html = marked.parse(markdown);

        content.innerHTML = `
            <div class="post-meta" style="margin-bottom: 2rem;">
                <span class="post-date">${formatDate(post.date)}</span>
                <span style="margin: 0 1rem">•</span>
                <span class="post-author">${post.author}</span>
            </div>
            ${html}
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Failed to load blog post');
    }
}

function setupModal() {
    const modal = document.getElementById('post-modal');
    const closeBtn = document.getElementById('modal-close');

    closeBtn.onclick = closeModal;

    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.getElementById('post-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}
