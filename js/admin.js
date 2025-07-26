document.addEventListener('DOMContentLoaded', function() {
    // Toggle Sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('show');
    });

    // Logout Confirmation
    const logoutBtn = document.getElementById('adminLogout');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');
    const closeModal = document.querySelector('.close-modal');
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logoutModal.classList.add('show');
    });
    
    cancelLogout.addEventListener('click', function() {
        logoutModal.classList.remove('show');
    });
    
    confirmLogout.addEventListener('click', function() {
        // In a real app, you would clear session/token here
        window.location.href = 'sellerlogin.html';
    });
    
    closeModal.addEventListener('click', function() {
        logoutModal.classList.remove('show');
    });
    
    // Close modal when clicking outside
    logoutModal.addEventListener('click', function(e) {
        if (e.target === logoutModal) {
            logoutModal.classList.remove('show');
        }
    });

    // Initialize Charts
    const salesCtx = document.getElementById('salesChart');
    const usersCtx = document.getElementById('usersChart');
    
    if (salesCtx) {
        const salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Sales',
                    data: [12000, 19000, 15000, 18000, 21000, 25000, 22000, 24000, 28000, 26000, 30000, 35000],
                    backgroundColor: 'rgba(74, 107, 255, 0.1)',
                    borderColor: 'rgba(74, 107, 255, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    if (usersCtx) {
        const usersChart = new Chart(usersCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Users',
                    data: [150, 230, 180, 270, 210, 300],
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Notification functionality can be added here
    // Similar to what we implemented earlier for seller dashboard
});

