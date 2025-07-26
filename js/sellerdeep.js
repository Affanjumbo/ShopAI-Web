// Global variables
let currentSeller = null;
const API_BASE_URL = 'https://localhost:7273/api';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    await checkAuth();
    
    // Initialize all dashboard components
    initDashboard();
    
    // Load initial data
    loadDashboardData();
});

// Check if user is authenticated
async function checkAuth() {
    const token = localStorage.getItem('sellerToken');
    if (!token) {
        window.location.href = 'sellerlogin.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Seller/current`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Not authenticated');
        
        currentSeller = await response.json();
        updateUIWithSellerData(currentSeller);
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('sellerToken');
        window.location.href = 'sellerlogin.html';
    }
}

// Update UI with seller data
function updateUIWithSellerData(seller) {
    document.getElementById('sellerNameDisplay').textContent = seller.businessName || 'My Shop';
    document.getElementById('sellerProfileImg').src = seller.profileImageUrl || 'images/person.jpg';
    // Update other UI elements as needed
}
// Profile Section
async function initProfileSection() {
    // Load profile data
    await loadProfileData();
    
    // Set up event listeners
    setupProfileEventListeners();
}

async function loadProfileData() {
    try {
        const response = await fetch(`${API_BASE_URL}/Seller/${currentSeller.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            }
        });
        
        const profile = await response.json();
        
        // Populate profile form
        document.getElementById('sellerName').value = profile.businessName;
        document.getElementById('sellerEmail').value = profile.email;
        document.getElementById('sellerPhone').value = profile.phoneNumber;
        document.getElementById('sellerAddress').value = profile.businessAddress;
        document.getElementById('sellerSince').value = new Date(profile.joinDate).toLocaleDateString();
        
        // Populate bank details if available
        if (profile.bankDetails) {
            document.getElementById('accountHolder').value = profile.bankDetails.accountHolderName;
            document.getElementById('accountNumber').value = profile.bankDetails.accountNumber;
            document.getElementById('bankName').value = profile.bankDetails.bankName;
            document.getElementById('branchName').value = profile.bankDetails.branchName;
            document.getElementById('ifscCode').value = profile.bankDetails.ifscCode;
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load profile data', 'error');
    }
}

function setupProfileEventListeners() {
    // Edit/Save profile
    document.getElementById('editBtn').addEventListener('click', enableProfileEditing);
    document.getElementById('saveBtn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancelBtn').addEventListener('click', cancelProfileEditing);
    
    // Profile picture upload
    document.getElementById('changePictureBtn').addEventListener('click', () => {
        document.getElementById('pictureInput').click();
    });
    
    document.getElementById('pictureInput').addEventListener('change', uploadProfilePicture);
}

function enableProfileEditing() {
    const currentTab = document.querySelector('.tab.active').dataset.tab;
    const form = currentTab === 'profile' ? document.getElementById('sellerForm') : document.getElementById('bankForm');
    
    form.classList.add('edit-mode');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.id !== 'sellerSince') {
            input.readOnly = false;
            if (input.tagName === 'SELECT') {
                input.disabled = false;
            }
        }
    });
    
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'block';
    document.getElementById('saveBtn').style.display = 'block';
}

async function saveProfileChanges() {
    const currentTab = document.querySelector('.tab.active').dataset.tab;
    
    if (currentTab === 'profile') {
        await updateSellerProfile();
    } else {
        await updateBankDetails();
    }
}

async function updateSellerProfile() {
    try {
        const updatedData = {
            id: currentSeller.id,
            businessName: document.getElementById('sellerName').value,
            email: document.getElementById('sellerEmail').value,
            phoneNumber: document.getElementById('sellerPhone').value,
            businessAddress: document.getElementById('sellerAddress').value
        };
        
        const response = await fetch(`${API_BASE_URL}/Seller/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            },
            body: JSON.stringify(updatedData)
        });
        
        if (response.ok) {
            showToast('Profile updated successfully!', 'success');
            cancelProfileEditing();
            await checkAuth(); // Refresh seller data
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Failed to update profile', 'error');
    }
}

async function updateBankDetails() {
    try {
        const bankData = {
            sellerId: currentSeller.id,
            accountHolderName: document.getElementById('accountHolder').value,
            accountNumber: document.getElementById('accountNumber').value,
            bankName: document.getElementById('bankName').value,
            branchName: document.getElementById('branchName').value,
            ifscCode: document.getElementById('ifscCode').value,
            accountType: document.getElementById('accountType').value
        };
        
        const response = await fetch(`${API_BASE_URL}/BankDetails`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            },
            body: JSON.stringify(bankData)
        });
        
        if (response.ok) {
            showToast('Bank details updated successfully!', 'success');
            cancelProfileEditing();
        } else {
            throw new Error('Failed to update bank details');
        }
    } catch (error) {
        console.error('Bank details update error:', error);
        showToast('Failed to update bank details', 'error');
    }
}

function cancelProfileEditing() {
    document.querySelectorAll('.seller-details').forEach(form => {
        form.classList.remove('edit-mode');
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.readOnly = true;
            if (input.tagName === 'SELECT') {
                input.disabled = true;
            }
        });
    });
    
    document.getElementById('editBtn').style.display = 'block';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'none';
}

async function uploadProfilePicture() {
    const file = document.getElementById('pictureInput').files[0];
    if (!file) return;
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sellerId', currentSeller.id);
        
        const response = await fetch(`${API_BASE_URL}/Seller/upload-profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            document.getElementById('profilePicture').src = result.imageUrl;
            document.getElementById('sellerProfileImg').src = result.imageUrl;
            showToast('Profile picture updated!', 'success');
        } else {
            throw new Error('Failed to upload image');
        }
    } catch (error) {
        console.error('Image upload error:', error);
        showToast('Failed to upload profile picture', 'error');
    }
}
// Products Section
async function initProductsSection() {
    await loadProducts();
    setupProductEventListeners();
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/Products/GetProductsBySeller/${currentSeller.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            }
        });
        
        const products = await response.json();
        renderProducts(products);
        
        // Update stats
        document.querySelector('.stat-card:nth-child(1) p').textContent = products.length;
        const outOfStock = products.filter(p => p.stockQuantity <= 0).length;
        document.querySelector('.stat-card:nth-child(2) p').textContent = outOfStock;
        const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
        document.querySelector('.stat-card:nth-child(3) p').textContent = lowStock;
    } catch (error) {
        console.error('Failed to load products:', error);
        showToast('Failed to load products', 'error');
    }
}

function renderProducts(products) {
    const container = document.querySelector('.product-table tbody');
    container.innerHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.imageUrl || 'images/placeholder.png'}" alt="${product.name}">
                <span>${product.name}</span>
            </td>
            <td>${product.category}</td>
            <td>Rs.${product.price.toFixed(2)}</td>
            <td>
                <span class="stock-indicator ${product.stockQuantity <= 0 ? 'out' : (product.stockQuantity <= 5 ? 'low' : 'in')}-stock">
                    ${product.stockQuantity <= 0 ? 'Out of Stock' : (product.stockQuantity <= 5 ? 'Low Stock' : 'In Stock')}
                </span>
            </td>
            <td>${product.stockQuantity}</td>
            <td>
                <button class="action-btn edit" onclick="openEditProductModal(${product.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete" onclick="confirmDeleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function setupProductEventListeners() {
    // Add product modal
    document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
    document.getElementById('submitAddProduct').addEventListener('click', addNewProduct);
    
    // Product search
    document.querySelector('.search-bar input').addEventListener('input', searchProducts);
}

async function addNewProduct(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('SellerId', currentSeller.id);
    formData.append('Name', document.getElementById('productName').value);
    formData.append('Description', document.getElementById('productDescription').value);
    formData.append('Price', document.getElementById('productPrice').value);
    formData.append('CategoryId', document.getElementById('productCategory').value);
    formData.append('StockQuantity', document.getElementById('productStock').value);
    
    const imageInput = document.getElementById('imageInput');
    for (let i = 0; i < imageInput.files.length; i++) {
        formData.append('Images', imageInput.files[i]);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/Products/CreateProduct`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            showToast('Product added successfully!', 'success');
            closeModal('addProductModal');
            await loadProducts();
        } else {
            throw new Error('Failed to add product');
        }
    } catch (error) {
        console.error('Add product error:', error);
        showToast('Failed to add product', 'error');
    }
}

function openEditProductModal(productId) {
    // Fetch product details and populate modal
    fetch(`${API_BASE_URL}/Products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
    })
    .then(response => response.json())
    .then(product => {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCategory').value = product.categoryId;
        document.getElementById('editProductStock').value = product.stockQuantity;
        
        // Display current images
        const imagePreview = document.getElementById('editImagePreview');
        imagePreview.innerHTML = product.images.map(img => `
            <div class="image-preview-item">
                <img src="${img.url}" alt="Product Image">
                <button class="remove-image" onclick="removeProductImage(${product.id}, '${img.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        openModal('editProductModal');
    })
    .catch(error => {
        console.error('Error fetching product:', error);
        showToast('Failed to load product details', 'error');
    });
}

async function updateProduct() {
    try {
        const formData = new FormData();
        formData.append('Id', document.getElementById('editProductId').value);
        formData.append('Name', document.getElementById('editProductName').value);
        formData.append('Description', document.getElementById('editProductDescription').value);
        formData.append('Price', document.getElementById('editProductPrice').value);
        formData.append('CategoryId', document.getElementById('editProductCategory').value);
        formData.append('StockQuantity', document.getElementById('editProductStock').value);
        
        const imageInput = document.getElementById('editImageInput');
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append('NewImages', imageInput.files[i]);
        }
        
        const response = await fetch(`${API_BASE_URL}/Products/UpdateProduct`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            showToast('Product updated successfully!', 'success');
            closeModal('editProductModal');
            await loadProducts();
        } else {
            throw new Error('Failed to update product');
        }
    } catch (error) {
        console.error('Update product error:', error);
        showToast('Failed to update product', 'error');
    }
}

async function confirmDeleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/Products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
                }
            });
            
            if (response.ok) {
                showToast('Product deleted successfully!', 'success');
                await loadProducts();
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            console.error('Delete product error:', error);
            showToast('Failed to delete product', 'error');
        }
    }
}

function searchProducts() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('.product-table tbody tr');
    
    rows.forEach(row => {
        const productName = row.querySelector('td:first-child span').textContent.toLowerCase();
        row.style.display = productName.includes(searchTerm) ? '' : 'none';
    });
}
// Orders Section
async function initOrdersSection() {
    await loadOrders();
    setupOrderEventListeners();
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders/GetOrdersBySeller/${currentSeller.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            }
        });
        
        const orders = await response.json();
        renderOrders(orders);
        
        // Update stats
        const pending = orders.filter(o => o.status === 'Pending').length;
        const toShip = orders.filter(o => o.status === 'Processing').length;
        const returns = orders.filter(o => o.status === 'Returned').length;
        
        document.querySelector('.order-stats .stat-card:nth-child(1) p').textContent = pending;
        document.querySelector('.order-stats .stat-card:nth-child(2) p').textContent = toShip;
        document.querySelector('.order-stats .stat-card:nth-child(3) p').textContent = returns;
    } catch (error) {
        console.error('Failed to load orders:', error);
        showToast('Failed to load orders', 'error');
    }
}

function renderOrders(orders) {
    const container = document.querySelector('.orders-table tbody');
    container.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>Rs.${order.totalAmount.toFixed(2)}</td>
            <td>
                <span class="status ${order.status.toLowerCase().replace(' ', '-')}">
                    ${order.status}
                </span>
            </td>
            <td>
                <button class="action-btn ${getOrderActionClass(order.status)}" 
                        onclick="${getOrderActionHandler(order.status, order.id)}">
                    <i class="fas ${getOrderActionIcon(order.status)}"></i>
                    ${getOrderActionText(order.status)}
                </button>
                <button class="action-btn details" onclick="viewOrderDetails(${order.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </td>
        </tr>
    `).join('');
}

function getOrderActionClass(status) {
    switch(status) {
        case 'Pending': return 'process';
        case 'Processing': return 'prepare';
        case 'Shipped': return 'track';
        default: return 'details';
    }
}

function getOrderActionText(status) {
    switch(status) {
        case 'Pending': return 'Process';
        case 'Processing': return 'Prepare';
        case 'Shipped': return 'Track';
        default: return 'Details';
    }
}

function getOrderActionIcon(status) {
    switch(status) {
        case 'Pending': return 'fa-box';
        case 'Processing': return 'fa-shipping-fast';
        case 'Shipped': return 'fa-truck';
        default: return 'fa-info-circle';
    }
}

function getOrderActionHandler(status, orderId) {
    switch(status) {
        case 'Pending': return `processOrder(${orderId})`;
        case 'Processing': return `prepareOrder(${orderId})`;
        case 'Shipped': return `trackOrder(${orderId})`;
        default: return `viewOrderDetails(${orderId})`;
    }
}

function setupOrderEventListeners() {
    // Order status filter
    document.querySelectorAll('.order-filter button').forEach(btn => {
        btn.addEventListener('click', filterOrders);
    });
}

async function processOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderId}/process`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            }
        });
        
        if (response.ok) {
            showToast('Order processed successfully!', 'success');
            await loadOrders();
        } else {
            throw new Error('Failed to process order');
        }
    } catch (error) {
        console.error('Process order error:', error);
        showToast('Failed to process order', 'error');
    }
}

async function prepareOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderId}/prepare`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            },
            body: JSON.stringify({
                trackingNumber: document.getElementById('trackingNumber').value,
                shippingMethod: document.getElementById('shippingMethod').value
            })
        });
        
        if (response.ok) {
            showToast('Order prepared for shipping!', 'success');
            closeModal('prepareModal');
            await loadOrders();
        } else {
            throw new Error('Failed to prepare order');
        }
    } catch (error) {
        console.error('Prepare order error:', error);
        showToast('Failed to prepare order', 'error');
    }
}

async function trackOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderId}/tracking`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            }
        });
        
        const trackingInfo = await response.json();
        
        // Display tracking info in modal
        document.getElementById('trackingNumberDisplay').textContent = trackingInfo.trackingNumber;
        document.getElementById('shippingMethodDisplay').textContent = trackingInfo.shippingMethod;
        document.getElementById('trackingStatus').textContent = trackingInfo.status;
        document.getElementById('estimatedDelivery').textContent = trackingInfo.estimatedDelivery;
        
        openModal('trackingModal');
    } catch (error) {
        console.error('Track order error:', error);
        showToast('Failed to load tracking info', 'error');
    }
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            }
        });
        
        const order = await response.json();
        
        // Populate order details modal
        document.getElementById('orderId').textContent = order.id;
        document.getElementById('orderDate').textContent = new Date(order.orderDate).toLocaleString();
        document.getElementById('orderStatus').textContent = order.status;
        document.getElementById('customerName').textContent = order.customerName;
        document.getElementById('customerEmail').textContent = order.customerEmail;
        document.getElementById('customerPhone').textContent = order.customerPhone;
        document.getElementById('shippingAddress').textContent = order.shippingAddress;
        
        // Populate order items
        const itemsContainer = document.getElementById('orderItems');
        itemsContainer.innerHTML = order.items.map(item => `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>Rs.${item.price.toFixed(2)}</td>
                <td>Rs.${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `).join('');
        
        // Update totals
        document.getElementById('subtotal').textContent = `Rs.${order.subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = `Rs.${order.shippingFee.toFixed(2)}`;
        document.getElementById('total').textContent = `Rs.${order.totalAmount.toFixed(2)}`;
        
        openModal('orderDetailsModal');
    } catch (error) {
        console.error('Order details error:', error);
        showToast('Failed to load order details', 'error');
    }
}

function filterOrders() {
    const status = this.dataset.status;
    document.querySelectorAll('.order-filter button').forEach(btn => {
        btn.classList.remove('active');
    });
    this.classList.add('active');
    
    const rows = document.querySelectorAll('.orders-table tbody tr');
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const rowStatus = row.querySelector('.status').textContent.toLowerCase().replace(' ', '-');
            row.style.display = rowStatus === status ? '' : 'none';
        }
    });
}
// Dashboard Initialization
function initDashboard() {
    // Initialize all sections
    initProfileSection();
    initProductsSection();
    initOrdersSection();
    
    // Set up sidebar navigation
    setupSidebarNavigation();
    
    // Set up notifications
    setupNotifications();
    
    // Set up logout
    setupLogout();
}

function loadDashboardData() {
    // Load initial data for dashboard
    loadSummaryCards();
    loadSalesChart();
    loadRecentOrders();
    loadTopProducts();
}

async function loadSummaryCards() {
    try {
        const response = await fetch(`${API_BASE_URL}/Dashboard/summary/${currentSeller.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
            }
        });
        
        const summary = await response.json();
        
        document.querySelector('.summary-card:nth-child(1) p').textContent = summary.todayOrders;
        document.querySelector('.summary-card:nth-child(1) .trend').textContent = 
            `${summary.ordersChange >= 0 ? '+' : ''}${summary.ordersChange}% from yesterday`;
        
        document.querySelector('.summary-card:nth-child(2) p').textContent = summary.todayRevenue.toFixed(2);
        document.querySelector('.summary-card:nth-child(2) .trend').textContent = 
            `${summary.revenueChange >= 0 ? '+' : ''}${summary.revenueChange}% from last week`;
        
        document.querySelector('.summary-card:nth-child(3) p').textContent = summary.productViews;
        document.querySelector('.summary-card:nth-child(3) .trend').textContent = 
            `${summary.viewsChange >= 0 ? '+' : ''}${summary.viewsChange}% from last week`;
        
        document.querySelector('.summary-card:nth-child(4) p').textContent = summary.rating.toFixed(1);
        document.querySelector('.summary-card:nth-child(4) .trend').textContent = 
            `From ${summary.reviewCount} reviews`;
    } catch (error) {
        console.error('Failed to load dashboard summary:', error);
    }
}

function loadSalesChart() {
    fetch(`${API_BASE_URL}/Dashboard/sales-chart/${currentSeller.id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Sales',
                    data: data.values,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => 'Rs.' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    })
    .catch(error => {
        console.error('Failed to load sales chart:', error);
    });
}

function loadRecentOrders() {
    fetch(`${API_BASE_URL}/Orders/recent/${currentSeller.id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
    })
    .then(response => response.json())
    .then(orders => {
        const container = document.querySelector('.recent-orders tbody');
        container.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>Rs.${order.totalAmount.toFixed(2)}</td>
                <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="action-btn ${getOrderActionClass(order.status)}" 
                            onclick="${getOrderActionHandler(order.status, order.id)}">
                        <i class="fas ${getOrderActionIcon(order.status)}"></i>
                        ${getOrderActionText(order.status)}
                    </button>
                </td>
            </tr>
        `).join('');
    })
    .catch(error => {
        console.error('Failed to load recent orders:', error);
    });
}

function loadTopProducts() {
    fetch(`${API_BASE_URL}/Products/top/${currentSeller.id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
    })
    .then(response => response.json())
    .then(products => {
        const container = document.querySelector('.top-products .product-list');
        container.innerHTML = products.map(product => `
            <div class="product-item">
                <img src="${product.imageUrl || 'images/placeholder.png'}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-meta">
                        <span class="price">Rs.${product.price.toFixed(2)}</span>
                        <span class="sales">${product.soldCount} sold</span>
                        <span class="rating">
                            <i class="fas fa-star"></i> ${product.rating.toFixed(1)}
                        </span>
                    </div>
                </div>
                <button class="edit-btn" onclick="openEditProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `).join('');
    })
    .catch(error => {
        console.error('Failed to load top products:', error);
    });
}

function setupSidebarNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.menu-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the selected section
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).style.display = 'block';
        });
    });
}

function setupNotifications() {
    fetch(`${API_BASE_URL}/Notifications/${currentSeller.id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
    })
    .then(response => response.json())
    .then(notifications => {
        const container = document.getElementById('notificationDropdown');
        const unreadCount = notifications.filter(n => !n.isRead).length;
        
        // Update badge
        document.querySelector('.notification-btn .badge').textContent = unreadCount;
        
        // Render notifications
        container.innerHTML = `
            <div class="dropdown-header">
                <span class="dropdown-title">Notifications (${notifications.length})</span>
                <span class="mark-all-read" id="markAllRead">Mark all as read</span>
            </div>
            ${notifications.map(notification => `
                <div class="notification-item ${notification.isRead ? '' : 'unread'}" 
                     data-notification-id="${notification.id}">
                    <div class="notification-title">
                        <span>${notification.title}</span>
                        <span class="notification-time">
                            ${new Date(notification.date).toLocaleTimeString()}
                        </span>
                    </div>
                    <div class="notification-content">
                        ${notification.message}
                    </div>
                </div>
            `).join('')}
            <div class="dropdown-footer">
                <span class="view-all" id="viewAllNotifications">View All Notifications</span>
            </div>
        `;
        
        // Set up event listeners
        document.getElementById('markAllRead').addEventListener('click', markAllNotificationsAsRead);
        document.getElementById('viewAllNotifications').addEventListener('click', viewAllNotifications);
        
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const notificationId = this.getAttribute('data-notification-id');
                viewNotification(notificationId);
            });
        });
    })
    .catch(error => {
        console.error('Failed to load notifications:', error);
    });
}

function markAllNotificationsAsRead() {
    fetch(`${API_BASE_URL}/Notifications/mark-all-read/${currentSeller.id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
    })
    .then(() => {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });
        document.querySelector('.notification-btn .badge').textContent = '0';
    })
    .catch(error => {
        console.error('Failed to mark notifications as read:', error);
    });
}

function viewAllNotifications() {
    // In a real app, this would open a full notifications page
    alert('Opening all notifications...');
}

function viewNotification(notificationId) {
    fetch(`${API_BASE_URL}/Notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
    })
    .then(response => response.json())
    .then(notification => {
        // Display notification details in modal
        document.getElementById('notificationTitle').textContent = notification.title;
        document.getElementById('notificationDate').textContent = 
            new Date(notification.date).toLocaleString();
        document.getElementById('notificationMessage').textContent = notification.message;
        
        openModal('notificationDetailModal');
        
        // Mark as read in UI
        document.querySelector(`.notification-item[data-notification-id="${notificationId}"]`)
            .classList.remove('unread');
        
        // Update badge count
        const unreadCount = parseInt(document.querySelector('.notification-btn .badge').textContent) - 1;
        document.querySelector('.notification-btn .badge').textContent = unreadCount > 0 ? unreadCount : '';
    })
    .catch(error => {
        console.error('Failed to view notification:', error);
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        document.getElementById('logoutConfirm').classList.add('show');
    });
    
    document.querySelector('.confirm-yes').addEventListener('click', function() {
        localStorage.removeItem('sellerToken');
        localStorage.removeItem('sellerId');
        window.location.href = 'sellerlogin.html';
    });
    
    document.querySelector('.confirm-no').addEventListener('click', function() {
        document.getElementById('logoutConfirm').classList.remove('show');
    });
}

// Utility Functions
function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}