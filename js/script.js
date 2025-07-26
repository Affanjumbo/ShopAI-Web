//***NAVBAR SECTION***//

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navbar = document.querySelector('.navbar-wrapper');
    navbar.classList.toggle('mobile-active');
}

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    const navbar = document.querySelector('.navbar-wrapper');
    if (!navbar.contains(e.target) && !e.target.classList.contains('menu-toggle')) {
        navbar.classList.remove('mobile-active');
    }
});

// Mobile dropdown toggle
document.querySelectorAll('.nav-item > a').forEach(item => {
    item.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            const dropdown = this.nextElementSibling;
            if (dropdown && dropdown.classList.contains('dropdown-menu')) {
                e.preventDefault();
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        }
    });
});

// Update cart badge
function updateCartCount(count) {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Safely get search input
    const searchInput = document.querySelector('.search-input'); // Change this if your class or ID is different

    if (searchInput) {
        // Enter key handler
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                performSearch(searchInput.value); // Make sure performSearch() exists
            }
        });
    }

    updateCartCount(0); // Safe to call now that DOM is loaded

    //****FEATURED PRODUCTS SECION***//

    // Slider functionality 
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');

    if (!prevBtn || !nextBtn || slides.length === 0) {
        console.error("Slider buttons or slides not found!");
        return;
    }

    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    showSlide(currentSlide);
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    setInterval(nextSlide, 4000); // ⏱ Auto slide every 4 seconds
});

