document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const navLinks = document.querySelectorAll('.account-nav a, .settings-menu a');
    const contentSections = document.querySelectorAll('.settings-section');
    
    function showSection(sectionId) {
        // Hide all sections
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the selected section
        const activeSection = document.getElementById(`${sectionId}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Set up click handlers for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            window.location.hash = sectionId;
        });
    });
    
    // Handle initial page load (check URL hash)
    const initialSection = window.location.hash.substring(1) || 'profile';
    showSection(initialSection);
    
    // Avatar upload preview
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    
    avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatarPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Toggle password change form
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordForm = document.getElementById('password-form');
    const cancelPassword = document.getElementById('cancel-password');
    
    changePasswordBtn.addEventListener('click', function() {
        passwordForm.style.display = passwordForm.style.display === 'none' ? 'block' : 'none';
    });
    
    cancelPassword.addEventListener('click', function() {
        passwordForm.style.display = 'none';
    });
    
    // Toggle add payment form
    const addPaymentBtn = document.querySelector('#payments-section .btn-primary');
    const addPaymentForm = document.getElementById('add-payment-form');
    const cancelAddPayment = document.getElementById('cancel-add-payment');
    
    addPaymentBtn.addEventListener('click', function() {
        addPaymentForm.style.display = addPaymentForm.style.display === 'none' ? 'block' : 'none';
    });
    
    cancelAddPayment.addEventListener('click', function() {
        addPaymentForm.style.display = 'none';
    });
});


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

    