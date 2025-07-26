document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation functionality
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a:not(.logout-btn)');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the page name from the link text
            const pageName = this.querySelector('span').textContent.toLowerCase().replace(/\s+/g, '-');
            
            // Special case for "Chat With Us" which has a different filename
            let filename = pageName;
            if (pageName === 'chat-with-us') {
                filename = 'chat';
            } else if (pageName === 'expense-manager') {
                filename = 'expense-tracker';
            }
            
            // Navigate to the corresponding HTML page
            window.location.href = `${filename}.html`;
        });
    });

    // Dropdown menu functionality
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        link.addEventListener('click', function(e) {
            // On mobile, toggle the menu
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
                
                // Close other open dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });

    // Category dropdown items navigation
    const categoryLinks = document.querySelectorAll('.dropdown-menu a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.textContent.toLowerCase().replace(/\s+/g, '-');
            window.location.href = `category.html?category=${category}`;
        });
    });
    // User profile click - navigate to account page
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', function() {
            window.location.href = 'account.html';
        });
    }

    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to logout?')) {
                // Clear any user session data
                sessionStorage.removeItem('userToken');
                localStorage.removeItem('userData');
                
                // Redirect to login page
                window.location.href = 'login.html';
            }
        });
    }

    // Mobile menu toggle (if you add a hamburger menu later)
    const mobileMenuToggle = document.createElement('div');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Responsive adjustments
    function handleResize() {
        if (window.innerWidth <= 768) {
            // Mobile view adjustments
            document.body.appendChild(mobileMenuToggle);
            
            mobileMenuToggle.addEventListener('click', function() {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        } else {
            // Desktop view adjustments
            if (document.body.contains(mobileMenuToggle)) {
                document.body.removeChild(mobileMenuToggle);
            }
            document.querySelector('.sidebar').classList.remove('active');
        }
    }
    
    // Initial call and event listener for resize
    handleResize();
    window.addEventListener('resize', handleResize);

    // Product card interactions
    const productCards = document.querySelectorAll('.product-card:not(.small)');
    productCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't navigate if clicking on buttons
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            // Navigate to product detail page
            const productId = this.getAttribute('data-product-id') || '123'; // You would get this from your data
            window.location.href = `product.html?id=${productId}`;
        });
    });

    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h4').textContent;
            
            // Add product to cart (in a real app, you would use a cart service)
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const productId = productCard.getAttribute('data-product-id') || Date.now().toString();
            
            cart.push({
                id: productId,
                name: productName,
                price: productCard.querySelector('.current-price').textContent,
                image: productCard.querySelector('.product-image img').src
            });
            
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart count
            const badge = document.querySelector('.notification .badge');
            if (badge) {
                badge.textContent = cart.length;
            }
            
            // Show feedback
            this.innerHTML = '<i class="fas fa-check"></i> Added';
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            }, 2000);
        });
    });

    // Buy now functionality
    const buyNowButtons = document.querySelectorAll('.buy-now-btn');
    buyNowButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id') || '123';
            
            // In a real app, you would add to cart and redirect to checkout
            window.location.href = `checkout.html?product=${productId}`;
        });
    });

    // Initialize cart count
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const badge = document.querySelector('.notification .badge');
        if (badge) {
            badge.textContent = cart.length;
        }
    }
    
    updateCartCount();
});

document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.featured-products-slider .slide');
    const dotsContainer = document.querySelector('.slide-dots');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlide = 0;
    let slideInterval;

    // Create dots for each slide
    function createDots() {
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    // Go to specific slide
    function goToSlide(slideIndex) {
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === slideIndex);
        });

        // Update dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === slideIndex);
        });

        currentSlide = slideIndex;
        resetInterval();
    }

    // Next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }

    // Previous slide
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(currentSlide);
    }

    // Auto-rotate slides
    function startInterval() {
        slideInterval = setInterval(nextSlide, 2000); // Change slide every 5 seconds
    }

    // Reset interval when user interacts
    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    // Initialize slider
    function initSlider() {
        createDots();
        startInterval();

        // Event listeners
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetInterval();
        });

        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetInterval();
        });

        // Pause on hover
        const slider = document.querySelector('.featured-products-slider');
        slider.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });

        slider.addEventListener('mouseleave', () => {
            resetInterval();
        });
    }

    initSlider();
});

