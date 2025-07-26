// Enhanced AI Recommendations products array


// Shopping cart array
let shoppingCart = [];

// DOM elements
const container = document.getElementById('products-container');
const filterControls = document.createElement('div');
filterControls.className = 'filter-controls';
const cartCount = document.createElement('span');
cartCount.className = 'cart-count';
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.textContent = 'Loading recommendations...';

// Modal elements
const modal = document.createElement('div');
modal.className = 'product-modal';
modal.innerHTML = `
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div class="modal-body"></div>
    </div>
`;

// Create header with cart
const header = document.createElement('header');
header.innerHTML = `
    <h1>Recommended For You</h1>
    
    <div class="sort-filter-container">
        <select id="sort-by" class="sort-dropdown">
            <option value="default">Sort by</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating</option>
            <option value="discount">Discount</option>
        </select>
        <select id="filter-by" class="filter-dropdown">
            <option value="all">All Categories</option>
            <option value="smart home">Smart Home</option>
            <option value="wearable">Wearables</option>
            <option value="health">Health</option>
        </select>
    </div>
`;

document.body.insertBefore(header, container);
document.body.appendChild(modal);

// Helper functions
const formatPrice = (price, currency = 'PAK') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
    }).format(price);
};

const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<span class="star full">★</span>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<span class="star half">★</span>';
        } else {
            stars += '<span class="star">★</span>';
        }
    }
    
    return stars;
};

const updateCartCount = () => {
    const totalItems = shoppingCart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems > 0 ? totalItems : '';
    cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
};

const addToCart = (productId) => {
    const product = aiRecommendedProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = shoppingCart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        shoppingCart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
    }
    
    updateCartCount();
    showNotification(`${product.name} added to cart`);
};

const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
};

const openProductModal = (productId) => {
    const product = aiRecommendedProducts.find(p => p.id === productId);
    if (!product) return;

    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="modal-product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="modal-product-details">
            <h2>${product.name}</h2>
            <div class="modal-rating">
                ${renderRatingStars(product.rating)}
                <span class="review-count">${product.reviewCount} reviews</span>
            </div>
            <div class="modal-price">
                ${product.originalPrice ? `
                    <span class="original-price">${formatPrice(product.originalPrice)}</span>
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.discount ? `<span class="discount-badge">Save ${product.discount}%</span>` : ''}
                ` : formatPrice(product.price)}
            </div>
            <p class="modal-description">${product.description}</p>
            <div class="modal-features">
                <h4>Key Features:</h4>
                <ul>
                    ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            <div class="modal-actions">
                <button class="add-to-cart-btn" ${!product.inStock ? 'disabled' : ''}>
                    ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>

            </div>
        </div>
    `;

    if (product.inStock) {
        modalBody.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            addToCart(product.id);
            modal.querySelector('.close-modal').click();
        });
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

const renderProducts = (products) => {
    container.innerHTML = '';
    
    if (products.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No products match your criteria.';
        container.appendChild(emptyState);
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        card.dataset.category = product.tags.join(' ');
        
        if (product.discount) {
            card.classList.add('discounted');
        }
        
        if (!product.inStock) {
            card.classList.add('out-of-stock');
        }

        let priceDisplay = `<div class="price">${formatPrice(product.price)}</div>`;
        if (product.originalPrice) {
            priceDisplay = `
                <div class="price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    <span class="original-price">${formatPrice(product.originalPrice)}</span>
                    ${product.discount ? `<span class="discount-badge">-${product.discount}%</span>` : ''}
                </div>
            `;
        }

        let colorOptions = '';
        if (product.colors && product.colors.length > 0) {
            colorOptions = `
                <div class="color-options">
                    ${product.colors.map(color => 
                        `<span class="color-dot" style="background-color: ${color.toLowerCase()}" title="${color}"></span>`
                    ).join('')}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="product-image" role="button" tabindex="0">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${!product.inStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                <button class="quick-view-btn">Quick View</button>
            </div>
            <div class="details">
                <h3>${product.name}</h3>
                <div class="rating">
                    ${renderRatingStars(product.rating)}
                    <span class="review-count">(${product.reviewCount})</span>
                </div>
                <p class="description">${product.description}</p>
                ${colorOptions}
                ${priceDisplay}
                <button class="add-to-cart" ${!product.inStock ? 'disabled' : ''}>
                    ${product.inStock ? 'Add to Cart' : 'Notify Me'}
                </button>
            </div>
        `;

        // Add event listeners
        card.querySelector('.add-to-cart').addEventListener('click', () => {
            if (product.inStock) {
                addToCart(product.id);
            } else {
                showNotification(`We'll notify you when ${product.name} is back in stock`);
            }
        });

        card.querySelector('.quick-view-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openProductModal(product.id);
        });

        card.querySelector('.product-image').addEventListener('click', () => {
            openProductModal(product.id);
        });

        // Add keyboard accessibility
        card.querySelector('.product-image').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProductModal(product.id);
            }
        });

        container.appendChild(card);
    });

    // Add animation to cards
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });
};

// Sort and filter functionality
const sortProducts = (products, sortBy) => {
    switch (sortBy) {
        case 'price-asc':
            return [...products].sort((a, b) => a.price - b.price);
        case 'price-desc':
            return [...products].sort((a, b) => b.price - a.price);
        case 'rating':
            return [...products].sort((a, b) => b.rating - a.rating);
        case 'discount':
            return [...products].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        default:
            return products;
    }
};

const filterProducts = (products, filterBy) => {
    if (filterBy === 'all') return products;
    return products.filter(product => product.tags.includes(filterBy));
};

// Initialize the page
const init = () => {
    container.appendChild(loadingIndicator);

    // Simulate API call with error handling
    const fetchProducts = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate random error (10% chance)
                if (Math.random() < 0.1) {
                    reject(new Error('Failed to load products. Please try again later.'));
                } else {
                    resolve(aiRecommendedProducts);
                }
            }, 1000);
        });
    };

    fetchProducts()
        .then(products => {
            container.removeChild(loadingIndicator);
            renderProducts(products);
            
            // Set up sort/filter event listeners
            document.getElementById('sort-by').addEventListener('change', (e) => {
                const filtered = filterProducts(aiRecommendedProducts, document.getElementById('filter-by').value);
                const sorted = sortProducts(filtered, e.target.value);
                renderProducts(sorted);
            });
            
            document.getElementById('filter-by').addEventListener('change', (e) => {
                const filtered = filterProducts(aiRecommendedProducts, e.target.value);
                const sorted = sortProducts(filtered, document.getElementById('sort-by').value);
                renderProducts(sorted);
            });
        })
        .catch(error => {
            container.removeChild(loadingIndicator);
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.innerHTML = `
                <p>${error.message}</p>
                <button id="retry-button">Retry</button>
            `;
            container.appendChild(errorElement);
            
            document.getElementById('retry-button').addEventListener('click', init);
        });
};

// Modal close functionality
modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Initialize the app
init();

// Responsive adjustments
const handleResize = () => {
    if (window.innerWidth < 768) {
        container.classList.add('mobile-view');
    } else {
        container.classList.remove('mobile-view');
    }
};

window.addEventListener('resize', handleResize);
handleResize(); // Initial check