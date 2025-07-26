document.addEventListener('DOMContentLoaded', function() {
    // First check authentication
    const token = localStorage.getItem('token');
    const customerId = localStorage.getItem('customerId');
    
    if (!token || !customerId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    // Configuration
    const backendUrl = "https://localhost:7273";
    const placeholderImage = '/images/potato.jpg';
    const fallbackImage = '/images/potato.jpg';

    // Common headers for API requests
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    let allProducts = [];
    let currentCategory = 'all';

    // Fetch all products with authentication
    function fetchAllProducts() {
        fetch(`${backendUrl}/api/Products/GetAllProducts`, {
            headers: authHeaders
        })
        .then(response => {
            if (response.status === 401) {
                // Token expired or invalid
                handleUnauthorized();
                throw new Error('Unauthorized');
            }
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allProducts = data.Data.filter(product => product.StockQuantity > 0);
            displayProducts(allProducts);
        })
        .catch(error => {
            if (error.message !== 'Unauthorized') {
                console.error('Error fetching products:', error);
                showErrorMessage('Failed to load products. Please try again later.');
            }
        });
    }

    // Fetch categories with authentication
    function fetchCategories() {
        fetch(`${backendUrl}/api/Categories/GetAllCategories`, {
            headers: authHeaders
        })
        .then(response => {
            if (response.status === 401) {
                handleUnauthorized();
                throw new Error('Unauthorized');
            }
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const dropdownMenu = document.getElementById('categories-dropdown');
            dropdownMenu.innerHTML = '';
            
            // Add "All Categories" option
            dropdownMenu.appendChild(createCategoryItem('all', 'All Categories', true));
            
            // Add active categories
            data.Data.filter(category => category.IsActive).forEach(category => {
                dropdownMenu.appendChild(createCategoryItem(category.Id, category.Name));
            });
            
            setupCategoryEventListeners();
        })
        .catch(error => {
            if (error.message !== 'Unauthorized') {
                console.error('Error fetching categories:', error);
                document.getElementById('categories-dropdown').innerHTML = `
                    <li class="error-loading">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Failed to load categories</span>
                    </li>
                `;
            }
        });
    }

    // Handle unauthorized access
    function handleUnauthorized() {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('customerId');
        window.location.href = 'login.html';
    }

    // Helper function to create category items
    function createCategoryItem(id, name, isActive = false) {
        const item = document.createElement('li');
        item.innerHTML = `
            <a href="#" class="category-filter ${isActive ? 'active' : ''}" 
               data-category-id="${id}">
                ${name}
            </a>
        `;
        return item;
    }

    // Setup event listeners for category filters
    function setupCategoryEventListeners() {
        document.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('click', function(e) {
                e.preventDefault();
                const categoryId = this.getAttribute('data-category-id');
                filterProductsByCategory(categoryId);
                
                // Update active state
                document.querySelectorAll('.category-filter').forEach(f => 
                    f.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Filter products by category
    function filterProductsByCategory(categoryId) {
        currentCategory = categoryId;
        const filteredProducts = categoryId === 'all' 
            ? allProducts 
            : allProducts.filter(product => product.CategoryId == categoryId);
        
        displayProducts(filteredProducts);
        updateCategoryTitle(categoryId);
    }

    // Update the category title
    function updateCategoryTitle(categoryId) {
        const categoryName = categoryId === 'all' 
            ? 'All Products' 
            : document.querySelector(`.category-filter[data-category-id="${categoryId}"]`).textContent;
        document.querySelector('.products-header h2').textContent = categoryName;
    }

    // Display products in the grid
    function displayProducts(products) {
        const productsContainer = document.getElementById('products-container');
        
        if (products.length === 0) {
            showNoProductsMessage();
            return;
        }
        
        productsContainer.innerHTML = '';
        const productsGrid = document.createElement('div');
        productsGrid.className = 'products-grid';
        
        products.forEach(product => {
            productsGrid.appendChild(createProductCard(product));
        });
        
        productsContainer.appendChild(productsGrid);
        setupProductCardEventListeners();
    }

    // Create a product card element
    function createProductCard(product) {
        const originalPrice = product.DiscountPercentage > 0 
            ? (product.Price / (1 - product.DiscountPercentage / 100)).toFixed(2)
            : null;
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img class="product-image lazy" 
                     src="${backendUrl}${placeholderImage}" 
                     data-src="${getProductImageUrl(product)}"
                     alt="${product.Name || 'Product image'}"
                     loading="lazy"
                     onerror="this.src='${backendUrl}${fallbackImage}'; this.onerror=null">
            </div>
            <div class="product-details">
                <h4>${product.Name || 'Unnamed Product'}</h4>
                <div class="product-price">
                    <span class="current-price">Rs.${product.Price?.toFixed(2) || '0.00'}</span>
                    ${originalPrice ? `<span class="original-price">Rs.${originalPrice}</span>` : ''}
                </div>
                <button class="add-to-cart" data-product-id="${product.Id}">
                    <i class="fas fa-shopping-cart"></i>Add to Cart
                </button>
                <button class="buy-now-btn" data-product-id="${product.Id}">
                    <i class="fas fa-wallet"></i>Buy Now
                </button>
            </div>
        `;
        
        // Initialize lazy loading
        initLazyLoading(productCard.querySelector('.product-image.lazy'));
        
        return productCard;
    }

    // Get proper product image URL
    function getProductImageUrl(product) {
        if (!product.ProductImage) return `${backendUrl}${fallbackImage}`;
        
        return product.ProductImage.startsWith('/') 
            ? `${backendUrl}${product.ProductImage}`
            : `${backendUrl}/images/products/${product.ProductImage}`;
    }

    // Initialize lazy loading for images
    function initLazyLoading(imageElement) {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        lazyImage.src = lazyImage.dataset.src;
                        lazyImage.classList.remove('lazy');
                        observer.unobserve(lazyImage);
                    }
                });
            });
            
            observer.observe(imageElement);
        } else {
            // Fallback for browsers without IntersectionObserver
            imageElement.src = imageElement.dataset.src;
            imageElement.classList.remove('lazy');
        }
    }

    // Setup event listeners for product cards
    function setupProductCardEventListeners() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                addToCart(productId);
            });
        });
        
        document.querySelectorAll('.buy-now-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                buyNow(productId);
            });
        });
    }

    // Show no products message
    function showNoProductsMessage() {
        document.getElementById('products-container').innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>No products available in this category.</p>
            </div>
        `;
    }

    // Show error message
    function showErrorMessage(message) {
        document.getElementById('products-container').innerHTML = `
            <div class="no-products">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Cart functions
    // Add to cart function for product listings
    async function addToCart(productId) {
        const token = localStorage.getItem('token');
        const customerId = localStorage.getItem('customerId');
        
        if (!token || !customerId) {
            alert('Please login to add items to cart');
            window.location.href = 'login.html';
            return;
        }
        
        try {
            const response = await fetch('https://localhost:7273/api/Carts/AddToCart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    CustomerId: parseInt(customerId),
                    ProductId: parseInt(productId),
                    Quantity: 1  // Changed from 5 to 1 since this is "Add to Cart"
                })
            });

            // Check if response is successful (status code 200-299)
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Server returned ${response.status} status`);
            }

            // Check if response has content
            const contentLength = response.headers.get('Content-Length');
            if (contentLength === '0') {
                // Successful but empty response (common for POST actions)
                alert('Product added to cart successfully!');
                updateCartCount();
                return;
            }

            // Try to parse JSON only if there's content
            const result = await response.json();
            
            if (result.Success !== undefined) {
                if (result.Success) {
                    alert('Product added to cart!');
                    updateCartCount();
                } else {
                    alert(result.Errors?.[0] || 'Failed to add to cart');
                }
            } else {
                // Handle case where response doesn't follow expected format
                alert('Product added to cart successfully!');
                updateCartCount();
            }
        } catch (error) {
            console.error('Error:', error);
            
            // More user-friendly error messages
            if (error.message.includes('Failed to fetch')) {
                alert('Network error. Please check your connection.');
            } else if (error.message.includes('Unexpected token')) {
                alert('Server response format error. Please try again.');
            } else {
                alert(error.message || 'Failed to add to cart. Please try again.');
            }
        }
    }

    // Enhanced updateCartCount function
    async function updateCartCount() {
        try {
            const response = await fetch(`${backendUrl}/api/Cart/GetCartCount?customerId=${customerId}`, {
                headers: authHeaders
            });
            
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }
            
            if (response.ok) {
                const data = await response.json();
                const count = data.Data || 0;
                document.querySelector('.item-count').textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
                document.querySelector('.notification .badge').textContent = count;
            }
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }
    
    // Enhanced buyNow function
    function buyNow(productId) {
        addToCart(productId).then(() => {
            window.location.href = 'checkout.html';
        }).catch(error => {
            console.error('Error in buy now:', error);
        });
    }
    // Initialize
    fetchAllProducts();
    fetchCategories();

});