document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('sellerToken');
    if (!token) {
        showToast('Seller not logged in', 'error');
        return;
    }

    // Decode JWT to extract sellerId
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Invalid token format', e);
            return null;
        }
    }

    const payload = parseJwt(token);
    const sellerId = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    if (!sellerId) {
        showToast('Invalid token. Please log in again.', 'error');
        return;
    }


    const chartElement = document.getElementById('salesChart');
    if (!chartElement) {
        console.error('Chart element with ID "salesChart" not found.');
        return;
    }

    const ctx = chartElement.getContext('2d');
    let salesChart = null;
    let allOrders = [];
    let allSubcategories = [];

    function updateChart(labels, values) {
        if (salesChart) {
            salesChart.data.labels = labels;
            salesChart.data.datasets[0].data = values;
            salesChart.update();
        } else {
            salesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sales',
                        data: values,
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                callback: value => 'Rs.' + value.toLocaleString()
                            }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }

    function createDetailsModal() {
        const modal = document.createElement('div');
        modal.id = 'orderDetailsModal';
        modal.className = 'order-details-modal';
        modal.innerHTML = `
            <div class="order-details-content">
                <span class="order-details-close">&times;</span>
                <h2>Order Details <span id="detailsOrderNumber"></span></h2>
                <div class="order-details-grid">
                    <div class="order-summary">
                        <h3>Summary</h3>
                        <p><strong>Date:</strong> <span id="detailsOrderDate"></span></p>
                        <p><strong>Customer:</strong> <span id="detailsCustomer"></span></p>
                        <p><strong>Status:</strong> <span id="detailsStatus"></span></p>
                        <p><strong>Subtotal:</strong> <span id="detailsSubtotal"></span></p>
                        <p><strong>Discount:</strong> <span id="detailsDiscount"></span></p>
                        <p><strong>Shipping:</strong> <span id="detailsShipping"></span></p>
                        <p><strong>Total:</strong> <span id="detailsTotal"></span></p>
                    </div>
                    <div class="order-items">
                        <h3>Items (<span id="detailsItemCount">0</span>)</h3>
                        <div class="items-list" id="detailsItemsList"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal when clicking X
        modal.addEventListener('click', function(e) {
        if (e.target.classList.contains('order-details-close') || e.target === modal) {
            closeDetailsModal();
        }
    });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDetailsModal();
        });
    }

    function closeDetailsModal() {
        document.getElementById('orderDetailsModal').style.display = 'none';
    }

    async function showOrderDetails(orderId) {
        try {
            const response = await fetch(`https://localhost:7273/api/Orders/GetOrderById/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(await response.text());
            
            const result = await response.json();
            if (result.Success && result.Data) {
                const order = result.Data;
                const modal = document.getElementById('orderDetailsModal');
                
                // Populate modal
                document.getElementById('detailsOrderNumber').textContent = order.OrderNumber;
                document.getElementById('detailsOrderDate').textContent = 
                    new Date(order.OrderDate).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                    });
                document.getElementById('detailsCustomer').textContent = order.CustomerName;
                document.getElementById('detailsStatus').textContent = order.OrderStatus;
                document.getElementById('detailsSubtotal').textContent = order.TotalBaseAmount;
                document.getElementById('detailsDiscount').textContent = order.TotalDiscountAmount;
                document.getElementById('detailsShipping').textContent = order.ShippingCost;
                document.getElementById('detailsTotal').textContent = order.TotalAmount;
                document.getElementById('detailsItemCount').textContent = order.OrderItems.length;

                // Populate items list
                const itemsList = document.getElementById('detailsItemsList');
                itemsList.innerHTML = '';
                order.OrderItems.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'order-item';
                    itemElement.innerHTML = `
                        <div class="item-info">
                            <h4>Product ID: ${item.ProductId}</h4>
                            <p>Quantity: ${item.Quantity}</p>
                        </div>
                        <div class="item-pricing">
                            <p>Unit Price: ${item.UnitPrice}</p>
                            <p>Discount: ${item.Discount}</p>
                            <p class="item-total">Total: ${item.TotalPrice}</p>
                        </div>
                    `;
                    itemsList.appendChild(itemElement);
                });

                // Show modal
                modal.style.display = 'block';
            }
        } catch (error) {
            showToast('Failed to load order details', 'error');
            console.error('Details error:', error);
        }
    }

    // 5. Order Status Update Function
    async function updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`https://localhost:7273/api/Orders/UpdateOrderStatus/${orderId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error(await response.text());
            showToast(`Status updated to ${newStatus}`, 'success');
            await fetchRecentOrders();
        } catch (error) {
            showToast('Update failed: ' + error.message, 'error');
        }
    }

    // 6. Fetch and Display Orders
    async function fetchRecentOrders() {
        try {
            const response = await fetch(`https://localhost:7273/api/Orders/GetOrdersBySeller/${sellerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            
            const result = await response.json();
            if (result.Success && Array.isArray(result.Data)) {
            allOrders = result.Data;
            displayRecentOrders(allOrders);
            filterAndRender(document.querySelector('.time-filter button.active').dataset.filter);
            }
    } catch (error) {

        showToast('Failed to load orders', 'error');
            console.error('Fetch error:', error);
            
    }
    }

    // 7. Display Orders in Table
    function displayRecentOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';

        const recentOrders = orders
            .sort((a, b) => new Date(b.OrderDate) - new Date(a.OrderDate))
            .slice(0, 4);

        if (recentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-orders">No orders found</td></tr>';
            return;
        }

        recentOrders.forEach(order => {
            const row = document.createElement('tr');
            const orderDate = new Date(order.OrderDate);
            const now = new Date();
            const isToday = orderDate.toDateString() === now.toDateString();
            const dateStr = isToday 
                ? `Today, ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                : orderDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});

            let statusClass = order.OrderStatus.toLowerCase();
            let actionBtn = '';
            
            if (order.OrderStatus === 'Pending') {
                actionBtn = `<button class="action-btn process" onclick="updateOrderStatus('${order.Id}', 'Processing')">
                    <i class="fas fa-box"></i> Process
                </button>`;
            } 
            else if (order.OrderStatus === 'Processing') {
                actionBtn = `<button class="action-btn ship" onclick="updateOrderStatus('${order.Id}', 'Shipped')">
                    <i class="fas fa-truck"></i> Ship
                </button>`;
            }
            else if (order.OrderStatus === 'Shipped') {
                actionBtn = `<button class="action-btn deliver" onclick="updateOrderStatus('${order.Id}', 'Delivered')">
                    <i class="fas fa-check"></i> Deliver
                </button>`;
            }
            else if (order.OrderStatus === 'Delivered' || order.OrderStatus === 'Canceled') {
                actionBtn = `<button class="action-btn details" onclick="showOrderDetails('${order.Id}')">
                    <i class="fas fa-file-alt"></i> Details
                </button>`;
            }

            row.innerHTML = `
                <td>#${order.OrderNumber}</td>
                <td>${order.CustomerName}</td>
                <td>${dateStr}</td>
                <td>Rs.${order.TotalAmount.toLocaleString('en-PK')}</td>
                <td><span class="status ${statusClass}">${order.OrderStatus}</span></td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(row);
        });
    }

    const detailsModalCSS = `
        .order-details-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
        }
        
        .order-details-content {
            background-color: #fff;
            margin: 5% auto;
            padding: 25px;
            border-radius: 8px;
            width: 70%;
            max-width: 800px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            position: relative;
            animation: modalFadeIn 0.3s;
        }
        
        .order-details-close {
            position: absolute;
            right: 25px;
            top: 15px;
            font-size: 28px;
            font-weight: bold;
            color: #aaa;
            cursor: pointer;
        }
        
        .order-details-close:hover {
            color: #333;
        }
        
        .order-details-grid {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 30px;
            margin-top: 20px;
        }
        
        .order-summary, .order-items {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 6px;
        }
        
        .order-summary h3, .order-items h3 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        .order-summary p {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
        }
        
        .order-summary p strong {
            color: #555;
        }
        
        .items-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .order-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
        }
        
        .order-item:last-child {
            border-bottom: none;
        }
        
        .item-total {
            font-weight: bold;
            color: #2c3e50;
        }
        
        @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;

    const styleTag = document.createElement('style');
    styleTag.innerHTML = detailsModalCSS;
    document.head.appendChild(styleTag);

    createDetailsModal();

    window.showOrderDetails = showOrderDetails;

    // 8. Filter and Render Chart
    function filterAndRender(filterType) {
        const now = new Date();
        const filteredOrders = allOrders.filter(order => {
            if (order.OrderStatus !== 'Delivered') return false;
            const date = new Date(order.OrderDate);
            const timeDiff = now - date;
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            if (filterType === 'week') {
                return daysDiff <= 7;
            }
            if (filterType === 'month') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            if (filterType === 'year') {
            return date.getFullYear() === now.getFullYear();
            }
            return true;
        });

        const salesByDate = {};
    filteredOrders.forEach(order => {
        let dateKey;
        if (filterType === 'week') {
            // For weekly view, show day names
            dateKey = new Date(order.OrderDate).toLocaleDateString('en-US', { weekday: 'short' });
        } else if (filterType === 'month') {
            // For monthly view, show day numbers
            dateKey = new Date(order.OrderDate).getDate();
        } else {
            // For yearly view, show month names
            dateKey = new Date(order.OrderDate).toLocaleDateString('en-US', { month: 'short' });
        }
        
        salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.TotalAmount;
    });

    // Convert to arrays for Chart.js
    const labels = Object.keys(salesByDate);
    const values = Object.values(salesByDate);

    // Sort labels chronologically
    if (filterType === 'week') {
        // Sort weekdays in order
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels.sort((a, b) => weekdays.indexOf(a) - weekdays.indexOf(b));
    } else if (filterType === 'month') {
        // Sort day numbers numerically
        labels.sort((a, b) => a - b);
    } else if (filterType === 'year') {
        // Sort months chronologically
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labels.sort((a, b) => months.indexOf(a) - months.indexOf(b));
    }

    updateChart(labels, values);
    }

    // 9. Initialize Time Filters
    document.querySelectorAll('.time-filter button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelector('.time-filter button.active').classList.remove('active');
            this.classList.add('active');
            filterAndRender(this.dataset.filter);
        });
    });

    // 10. Make updateOrderStatus available globally
    window.updateOrderStatus = updateOrderStatus;

    // Initial load
    await fetchRecentOrders();



    const processOrdersBtn = document.getElementById('processOrdersBtn');
    const ordersTableBody = document.getElementById('ordersTableBody');
    const processOrdersModal= document.getElementById('processOrdersModal')
    
    // When Process Orders button is clicked, trigger the View More functionality
    processOrdersBtn.addEventListener('click', function() {
        processOrdersModal.classList.add('active');
        // First check if we need to fetch more orders or just display them
        if (ordersTableBody.querySelectorAll('tr').length <= 4) {
            // If only showing 4 orders (recent ones), trigger the view more click
            initializeViewMoreModal();
            document.getElementById('viewMoreBtn').addEventListener('click', showAllOrders);
            viewMoreBtn.click();
        } else {
            // If already showing all orders, just scroll to the orders section
            document.querySelector('.recent-orders').scrollIntoView({
                behavior: 'smooth'
            });
        }
    });


    //REPORTING
    const viewReportsBtn = document.getElementById('viewReportsBtn');
    const viewReportsModal = document.getElementById('viewReportsModal');
    const closeBtn = document.getElementById('closeViewReportsModal');
    const closeFooterBtn = document.getElementById('closeReports');
    const generateBtn = document.getElementById('generateReport');
    const exportPdfBtn = document.getElementById('exportPdf');
    const reportPeriod = document.getElementById('reportPeriod');
    const customDateRange = document.getElementById('customDateRange');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Set default dates (today for end date, 7 days ago for start date)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    endDateInput.valueAsDate = today;
    startDateInput.valueAsDate = sevenDaysAgo;

    // Toggle custom date range visibility
    reportPeriod.addEventListener('change', function() {
        customDateRange.style.display = this.value === 'custom' ? 'flex' : 'none';
    });

    // Open modal
    viewReportsBtn.addEventListener('click', function() {
        viewReportsModal.style.display = 'flex';
    });

    // Close modal
    function closeModal() {
        viewReportsModal.style.display = 'none';
    }

    closeBtn.addEventListener('click', closeModal);
    closeFooterBtn.addEventListener('click', closeModal);
    viewReportsModal.addEventListener('click', function(e) {
        if (e.target === viewReportsModal) closeModal();
    });

    // Generate report
    generateBtn.addEventListener('click', async function() {
    let startDate, endDate;
    const period = reportPeriod.value;
    
    // Calculate dates based on selection
    switch(period) {
        case '7':
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            break;
        case '30':
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);
            break;
        case 'this_month':
            startDate = new Date();
            startDate.setDate(1);
            endDate = new Date();
            break;
        case 'last_month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setDate(1);
            endDate = new Date();
            endDate.setDate(0); // Last day of previous month
            break;
        case 'custom':
            startDate = new Date(startDateInput.value);
            endDate = new Date(endDateInput.value);
            break;
    }

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    try {
        // Show loading state
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        const response = await fetch(`https://localhost:7273/api/Orders/sales-report?startDate=${startDateStr}&endDate=${endDateStr}&sellerId=${sellerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        
        const result = await response.json();
        if (result.Success && result.Data) {

            
            // Parse the numbers to ensure they're treated as numbers
            const totalRevenue = parseFloat(result.Data.TotalRevenue) || 0;
            const totalOrders = parseInt(result.Data.TotalOrders) || 0;
            const avgOrderValue = parseFloat(result.Data.AverageOrderValue) || 0;

            console.log('API result:', result.Data);

console.log('Parsed values =>');
console.log('Total Revenue:', totalRevenue);
console.log('Total Orders:', totalOrders);
console.log('Average Order Value:', avgOrderValue);

// DEBUG: See which element is getting updated
console.log('DOM element for totalRevenue:', document.getElementById('totaRevenue'));
console.log('DOM element for avgOrderValue:', document.getElementById('avgOrderValue'));
            // Update UI with report data
            document.getElementById('totaRevenue').textContent = `Rs.${totalRevenue.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('totalOrders').textContent = totalOrders;
            document.getElementById('avgOrderValue').textContent = `Rs.${avgOrderValue.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            showToast('Report generated successfully', 'success');
        } else {
            showToast('Failed to generate report', 'error');
        }
    } catch (error) {
        showToast('Error generating report: ' + error.message, 'error');
        console.error('Report error:', error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
});

    // Export as PDF
    exportPdfBtn.addEventListener('click', function() {
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get report data
        const title = "Sales Report";
        const period = reportPeriod.options[reportPeriod.selectedIndex].text;
        const totalRevenue = document.getElementById('totaRevenue').textContent;
        const totalOrders = document.getElementById('totalOrders').textContent;
        const avgOrderValue = document.getElementById('avgOrderValue').textContent;
        const date = new Date().toLocaleDateString();
        
        // Add content to PDF
        doc.setFontSize(18);
        doc.text(title, 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Period: ${period}`, 20, 40);
        doc.text(`Generated on: ${date}`, 20, 50);
        
        doc.setFontSize(14);
        doc.text('Summary', 20, 70);
        
        doc.setFontSize(12);
        doc.text(`Total Revenue: ${totalRevenue}`, 20, 85);
        doc.text(`Total Orders: ${totalOrders}`, 20, 95);
        doc.text(`Average Order Value: ${avgOrderValue}`, 20, 105);
        
        // Save the PDF
        doc.save(`Sales_Report_${date.replace(/\//g, '-')}.pdf`);
    });

    // JWT parsing function
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Invalid token format', e);
            return null;
        }
    }








    async function fetchAndUpdateSellerProfile() {
    try {
        const url = `https://localhost:7273/api/Seller/${sellerId}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch seller profile: ${response.status}`);
        }
        const result = await response.json();
        if (result.Success && result.Data) {
            const seller = result.Data;
            const fullName = `${seller.FirstName} ${seller.LastName}`;
            document.getElementById('sellerNameDisplay').textContent = fullName;

            let profileImg = 'images/person.jpg'; // placeholder default
            if (seller.ProfileImageUrl) {
                profileImg = seller.ProfileImageUrl;
            }
            document.getElementById('sellerProfileImg').src = profileImg;

            // Now get revenue and set status label accordingly
            const revenueRes = await fetch(`https://localhost:7273/api/Orders/GetRevenueStatsBySeller/${sellerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!revenueRes.ok) throw new Error(`Failed to fetch revenue: ${revenueRes.status}`);
            const revenueResult = await revenueRes.json();
            if (revenueResult.Success && revenueResult.Data) {
                const totalRevenue = revenueResult.Data.TotalRevenue || 0;
                const statusLabel = totalRevenue > 1000000 ? 'Premium Seller' : 'Regular Seller';
                document.querySelector('.seller-status').textContent = statusLabel;
            }
        }
    } catch (error) {
        console.error('Error fetching seller profile or revenue:', error);
    }
}

    function initializeViewMoreModal() {
        const modal = document.getElementById('ordersModal');
        
        // Close modal when clicking X
        document.getElementById('closeModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    async function showAllOrders() {
        try {
            const modal = document.getElementById('ordersModal');
            const tbody = modal.querySelector('tbody');
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading orders...</td></tr>';

            modal.style.display = 'block';
            
            // Reuse the allOrders data we already have
            if (allOrders && allOrders.length > 0) {
                displayOrdersInModal(allOrders);
            } else {
                // Fetch fresh data if needed
                const response = await fetch(`https://localhost:7273/api/Orders/GetOrdersBySeller/${sellerId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error(await response.text());
                
                const result = await response.json();
                if (result.Success && Array.isArray(result.Data)) {
                    allOrders = result.Data;
                    displayOrdersInModal(allOrders);
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" class="no-orders">No orders found</td></tr>';
                }
            }
        } catch (error) {
            showToast('Failed to load all orders', 'error');
            console.error('View More error:', error);
        }
    }

    function displayOrdersInModal(orders) {
        const tbody = document.querySelector('#ordersModal tbody');
        tbody.innerHTML = '';

        // Sort by date (newest first)
        const sortedOrders = [...orders].sort((a, b) => new Date(b.OrderDate) - new Date(a.OrderDate));

        if (sortedOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-orders">No orders found</td></tr>';
            return;
        }

        sortedOrders.forEach(order => {
            const row = document.createElement('tr');
            const orderDate = new Date(order.OrderDate);
            const now = new Date();
            const isToday = orderDate.toDateString() === now.toDateString();
            const dateStr = isToday 
                ? `Today, ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                : orderDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});

            let statusClass = order.OrderStatus.toLowerCase();
            let actionBtn = '';
            
            if (order.OrderStatus === 'Pending') {
                actionBtn = `<button class="action-btn process" onclick="updateOrderStatus('${order.Id}', 'Processing')">
                    <i class="fas fa-box"></i> Process
                </button>`;
            } 
            else if (order.OrderStatus === 'Processing') {
                actionBtn = `<button class="action-btn ship" onclick="updateOrderStatus('${order.Id}', 'Shipped')">
                    <i class="fas fa-truck"></i> Ship
                </button>`;
            }
            else if (order.OrderStatus === 'Shipped') {
                actionBtn = `<button class="action-btn deliver" onclick="updateOrderStatus('${order.Id}', 'Delivered')">
                    <i class="fas fa-check"></i> Deliver
                </button>`;
            }
            else if (order.OrderStatus === 'Delivered' || order.OrderStatus === 'Canceled') {
                actionBtn = `<button class="action-btn details" onclick="showOrderDetails('${order.Id}')">
                    <i class="fas fa-file-alt"></i> Details
                </button>`;
            }

            row.innerHTML = `
                <td>#${order.OrderNumber}</td>
                <td>${order.CustomerName}</td>
                <td>${dateStr}</td>
                <td>Rs.${order.TotalAmount.toLocaleString('en-PK')}</td>
                <td><span class="status ${statusClass}">${order.OrderStatus}</span></td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // 2. Initialize the modal and view more button
    initializeViewMoreModal();
    document.getElementById('viewMoreBtn').addEventListener('click', showAllOrders);

    window.showAllOrders = showAllOrders;

    const addProductBtn = document.getElementById('addProductBtn');
    const addProductModal = document.getElementById('addProductModal');
    const closeAddProductModal = document.getElementById('closeAddProductModal');
    const cancelAddProduct = document.getElementById('cancelAddProduct');
    const submitAddProduct = document.getElementById('submitAddProduct');
    const addProductForm = document.getElementById('addProductForm');
    const productCategory = document.getElementById('productCategory');
    const subCategoryContainer = document.getElementById('subCategoryContainer');
    const productSubCategory = document.getElementById('productSubCategory');
    const dropArea = document.getElementById('dropArea');
    const uploadBtn = document.getElementById('uploadBtn');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    
    let selectedFile = null;

    // Fetch categories from API
    async function fetchCategories() {
        try {
            const response = await fetch('https://localhost:7273/api/Categories/GetAllCategories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            
            const data = await response.json();
            if (data.Success && data.Data) {
                populateCategories(data.Data);
            } else {
                throw new Error('Invalid categories data');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Failed to load categories. Please try again.', 'error');
        }
    }

    // Fetch subcategories from API
    async function fetchSubcategories() {
        try {
            const response = await fetch('https://localhost:7273/api/Products/GetAllSubcategories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch subcategories');
            }
            
            const data = await response.json();
            if (data.Success && data.Data) {
                allSubcategories = data.Data;
                return data.Data;
            } else {
                throw new Error('Invalid subcategories data');
            }
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            showToast('Failed to load subcategories. Please try again.', 'error');
            return[];
        }
    }

    // Populate categories dropdown
    function populateCategories(categories) {
        productCategory.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Id;
            option.textContent = category.Name;
            productCategory.appendChild(option);
        });
    }

    // Populate subcategories dropdown for Groceries
    function populateSubcategories() {
    const productSubCategory = document.getElementById('productSubCategory');
    if (!productSubCategory) {
        console.error('Subcategory select element not found');
        return;
    }
    
    productSubCategory.innerHTML = '<option value="">Select Sub Category</option>';
    
    if (!allSubcategories || allSubcategories.length === 0) {
        console.warn('No subcategories available');
        return;
    }
    
    const groceriesSubcategories = allSubcategories.filter(sub => sub.CategoryId === 16);
    
    groceriesSubcategories.forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory.Id;
        option.textContent = subcategory.Name;
        productSubCategory.appendChild(option);
    });
}

    // Handle category change to show/hide subcategory
    productCategory.addEventListener('change', async function() {
    if (this.value === '16') { // Groceries category ID
        // Only fetch if we haven't already or if empty
        if (allSubcategories.length === 0) {
            await fetchSubcategories();
        }
        populateSubcategories();
        subCategoryContainer.style.display = 'block';
        productSubCategory.required = true;
    } else {
        subCategoryContainer.style.display = 'none';
        productSubCategory.required = false;
    }
    });

    // Handle file selection
    function handleFileSelect(file) {
        if (!file.type.match('image.*')) {
            showToast('Please select an image file', 'error');
            return;
        }
        
        selectedFile = file;
        
        // Clear previous preview
        imagePreview.innerHTML = '';
        
        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFileSelect(file);
    });

    uploadBtn.addEventListener('click', function() {
        imageInput.click();
    });

    imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFileSelect(this.files[0]);
        }
    });

    // Modal open/close handlers
    addProductBtn.addEventListener('click', function() {
        addProductModal.classList.add('active');
        addProductModal.style.display = 'flex';
        fetchCategories();
    });

    closeAddProductModal.addEventListener('click', function() {
        addProductModal.style.display = 'none';
        resetForm();
    });

    cancelAddProduct.addEventListener('click', function() {
        addProductModal.style.display = 'none';
        resetForm();
    });

    // Reset form
    function resetForm() {
        addProductForm.reset();
        imagePreview.innerHTML = '';
        selectedFile = null;
        subCategoryContainer.style.display = 'none';
    }

    // Submit product form
    submitAddProduct.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!addProductForm.checkValidity()) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        if (!selectedFile) {
            showToast('Please select a product image', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('Name', document.getElementById('productName').value);
        formData.append('Description', document.getElementById('productDescription').value);
        formData.append('Price', document.getElementById('productPrice').value);
        formData.append('StockQuantity', document.getElementById('productStock').value);
        formData.append('DiscountPercentage', document.getElementById('productDiscount').value);
        formData.append('CategoryId', productCategory.value);
        formData.append('IsAvailable', document.getElementById('productAvailability').value);
        formData.append('SellerId', sellerId);
        formData.append('ProductImage', selectedFile);
        
        // Only add SubCategoryId if it's required (Groceries)
        if (productCategory.value === '16') {
            formData.append('SubCategoryId', productSubCategory.value);
        }
        
        try {
            const response = await fetch('https://localhost:7273/api/Products/CreateProduct', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.Success) {
                showToast('Product created successfully!', 'success');
                addProductModal.style.display = 'none';
                resetForm();
                // You might want to refresh the product list here
            } else {
                showToast(result.Message || 'Failed to create product', 'error');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            showToast('An error occurred while creating the product', 'error');
        }
    });

    //TOASTIWANT
    // Helper function to show toast messages
    function showToast(message, type) {
    console.log(`${type}: ${message}`);
    // Create a simple toast if one doesn't exist
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 20px';
    toast.style.background = type === 'error' ? '#ff4444' : '#00C851';
    toast.style.color = 'white';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '1000';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000); // Temporary solution
}



async function fetchDashboardData() {
    try {
        const url = `https://localhost:7273/api/seller/dashboard/${sellerId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        updateDashboardUI(data);
    } catch (error) {
        console.error('Dashboard fetch error:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function updateDashboardUI(data) {
    // Update This Month's Orders
    document.getElementById('thisMonthsOrders').textContent = data.ThisMonthsOrders;
    const orderTrendElement = document.getElementById('orderTrend');
    orderTrendElement.textContent = `${data.OrderTrend} from last month`;
    orderTrendElement.className = 'trend ' + (data.OrderTrend.includes('+') ? 'up' : data.OrderTrend.includes('-') ? 'down' : '');

    // Update Revenue
    document.getElementById('totalRevenue').textContent = `Rs.${data.TotalRevenue.toLocaleString('en-PK')}`;
    const revenueTrendElement = document.getElementById('revenueTrend');
    revenueTrendElement.textContent = `${data.RevenueTrend} from last month`;
    revenueTrendElement.className = 'trend ' + (data.RevenueTrend.includes('+') ? 'up' : data.RevenueTrend.includes('-') ? 'down' : '');

    // Update Seller Rank
    document.getElementById('sellerRank').textContent = `#${data.SellerRank}`;
    const rankTrendElement = document.getElementById('rankTrend');
    if (data.RankTrend === "N/A") {
        rankTrendElement.textContent = "No change";
        rankTrendElement.className = 'trend';
    } else {
        rankTrendElement.textContent = data.RankTrend;
        rankTrendElement.className = 'trend ' + (data.RankTrend.includes('+') ? 'down' : 'up'); // + in rank is actually bad (higher number = lower rank)
    }

    // Update Rating
    document.getElementById('averageRating').textContent = `${data.AverageRating}/5`;
    document.getElementById('totalReviews').textContent = `From ${data.TotalReviews} reviews`;
}

// Call this function after you get the sellerId
await fetchDashboardData();

async function fetchTopProducts() {
        try {
            const response = await fetch(`https://localhost:7273/api/Orders/GetTopSellingProductsBySeller/${sellerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(await response.text());
            
            const result = await response.json();
            if (result.Success && Array.isArray(result.Data)) {
                displayTopProducts(result.Data.slice(0, 3)); // Show top 3 in main section
                displayAllProducts(result.Data); // Show all in popup
            }
        } catch (error) {
            showToast('Failed to load products', 'error');
            console.error('Fetch error:', error);
        }
    }

    // Display top products in main section
    function displayTopProducts(products) {
        const container = document.getElementById('topProductsList');
        container.innerHTML = '';
        
        products.forEach(product => {
            container.appendChild(createProductElement(product));
        });
    }

    // Display all products in popup
    function displayAllProducts(products) {
        const container = document.getElementById('allProductsList');
        container.innerHTML = '';
        
        products.forEach(product => {
            container.appendChild(createProductElement(product, true));
        });
    }

    // Create product element
    function createProductElement(product, isPopup = false) {
    const productElement = document.createElement('div');
    productElement.className = 'product-item';

    const placeholder = '/images/potato.jpg'; // lightweight default
    const fallback = '/images/potato.jpg';         // fallback on error

    // Determine the actual image source
    const backendUrl = "https://localhost:7273";

const actualImageUrl = product.ProductImage?.startsWith('/')
    ? backendUrl + product.ProductImage
    : backendUrl + '/images/products/' + product.ProductImage; // fallback path


    productElement.innerHTML = `
        <img src="${placeholder}" alt="${product.ProductName}" class="product-image">
        <div class="product-info">
            <h3 class="product-name">${product.ProductName}</h3>
            <div class="product-meta">
                <span class="price">Rs.${Math.round(product.TotalRevenue / product.TotalQuantitySold).toLocaleString()}</span>
                <span class="sales">${product.TotalQuantitySold} sold</span>
                <span class="revenue">Rs.${product.TotalRevenue.toLocaleString()}</span>
            </div>
        </div>
    `;

    const img = productElement.querySelector('.product-image');

    // Load actual image safely
    const imageLoader = new Image();
    imageLoader.src = actualImageUrl;
    imageLoader.onload = () => img.src = actualImageUrl;
    imageLoader.onerror = () => img.src = fallback;

    return productElement;
}


    // Popup control functions
    function openProductsPopup() {
        document.getElementById('topProductsPopup').style.display = 'block';
    }

    function closeProductsPopup() {
        document.getElementById('topProductsPopup').style.display = 'none';
    }

    // Event listeners
    document.getElementById('viewAllProducts').addEventListener('click', openProductsPopup);
    document.getElementById('closeProductsPopup').addEventListener('click', closeProductsPopup);

    // Close popup when clicking outside content
    document.getElementById('topProductsPopup').addEventListener('click', function(e) {
        if (e.target === this) closeProductsPopup();
    });

    // Initialize
    await fetchTopProducts();


    

// Call it here
await fetchAndUpdateSellerProfile();

        async function fetchSeller() {
    const res = await fetch(`https://localhost:7273/api/Seller/${sellerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch seller');
    const data = await res.json();
    if (!data.Success) throw new Error('Seller fetch unsuccessful');
    return data.Data;
  }

  

  // Fetch shop info
  async function fetchShop() {
    const res = await fetch(`https://localhost:7273/api/ShopDetails/seller/${sellerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch shop');
    const data = await res.json();
    if (!data.Success) throw new Error('Shop fetch unsuccessful');
    return data.Data;
  }

  // Fetch address info
  async function fetchAddresses() {
    const res = await fetch(`https://localhost:7273/api/seller/addresses/${sellerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch addresses');
    const data = await res.json();
    if (!data.Success) throw new Error('Address fetch unsuccessful');
    return data.Data;
  }


  try {
    const seller = await fetchSeller();
    const shop = await fetchShop();
    const shopData = Array.isArray(shop) && shop.length > 0 ? shop[0] : null;
    const addresses = await fetchAddresses();

    // Populate form fields
    document.getElementById('shopName').value = shopData?.ShopName || 'N/A';
    document.getElementById('sellerEmail').value = seller.Email || 'N/A';
    document.getElementById('sellerPhone').value = seller.PhoneNumber || 'N/A';

    // Find business address that is default
    const businessAddress = addresses.find(addr => addr.AddressType === 'Business' && addr.IsDefault);
    if (businessAddress) {
      document.getElementById('sellerAddress').value = `${businessAddress.Street}, ${businessAddress.City}, ${businessAddress.State}, ${businessAddress.Country} - ${businessAddress.PostalCode}`;
    } else {
      document.getElementById('sellerAddress').value = 'N/A';
    }

    // Format member since date nicely
    const registeredDate = new Date(seller.RegisteredAt);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('sellerSince').value = registeredDate.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error(error);
    alert('Failed to load seller details');
  }

        try {
    // Fetch shops for seller
    const shopRes = await fetch(`https://localhost:7273/api/ShopDetails/seller/${sellerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!shopRes.ok) throw new Error('Failed to fetch shop details');
    const shopResult = await shopRes.json();
    if (!shopResult.Success) throw new Error('Shop details fetch unsuccessful');

    // Assuming primary shop or first shop
    const shop = shopResult.Data.find(s => s.IsPrimary) || shopResult.Data[0];
    if (!shop) {
      alert('No shop found for seller');
      return;
    }

    const shopId = shop.Id;

    // Now fetch bank details by ShopId
    // You may have multiple bank details, so you might want to adjust this if needed
    const bankRes = await fetch(`https://localhost:7273/api/BankDetails/shop/${shopId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!bankRes.ok) throw new Error('Failed to fetch bank details');
    const bankResult = await bankRes.json();
    if (!bankResult.Success) throw new Error('Bank details fetch unsuccessful');

    // If API returns multiple bank details, take primary or first one
    let bank = bankResult.Data;
    if (Array.isArray(bank)) {
      bank = bank.find(b => b.IsPrimary) || bank[0];
    }

    if (!bank) {
      alert('No bank details found for this shop');
      return;
    }

    // Populate form
    document.getElementById('accountHolder').value = bank.AccountHolder || 'N/A';
    document.getElementById('accountNumber').value = bank.IBAN || 'N/A';
    document.getElementById('bankName').value = bank.BankName || 'N/A';
    document.getElementById('ifscCode').value = bank.SwiftCode || 'N/A';

  } catch (error) {
    console.error(error);
    alert('Failed to load bank details');
  }
    // Time filter buttons (week, month, year)
    const timeFilters = document.querySelectorAll('.time-filter button');
    timeFilters.forEach(button => {
        button.addEventListener('click', function () {
            timeFilters.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterType = this.dataset.filter; // week / month / year
            filterAndRender(filterType);
        });
    });

    // Sidebar toggle logic (mobile menu)
    const mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.style.display = 'none';

    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'block';
        } else {
            mobileMenuToggle.style.display = 'none';
            document.querySelector('.seller-sidebar').style.width = '280px';
        }
    }

    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();

    mobileMenuToggle.addEventListener('click', function () {
        const sidebar = document.querySelector('.seller-sidebar');
        if (sidebar.style.width === '280px' || !sidebar.style.width) {
            sidebar.style.width = '0';
        } else {
            sidebar.style.width = '280px';
        }
    });

    // Show summary cards with animation
    setTimeout(() => {
        document.querySelectorAll('.summary-card').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, 300);


    

});


document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const createDiscountBtn = document.getElementById('createDiscountBtn');
    const discountModal = document.getElementById('createDiscountModal');
    const closeBtn = document.getElementById('closeCreateDiscountModal');
    const cancelBtn = document.getElementById('cancelCreateDiscount');
    const submitBtn = document.getElementById('submitCreateDiscount');
    const productSelect = document.getElementById('productSelect');
    const discountForm = document.getElementById('discountForm');
    const discountPercentageInput = document.getElementById('discountPercentage');

    // Check authentication and get seller ID
    const token = localStorage.getItem('sellerToken');
    if (!token) {
        showToast('Seller not logged in', 'error');
        return;
    }

    const payload = parseJwt(token);
    const sellerId = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    if (!sellerId) {
        showToast('Invalid token. Please log in again.', 'error');
        return;
    }

    // JWT parsing function (reuse from your existing code)
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Invalid token format', e);
            return null;
        }
    }

    // Open modal when Create Discount button is clicked
    createDiscountBtn.addEventListener('click', function() {
        discountModal.classList.add('active');
        discountModal.style.display = 'flex';
        loadSellerProducts();
    });

    // Close modal functions
    function closeModal() {
        discountModal.style.display = 'none';
        discountForm.reset();
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside the modal content
    discountModal.addEventListener('click', function(e) {
        if (e.target === discountModal) {
            closeModal();
        }
    });

    // Load seller's products into select dropdown
    async function loadSellerProducts() {
        try {
            productSelect.innerHTML = '<option value="">Select a product...</option>';
            
            const response = await fetch(`https://localhost:7273/api/Products/GetProductsBySeller/${sellerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(await response.text());
            
            const result = await response.json();
            if (result.Success && Array.isArray(result.Data)) {
                result.Data.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.Id;
                    option.textContent = product.Name;
                    productSelect.appendChild(option);
                });
            } else {
                showToast('No products found', 'info');
            }
        } catch (error) {
            showToast('Failed to load products', 'error');
            console.error('Product load error:', error);
        }
    }

    // Handle discount submission
    submitBtn.addEventListener('click', async function() {
        const productId = productSelect.value;
        const discountPercentage = discountPercentageInput.value;

        // Validate inputs
        if (!productId) {
            showToast('Please select a product', 'error');
            return;
        }
        
        if (!discountPercentage || isNaN(discountPercentage) || 
            discountPercentage < 0 || discountPercentage > 100) {
            showToast('Please enter a valid discount percentage (0-100)', 'error');
            return;
        }

        try {
            const response = await fetch('https://localhost:7273/api/Products/SetProductDiscount', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    SellerId: sellerId,
                    ProductId: parseInt(productId),
                    DiscountPercentage: parseFloat(discountPercentage)
                })
            });

            if (!response.ok) throw new Error(await response.text());
            
            const result = await response.json();
            if (result.Success) {
                showToast(result.Data.Message || `Discount of ${discountPercentage}% applied successfully`, 'success');
                closeModal();
            } else {
                showToast(result.Message || 'Failed to apply discount', 'error');
            }
        } catch (error) {
            showToast('Error applying discount: ' + error.message, 'error');
            console.error('Discount error:', error);
        }
    });

    // Toast notification function (reuse from your existing code)
    function showToast(message, type) {
    console.log(`${type}: ${message}`);
    // Create a simple toast if one doesn't exist
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 20px';
    toast.style.background = type === 'error' ? '#ff4444' : '#00C851';
    toast.style.color = 'white';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '1000';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}
});


document.getElementById('saveBtn').addEventListener('click', async function() {
    // Get JWT token from storage
    const token = localStorage.getItem('sellerToken');
    if (!token) {
        showToast('Please login again', 'error');
        return;
    }

    // Parse sellerId from JWT (using your existing function)
    const payload = parseJwt(token);
    const sellerId = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    
    // Prepare update data from form fields
    const updateData = {
        sellerId: parseInt(sellerId),
        phoneNumber: document.getElementById('sellerPhone').value,
        businessAddress: document.getElementById('sellerAddress').value,
        shopName: document.getElementById('shopName').value,
        accountHolder: document.getElementById('accountHolder').value,
        accountNumber: document.getElementById('accountNumber').value,
        bankName: document.getElementById('bankName').value,
        swiftCode: document.getElementById('ifscCode').value
    };

    try {
        // Show loading state
        this.disabled = true;
        this.textContent = 'Saving...';

        // Call your API endpoint
        const response = await fetch('https://localhost:7273/api/seller-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        // Handle response
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }

        const result = await response.json();
        showToast('Profile updated successfully!', 'success');
        
        // Reset form to readonly mode
        document.querySelectorAll('#sellerForm input, #sellerForm textarea, #bankForm input')
            .forEach(field => field.readOnly = true);
        
        // Hide save button, show edit button
        document.getElementById('saveBtn').style.display = 'none';
        document.getElementById('editBtn').style.display = 'inline-block';

    } catch (error) {
        console.error('Update error:', error);
        showToast(error.message || 'Failed to update profile', 'error');
    } finally {
        // Reset button state
        this.disabled = false;
        this.textContent = 'Save Changes';
    }
});

// Your existing JWT parser function
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Invalid token', e);
        return null;
    }
}

// Toast notification function (implement according to your UI framework)
function showToast(message, type) {
    // Example using Toastify.js
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: type === 'error' ? '#ff4444' : '#00C851'
    }).showToast();
}

// Sidebar menu navigation
document.addEventListener('DOMContentLoaded', function () {
    const menuItems = document.querySelectorAll('.seller-menu li');

    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            menuItems.forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            this.classList.add('active');

            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
});




document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('sellerToken');
    if (!token) {
        showToast('Seller not logged in', 'error');
        return;
    }

    // Decode JWT to extract sellerId
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Invalid token format', e);
            return null;
        }
    }

    const payload = parseJwt(token);
    const sellerId = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    if (!sellerId) {
        showToast('Invalid token. Please log in again.', 'error');
        return;
    }

    // Constants
    const backendUrl = "https://localhost:7273";
    const placeholderImage = '/images/potato.jpg';
    
    // DOM Elements
const productsSection = document.getElementById('products');
const productTable = document.querySelector('.product-table');

// Fetch and display products
async function fetchAndDisplayProducts() {
    try {
        const response = await fetch(`${backendUrl}/api/Products/GetProductsBySeller/${sellerId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const result = await response.json();
        if (result.Success && result.Data) {
            window.products = result.Data;
            displayProducts(result.Data);
            updateStats(result.Data);
        } else {
            throw new Error(result.Message || 'Failed to fetch products');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        showToast(error.message, 'error');
    }
}

// Update stats cards
function updateStats(products) {
    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.StockQuantity <= 0).length;
    const lowInventory = products.filter(p => p.StockQuantity > 0 && p.StockQuantity <= 5).length;
    
    document.querySelectorAll('.stat-card p')[0].textContent = totalProducts;
    document.querySelectorAll('.stat-card p')[1].textContent = outOfStock;
    document.querySelectorAll('.stat-card p')[2].textContent = lowInventory;
}

// Event delegation for edit buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const productId = e.target.getAttribute('data-id');
        console.log('Edit button clicked for product ID:', productId);
        
        if (!window.products || !Array.isArray(window.products)) {
            console.error('Products not loaded');
            showToast('Products data not loaded. Please refresh.', 'error');
            return;
        }
        
        const product = window.products.find(p => p.Id == productId);
        console.log('Found product:', product);
        
        if (!product) {
            console.error('Product not found with ID:', productId);
            showToast('Product not found', 'error');
            return;
        }
        
        showEditModal(product);
    }
});

// Display products in table
function displayProducts(products) {
    productTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Discount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr data-id="${product.Id}">
                        <td>
                            <img src="${getProductImageUrl(product.ProductImage)}" 
                                 alt="${product.Name}" 
                                 onerror="this.src='${placeholderImage}'"
                                 class="product-thumbnail">
                        </td>
                        <td>${product.Name}</td>
                        <td>${product.Description}</td>
                        <td>Rs. ${product.Price.toFixed(2)}</td>
                        <td>${product.StockQuantity}</td>
                        <td>${product.DiscountPercentage}%</td>
                        <td class="actions">
    <button class="edit-btn fancy-btn edit" data-id="${product.Id}">
        <i class="fas fa-edit"></i> Edit
    </button>
    <button class="delete-btn fancy-btn delete" data-id="${product.Id}">
        <i class="fas fa-trash-alt"></i> Delete
    </button>
</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            confirmDelete(productId);
        });
    });
}

// Get product image URL
function getProductImageUrl(imagePath) {
    if (!imagePath) return placeholderImage;
    return imagePath.startsWith('/') 
        ? backendUrl + imagePath 
        : backendUrl + '/images/products/' + imagePath;
}

// Show edit modal
async function showEditModal(product) {
    try {
        // Fetch categories
        const categories = await fetchCategories();
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal-overlay edit-product-modal" id="editProductModal">
                <div class="modal-content">
                    <h3>Edit Product</h3>
                    <form id="edit-product-form" enctype="multipart/form-data">
                        <input type="hidden" name="Id" value="${product.Id}">
                        <input type="hidden" name="SellerId" value="${product.SellerId}">
                        
                        <div class="form-group">
                            <label for="Name">Name</label>
                            <input type="text" id="Name" name="Name" value="${product.Name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="Description">Description</label>
                            <textarea id="Description" name="Description" required>${product.Description}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="Price">Price</label>
                            <input type="number" id="Price" name="Price" step="0.01" value="${product.Price}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="StockQuantity">Stock Quantity</label>
                            <input type="number" id="StockQuantity" name="StockQuantity" value="${product.StockQuantity}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="DiscountPercentage">Discount Percentage</label>
                            <input type="number" id="DiscountPercentage" name="DiscountPercentage" value="${product.DiscountPercentage}">
                        </div>
                        
                        <div class="form-group">
                            <label for="CategoryId">Category</label>
                            <select id="CategoryId" name="CategoryId" required>
                                ${categories.map(cat => 
                                    `<option value="${cat.Id}" ${cat.Id == product.CategoryId ? 'selected' : ''}>${cat.Name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="ProductImage">Product Image</label>
                            <input type="file" id="ProductImage" name="ProductImage" accept="image/*">
                            <div class="current-image">
                                <img src="${getProductImageUrl(product.ProductImage)}" 
                                     alt="Current image" 
                                     onerror="this.src='${placeholderImage}'">
                                <span>Current Image</span>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="cancel-btn">Cancel</button>
                            <button type="submit" class="save-btn">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Remove any existing modal first
        const oldModal = document.getElementById('editProductModal');
        if (oldModal) oldModal.remove();
        
        // Insert into DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Setup event listeners
        setupModalEvents(product);
    } catch (error) {
        console.error('Error showing edit modal:', error);
        showToast('Failed to load editor', 'error');
    }
}

// Setup modal events
function setupModalEvents(product) {
    const modal = document.getElementById('editProductModal');
    const form = modal.querySelector('#edit-product-form');
    
    // Cancel button
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    // Overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleEditFormSubmit(form, product.Id);
    });
}

// Handle form submission
async function handleEditFormSubmit(form) {
    const saveBtn = form.querySelector('.save-btn');
    const originalBtnText = saveBtn.textContent;
    
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        const url = `${backendUrl}/api/Products/UpdateProduct`;
        
        console.log('Submitting to:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Response status:', response.status);
        
        // First check if response is completely empty
        if (response.status === 204) { // No Content
            showToast('Product updated successfully', 'success');
            document.getElementById('editProductModal').remove();
            await fetchAndDisplayProducts();
            return;
        }

        // Get response as text first
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // If empty response but status is OK
        if (!responseText && response.ok) {
            showToast('Product updated successfully', 'success');
            document.getElementById('editProductModal').remove();
            await fetchAndDisplayProducts();
            return;
        }

        let result;
        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch (error) {
            console.error('JSON parse error:', error);
            if (response.ok) {
                // If response was successful but not JSON, assume success
                showToast('Product updated successfully', 'success');
                document.getElementById('editProductModal').remove();
                await fetchAndDisplayProducts();
                return;
            }
            throw new Error(responseText || 'Failed to update product');
        }

        console.log('Parsed result:', result);
        
        if (!response.ok) {
            const errorMsg = result.Message || result.message || 
                           result.Data?.Message || 'Failed to update product';
            throw new Error(errorMsg);
        }

        if (result.Success || response.ok) {
            showToast(result.Data?.Message || 'Product updated successfully', 'success');
            document.getElementById('editProductModal').remove();
            await fetchAndDisplayProducts();
        } else {
            throw new Error(result.Message || 'Failed to update product');
        }
    } catch (error) {
        console.error('Error updating product:', {
            error: error,
            message: error.message,
            stack: error.stack
        });
        showToast(error.message || 'Failed to update product', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
}

async function fetchCategories() {
    const response = await fetch(`${backendUrl}/api/Categories/GetAllCategories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    return result.Success ? result.Data : [];
}

// Confirm and delete product
async function confirmDelete(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`${backendUrl}/api/Products/DeleteProduct/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.Success) {
            showToast('Product deleted successfully', 'success');
            await fetchAndDisplayProducts();
        } else {
            throw new Error(result.Message || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(error.message, 'error');
    }
}

// Helper function to show toast messages
function showToast(message, type) {
    // Implement your toast notification system or use console.log for now
    console.log(`${type}: ${message}`);
    alert(`${type}: ${message}`); // Simple fallback
}

// Add this CSS to your stylesheet or in a style tag in the head
const modalStyles = `
    <style>
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        
        .cancel-btn {
            padding: 8px 16px;
            background: #f0f0f0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .save-btn {
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .current-image {
            margin-top: 10px;
        }
        
        .current-image img {
            max-width: 100px;
            max-height: 100px;
            display: block;
            margin-bottom: 5px;
        }
    </style>
`;

// Add the styles to the head
document.head.insertAdjacentHTML('beforeend', modalStyles);

// Initialize
await fetchAndDisplayProducts();
});
//recent order table handler//

 // Modal functions
 let currentOrderId = '';

 function openProcessModal(orderId) {
    currentOrderId = orderId;
    document.getElementById('processOrderId').textContent = '#' + orderId;
    document.getElementById('processModal').style.display = 'flex';
}

function openTrackingModal(orderId) {
    document.getElementById('trackingOrderId').textContent = '#' + orderId;
    document.getElementById('trackingModal').style.display = 'flex';
}

function openDetailsModal(orderId) {
    document.getElementById('detailsOrderId').textContent = '#' + orderId;
    document.getElementById('detailsModal').style.display = 'flex';
}

function openPrepareModal(orderId) {
    currentOrderId = orderId;
    document.getElementById('prepareOrderId').textContent = '#' + orderId;
    document.getElementById('prepareModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}



 

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}



document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationBadge = document.querySelector('.badge');
    const notificationItems = document.querySelectorAll('.notification-item');
    const viewAllBtn = document.getElementById('viewAllNotifications');
    const notificationModal = document.getElementById('notificationDetailModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const allNotificationsPopup = document.getElementById('allNotificationsPopup');
    const closeAllBtn = document.querySelector('.close-all-notifications');
    const allNotificationsList = document.getElementById('allNotificationsList');
    
    // Notification data (same as yours)
    const notificationData = {
        1: {
            title: "New Order Received",
            time: "2 minutes ago",
            content: "You have received a new order that requires processing. Please review the order details and prepare the shipment.",
            meta: {
                "Order ID": "#ORD-12345",
                "Amount": "Rs.1,250.00",
                "Items": "2 products",
                "Customer": "Raina khan",
                "Payment Method": "Credit Card",
                "Shipping Address": "123, Wahadat Road, Lahore Pakistan - 560001"
            },
            actions: [
                { text: "Print Invoice", type: "secondary", url: "#" }
            ]
        },
        2: {
            title: "Payment Processed",
            time: "1 hour ago",
            content: "Payment for an order has been successfully processed and will be credited to your account according to the payment schedule.",
            meta: {
                "Order ID": "#ORD-12344",
                "Amount": "Rs.899.00",
                "Payment Date": "Today, 3:45 PM",
                "Transaction ID": "TXN789456123",
                "Settlement Date": "Next business day",
                "Payment Gateway": "NayaPay"
            },
            actions: [
                { text: "Financial Report", type: "secondary", url: "#" }
            ]
        },
        3: {
            title: "Inventory Alert",
            time: "5 hours ago",
            content: "One of your popular products is running low on stock. Consider replenishing inventory to avoid missed sales opportunities.",
            meta: {
                "Product": "Wireless Headphones",
                "SKU": "WH-2023-BLK",
                "Current Stock": "3 units",
                "Reorder Level": "5 units",
                "Last Sold": "Today, 11:30 AM",
                "Daily Average": "8 units sold/day"
            },
            actions: [
                { text: "View Product", type: "secondary", url: "#" }
            ]
        },
        4: {
            title: "Customer Review",
            time: "1 day ago",
            content: "A satisfied customer has left positive feedback for one of your products. Customer reviews help build trust with potential buyers.",
            meta: {
                "Product": "Bluetooth Speaker",
                "Rating": "★★★★★",
                "Customer": "palwasha",
                "Review Date": "Yesterday",
                "Verified Purchase": "Yes",
                "Review Text": "Excellent sound quality and battery life. Highly recommended!"
            },
            actions: [
                { text: "Respond", type: "secondary", url: "#" }
            ]
        }
    };

});

// Help Center JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const helpBtn = document.querySelector('.help-btn');
    const helpDropdown = document.querySelector('.help-dropdown');
    const helpCloseBtn = document.querySelector('.help-dropdown .dropdown-close');
    const helpQuestions = document.querySelectorAll('.help-question');

    // Toggle help dropdown
    helpBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        helpDropdown.classList.toggle('show');
    });

    // Close help dropdown
    helpCloseBtn.addEventListener('click', function() {
        helpDropdown.classList.remove('show');
    });

  

    // Prevent dropdown from closing when clicking inside
    helpDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Toggle help answers
    helpQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('.help-icon');
            
            // Close all other answers first
            document.querySelectorAll('.help-answer.show').forEach(openAnswer => {
                if (openAnswer !== answer) {
                    openAnswer.classList.remove('show');
                    openAnswer.previousElementSibling.querySelector('.help-icon').classList.remove('rotate');
                }
            });
            
            // Toggle current answer
            answer.classList.toggle('show');
            icon.classList.toggle('rotate');
        });
    });

    // Close all answers when closing dropdown
    helpCloseBtn.addEventListener('click', function() {
        document.querySelectorAll('.help-answer.show').forEach(answer => {
            answer.classList.remove('show');
            answer.previousElementSibling.querySelector('.help-icon').classList.remove('rotate');
        });
    });
});

// Logout Functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutConfirm = document.getElementById('logoutConfirm');
    const confirmYes = document.querySelector('.confirm-yes');
    const confirmNo = document.querySelector('.confirm-no');
    
    // Toggle logout confirmation
    logoutBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        logoutConfirm.classList.toggle('show');
    });

    // Yes - Logout
    confirmYes.addEventListener('click', function() {
        // Clear any session data (in a real app)
        localStorage.removeItem('sellerAuthenticated');
        
        // Redirect to login page
        window.location.href = 'sellerlogin.html';
    });
    
    // No - Stay logged in
    confirmNo.addEventListener('click', function() {
        logoutConfirm.classList.remove('show');
    });
});

//**Dashboard handler */

document.addEventListener('DOMContentLoaded', function () {
    const allSections = document.querySelectorAll('.content-section');
    const menuItems = document.querySelectorAll('.menu-item');

    function showSection(sectionId) {
        // Hide all sections
        allSections.forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.style.display = 'block';
        }

        // Show/hide dashboard-only items
        const isDashboard = sectionId === 'dashboard';
        document.getElementById('topSellingProducts').style.display = isDashboard ? 'block' : 'none';
        document.getElementById('quickActions').style.display = isDashboard ? 'block' : 'none';

        // Update active menu
        menuItems.forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // Update URL hash
        location.hash = sectionId;
    }

    // Sidebar click handler
    menuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent page jump
            const target = this.getAttribute('data-section');
            showSection(target);
        });
    });

    // On page load or refresh
    const defaultSection = 'dashboard';
    const hashSection = window.location.hash.replace('#', '') || defaultSection;
    showSection(hashSection);
});




//** TOP SELLPKG PRODUCT**//

function openTopProductsPopup() {
    document.getElementById('topProductsPopup').style.display = 'flex';
}

function closeTopProductsPopup() {
    document.getElementById('topProductsPopup').style.display = 'none';
}

let currentProduct = null;

function openEditPopup(button) {
    currentProduct = button.closest('.product-item');
    
    const name = currentProduct.querySelector('.product-name').innerText;
    const price = currentProduct.querySelector('.price').innerText.replace('Rs.', '');

    document.getElementById('editName').value = name;
    document.getElementById('editPrice').value = price;

    document.getElementById('editPopup').style.display = 'flex';
}

function closeEditPopup() {
    document.getElementById('editPopup').style.display = 'none';
}



//**seller profile**//

   // DOM Elements
   const sellerBtn = document.getElementById('sellerBtn');
   const sellerPopup = document.getElementById('sellerPopup');
   const closePopup = document.getElementById('closePopup');
   const editBtn = document.getElementById('editBtn');
   const cancelBtn = document.getElementById('cancelBtn');
   const saveBtn = document.getElementById('saveBtn');
   const sellerForm = document.getElementById('sellerForm');
   const bankForm = document.getElementById('bankForm');
   const profileTab = document.getElementById('profileTab');
   const bankTab = document.getElementById('bankTab');
   const tabs = document.querySelectorAll('.tab');
   const profilePicture = document.getElementById('profilePicture');
   const changePictureBtn = document.getElementById('changePictureBtn');
   const pictureInput = document.getElementById('pictureInput');
   const sellerProfileImg = document.getElementById('sellerProfileImg');
   const sellerNameDisplay = document.getElementById('sellerNameDisplay');
   
   // Form inputs
   const formInputs = [...sellerForm.querySelectorAll('input, select, textarea'), 
                     ...bankForm.querySelectorAll('input, select')];
   
   // Original values for cancel functionality
   let originalValues = {};
   let currentTab = 'profile';
   
   // Toggle popup
   sellerBtn.addEventListener('click', () => {
       sellerPopup.classList.add('active');
   });
   
   closePopup.addEventListener('click', () => {
       sellerPopup.classList.remove('active');
       // Cancel any ongoing edits
       if (sellerForm.classList.contains('edit-mode') || bankForm.classList.contains('edit-mode')) {
           cancelBtn.click();
       }
   });
   
   // Tab switching
   tabs.forEach(tab => {
       tab.addEventListener('click', () => {
           // Update active tab
           tabs.forEach(t => t.classList.remove('active'));
           tab.classList.add('active');
           currentTab = tab.dataset.tab;
           
           // Show corresponding content
           profileTab.style.display = 'none';
           bankTab.style.display = 'none';
           
           if (currentTab === 'profile') {
               profileTab.style.display = 'block';
               editBtn.textContent = 'Edit Profile';
           } else {
               bankTab.style.display = 'block';
               editBtn.textContent = 'Edit Bank Details';
           }
           
           // Update edit button visibility based on current form state
           if (sellerForm.classList.contains('edit-mode') || bankForm.classList.contains('edit-mode')) {
               editBtn.style.display = 'none';
               cancelBtn.style.display = 'block';
               saveBtn.style.display = 'block';
           }
       });
   });
   
   // Edit functionality
   editBtn.addEventListener('click', () => {
       // Store original values
       const currentForm = currentTab === 'profile' ? sellerForm : bankForm;
       const currentInputs = currentForm.querySelectorAll('input, select, textarea');
       
       currentInputs.forEach(input => {
           originalValues[input.id] = input.value;
       });
       
       // Enable editing
       currentForm.classList.add('edit-mode');
       currentInputs.forEach(input => {
           if (input.id !== 'sellerSince') {
               input.readOnly = false;
               if (input.tagName === 'SELECT') {
                   input.disabled = false;
               }
           }
       });
       
       // Show cancel and save buttons
       editBtn.style.display = 'none';
       cancelBtn.style.display = 'block';
       saveBtn.style.display = 'block';
   });
   
   // Cancel editing
   cancelBtn.addEventListener('click', () => {
       // Restore original values
       for (const id in originalValues) {
           const input = document.getElementById(id);
           if (input) {
               input.value = originalValues[id];
               input.readOnly = true;
               if (input.tagName === 'SELECT') {
                   input.disabled = true;
               }
           }
       }
       
       // Disable editing
       sellerForm.classList.remove('edit-mode');
       bankForm.classList.remove('edit-mode');
       formInputs.forEach(input => {
           input.readOnly = true;
           if (input.tagName === 'SELECT') {
               input.disabled = true;
           }
       });
       
       // Show edit button
       editBtn.style.display = 'block';
       cancelBtn.style.display = 'none';
       saveBtn.style.display = 'none';
   });
   
   // Save changes
   saveBtn.addEventListener('click', () => {
       const currentForm = currentTab === 'profile' ? sellerForm : bankForm;
       const currentInputs = currentForm.querySelectorAll('input, select, textarea');
       
       // Here you would typically send the data to your server
       alert('Changes saved successfully!');
       
       // Update the button info if name changed
       if (currentTab === 'profile') {
       }
       
       // Disable editing
       currentForm.classList.remove('edit-mode');
       currentInputs.forEach(input => {
           input.readOnly = true;
           if (input.tagName === 'SELECT') {
               input.disabled = true;
           }
       });
       
       // Show edit button
       editBtn.style.display = 'block';
       cancelBtn.style.display = 'none';
       saveBtn.style.display = 'none';
   });
   
   // Profile picture change
   changePictureBtn.addEventListener('click', () => {
       pictureInput.click();
   });
   
   pictureInput.addEventListener('change', (e) => {
       const file = e.target.files[0];
       if (file) {
           const reader = new FileReader();
           reader.onload = (event) => {
               profilePicture.src = event.target.result;
               sellerProfileImg.src = event.target.result;
           };
           reader.readAsDataURL(file);
       }
   });
   
   // Close popup when clicking outside
   sellerPopup.addEventListener('click', (e) => {
       if (e.target === sellerPopup) {
           sellerPopup.classList.remove('active');
           // Cancel any ongoing edits
           if (sellerForm.classList.contains('edit-mode') || bankForm.classList.contains('edit-mode')) {
               cancelBtn.click();
           }
       }
   });

/*quick actions*/

   // DOM Elements
   const processOrdersBtn = document.getElementById('processOrdersBtn');
   const viewReportsBtn = document.getElementById('viewReportsBtn');
   
   // Modals
   const addProductModal = document.getElementById('addProductModal');
   const processOrdersModal = document.getElementById('processOrdersModal');
   const viewReportsModal = document.getElementById('viewReportsModal');
   
   // Close buttons
   const closeAddProductModal = document.getElementById('closeAddProductModal');
   const closeProcessOrdersModal = document.getElementById('closeProcessOrdersModal');
   const closeViewReportsModal = document.getElementById('closeViewReportsModal');
   
   // Cancel buttons
   const cancelAddProduct = document.getElementById('cancelAddProduct');
   const cancelProcessOrders = document.getElementById('cancelProcessOrders');
   const closeReports = document.getElementById('closeReports');
   
   // Submit buttons
   const submitAddProduct = document.getElementById('submitAddProduct');
   const confirmProcessOrders = document.getElementById('confirmProcessOrders');
   
   // Image upload elements
   const uploadBtn = document.getElementById('uploadBtn');
   const dropArea = document.getElementById('dropArea');
   const imagePreview = document.getElementById('imagePreview');
   let uploadedImages = [];
   

   

   
   viewReportsBtn.addEventListener('click', () => {
       viewReportsModal.classList.add('active');
   });
   
   // Close modals
   function closeAllModals() {
       viewReportsModal.classList.remove('active');
   }
   
   closeViewReportsModal.addEventListener('click', closeAllModals);
   
   closeReports.addEventListener('click', closeAllModals);
   
   // Close when clicking outside modal content
   document.addEventListener('click', (e) => {
       if (e.target.classList.contains('modal-overlay')) {
           closeAllModals();
       }
   });
   

   
   function preventDefaults(e) {
       e.preventDefault();
       e.stopPropagation();
   }


   
    //**Settings handler **/


        // Help dropdown functionality
        const helpBtn = document.querySelector('.help-btn');
        const helpDropdown = document.querySelector('.help-dropdown');
        const helpItems = document.querySelectorAll('.help-item');
        const dropdownClose = document.querySelector('.dropdown-close');

        // Toggle notification dropdown
        

        // Toggle help dropdown
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpDropdown.classList.toggle('active');
            
            // Hide notification dropdown if open
            notificationDropdown.classList.remove('active');
        });

        // Close dropdown button
        dropdownClose.addEventListener('click', (e) => {
            e.stopPropagation();
            helpDropdown.classList.remove('active');
        });

        // Toggle help items
        helpItems.forEach(item => {
            const question = item.querySelector('.help-question');
            
            question.addEventListener('click', () => {
                item.classList.toggle('active');
                
                // Close other items when opening one
                helpItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
           
            helpDropdown.classList.remove('active');
        });

        helpDropdown.addEventListener('click', (e) => e.stopPropagation());

       

        // Mark individual notifications as read when clicked
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                if (this.classList.contains('unread')) {
                    this.classList.remove('unread');
                    this.style.backgroundColor = '';
                    updateBadgeCount();
                }
            });
        });

        function closeModal() {
            document.getElementById('settingsModal').style.display = 'none';
        }

        // Close modal when clicking outside of it
        window.onclick = function(event) {
            const modal = document.getElementById('settingsModal');
            if (event.target == modal) {
                closeModal();
            }
        }

        // Add some interactive effects to cards
        document.querySelectorAll('.settings-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.querySelector('h3 i').style.transform = 'rotate(10deg)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.querySelector('h3 i').style.transform = 'rotate(0)';
            });
        });

        // Form submission handling (example)
        document.addEventListener('DOMContentLoaded', function() {
            // This would be expanded with actual form handling in a real application
            const forms = ['storeForm', 'shippingForm', 'securityForm', 'notificationForm'];
            forms.forEach(formId => {
                const form = document.getElementById(formId);
                if (form) {
                    form.addEventListener('submit', function(e) {
                        e.preventDefault();
                        alert('Settings saved successfully!');
                        closeModal();
                    });
                }
            });
        });



document.addEventListener('DOMContentLoaded', async () => {
    const backendUrl = 'https://localhost:7273'; // Replace with your actual API base URL
    const token = localStorage.getItem('sellerToken');
    if (!token) {
        showToast('Seller not logged in', 'error');
        return;
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Invalid token format', e);
            return null;
        }
    }

    const payload = parseJwt(token);
    const sellerId = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    if (!sellerId) {
        showToast('Invalid token. Please log in again.', 'error');
        return;
    }

    try {
        // Fetch Insights
        const insightsRes = await fetch(`${backendUrl}/api/Customers/Insights/${sellerId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const insights = await insightsRes.json();
        console.log('Insights Response:', insights);

        document.querySelector('#total-customers p').textContent =
    insights.TotalCustomers != null ? insights.TotalCustomers.toLocaleString() : '0';

document.querySelector('#repeat-customers p').textContent =
    insights.RepeatCustomers != null && insights.RepeatCustomerPercentage != null
        ? `${insights.RepeatCustomers} (${insights.RepeatCustomerPercentage}%)`
        : '0 (0%)';

document.querySelector('#avg-rating p').textContent =
    insights.AvgRating != null ? `${insights.AvgRating}/5` : '0/5';


        // Fetch Order History

    const historyRes = await fetch(`${backendUrl}/api/Customers/WithOrders/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const customers = await historyRes.json();

    if (!Array.isArray(customers) || customers.length === 0) {
        document.getElementById('customer-table-section').innerHTML = `<p>No customer data available.</p>`;
        return;
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Customer Name</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map((c, index) => {
                    const customerName = c.CustomerName ?? 'N/A';
                    const totalOrders = c.TotalOrders ?? 0;
                    const totalSpent = c.TotalSpent != null ? `PKR ${c.TotalSpent.toLocaleString()}` : 'PKR 0';

                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${customerName}</td>
                            <td>${totalOrders}</td>
                            <td>${totalSpent}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('customer-table-section').innerHTML = tableHTML;

} catch (error) {
    console.error('Error loading customer insights:', error);
    showToast('Error loading insights. Try again later.', 'error');
}

});
