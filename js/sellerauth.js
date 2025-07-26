// Global registration data storage
let registrationData = {
    sellerId: null,
    shopId: null,
    tempPersonalData: {}
};

function isValidName(name) {
    const trimmed = name.trim();
    return trimmed.length >= 2 && /^([A-Z][a-z]*)+( [A-Z][a-z]*)*$/.test(trimmed);
}

function formatName(value) {
    return value
        .trim()
        .split(/\s+/) // Split by any whitespace (even multiple spaces)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidAge(dob) {
    const birthDate = new Date(dob);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return age >= 13;
}

function isValidPakistaniPhone(phone) {
    return /^03\d{9}$/.test(phone);
}

// List of major Pakistani cities (can be expanded)
const pakistaniCities = [
  'Islamabad', 'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi',
  'Multan', 'Hyderabad', 'Peshawar', 'Quetta', 'Gujranwala',
  'Sialkot', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Sheikhupura', 'Mirpur Khas', 'Okara', 'Rahim Yar Khan',
  'Layyah', 'Tando Adam', 'Jamsher', 'Gujjar Khan', 'Rawat', 'Rawla Kot',
  'Mardan', 'Abbottabad', 'Kasur', 'Dera Ghazi Khan',
  'Muzaffargarh', 'Jhang', 'Gojra', 'Chiniot', 'Vehari',
  'Mingora', 'Tando Adam', 'Khairpur', 'Kohat', 'Hafizabad',
  'Dera Ismail Khan', 'Nawabshah', 'Gilgit', 'Skardu', 'Gwadar',
  'Chakwal', 'Mansehra', 'Bannu', 'Kamoke', 'Turbat', 'Attock'
];

function isValidPakistaniCity(city) {
    return pakistaniCities.includes(city);
}

// Toast notification function
function showToast(message, fieldId = null) {
    // Remove any existing toast for this field
    const existingToast = document.querySelector(`.field-error-notification[data-field="${fieldId}"]`);
    if (existingToast) existingToast.remove();

    // If message is empty, just clear any existing error
    if (!message) return;

    const toast = document.createElement('div');
    toast.className = 'field-error-notification';
    toast.setAttribute('data-field', fieldId);
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

    // Style the toast
    toast.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: #FFF2F0;
        color: #FF4D4F;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #FFCCC7;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 100;
        margin-top: 5px;
        width: 100%;
        opacity: 1;
        transition: opacity 0.3s ease;
    `;

    // Position relative to the field
    if (fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.parentNode.appendChild(toast);
        }
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '100';
        setTimeout(() => toast.remove(), 300);
    }, 500);
}



// 1. PASSWORD STRENGTH METER ============================================
function setupPasswordStrengthMeter() {
    const passwordInput = document.getElementById('seller-password');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', function(e) {
        const password = e.target.value;
        const strengthBars = document.querySelectorAll('.strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        // Reset all bars
        strengthBars.forEach(bar => {
            bar.style.width = '0%';
            bar.style.backgroundColor = '#e0e0e0';
        });
        
        if (!password) {
            strengthText.textContent = 'Weak';
            strengthText.style.color = '#ff5252';
            return;
        }

        // Check requirements
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        // Update requirement indicators
        document.getElementById('req-length').querySelector('i').style.color = hasLength ? '#4caf50' : '#ff5252';
        document.getElementById('req-uppercase').querySelector('i').style.color = hasUpper ? '#4caf50' : '#ff5252';
        document.getElementById('req-number').querySelector('i').style.color = hasNumber ? '#4caf50' : '#ff5252';
        document.getElementById('req-special').querySelector('i').style.color = hasSpecial ? '#4caf50' : '#ff5252';

        // Calculate strength (0-4)
        let strength = 0;
        if (hasLength) strength++;
        if (hasUpper) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;

        // Update visual indicators
        if (strength <= 1) {
            strengthBars[0].style.width = '33%';
            strengthBars[0].style.backgroundColor = '#ff5252';
            strengthText.textContent = 'Weak';
            strengthText.style.color = '#ff5252';
        } else if (strength <= 3) {
            strengthBars[0].style.width = '66%';
            strengthBars[1].style.width = '66%';
            strengthBars[0].style.backgroundColor = '#ffb74d';
            strengthBars[1].style.backgroundColor = '#ffb74d';
            strengthText.textContent = 'Medium';
            strengthText.style.color = '#ffb74d';
        } else {
            strengthBars.forEach(bar => {
                bar.style.width = '100%';
                bar.style.backgroundColor = '#4caf50';
            });
            strengthText.textContent = 'Strong';
            strengthText.style.color = '#4caf50';
        }
    });
}

// 2. TAB NAVIGATION =====================================================
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// 3. FORM VALIDATION ====================================================
function validateCurrentTab(tab) {
    const inputs = tab.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    // Check required fields
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    if (!isValid) {
        showAlert('Please fill all required fields', 'error');
        return false;
    }

    // Special validation for password tab
    if (tab.id === 'security-tab') {
        const password = document.getElementById('seller-password').value;
        const confirmPassword = document.getElementById('seller-confirm-password').value;
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'error');
            document.getElementById('seller-confirm-password').classList.add('error');
            return false;
        }

        // Check password meets all requirements
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        
        if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
            showAlert('Password must meet all requirements', 'error');
            return false;
        }
    }

    return true;
}

// 4. API INTEGRATION ====================================================
async function registerSeller(sellerData) {
    const response = await fetch('https://localhost:7273/api/Seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellerData)
    });

    const result = await response.json();
    // In your API error handling:
    
    if (!response.ok) throw new Error(result.message || 'Registration failed');
    
    
    return {
        sellerId: result.id || result.SellerId// Only return what we actually need
    };
}

async function createShop(shopData) {
    const response = await fetch('https://localhost:7273/api/ShopDetails/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData)
    });

    const result = await response.json();
    if (response.status === 409) {
    showToast('Shop name is already taken', 'store-name');  // Added field ID
    throw new Error('Shop name already exists');
}
    if (!response.ok) throw new Error(result.message || 'Shop creation failed');
    
    
    return result;
}

async function addBankDetails(bankData, token) {
    const response = await fetch('https://localhost:7273/api/BankDetails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bankData)
    });

    if (response.status === 409 || response.status === 400) {
    const errorMessage = result.message.includes('IBAN') 
        ? 'IBAN already registered' 
        : 'Swift code already registered';
    const errorField = result.message.includes('IBAN') ? 'iban' : 'swift-bic';
    showToast(errorMessage, errorField);
    throw new Error('Bank details already exist');
}

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bank details failed');
    }

    return await response.json();
}

// 5. MAIN REGISTRATION FLOW =============================================
function setupSellerRegistration() {
    const signupForm = document.getElementById('seller-signup');
    if (!signupForm) return;

    // Initialize password strength meter
    setupPasswordStrengthMeter();


    // First Name validation
// First Name validation
document.getElementById('first-name').addEventListener('blur', function () {
    let value = this.value;
    if (value.trim() === '') return;

    const formatted = formatName(value);
    this.value = formatted;

    const isValid = isValidName(formatted);
    showToast(isValid ? '' : 'First Name must and contain only letters and atleast 2', 'first-name');
    this.classList.toggle('error', !isValid);
});

document.getElementById('last-name').addEventListener('blur', function () {
    let value = this.value;
    if (value.trim() === '') return;

    const formatted = formatName(value);
    this.value = formatted;

    const isValid = isValidName(formatted);
    showToast(isValid ? '' : 'Last Name must and contain only letters and atleast 2', 'last-name');
    this.classList.toggle('error', !isValid);
});

document.getElementById('seller-email').addEventListener('blur', function () {
    if (this.value.trim() === '') return; // Don't validate empty fields here
    const isValid = isValidEmail(this.value);
    showToast(isValid ? '' : 'Enter a valid email (e.g., user@example.com).', 'seller-email');
    this.classList.toggle('error', !isValid);
});


// DOB validation
document.getElementById('seller-dob').addEventListener('change', function() {
    if (this.value.trim() === '') return;
    const isValid = isValidAge(this.value);
    showToast(isValid ? '' : 'You must be at least 13 years old', 'seller-dob');
    this.classList.toggle('error', !isValid);
});

// Phone validation
document.getElementById('seller-phone').addEventListener('blur', function() {
    if (this.value.trim() === '') return;
    const isValid = isValidPakistaniPhone(this.value);
    showToast(isValid ? '' : 'Phone must be 11 digits starting with 03', 'seller-phone');
    this.classList.toggle('error', !isValid);
});

// City validation
document.getElementById('seller-city').addEventListener('blur', function() {
    if (this.value.trim() === '') return;
    const isValid = isValidPakistaniCity(this.value);
    showToast(isValid ? '' : 'Please enter a valid Pakistani city', 'seller-city');
    this.classList.toggle('error', !isValid);
});
    // Store personal data temporarily when leaving personal tab
document.querySelector('#personal-tab .next-tab').addEventListener('click', function() {
        registrationData.tempPersonalData = {
            FirstName: document.getElementById('first-name').value,
            LastName: document.getElementById('last-name').value,
            Email: document.getElementById('seller-email').value,
            PhoneNumber: document.getElementById('seller-phone').value,
            DateOfBirth: document.getElementById('seller-dob').value,
            City: document.getElementById('seller-city').value
        };
    });

    // Next button handlers
    document.querySelectorAll('.next-tab').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const currentTab = document.querySelector('.tab-content.active');
            const nextTab = this.dataset.next;
            
            // Validate current tab before proceeding
            if (!validateCurrentTab(currentTab)) return;
            
            // Create account when moving from security tab
            // In the store-tab section


            
else if (currentTab.id === 'store-tab') {
    try {
        // First get the seller registration response again to ensure we have the ID
        const sellerResponse = await fetch('https://localhost:7273/api/Seller/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...registrationData.tempPersonalData,
                Password: document.getElementById('seller-password').value
            })
        });

        function isValidShopName(name) {
    const trimmed = name.trim();
    return /^([A-Za-z0-9]+ ?)+$/.test(trimmed); // Only letters, numbers, spaces
}

function formatShopName(name) {
    return name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

document.getElementById('store-name').addEventListener('blur', function () {
    let value = this.value;
    if (value.trim() === '') return;

    const formatted = formatShopName(value);
    this.value = formatted;

    const isValid = isValidShopName(formatted);
    showToast(
        isValid ? '' : 'Shop name can only contain letters, numbers, and spaces (e.g., "Mega Mart 360")',
        'store-name'
    );
    this.classList.toggle('error', !isValid);
});

        
        const sellerResult = await sellerResponse.json();

        const errors = sellerResult.Errors || [];

        if (sellerResponse.status === 400 && errors.some(e => e.includes('Email')) && errors.some(e => e.includes('Phone'))) {
            throw new Error('ERROR: This Email and Phone Number are already registered');
        } else if (sellerResponse.status === 400 && errors.some(e => e.includes('Email'))) {
            throw new Error('EMAIL_EXISTS: This email is already registered');
        } else if (sellerResponse.status === 400 && errors.some(e => e.includes('Phone'))) {
            throw new Error('PHONE_NUMBER_EXISTS: This Phone Number is already registered');
        }
        if (!sellerResponse.ok) throw new Error(sellerResult.message || 'Seller registration failed');

        // Now create shop with proper field mapping
        const shopResponse = await fetch('https://localhost:7273/api/ShopDetails/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                SellerId: sellerResult.Data.Id, // Map seller's "Id" to shop's "SellerId"
                ShopName: document.getElementById('store-name').value,
                WebsiteUrl: document.getElementById('store-website').value || null,
                IsPrimary: true
            })
        });

        const shopResult = await shopResponse.json();
        console.log("Shop creation response:", shopResult); // Debug log
        
        if (!shopResponse.ok) {
            throw new Error(shopResult.message || 'Shop creation failed');
        }

        // Store shop ID for bank details if needed
        registrationData.shopId = shopResult.Data.Id;
        switchTab(nextTab);
        
    } catch (error) {
        console.error("Error in store tab:", error);
        showAlert(error.message, 'error');
        return;
    }
} else {
                // For other tabs, just switch
                switchTab(nextTab);
            }
        });
    });
    // Previous button handlers
    document.querySelectorAll('.prev-tab').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab(this.dataset.prev);
        });
    });

    


    // Final form submission (bank details)
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate bank tab
        if (!validateCurrentTab(document.getElementById('bank-tab'))) return;



        function isValidAccountHolderName(name) {
            const trimmed = name.trim();
    // Check if total length is at least 4 and matches the pattern
            return trimmed.length >= 4 && /^([A-Z][a-z]*)+( [A-Z][a-z]*)*$/.test(trimmed);
        }

        function formatAccountHolderName(value) {
            return value
                .trim()
                .split(/\s+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        document.getElementById('account-holder-name').addEventListener('blur', function () {
            let value = this.value;
            if (value.trim() === '') return;

            const formatted = formatAccountHolderName(value);
            this.value = formatted;

            const isValid = isValidAccountHolderName(formatted);
            showToast(
                isValid ? '' : 'Account holder name must contain only letters atleast 4',
                'account-holder-name'
            );
            this.classList.toggle('error', !isValid);
        });

        function isValidBankName(name) {
    
        const trimmed = name.trim();
        return trimmed.length >= 3 && /^([A-Z]+[a-z]*)( [A-Z]+[a-z]*)*$/.test(trimmed);
        }

function formatBankName(value) {
    return value
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

document.getElementById('bank-name').addEventListener('blur', function () {
    let value = this.value;
    if (value.trim() === '') return;

    const formatted = formatBankName(value);
    this.value = formatted;

    const isValid = isValidBankName(formatted);
    showToast(
        isValid ? '' : 'Bank name must contain only letters atleast 3  Example: {HBL,MCB,Bank Alfalah}',
        'bank-name'
    );
    this.classList.toggle('error', !isValid);
});



function isValidIBAN(iban) {
    const trimmed = iban.trim().toUpperCase();
    // Match either with or without 'PK' at the start
    return /^(PK)?\d{2}[A-Z0-9]{16,22}$/.test(trimmed);
}

document.getElementById('iban').addEventListener('blur', function () {
    let value = this.value.trim().toUpperCase();
    this.value = value;

    if (value === '') return;

    const isValid = isValidIBAN(value);
    showToast(
        isValid ? '' : 'IBAN must contain 2 starting digits followed by 16 to 22 letters/numbers (e.g., "36SCBL0000001123456702" or "PK36SCBL0000001123456702")',
        'iban'
    );
    this.classList.toggle('error', !isValid);
});


        
        
        // Check terms checkbox
        if (!document.getElementById('terms-checkbox').checked) {
            showAlert('You must agree to the terms and conditions', 'error');
            return;
        }

        try {
            const bankData = {
                ShopId: registrationData.shopId,
                AccountHolder: document.getElementById('account-holder-name').value,
                BankName: document.getElementById('bank-name').value,
                IBAN: document.getElementById('iban').value,
                SwiftCode: document.getElementById('swift-bic').value || null,
                StatementUrl: "uploaded_statement_url",
                IsPrimary: true
            };
            
            console.log("Submitting bank details:", bankData);

        const response = await fetch('https://localhost:7273/api/BankDetails', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${registrationData.token}` // Add token if required
            },
            body: JSON.stringify(bankData)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Bank details submission failed');
        }
        
        showAlert('Registration successful! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'sellerlogin.html', 1500);
        
    } catch (error) {
        console.error("Bank submission error:", error);
        showAlert(error.message, 'error');
    }
    });
}

// 6. OTHER PAGES ========================================================
async function loginSeller(credentials) {
    const response = await fetch('https://localhost:7273/api/Seller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });

    const result = await response.json();

    if (!response.ok || !result.Success) {
        throw new Error(result.Errors?.[0] || result.Message || 'Login failed');
    }

    return result.Data; // Return only the relevant seller data
}
function setupSellerLogin() {
    const loginForm = document.getElementById('seller-login');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('seller-email').value.trim();
        const password = document.getElementById('seller-password').value;

        if (!email || !password) {
            showAlert('Please fill in all fields', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert('Please enter a valid email address', 'error');
            return;
        }

        try {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            // Call login API
            const response = await fetch('https://localhost:7273/api/Seller/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.Success && data.Data && data.Data.Token) {
                // Store relevant seller info for future use
                localStorage.setItem('sellerToken', data.Data.Token);
                localStorage.setItem('sellerId', data.Data.SellerId);
                localStorage.setItem('sellerName', data.Data.SellerName);

                showAlert('Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'sellerhomepage.html';
                }, 1500);
            } else {
                throw new Error(data.Data?.Message || 'Login failed. Either Email does not exist or Password is Wrong!');
            }

        } catch (error) {
            console.error('Login error:', error);
            showAlert(error.message || 'Login failed. Please check your credentials.', 'error');

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    const togglePassword = loginForm.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    }

    const forgotPasswordLink = loginForm.querySelector('.forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            const email = document.getElementById('seller-email').value.trim();

            if (email) {
                window.location.href = `sellerforgotp.html?email=${encodeURIComponent(email)}`;
            } else {
                window.location.href = 'sellerforgotp.html';
            }
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {


    if (document.getElementById('seller-signup')) {
        setupSellerRegistration();
    }
    // Check if we're on the login page
    if (document.getElementById('seller-login')) {
        setupSellerLogin();
        
        // If there's an email parameter in the URL (e.g., from password reset), pre-fill it
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        if (email) {
            const emailInput = document.getElementById('seller-email');
            if (emailInput) {
                emailInput.value = decodeURIComponent(email);
            }
        }
    }
});

// Reuse the existing showAlert function from your code
function showAlert(message, type) {
    const existingAlert = document.querySelector('.auth-alert');
    if (existingAlert) existingAlert.remove();

    const alertDiv = document.createElement('div');
    alertDiv.className = `auth-alert auth-alert-${type}`;
    alertDiv.textContent = message;

    const form = document.querySelector('.auth-form') || document.querySelector('.auth-container');
    form.prepend(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// ===============================
// 📧 SELLER FORGOT PASSWORD
// ===============================
function setupForgotPassword() {
    const forgetForm = document.getElementById('seller-forgot-password');
    if (!forgetForm) return;

    forgetForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('reset-email').value.trim();
        
        // Validation (using seller's existing pattern)
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const submitBtn = forgetForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';

        // Call seller's forgot password endpoint
        fetch('https://localhost:7273/api/SellerForgetPassword/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message); });
            }
            return response.text();
        })
        .then(message => {
            showAlert(message, 'success');
            setTimeout(() => {
                window.location.href = `sellerresetp.html?email=${encodeURIComponent(email)}`;
            }, 1500);
        })
        .catch(error => {
            console.error('Send OTP error:', error);
            showAlert(error.message || 'Failed to send OTP. Please try again.', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send OTP';
        });
    });
}

// ===============================
// 🔁 SELLER RESET PASSWORD FLOW
// ===============================
function setupResetPassword() {
    const resetForm = document.getElementById('seller-reset-password');
    if (!resetForm) return;

    const otpInput = document.getElementById('otp-code');
    const emailInput = document.getElementById('email');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const stepInfo = document.getElementById('step-info');
    const stepOtp = document.getElementById('step-otp');
    const stepPasswords = document.getElementById('step-passwords');
    const actionBtn = document.getElementById('actionBtn');
    
    let currentStep = 1;

    // Get the email from the URL (consistent with seller's pattern)
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        emailInput.value = decodeURIComponent(email);
        emailInput.readOnly = true;
        stepOtp.style.display = 'block';
        stepPasswords.style.display = 'none';
        stepInfo.textContent = 'Enter the OTP sent to your email';
        actionBtn.textContent = 'Verify OTP';
        currentStep = 1;
    }

    // Password strength validation (using seller's existing pattern)
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function(e) {
            const password = e.target.value;
            const strengthBars = document.querySelectorAll('.strength-bar');
            const strengthText = document.getElementById('strength-text');
            
            // Reset all bars
            strengthBars.forEach(bar => {
                bar.style.width = '0%';
                bar.style.backgroundColor = '#e0e0e0';
            });
            
            if (!password) {
                strengthText.textContent = 'Weak';
                strengthText.style.color = '#ff5252';
                return;
            }

            // Check requirements (same as seller's registration)
            const hasLength = password.length >= 8;
            const hasUpper = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);

            // Calculate strength (0-4)
            let strength = 0;
            if (hasLength) strength++;
            if (hasUpper) strength++;
            if (hasNumber) strength++;
            if (hasSpecial) strength++;

            // Update visual indicators
            if (strength <= 1) {
                strengthBars[0].style.width = '33%';
                strengthBars[0].style.backgroundColor = '#ff5252';
                strengthText.textContent = 'Weak';
                strengthText.style.color = '#ff5252';
            } else if (strength <= 3) {
                strengthBars[0].style.width = '66%';
                strengthBars[1].style.width = '66%';
                strengthBars[0].style.backgroundColor = '#ffb74d';
                strengthBars[1].style.backgroundColor = '#ffb74d';
                strengthText.textContent = 'Medium';
                strengthText.style.color = '#ffb74d';
            } else {
                strengthBars.forEach(bar => {
                    bar.style.width = '100%';
                    bar.style.backgroundColor = '#4caf50';
                });
                strengthText.textContent = 'Strong';
                strengthText.style.color = '#4caf50';
            }
        });
    }

    // Form submission handler
    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = emailInput.value;
        let isValid = true;

        // Step 1: OTP Verification
        if (currentStep === 1) {
            const otp = otpInput.value.trim();
            console.log('OTP entered:', otp);
            if (!otp || otp.length !== 6) {
                showAlert('Please enter a valid 6-digit OTP', 'error');
                isValid = false;
            }

            if (isValid) {
                // Show loading state
                actionBtn.disabled = true;
                actionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
                console.log('Sending OTP verification request...');

                // Verify OTP via seller's endpoint
                fetch('https://localhost:7273/api/SellerForgetPassword/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Email: email, OtpCode: otp })
                })
                .then(response => {
                    console.log('Response status:', response.status);
                    if (!response.ok) {
                        return response.json().then(err => { console.error('API Error:', err); // Debug log
                        throw new Error(err.message || 'OTP verification failed');
                        });
                        
                    }
                    return response.text();
                })
                .then(message => {
                    console.log('Verification response:', message);
                    if (message.includes('OTP verified') || message.toLowerCase().includes('success') ) {
                        // OTP is verified, show password fields
                        stepOtp.style.display = 'none';
                        stepPasswords.style.display = 'block';
                        stepInfo.textContent = 'Set your new password';
                        actionBtn.textContent = 'Reset Password';
                        currentStep = 2;
                        newPasswordInput.disabled = false;
                        confirmPasswordInput.disabled = false;
                    } else {
                        throw new Error(message || 'Invalid OTP response');
                    }
                })
                .catch(error => {
                    console.error('OTP verification failed:', error);
                    showAlert(error.message || 'OTP verification failed. Please try again.', 'error');
                })
                .finally(() => {
                    actionBtn.disabled = false;
                    actionBtn.textContent = currentStep === 1 ? 'Verify OTP' : 'Reset Password';
                });
            }
        }
        // Step 2: Reset Password
        else if (currentStep === 2) {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Check password meets all requirements
            const hasLength = newPassword.length >= 8;
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasNumber = /[0-9]/.test(newPassword);
            const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
            
            if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
                showAlert('Password must meet all requirements', 'error');
                isValid = false;
            }

            // Check if passwords match
            if (newPassword !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                isValid = false;
            }

            if (isValid) {
                // Show loading state
                actionBtn.disabled = true;
                actionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

                // Proceed with password reset using seller's endpoint
                fetch('https://localhost:7273/api/SellerForgetPassword/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Email: email,
                        NewPassword: newPassword,
                        ConfirmPassword: confirmPassword
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.message); });
                    }
                    return response.text();
                })
                .then(message => {
                    showAlert(message, 'success');
                    setTimeout(() => {
                        window.location.href = 'sellerlogin.html';
                    }, 1500);
                })
                .catch(error => {
                    console.error('Password reset error:', error);
                    showAlert(error.message || 'Failed to reset password. Please try again.', 'error');
                })
                .finally(() => {
                    actionBtn.disabled = false;
                });
            }
        }
    });
}

// Initialize on DOM load (consistent with seller's pattern)
document.addEventListener('DOMContentLoaded', function() {
    // Reuse seller's existing showAlert function
    if (!window.showAlert) {
        window.showAlert = function(message, type) {
            const existingAlert = document.querySelector('.auth-alert');
            if (existingAlert) existingAlert.remove();

            const alertDiv = document.createElement('div');
            alertDiv.className = `auth-alert auth-alert-${type}`;
            alertDiv.textContent = message;

            const form = document.querySelector('.auth-form') || document.querySelector('.auth-container');
            form.prepend(alertDiv);

            setTimeout(() => {
                alertDiv.remove();
            }, 3000);
        };
    }

    // Setup appropriate form based on current page
    if (document.getElementById('seller-forgot-password')) {
        setupForgotPassword();
    }
    if (document.getElementById('seller-reset-password')) {
        setupResetPassword();
    }
});