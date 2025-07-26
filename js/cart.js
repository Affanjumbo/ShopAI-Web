    let currentCartId = null;
document.addEventListener('DOMContentLoaded', function() {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    const customerId = localStorage.getItem('customerId');
    
    if (!token || !customerId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    // API configuration
    const API_BASE_URL = 'https://localhost:7273/api';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const backendUrl = "https://localhost:7273";
    const placeholderImage = '/images/potato.jpg';
    const fallbackImage = '/images/potato.jpg';

    // Common function to get proper image URL
    function getProductImageUrl(imagePath) {
        if (!imagePath) return `${backendUrl}${fallbackImage}`;
        
        return imagePath.startsWith('http') ? imagePath :
               imagePath.startsWith('/') ? `${backendUrl}${imagePath}` :
               `${backendUrl}/images/products/${imagePath}`;
    }

    // DOM elements
    const cartItemsContainer = document.querySelector('.cart-items');
    const itemCountElement = document.querySelector('.item-count');
    const subtotalElement = document.querySelector('.subtotal');
    const totalElement = document.querySelector('.total-price');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const notificationBadge = document.querySelector('.notification .badge');
    const recommendationsContainer = document.querySelector('.ai-recommendations');

    // Load cart items from API
    async function loadCartItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/Carts/GetCart/${customerId}`, {
                headers: headers
            });
            
            if (!response.ok) throw new Error('Failed to load cart');
            
            const data = await response.json();
            currentCartId = data.Data.Id;
            return data.Data?.CartItems || [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    // Add item to cart via API
    async function addToCart(productId, quantity = 1) {
        try {
            const response = await fetch(`${API_BASE_URL}/Carts/AddToCart`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    CustomerId: parseInt(customerId),
                    ProductId: productId,
                    Quantity: quantity
                })
            });
            
            if (!response.ok) throw new Error('Failed to add to cart');
            
            return await response.json();
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    }

    // Update cart item quantity via API
    async function updateCartItem(cartItemId, newQuantity) {
        try {
            const response = await fetch(`${API_BASE_URL}/Carts/UpdateCartItem`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({
                    CustomerId: parseInt(customerId),
                    CartItemId: parseInt(cartItemId),
                    Quantity: newQuantity
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update cart');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating cart:', error);
            throw error;
        }
    }

    // Remove item from cart via API
    async function removeCartItem(cartItemId) {
        try {
            const response = await fetch(`${API_BASE_URL}/Carts/RemoveCartItem`, {
                method: 'DELETE',
                headers: headers,
                body: JSON.stringify({
                    CustomerId: parseInt(customerId),
                    CartItemId: parseInt(cartItemId)
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove from cart');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    }

    // Render cart items
    async function renderCartItems() {
        const cartItems = await loadCartItems();
        
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your Cart is Empty</h3>
                    <p>Looks like you haven't added anything to your cart yet</p>
                    <a href="dashboard.html" class="shop-btn">Shop Now</a>
                </div>
            `;
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.7';
            checkoutBtn.style.cursor = 'not-allowed';
            
            // Hide recommendations if cart is empty
            recommendationsContainer.style.display = 'block';
            const lastProduct = cartItems[cartItems.length - 1];
    if (!lastProduct || !lastProduct.ProductId) {
        console.error('Last product is invalid:', lastProduct);
        document.querySelector('.recommended-products').innerHTML = `
            <div class="recommendation-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Add some products in cart to view smart suggestions</p>
            </div>
        `;
        return;
    }

    console.log('Loading recommendations for product ID:', lastProduct.ProductId); // Debug log
    loadRecommendations(lastProduct.ProductId);
            return;
        }

        cartItemsContainer.innerHTML = '';
        
        cartItems.forEach((item) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img class="lazy" 
                         src="${placeholderImage}" 
                         data-src="${getProductImageUrl(item.ProductImage)}"
                         alt="${item.ProductName}"
                         loading="lazy"
                         onerror="this.src='${getProductImageUrl(fallbackImage)}'; this.onerror=null">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.ProductName}</h3>
                    <div class="cart-item-price">
                        <span>Rs.${item.UnitPrice?.toFixed(2)}</span>
                        ${item.Discount > 0 ? `<span class="discount">(-Rs.${item.Discount?.toFixed(2)})</span>` : ''}
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn minus" data-id="${item.Id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.Quantity}" min="1" data-id="${item.Id}">
                            <button class="quantity-btn plus" data-id="${item.Id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item" data-id="${item.Id}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                    <div class="cart-item-total">
                        Total: Rs.${item.TotalPrice?.toFixed(2)}
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
            initLazyLoading(cartItem.querySelector('.cart-item-image img.lazy'));
        });

        // Show recommendations if cart has items
        recommendationsContainer.style.display = 'block';
        loadRecommendations(cartItems[cartItems.length - 1].ProductId); // Use first product for recommendations

        // Add event listeners
        setupCartEventListeners();
        updateCartSummary(cartItems);
        updateCartCount(cartItems);
    }

    // Lazy loading function for images
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
            imageElement.src = imageElement.dataset.src;
            imageElement.classList.remove('lazy');
        }
    }

    // Load AI recommendations
async function loadRecommendations(productId) {
    try {
        console.log(`Fetching recommendations for product ID: ${productId}`); // Debug log

        const response = await fetch(`${backendUrl}/ai/AIFeatures/smart-suggestions?product_id=${productId}`, {
            method: 'POST', // Set the correct method
            headers: headers // Reuse your existing headers
        });

        console.log('Recommendations API response status:', response.status); // Debug log

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Recommendations API error:', errorText); // Debug log
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Recommendations API response data:', data); // Debug log

        if (!data.Suggestions) {
            throw new Error('Invalid recommendations data format');
        }

        displayRecommendations(data.Suggestions);

    } catch (error) {
        console.error('Error loading recommendations:', error);
        document.querySelector('.recommended-products').innerHTML = `
            <div class="recommendation-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Could not load recommendations</p>
            </div>
        `;
    }
}


    // Display AI recommendations
    function displayRecommendations(products) {
        const container = document.querySelector('.recommended-products');
        container.innerHTML = '';
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p>No recommendations available at this time</p>';
            return;
        }
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'recommended-product';
            productCard.innerHTML = `
                <div class="recommended-product-image">
                    <img class="lazy" 
                         src="${placeholderImage}" 
                         data-src="${getProductImageUrl(product.ProductImage)}"
                         alt="${product.Name}"
                         loading="lazy"
                         onerror="this.src='${getProductImageUrl(fallbackImage)}'; this.onerror=null">
                </div>
                <div class="recommended-product-info">
                    <div class="recommended-product-title">${product.Name}</div>
                    <div class="recommended-product-price">Rs.${product.Price.toFixed(2)}</div>
                    <button class="add-to-cart-btn" data-id="${product.ProductId}">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            `;
            container.appendChild(productCard);
            initLazyLoading(productCard.querySelector('img.lazy'));
        });

        // Add event listeners to "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const productId = this.getAttribute('data-id');
                try {
                    await addToCart(productId);
                    alert('Product added to cart!');
                    await renderCartItems(); // Refresh cart
                } catch (error) {
                    alert('Failed to add to cart: ' + error.message);
                }
            });
        });
    }

    // Setup event listeners for cart actions
    function setupCartEventListeners() {
        // Quantity minus buttons
        document.querySelectorAll('.quantity-btn.minus').forEach(button => {
            button.addEventListener('click', async function() {
                const cartItemId = this.getAttribute('data-id');
                const input = this.nextElementSibling;
                let newQuantity = parseInt(input.value) - 1;
                
                if (newQuantity < 1) newQuantity = 1;
                
                try {
                    await updateCartItem(cartItemId, newQuantity);
                    await renderCartItems();
                } catch (error) {
                    alert('Failed to update quantity');
                }
            });
        });

        // Quantity plus buttons
        document.querySelectorAll('.quantity-btn.plus').forEach(button => {
            button.addEventListener('click', async function() {
                const cartItemId = this.getAttribute('data-id');
                const input = this.previousElementSibling;
                const newQuantity = parseInt(input.value) + 1;
                
                try {
                    await updateCartItem(cartItemId, newQuantity);
                    await renderCartItems();
                } catch (error) {
                    alert('Failed to update quantity');
                }
            });
        });

        // Quantity inputs
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', async function() {
                const cartItemId = this.getAttribute('data-id');
                let newQuantity = parseInt(this.value) || 1;
                
                if (newQuantity < 1) newQuantity = 1;
                
                try {
                    await updateCartItem(cartItemId, newQuantity);
                    await renderCartItems();
                } catch (error) {
                    alert('Failed to update quantity');
                }
            });
        });

        // Remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', async function() {
                const cartItemId = this.getAttribute('data-id');
                
                try {
                    await removeCartItem(cartItemId);
                    await renderCartItems();
                } catch (error) {
                    alert('Failed to remove item');
                }
            });
        });
    }

    // Update cart summary
    function updateCartSummary(cartItems) {
        const subtotal = cartItems.reduce((total, item) => total + (item.UnitPrice * item.Quantity), 0);
        const totalDiscount = cartItems.reduce((total, item) => total + item.Discount, 0);
        const total = subtotal - totalDiscount;
        
        subtotalElement.textContent = `Rs.${subtotal.toFixed(2)}`;
        totalElement.textContent = `Rs.${total.toFixed(2)}`;
        document.querySelector('.tax').textContent = `-Rs.${totalDiscount.toFixed(2)}`;
    }

    // Update cart count
    function updateCartCount(cartItems) {
        const totalItems = cartItems.reduce((total, item) => total + item.Quantity, 0);
        itemCountElement.textContent = `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'}`;
        notificationBadge.textContent = totalItems;
    }

    // Checkout button
    // In your cart.js

let selectedAddressId = null;
let customerAddresses = [];

// Modified checkout button handler
checkoutBtn.addEventListener('click', async function() {
    try {
        // Load customer addresses first
        await loadCustomerAddresses();
        
        // Then load cart items
        const cartItems = await loadCartItems();
        
        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        // Show checkout modal with addresses
        showCheckoutModal(cartItems);
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to start checkout: ' + error.message);
    }
});

// Load customer addresses
async function loadCustomerAddresses() {
    try {
        const response = await fetch(`${API_BASE_URL}/Addresses/GetAddressesByCustomer/${customerId}`, {
            headers: headers
        });
        
        if (!response.ok) throw new Error('Failed to load addresses');
        
        const data = await response.json();
        customerAddresses = data.Data || [];
        
        // Set default address if available
        if (customerAddresses.length > 0) {
            selectedAddressId = customerAddresses[0].Id;
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        throw error;
    }
}

// Enhanced checkout modal
function showCheckoutModal(cartItems) {
    const modal = `
        <div class="checkout-modal" id="checkoutModal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Complete Your Order</h2>
                
                <!-- Address Selection -->
                <div class="address-section">
                    <h3>Shipping Address</h3>
                    ${customerAddresses.length > 0 ? 
                        customerAddresses.map(address => `
                            <div class="address-option ${address.Id === selectedAddressId ? 'selected' : ''}" 
                                 data-id="${address.Id}">
                                <div class="address-details">
                                    <strong>${address.AddressLine1}</strong><br>
                                    ${address.AddressLine2 ? address.AddressLine2 + '<br>' : ''}
                                    ${address.City}, ${address.State}<br>
                                    ${address.PostalCode}, ${address.Country}
                                </div>
                                <div class="address-selector">
                                    <input type="radio" name="shippingAddress" 
                                           value="${address.Id}" 
                                           ${address.Id === selectedAddressId ? 'checked' : ''}>
                                </div>
                            </div>
                        `).join('') : 
                        '<p>No addresses found. Please add an address to continue.</p>'
                    }
                    <button id="addNewAddress" class="btn-outline">
                        <i class="fas fa-plus"></i> Add New Address
                    </button>
                </div>
                
                <!-- Order Summary -->
                <div class="order-summary">
                    <h3>Order Summary</h3>
                    <div class="order-items-list">
                        ${cartItems.map(item => `
                            <div class="order-item">
                                <img src="${getProductImageUrl(item.ProductImage)}" 
                                     alt="${item.ProductName}"
                                     onerror="this.src='${getProductImageUrl(fallbackImage)}'">
                                <div>
                                    <h4>${item.ProductName}</h4>
                                    <div>Qty: ${item.Quantity}</div>
                                    <div>Rs.${item.TotalPrice.toFixed(2)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>Rs.${cartItems.reduce((sum, item) => sum + (item.UnitPrice * item.Quantity), 0).toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>Discount:</span>
                            <span>-Rs.${cartItems.reduce((sum, item) => sum + item.Discount, 0).toFixed(2)}</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Total:</span>
                            <span>Rs.${cartItems.reduce((sum, item) => sum + item.TotalPrice, 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Payment Options -->
                <div class="payment-options">
                    <h3>Select Payment Method</h3>
                    <div class="payment-methods">
                        <label class="payment-method">
                            <input type="radio" name="paymentMethod" value="JazzCash" checked>
                            <img src="images/download (2).png" alt="JazzCash">
                            JazzCash
                        </label>
                        <label class="payment-method">
                            <input type="radio" name="paymentMethod" value="EasyPaisa">
                            <img src="images/download (1).png" alt="EasyPaisa">
                            EasyPaisa
                        </label>
                        <label class="payment-method">
                            <input type="radio" name="paymentMethod" value="COD">
                            <img src="images/download (3).png" alt="Cash on Delivery">
                            Cash on Delivery
                        </label>
                    </div>
                </div>
                
                <button id="confirmOrderBtn" class="btn-primary" ${customerAddresses.length === 0 ? 'disabled' : ''}>
                    Place Order
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Event listeners
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('checkoutModal').remove();
    });
    
    // Address selection
    document.querySelectorAll('.address-option').forEach(option => {
        option.addEventListener('click', function() {
            selectedAddressId = parseInt(this.getAttribute('data-id'));
            document.querySelectorAll('.address-option').forEach(opt => 
                opt.classList.remove('selected'));
            this.classList.add('selected');
            document.querySelector(`input[value="${selectedAddressId}"]`).checked = true;
        });
    });
    
    // Add new address button
    document.getElementById('addNewAddress')?.addEventListener('click', () => {
        // Implement address addition logic
        alert('Redirect to address management page');
    });
    
    // Order confirmation handler
    document.getElementById('confirmOrderBtn').addEventListener('click', async () => {
        if (!selectedAddressId) {
            alert('Please select a shipping address');
            return;
        }
        
        await placeOrder(cartItems);
    });
}

// Enhanced placeOrder function with payment processing
async function placeOrder() {
    const btn = document.getElementById('confirmOrderBtn');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (!selectedAddressId) {
        alert("Please select an address.");
        return;
    }

    if (!currentCartId) {
        alert("Cart not loaded.");
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = 'Processing...';

        const payload = {
            BillingAddressId: selectedAddressId,
            ShippingAddressId: selectedAddressId,
            PaymentMethod: paymentMethod
        };

        const response = await fetch(`${API_BASE_URL}/Checkout/ProceedToCheckout/${currentCartId}`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // First check HTTP status
        if (response.ok) {
            showSuccessToast("order placed successfully!");
        }

        const result = await response.json();
        console.log('Checkout API response:', result); // Debug log

        // If we get here, it was successful
        document.getElementById('checkoutModal')?.remove();
        
        // Show success message
        showSuccessToast("Order placed successfully!");
        
        // Clear the cart
        currentCartId = null;
        await renderCartItems();
        
        

    } catch (error) {
        console.error('Checkout error:', error);
        showErrorToast(error.message || 'Checkout failed. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Place Order';
    }
}



function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification success';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


    // Initialize
    renderCartItems();
});

