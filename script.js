document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsDiv = document.getElementById('results');
    const noResultsDiv = document.getElementById('no-results');
    const loadingSpinner = document.getElementById('loading');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav ul');

    let currentQuery = '';
    let startIndex = 0;
    const maxResults = 24;
    let isLoading = false;

    function orderBook(title) {
        window.location.href = `order.html?title=${encodeURIComponent(title)}`;
    }

    function createBookCard(book) {
        const volumeInfo = book.volumeInfo;
        const title = volumeInfo.title || 'No Title';
        const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author';
        const thumbnail = volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/170x255?text=No+Cover';
        const pdfLink = book.accessInfo?.pdf?.isAvailable ? volumeInfo.previewLink : null;

        const card = document.createElement('div');
        card.className = 'book-card';

        card.innerHTML = `
            <img src="${thumbnail}" alt="Cover of ${title}" class="book-cover" />
            <div class="book-title" title="${title}">${title}</div>
            <div class="book-author">${authors}</div>
            <div class="actions">
                <button class="btn btn-order" type="button"><i class="fas fa-shopping-cart"></i> Order</button>
                ${pdfLink ? `<a href="${pdfLink}" target="_blank" rel="noopener" class="btn btn-download"><i class="fas fa-download"></i> Preview</a>` : ''}
            </div>
        `;

        card.querySelector('.btn-order').addEventListener('click', () => orderBook(title));
        return card;
    }

    async function fetchAndDisplayBooks(query = '', append = false) {
        if (isLoading) return;
        isLoading = true;
        loadingSpinner.style.display = 'block';
        noResultsDiv.style.display = 'none';
        loadMoreBtn.style.display = 'none';

        if (!append) {
            resultsDiv.innerHTML = '';
            startIndex = 0;
        }

        const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query || 'fiction')}&startIndex=${startIndex}&maxResults=${maxResults}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const books = data.items;

            if (!books || books.length === 0) {
                noResultsDiv.style.display = 'block';
                noResultsDiv.textContent = query ? `No books found for "${query}".` : 'No recommended books right now.';
                return;
            }

            books.forEach(book => {
                const title = book.volumeInfo.title;
                if (title && !resultsDiv.querySelector(`[title="${title.replace(/"/g, '\\"')}"]`)) {
                    const card = createBookCard(book);
                    resultsDiv.appendChild(card);
                }
            });

            if (books.length === maxResults) {
                loadMoreBtn.style.display = 'block';
            }
        } catch (error) {
            noResultsDiv.style.display = 'block';
            noResultsDiv.textContent = 'Error fetching books. Please try again later.';
            console.error('Google API error:', error);
        } finally {
            isLoading = false;
            loadingSpinner.style.display = 'none';
        }
    }

    // Debounced live search
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        if (query === currentQuery && resultsDiv.children.length > 0 && query !== '') return;
        currentQuery = query;

        searchTimeout = setTimeout(() => {
            fetchAndDisplayBooks(currentQuery);
        }, 300);
    });

    // Search button
    searchBtn.addEventListener('click', () => {
        clearTimeout(searchTimeout);
        currentQuery = searchInput.value.trim();
        fetchAndDisplayBooks(currentQuery);
    });

    // Load more button
    loadMoreBtn.addEventListener('click', () => {
        if (!isLoading) {
            startIndex += maxResults;
            fetchAndDisplayBooks(currentQuery, true);
        }
    });

    // Mobile nav toggle
    navToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        navToggle.querySelector('i').classList.toggle('fa-bars');
        navToggle.querySelector('i').classList.toggle('fa-times');
    });

    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                navToggle.querySelector('i').classList.remove('fa-times');
                navToggle.querySelector('i').classList.add('fa-bars');
            }
        });
    });

    // Fade-in animation observer
    const animateElements = document.querySelectorAll('.animate-fade-in, .animate-fade-in-up');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animateElements.forEach(element => {
        observer.observe(element);
    });

    // Initial fetch
    fetchAndDisplayBooks();
});
