// product.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart count
    updateCartCount();

    // Thumbnail click event
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('mainProductImage');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Update main image
            const imgSrc = this.querySelector('img').src;
            mainImage.src = imgSrc;
        });
    });
    
    // Size selection
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            sizeOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Color selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            
            // Update product title with selected color
            const color = this.getAttribute('data-color');
            document.querySelector('.product-title').textContent = 
                `Premium Smart Watch Series 7 (${color})`;
        });
    });
    
    // Quantity control
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const qtyValue = document.querySelector('.qty-value');
    
    minusBtn.addEventListener('click', function() {
        let value = parseInt(qtyValue.value);
        if (value > 1) {
            qtyValue.value = value - 1;
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let value = parseInt(qtyValue.value);
        qtyValue.value = value + 1;
    });
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabBtns.forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Star rating for reviews
    const ratingStars = document.querySelectorAll('.rating-star');
    const userRatingInput = document.getElementById('user-rating');
    
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            userRatingInput.value = rating;
            
            // Update star display
            ratingStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
        
        star.addEventListener('mouseover', function() {
            const rating = this.getAttribute('data-rating');
            
            // Show hover state
            ratingStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });
        
        star.addEventListener('mouseout', function() {
            // Remove hover state
            ratingStars.forEach(s => s.classList.remove('hover'));
            
            // Restore selected state
            const currentRating = userRatingInput.value;
            ratingStars.forEach((s, index) => {
                if (index < currentRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
    
    // Review form submission
    const reviewForm = document.querySelector('.review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Here you would normally send the data to your server
            // For demo purposes, we'll just show a success message
            showToast('Thank you for your review!');
            
            // Reset form
            this.reset();
            userRatingInput.value = 0;
            ratingStars.forEach(s => s.classList.remove('active'));
        });
    }
    
    // Add to cart buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn, .btn-primary');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            addToCart();
        });
    });
});

// Add to Cart Function
function addToCart() {
    // Get product details
    const product = {
        id: 'watch-001', // You would normally get this from your database
        name: document.querySelector('.product-title').textContent,
        price: document.querySelector('.current-price').textContent,
        image: document.getElementById('mainProductImage').src,
        color: document.querySelector('.color-option.active').getAttribute('data-color'),
        size: document.querySelector('.size-option.active').textContent,
        quantity: document.querySelector('.qty-value').value
    };
    
    // Get existing cart from localStorage or create new one
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.color === product.color && 
        item.size === product.size
    );
    
    if (existingItemIndex !== -1) {
        // Update quantity if product exists
        cart[existingItemIndex].quantity = parseInt(cart[existingItemIndex].quantity) + parseInt(product.quantity);
    } else {
        // Add new product to cart
        cart.push(product);
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count in navbar
    updateCartCount();
    
    // Show success toast
    showToast('Product added to cart successfully!');
}

// Update cart count in navbar
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + parseInt(item.quantity), 0);
    
    const cartBadge = document.querySelector('.badge');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
}

// Show toast notification
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}