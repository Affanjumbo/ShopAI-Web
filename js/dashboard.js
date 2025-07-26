// Add this script to your main JavaScript file or in a script tag
document.addEventListener('DOMContentLoaded', function() {
    // Fetch categories from API
    fetch('https://localhost:7273/api/Categories/GetAllCategories')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const dropdownMenu = document.getElementById('categories-dropdown');
            
            // Clear loading state
            dropdownMenu.innerHTML = '';
            
            // Filter only active categories
            const activeCategories = data.Data.filter(category => category.IsActive);
            
            if (activeCategories.length === 0) {
                dropdownMenu.innerHTML = `
                    <li class="no-categories">
                        <span>No categories available</span>
                    </li>
                `;
                return;
            }
            
            // Add each category to the dropdown
            activeCategories.forEach(category => {
                const categoryItem = document.createElement('li');
                categoryItem.innerHTML = `
                    <a href="category.html?cat=${encodeURIComponent(category.Name)}&id=${category.Id}">
                        ${category.Name}
                    </a>
                `;
                dropdownMenu.appendChild(categoryItem);
            });
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
            document.getElementById('categories-dropdown').innerHTML = `
                <li class="error-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Failed to load categories</span>
                </li>
            `;
        });
    
    // Dropdown toggle functionality
    const dropdownToggle = document.querySelector('.dropdown > a');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdownMenu.style.display = 'none';
        }
    });
});