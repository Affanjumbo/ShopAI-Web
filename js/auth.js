document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('signup-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            const password = e.target.value;
            const strengthBars = document.querySelectorAll('.strength-bar');
            const strengthText = document.getElementById('strength-text');
            
            // Reset all bars first
            strengthBars.forEach(bar => {
                bar.style.backgroundColor = '#e0e0e0';
                bar.classList.remove('weak', 'medium', 'strong');
            });
            
            // Check requirements
            const hasLength = password.length >= 8;
            const hasUppercase = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);
            
            // Calculate strength
            let strength = 0;
            if (hasLength) strength++;
            if (hasUppercase) strength++;
            if (hasNumber) strength++;
            if (hasSpecial) strength++;
            
            // Update strength meter
            if (strength <= 1) {
                if (strengthBars[0]) {
                    strengthBars[0].style.backgroundColor = '#ff5252';
                    strengthBars[0].classList.add('weak');
                }
                if (strengthText) {
                    strengthText.textContent = 'Weak';
                    strengthText.style.color = '#ff5252';
                }
            } else if (strength <= 3) {
                if (strengthBars[0]) {
                    strengthBars[0].style.backgroundColor = '#ffb74d';
                    strengthBars[0].classList.add('medium');
                }
                if (strengthBars[1]) {
                    strengthBars[1].style.backgroundColor = '#ffb74d';
                    strengthBars[1].classList.add('medium');
                }
                if (strengthText) {
                    strengthText.textContent = 'Medium';
                    strengthText.style.color = '#ffb74d';
                }
            } else {
                strengthBars.forEach(bar => {
                    bar.style.backgroundColor = '#4caf50';
                    bar.classList.add('strong');
                });
                if (strengthText) {
                    strengthText.textContent = 'Strong';
                    strengthText.style.color = '#4caf50';
                }
            }
            
            // Update requirement indicators
            const requirements = {
                length: document.getElementById('req-length'),
                uppercase: document.getElementById('req-uppercase'),
                number: document.getElementById('req-number'),
                special: document.getElementById('req-special')
            };
            
            if (requirements.length) {
                const icon = requirements.length.querySelector('i');
                icon.style.color = hasLength ? '#4caf50' : '#ccc';
            }
            if (requirements.uppercase) {
                const icon = requirements.uppercase.querySelector('i');
                icon.style.color = hasUppercase ? '#4caf50' : '#ccc';
            }
            if (requirements.number) {
                const icon = requirements.number.querySelector('i');
                icon.style.color = hasNumber ? '#4caf50' : '#ccc';
            }
            if (requirements.special) {
                const icon = requirements.special.querySelector('i');
                icon.style.color = hasSpecial ? '#4caf50' : '#ccc';
            }
        });
    }

    // 👁 Toggle password visibility (EXISTING CODE)
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    });

    // ===============================
    // ✍️ SIGNUP FORM (UPDATED WITH PASSWORD STRENGTH CHECK)
    // ===============================
   // Validation functions
function isValidName(name) {
    const trimmed = name.trim();
    return trimmed.length >= 2 && /^([A-Z][a-z]*)+( [A-Z][a-z]*)*$/.test(trimmed);
}

function formatName(value) {
    return value
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPakistaniPhone(phone) {
    return /^03\d{9}$/.test(phone);
}

function isValidAge(dob) {
    const birthDate = new Date(dob);


    const birthYear = birthDate.getFullYear();
    const currentYear = new Date().getFullYear();

    // Only allow age between 13 and 110
    const minYear = currentYear - 110;
    const maxYear = currentYear - 13;

    if (birthYear < minYear || birthYear > maxYear) {
        return false;
    }

    return true;
}

function checkPasswordStrength(password) {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    return {
        hasLength,
        hasUppercase,
        hasNumber,
        hasSpecial
    };
}

// Error display function
let errorTimeouts = {}; // Keep track of timeouts for each field

function showFieldError(fieldId, message, skipIfEmptyBeforeSubmit = false) {
    const field = document.getElementById(fieldId);
    
    // Skip showing empty errors before first submit
    if (skipIfEmptyBeforeSubmit && !submittedOnce && field.value.trim() === '') {
        return;
    }

    // Get or create the error element
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'error-message';
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    errorElement.textContent = message;
    errorElement.style.display = message ? 'block' : 'none';
    field.classList.toggle('error', !!message);

    // Clear any previous timeout
    if (errorTimeouts[fieldId]) {
        clearTimeout(errorTimeouts[fieldId]);
    }

    // If not submitted, and message exists, auto-hide after 2s
    if (message) {
        errorTimeouts[fieldId] = setTimeout(() => {
            errorElement.style.display = 'none';
            field.classList.remove('error');
        }, 100000);
    }
}


// Setup field validations
function setupFieldValidations() {
    // First Name validation
    document.getElementById('signup-first-name').addEventListener('blur', function() {
        let value = this.value;
        if (value.trim() === '') return;

        const formatted = formatName(value);
        this.value = formatted;

        if (!isValidName(formatted)) {
            showFieldError('signup-first-name', 'First name must contain only letters and be at least 2 characters long');
        } else {
            showFieldError('signup-first-name', '');
        }
    });

    // Last Name validation
    document.getElementById('signup-last-name').addEventListener('blur', function() {
        let value = this.value;
        if (value.trim() === '') return;

        const formatted = formatName(value);
        this.value = formatted;

        if (!isValidName(formatted)) {
            showFieldError('signup-last-name', 'Last name must contain only letters and be at least 2 characters long');
        } else {
            showFieldError('signup-last-name', '');
        }
    });

    // Email validation
    document.getElementById('signup-email').addEventListener('blur', function() {
        const value = this.value.trim();
        if (value === '') return;

        if (!isValidEmail(value)) {
            showFieldError('signup-email', 'Please enter a valid email (e.g., user@example.com)');
        } else {
            showFieldError('signup-email', '');
        }
    });

    // Phone validation
    document.getElementById('signup-phone').addEventListener('blur', function() {
        const value = this.value.trim();
        if (value === '') return;

        if (!isValidPakistaniPhone(value)) {
            showFieldError('signup-phone', 'Phone must be 11 digits starting with 03 (e.g., 03123456789)');
        } else {
            showFieldError('signup-phone', '');
        }
    });

    // Date of Birth validation
    document.getElementById('signup-dob').addEventListener('change', function() {
        const value = this.value;
        if (!value) {
            showFieldError('signup-dob', 'Date of birth is required');
            return;
        }

        if (!isValidAge(value)) {
            showFieldError('signup-dob', 'Enter a valid date: You must be at least 13 years old');
        } else {
            showFieldError('signup-dob', '');
        }
    });

    // Password validation
    document.getElementById('signup-password').addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        
        // Update requirement indicators
        document.getElementById('req-length').classList.toggle('valid', strength.hasLength);
        document.getElementById('req-uppercase').classList.toggle('valid', strength.hasUppercase);
        document.getElementById('req-number').classList.toggle('valid', strength.hasNumber);
        document.getElementById('req-special').classList.toggle('valid', strength.hasSpecial);
    });

    // Confirm Password validation
    document.getElementById('signup-confirm-password').addEventListener('blur', function() {
        const password = document.getElementById('signup-password').value;
        const confirmPassword = this.value;
        
        if (confirmPassword.trim() === '') {
            showFieldError('signup-confirm-password', 'Please confirm your password');
            return;
        }
        
        if (password !== confirmPassword) {
            showFieldError('signup-confirm-password', 'Passwords do not match');
        } else {
            showFieldError('signup-confirm-password', '');
        }
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });
}

// Signup form submission
const signupForm = document.getElementById('signup');
if (signupForm) {
    setupFieldValidations();

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        let hasError = false;
        // Get form values
        const firstName = document.getElementById('signup-first-name').value;
        const lastName = document.getElementById('signup-last-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const dob = document.getElementById('signup-dob').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (firstName === '') {
        showFieldError('signup-first-name', 'First name is required');
        hasError = true;
    } else if (!isValidName(firstName)) {
        showFieldError('signup-first-name', 'First name must contain only letters and be at least 2 characters long');
        hasError = true;
    } else {
        showFieldError('signup-first-name', '');
    }

    // Last Name
    if (lastName === '') {
        showFieldError('signup-last-name', 'Last name is required');
        hasError = true;
    } else if (!isValidName(lastName)) {
        showFieldError('signup-last-name', 'Last name must contain only letters and be at least 2 characters long');
        hasError = true;
    } else {
        showFieldError('signup-last-name', '');
    }

    // Email
    if (email === '') {
        showFieldError('signup-email', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showFieldError('signup-email', 'Please enter a valid email');
        hasError = true;
    } else {
        showFieldError('signup-email', '');
    }

    // Phone
    if (phone === '') {
        showFieldError('signup-phone', 'Phone number is required');
        hasError = true;
    } else if (!isValidPakistaniPhone(phone)) {
        showFieldError('signup-phone', 'Phone must be 11 digits starting with 03');
        hasError = true;
    } else {
        showFieldError('signup-phone', '');
    }

    // Date of Birth
    if (!dob) {
        showFieldError('signup-dob', 'Date of birth is required');
        hasError = true;
    } else if (!isValidAge(dob)) {
        showFieldError('signup-dob', 'You must be at least 13 years old');
        hasError = true;
    } else {
        showFieldError('signup-dob', '');
    }

    

    // Terms checkbox
    if (!document.querySelector('#signup input[type="checkbox"]').checked) {
        alert('You must agree to the terms and conditions');
        hasError = true;
    }

    // Stop if any errors
    if (hasError) return;

        // Trigger validation for all fields
        document.getElementById('signup-first-name').dispatchEvent(new Event('blur'));
        document.getElementById('signup-last-name').dispatchEvent(new Event('blur'));
        document.getElementById('signup-email').dispatchEvent(new Event('blur'));
        document.getElementById('signup-phone').dispatchEvent(new Event('blur'));
        document.getElementById('signup-dob').dispatchEvent(new Event('change'));
        document.getElementById('signup-password').dispatchEvent(new Event('blur'));
        document.getElementById('signup-confirm-password').dispatchEvent(new Event('blur'));

        // Check for any errors
        const errorElements = document.querySelectorAll('.error');
        if (errorElements.length > 0) {
            return;
        }

        // Check password strength
        const strength = checkPasswordStrength(password);
        if (!strength.hasLength || !strength.hasUppercase || !strength.hasNumber || !strength.hasSpecial) {
            showFieldError('signup-password', 'Password does not meet all requirements');
            return;
        }

        // Check terms checkbox
        if (!document.querySelector('#signup input[type="checkbox"]').checked) {
            alert('You must agree to the terms and conditions');
            return;
        }

        // Prepare the data to be sent to the API
        const customerData = {
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            PhoneNumber: phone,
            DateOfBirth: dob,
            Password: password
        };

        try {
            // Make the API call to register the customer
            const response = await fetch('https://localhost:7273/api/Customers/RegisterCustomer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });

            const result = await response.json();

            const errors = result.Errors || [];

            if (response.ok) {
            if (result.Success) {
            alert('Account created successfully! You can now log in.');
                            window.location.href = 'login.html';                
                } 

            } else if (response.status === 400 && errors.some(e => e.includes('Email')) && errors.some(e => e.includes('Phone'))) {
                    alert('ERROR: This Email and Phone Number are already registered');
                } else if (response.status === 400 && errors.some(e => e.includes('Email'))) {
                    alert('EMAIL_EXISTS: This email is already registered');
                } else if (response.status === 400 && errors.some(e => e.includes('Phone'))) {
                    alert('PHONE_NUMBER_EXISTS: This Phone Number is already registered');
                }
            
            else {
                alert('Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            alert('Registration failed. Please try again.');
        }
    });
}

// Login form
const loginForm = document.getElementById('login');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !email.includes('@')) {
            showFieldError('login-email', 'Please enter a valid email');
            return;
        } else {
            showFieldError('login-email', '');
        }

        if (!password) {
            showFieldError('login-password', 'Please enter your password');
            return;
        } else {
            showFieldError('login-password', '');
        }

        fetch('https://localhost:7273/api/Customers/Login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email, Password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.Success && data.Data) {
                // Store customer details and token in localStorage
                localStorage.setItem('customerId', data.Data.CustomerId);
                localStorage.setItem('customerName', data.Data.CustomerName);
                localStorage.setItem('token', data.Data.Token);
                
                // Redirect to customer page
                window.location.href = 'customerpage.html';
            } else {
                const errorMessage = data.Errors?.[0] || 'Login failed. Please try again.';
                if (errorMessage.includes('Email')) {
                    showFieldError('login-email', errorMessage);
                } else if (errorMessage.includes('Password')) {
                    showFieldError('login-password', errorMessage);
                } else {
                    alert(errorMessage);
                }
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
            alert('An error occurred. Please try again.');
        });
    });
}

    // ===============================
    // 📧 FORGOT PASSWORD (EXISTING CODE - NO CHANGES)
    // ===============================
    const forgetForm = document.getElementById('forgetpassword-form');
    if (forgetForm) {
        forgetForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('login-email').value;

            if (!email || !email.includes('@')) {
                alert('Please enter a valid email');
                return;
            }

            fetch('https://localhost:7273/api/CustomerForgetPassword/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email: email })
            })
                .then(response => response.text())
                .then(message => {
                    alert(message);
                    window.location.href = `resetpassword.html?email=${encodeURIComponent(email)}`;
                })
                .catch(error => {
                    console.error('Send OTP error:', error);
                    alert('Failed to send OTP. Please try again.');
                });
        });
    }

 // ===============================
// 🔁 RESET PASSWORD FLOW (Enhanced Validation)
// ===============================
const resetForm = document.getElementById('resetPasswordForm');
if (resetForm) {
    const otpInput = document.getElementById('otp-code');
    const emailInput = document.getElementById('email');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const stepInfo = document.getElementById('step-info');
    const stepOtp = document.getElementById('step-otp');
    const stepPasswords = document.getElementById('step-passwords');
    const actionBtn = document.getElementById('actionBtn');
    
    let currentStep = 1;

    // Get the email from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        emailInput.value = email;
        emailInput.readOnly = true;
        stepOtp.style.display = 'block';
        stepPasswords.style.display = 'none';
        stepInfo.innerText = 'Enter the OTP sent to your email';
        actionBtn.innerText = 'Verify OTP';
        currentStep = 1;
    }

    // Add password strength checker for new password
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function(e) {
            validatePasswordStrength(e.target.value);
            clearError(newPasswordInput);
        });
    }

    // Confirm password validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (newPasswordInput.value !== confirmPasswordInput.value) {
                showError(confirmPasswordInput, 'Passwords do not match');
            } else {
                clearError(confirmPasswordInput);
            }
        });
    }

    // Helper function to show errors
    function showError(input, message) {
        const formGroup = input.closest('.input-group');
        if (!formGroup) return;
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        input.style.borderColor = '#ff5252';
    }

    // Helper function to clear errors
    function clearError(input) {
        const formGroup = input.closest('.input-group');
        if (!formGroup) return;
        
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        input.style.borderColor = '#ddd';
    }

    // Password strength validation
    function validatePasswordStrength(password) {
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        if (!hasLength) {
            showError(newPasswordInput, 'Password must be at least 8 characters');
            return false;
        }
        if (!hasUppercase) {
            showError(newPasswordInput, 'Password must contain at least 1 uppercase letter');
            return false;
        }
        if (!hasNumber) {
            showError(newPasswordInput, 'Password must contain at least 1 number');
            return false;
        }
        if (!hasSpecial) {
            showError(newPasswordInput, 'Password must contain at least 1 special character');
            return false;
        }
        
        clearError(newPasswordInput);
        return true;
    }

    resetForm.addEventListener('submit', function (e) {
        e.preventDefault();
        let isValid = true;

        // Step 1: OTP Verification
        if (currentStep === 1) {
            const otp = otpInput.value.trim();
            if (!otp || otp.length !== 6) {
                showError(otpInput, 'Please enter a valid 6-digit OTP');
                isValid = false;
            } else {
                clearError(otpInput);
            }

            if (isValid) {
                // Verify OTP via backend
                fetch('https://localhost:7273/api/CustomerForgetPassword/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Email: email, OtpCode: otp })
                })
                .then(response => response.text())
                .then(message => {
                    if (message.includes('OTP verified')) {
                        // OTP is verified, show password fields
                        stepOtp.style.display = 'none';
                        stepPasswords.style.display = 'block';
                        stepInfo.innerText = 'Set your new password';
                        actionBtn.innerText = 'Reset Password';
                        currentStep = 2;
                        newPasswordInput.disabled = false;
                        confirmPasswordInput.disabled = false;

                    } else {
                        showError(otpInput, 'Invalid or expired OTP');
                    }
                })
                .catch(error => {
                    console.error('OTP verification failed:', error);
                    showError(otpInput, 'OTP verification failed. Please try again.');
                });
            }
        }
        // Step 2: Reset Password
        else if (currentStep === 2) {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validate password strength
            isValid = validatePasswordStrength(newPassword);

            // Check if passwords match
            if (newPassword !== confirmPassword) {
                showError(confirmPasswordInput, 'Passwords do not match');
                isValid = false;
            } else {
                clearError(confirmPasswordInput);
            }

            if (isValid) {
                // Proceed with password reset
                fetch('https://localhost:7273/api/CustomerForgetPassword/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Email: email,
                        NewPassword: newPassword,
                        ConfirmPassword: confirmPassword
                    })
                })
                .then(response => response.text())
                .then(message => {
                    alert(message);
                    window.location.href = 'login.html';
                })
                .catch(error => {
                    console.error('Password reset error:', error);
                    showError(newPasswordInput, 'Failed to reset password. Please try again.');
                });
            }
        }
    });
}
});