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

    // Common function to get proper image URL (consistent with cart.js)
    function getProductImageUrl(imagePath) {
        if (!imagePath) return `${backendUrl}${fallbackImage}`;
        
        return imagePath.startsWith('http') ? imagePath :
               imagePath.startsWith('/') ? `${backendUrl}${imagePath}` :
               `${backendUrl}/images/products/${imagePath}`;
    }

    // DOM elements
    const budgetInput = document.getElementById('budget');
    const setBudgetBtn = document.getElementById('setBudget');
    const budgetError = document.getElementById('budgetError');
    const recommendationsSection = document.getElementById('recommendations');
    const itemsList = document.getElementById('itemsList');
    const summaryCard = document.getElementById('summaryCard');
    const originalBudgetSpan = document.getElementById('originalBudget');
    const recommendedTotalSpan = document.getElementById('recommendedTotal');
    const finalTotalSpan = document.getElementById('finalTotal');
    const remainingBudgetSpan = document.getElementById('remainingBudget');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    let userBudget = 0;
    let recommendedItems = [];
    let selectedItems = [];
    
    // Set budget button click handler
    setBudgetBtn.addEventListener('click', function() {
        const budget = parseInt(budgetInput.value);
        
        if (isNaN(budget)) {
            budgetError.textContent = "Please enter a valid budget amount";
            return;
        }
        
        if (budget < 2000) {
            budgetError.textContent = "Please enter a budget of at least Rs.2000";
            return;
        }
        
        budgetError.textContent = "";
        userBudget = budget;
        originalBudgetSpan.textContent = budget.toLocaleString();
        
        // Generate recommendations from API
        generateRecommendationsFromAPI(budget, customerId);
    });
    
    // Generate grocery recommendations from API
    async function generateRecommendationsFromAPI(budget, customerId) {
        try {
            const response = await fetch(`https://localhost:7273/ai/AIFeatures/expense-manager`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    CustomerId: parseInt(customerId),
                    Budget: budget
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.Message && data.BudgetPlan) {
                // Process the API response
                processApiResponse(data);
                recommendationsSection.classList.remove('hidden');
            } else {
                throw new Error("Invalid response format from API");
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            budgetError.textContent = "Failed to generate recommendations. Please try again.";
            // Fallback to local recommendations
            generateLocalRecommendations(budget);
            recommendationsSection.classList.remove('hidden');
        }
    }
    
    // Process API response
    function processApiResponse(apiData) {
        // Clear previous items
        itemsList.innerHTML = "";
        recommendedItems = [];
        selectedItems = [];
        
        // Flatten all items from all categories
        apiData.BudgetPlan.forEach(category => {
            category.Items.forEach(item => {
                recommendedItems.push({
                    id: item.ProductId,
                    name: item.ProductName,
                    price: item.Price,
                    category: category.SubCategory,
                    image: getProductImageUrl(item.ProductImage) // Use consistent image handling
                });
            });
        });
        
        selectedItems = [...recommendedItems];
        displayItems(selectedItems);
        updateSummary();
    }
    
    // Fallback local recommendations if API fails
    function generateLocalRecommendations(budget) {
        // Clear previous items
        itemsList.innerHTML = "";
        recommendedItems = [];
        selectedItems = [];
        
        // Sample grocery items with prices (fallback data)
        const groceryItems = [
            { id: 1, name: "Rice (5kg)", price: 250, category: "staples", image: "/images/rice.jpg" },
            { id: 2, name: "Wheat Flour (5kg)", price: 200, category: "staples", image: "/images/flour.jpg" },
            { id: 3, name: "Sugar (2kg)", price: 80, category: "staples", image: "/images/sugar.jpg" },
            { id: 4, name: "Cooking Oil (1L)", price: 180, category: "staples", image: "/images/oil.jpg" },
            { id: 5, name: "Milk (1L)", price: 60, category: "dairy", image: "/images/milk.jpg" },
            { id: 6, name: "Eggs (Dozen)", price: 80, category: "dairy", image: "/images/eggs.jpg" },
            { id: 7, name: "Paneer (200g)", price: 100, category: "dairy", image: "/images/paneer.jpg" },
            { id: 8, name: "Potatoes (2kg)", price: 50, category: "vegetables", image: "/images/potatoes.jpg" },
            { id: 9, name: "Tomatoes (1kg)", price: 40, category: "vegetables", image: "/images/tomatoes.jpg" },
            { id: 10, name: "Onions (2kg)", price: 60, category: "vegetables", image: "/images/onions.jpg" }
        ];
        
        // Calculate how much to allocate to each category
        const categoryAllocation = {
            staples: 0.4,
            dairy: 0.3,
            vegetables: 0.3
        };
        
        // Select items for each category
        Object.keys(categoryAllocation).forEach(category => {
            const categoryBudget = budget * categoryAllocation[category];
            const categoryItems = groceryItems.filter(item => item.category === category);
            
            // Sort by price (lower first)
            categoryItems.sort((a, b) => a.price - b.price);
            
            let spent = 0;
            const selectedCategoryItems = [];
            
            for (const item of categoryItems) {
                if (spent + item.price <= categoryBudget) {
                    selectedCategoryItems.push({
                        ...item,
                        image: getProductImageUrl(item.image) // Use consistent image handling
                    });
                    spent += item.price;
                }
            }
            
            recommendedItems.push(...selectedCategoryItems);
        });
        
        selectedItems = [...recommendedItems];
        displayItems(selectedItems);
        updateSummary();
    }
    
    // Display items in the UI with consistent image handling
    function displayItems(items) {
        itemsList.innerHTML = "";

        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            itemCard.innerHTML = `
                <div class="item-image-container">
                    <img class="lazy" 
                         src="${placeholderImage}" 
                         data-src="${item.image}"
                         alt="${item.name}"
                         loading="lazy"
                         onerror="this.src='${fallbackImage}'; this.onerror=null">
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">Rs. ${item.price}</p>
                    <p>${item.category}</p>
                </div>
                <button class="remove-btn" data-id="${item.id}" title="Remove item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
            `;
            itemsList.appendChild(itemCard);
            
            // Initialize lazy loading for the image
            initLazyLoading(itemCard.querySelector('img.lazy'));
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.item-card button').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = parseInt(this.getAttribute('data-id'));
                removeItem(itemId);
            });
        });
    }
    
    // Lazy loading function for images (consistent with cart.js)
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
    
    // Remove an item
    function removeItem(itemId) {
        selectedItems = selectedItems.filter(item => item.id !== itemId);
        displayItems(selectedItems);
        updateSummary();
    }
    
    // Update the summary card
    function updateSummary() {
        const recommendedTotal = recommendedItems.reduce((sum, item) => sum + item.price, 0);
        const finalTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
        const remaining = userBudget - finalTotal;
        
        recommendedTotalSpan.textContent = recommendedTotal.toLocaleString();
        finalTotalSpan.textContent = finalTotal.toLocaleString();
        remainingBudgetSpan.textContent = remaining.toLocaleString();
        
        // Highlight if remaining is negative
        if (remaining < 0) {
            remainingBudgetSpan.innerHTML = `<span style="color:red">${remaining.toLocaleString()}</span>`;
        } else {
            remainingBudgetSpan.innerHTML = `<span style="color:green">${remaining.toLocaleString()}</span>`;
        }
        
        // Show/hide summary and checkout button
        if (selectedItems.length > 0) {
            summaryCard.classList.remove('hidden');
            checkoutBtn.classList.remove('hidden');
        } else {
            summaryCard.classList.add('hidden');
            checkoutBtn.classList.add('hidden');
        }
    }
    
    // Checkout button handler
    checkoutBtn.addEventListener('click', async function () {
    const finalTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);

    if (finalTotal > userBudget) {
        alert("Warning: Your selected items exceed your budget!");
        return;
    }

    try {
        for (const item of selectedItems) {
            const res = await fetch(`${API_BASE_URL}/Carts/AddToCart`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    CustomerId: parseInt(customerId),
                    ProductId: item.id,
                    Quantity: 1
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to add "${item.name}" to cart.\nServer says: ${errorText}`);
            }
        }

        alert("All recommended items were successfully added to your cart.");
        window.location.href = 'my-cart.html'; // <-- changed here
    } catch (err) {
        console.error("Checkout error:", err);
        alert("Some items could not be added to your cart.\n" + err.message);
    }
});


});