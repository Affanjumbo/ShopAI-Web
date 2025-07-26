document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const navLinks = document.querySelectorAll('.account-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Function to show a specific section
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
        
        // Load data for the section (simulated in this example)
        loadSectionData(sectionId);
    }
    
    // Function to simulate loading section data
    function loadSectionData(section) {
        console.log(`Loading data for ${section} section`);
        // In a real app, you would fetch data from an API here
        
        // For this example, we'll just show which section is active
        const sectionTitle = document.querySelector(`#${section}-section .section-title`);
        if (sectionTitle) {
            console.log(`Displaying ${section} content`);
        }
    }
    
    // Set up click handlers for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    // Handle initial page load (check URL hash)
    const initialSection = window.location.hash.substring(1) || 'dashboard';
    showSection(initialSection);
    
    // Update URL hash when sections change
    window.addEventListener('hashchange', function() {
        const sectionId = window.location.hash.substring(1) || 'dashboard';
        showSection(sectionId);
    });
    
    // Set default address functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('set-default-btn')) {
            e.preventDefault();
            const currentDefault = document.querySelector('.address-card.default');
            if (currentDefault) {
                currentDefault.classList.remove('default');
                currentDefault.querySelector('.default-badge').remove();
            }
            
            const newDefault = e.target.closest('.address-card');
            newDefault.classList.add('default');
            
            const badge = document.createElement('span');
            badge.className = 'default-badge';
            badge.textContent = 'Default';
            newDefault.prepend(badge);
        }
    });
});

// Sample order data
const orders = [
    {
        id: "ORD-12345",
        date: "2023-05-15",
        items: [
            { name: "Organic Apples", image: "https://cdn-icons-png.flaticon.com/512/415/415733.png", qty: 2, price: 120 },
            { name: "Whole Wheat Bread", image: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png", qty: 1, price: 65 }
        ],
        total: 305,
        status: "to-receive"
    },
    {
        id: "ORD-12346",
        date: "2023-05-10",
        items: [
            { name: "Fresh Milk", image: "https://cdn-icons-png.flaticon.com/512/2674/2674482.png", qty: 3, price: 50 }
        ],
        total: 150,
        status: "to-ship"
    },
    {
        id: "ORD-12347",
        date: "2023-05-05",
        items: [
            { name: "Eggs (Dozen)", image: "https://cdn-icons-png.flaticon.com/512/3655/3655592.png", qty: 1, price: 80 },
            { name: "Butter 250g", image: "https://cdn-icons-png.flaticon.com/512/2515/2515183.png", qty: 2, price: 45 }
        ],
        total: 170,
        status: "to-pay"
    },
    {
        id: "ORD-12348",
        date: "2023-04-28",
        items: [
            { name: "Chicken Breast", image: "https://cdn-icons-png.flaticon.com/512/1046/1046851.png", qty: 1, price: 220 },
            { name: "Broccoli", image: "https://cdn-icons-png.flaticon.com/512/2329/2329869.png", qty: 3, price: 30 }
        ],
        total: 310,
        status: "to-review"
    },
    {
        id: "ORD-12349",
        date: "2023-04-20",
        items: [
            { name: "Rice 5kg", image: "https://cdn-icons-png.flaticon.com/512/2433/2433059.png", qty: 1, price: 350 },
            { name: "Cooking Oil", image: "https://cdn-icons-png.flaticon.com/512/4105/4105671.png", qty: 1, price: 180 }
        ],
        total: 530,
        status: "return"
    },
    {
        id: "ORD-12350",
        date: "2023-04-15",
        items: [
            { name: "Frozen Pizza", image: "https://cdn-icons-png.flaticon.com/512/2927/2927347.png", qty: 2, price: 150 }
        ],
        total: 300,
        status: "cancelled"
    }
];

// DOM Elements
const ordersTable = document.querySelector('.orders-table tbody');
const filterButtons = document.querySelectorAll('.filter-btn');

// Render orders
function renderOrders(filter = 'all') {
    ordersTable.innerHTML = '';
    
    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(order => order.status === filter);
    
    if (filteredOrders.length === 0) {
        ordersTable.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-orders">
                        <i class="fas fa-box-open"></i>
                        <h3>No orders found</h3>
                        <p>You don't have any ${filter === 'all' ? '' : filter.replace('-', ' ')} orders yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        
        // Format date
        const formattedDate = new Date(order.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Generate items list
        let itemsHTML = '';
        order.items.forEach(item => {
            itemsHTML += `
                <div class="order-items">
                    <img src="${item.image}" alt="${item.name}" class="order-item-img">
                    <div>
                        <div>${item.name}</div>
                        <small>${item.qty} × ₹${item.price}</small>
                    </div>
                </div>
            `;
        });
        
        // Get status class and text
        const statusInfo = getStatusInfo(order.status);
        
        // Generate action buttons based on status
        const actionsHTML = generateActionButtons(order.status, order.id);
        
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${formattedDate}</td>
            <td>${itemsHTML}</td>
            <td>₹${order.total}</td>
            <td><span class="order-status ${statusInfo.class}">${statusInfo.text}</span></td>
            <td><div class="order-actions">${actionsHTML}</div></td>
        `;
        
        ordersTable.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addActionButtonListeners();
}

// Get status information
function getStatusInfo(status) {
    const statusMap = {
        'to-pay': { class: 'status-to-pay', text: 'Payment Pending' },
        'to-ship': { class: 'status-to-ship', text: 'To Ship' },
        'to-receive': { class: 'status-to-receive', text: 'To Receive' },
        'to-review': { class: 'status-to-review', text: 'To Review' },
        'return': { class: 'status-return', text: 'Return Requested' },
        'cancelled': { class: 'status-cancelled', text: 'Cancelled' }
    };
    return statusMap[status] || { class: '', text: status };
}

// Generate action buttons based on status
function generateActionButtons(status, orderId) {
    let buttons = '';
    
    switch(status) {
        case 'to-pay':
            buttons = `
                <button class="action-btn action-btn-primary" data-action="pay" data-order="${orderId}">Pay Now</button>
                <button class="action-btn action-btn-danger" data-action="cancel" data-order="${orderId}">Cancel</button>
            `;
            break;
        case 'to-ship':
            buttons = `
                <button class="action-btn action-btn-secondary" data-action="track" data-order="${orderId}">Track</button>
            `;
            break;
        case 'to-receive':
            buttons = `
                <button class="action-btn action-btn-primary" data-action="received" data-order="${orderId}">Received</button>
                <button class="action-btn action-btn-secondary" data-action="track" data-order="${orderId}">Track</button>
            `;
            break;
        case 'to-review':
            buttons = `
                <button class="action-btn action-btn-primary" data-action="review" data-order="${orderId}">Review</button>
                <button class="action-btn action-btn-danger" data-action="return" data-order="${orderId}">Return</button>
            `;
            break;
        case 'return':
            buttons = `
                <button class="action-btn action-btn-secondary" data-action="track-return" data-order="${orderId}">Track Return</button>
            `;
            break;
        default:
            buttons = `
                <button class="action-btn action-btn-secondary" data-action="reorder" data-order="${orderId}">Reorder</button>
            `;
    }
    
    return buttons;
}

// Add event listeners to action buttons
function addActionButtonListeners() {
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const orderId = this.getAttribute('data-order');
            handleOrderAction(action, orderId);
        });
    });
}

// Handle order actions
function handleOrderAction(action, orderId) {
    const order = orders.find(o => o.id === orderId);
    
    switch(action) {
        case 'pay':
            alert(`Processing payment for order ${orderId}`);
            // In a real app, this would redirect to payment gateway
            break;
        case 'cancel':
            if (confirm(`Are you sure you want to cancel order ${orderId}?`)) {
                order.status = 'cancelled';
                renderOrders();
                alert(`Order ${orderId} has been cancelled.`);
            }
            break;
        case 'track':
            alert(`Tracking order ${orderId}`);
            // In a real app, this would show tracking details
            break;
        case 'received':
            if (confirm(`Mark order ${orderId} as received?`)) {
                order.status = 'to-review';
                renderOrders();
                alert(`Order ${orderId} marked as received. Please leave a review.`);
            }
            break;
        case 'review':
            alert(`Redirecting to review page for order ${orderId}`);
            // In a real app, this would open a review modal/page
            break;
        case 'return':
            if (confirm(`Request return for order ${orderId}?`)) {
                order.status = 'return';
                renderOrders();
                alert(`Return requested for order ${orderId}. We'll contact you shortly.`);
            }
            break;
        case 'track-return':
            alert(`Tracking return for order ${orderId}`);
            break;
        case 'reorder':
            alert(`Adding items from order ${orderId} to cart`);
            // In a real app, this would add items to cart
            break;
    }
}

// Add event listeners to filter buttons
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        renderOrders(this.getAttribute('data-filter'));
    });
});

// Initial render
renderOrders();