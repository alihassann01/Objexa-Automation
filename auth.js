// ===== DOM Elements =====
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const tabs = document.querySelectorAll('.auth-tab');
const googleAuthBtn = document.getElementById('googleAuthBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeModalBtn = document.getElementById('closeModalBtn');
const practiceTypeSelect = document.getElementById('practiceTypeSelect');
const otherPracticeInput = document.getElementById('otherPracticeInput');

// ===== Helper Functions =====
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';

    // Auto-scroll to message
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';

    // Auto-scroll to message
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
    }
}

// ===== Practice Type "Other" Toggle =====
if (practiceTypeSelect) {
    practiceTypeSelect.addEventListener('change', () => {
        if (practiceTypeSelect.value === 'other') {
            otherPracticeInput.classList.add('visible');
            otherPracticeInput.required = true;
        } else {
            otherPracticeInput.classList.remove('visible');
            otherPracticeInput.required = false;
            otherPracticeInput.value = '';
        }
    });
}

// ===== Handle URL Query Params (Tab Switch) =====
const urlParams = new URLSearchParams(window.location.search);
const initialMode = urlParams.get('mode');

if (initialMode === 'register') {
    // Switch to register tab immediately
    hideMessages();
    tabs.forEach(t => t.classList.remove('active'));

    // Find register tab
    const registerTab = document.querySelector('[data-tab="register"]');
    if (registerTab) registerTab.classList.add('active');

    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    formTitle.textContent = 'Create Account';
    formSubtitle.textContent = 'Start automating your dental practice today';
}

// ===== Tab Switching Logic =====
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        hideMessages();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.getAttribute('data-tab');
        if (mode === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            formTitle.textContent = 'Welcome Back';
            formSubtitle.textContent = 'Enter your details to access your account';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            formTitle.textContent = 'Create Account';
            formSubtitle.textContent = 'Start automating your dental practice today';
        }
    });
});

// ===== Forgot Password Modal =====
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.classList.add('active');
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        forgotPasswordModal.classList.remove('active');
    });
}

// Close modal on outside click
forgotPasswordModal?.addEventListener('click', (e) => {
    if (e.target === forgotPasswordModal) {
        forgotPasswordModal.classList.remove('active');
    }
});

// ===== Forgot Password Handler =====
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = forgotPasswordForm.querySelector('button[type="submit"]');
        const email = forgotPasswordForm.email.value;

        setLoading(btn, true);

        if (!window.supabaseClient) {
            alert('Connection error. Please refresh.');
            setLoading(btn, false);
            return;
        }

        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        setLoading(btn, false);

        if (error) {
            alert(error.message);
        } else {
            alert('Password reset link sent! Check your email.');
            forgotPasswordModal.classList.remove('active');
            forgotPasswordForm.reset();
        }
    });
}

// ===== Login Handler =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    const btn = loginForm.querySelector('button[type="submit"]');
    const formData = new FormData(loginForm);

    setLoading(btn, true);

    if (!window.supabaseClient) {
        showError('Connection error. Please refresh the page.');
        setLoading(btn, false);
        return;
    }

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: formData.get('email'),
        password: formData.get('password')
    });

    setLoading(btn, false);

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            showError('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
            showError('Please verify your email before logging in. Check your inbox.');
        } else {
            showError(error.message);
        }
    } else {
        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});

// ===== Register Handler =====
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    const btn = registerForm.querySelector('button[type="submit"]');
    const formData = new FormData(registerForm);

    // Get practice type (use "other" input if selected)
    let practiceType = formData.get('practiceType');
    if (practiceType === 'other') {
        practiceType = formData.get('otherPractice');
    }

    setLoading(btn, true);

    if (!window.supabaseClient) {
        showError('Connection error. Please refresh the page.');
        setLoading(btn, false);
        return;
    }

    // Check password length
    const password = formData.get('password');
    if (password.length < 8) {
        showError('Password must be at least 8 characters long.');
        setLoading(btn, false);
        return;
    }

    const { data, error } = await window.supabaseClient.auth.signUp({
        email: formData.get('email'),
        password: password,
        options: {
            emailRedirectTo: window.location.origin + '/auth.html?verified=true',
            data: {
                full_name: formData.get('fullName'),
                practice_type: practiceType,
                practice_name: formData.get('practiceName'),
                phone: formData.get('phone')
            }
        }
    });

    setLoading(btn, false);

    if (error) {
        if (error.message.includes('already registered')) {
            showError('This email is already registered. Please login instead.');
        } else {
            showError(error.message);
        }
    } else {
        // Check if email confirmation is required
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            showError('This email is already registered. Please login instead.');
        } else {
            // Save redirect intent to localStorage for multi-device support
            const redirectTarget = urlParams.get('redirect');
            if (redirectTarget) {
                localStorage.setItem('pendingRedirect', redirectTarget);
            }
            // Save the email for verification polling
            localStorage.setItem('pendingVerificationEmail', formData.get('email'));

            showSuccess('Registration successful! Please check your email to verify your account.');
            registerForm.reset();

            // Start polling for verification (multi-device support)
            startVerificationPolling();
        }
    }
});

// ===== Google Auth Handler =====
googleAuthBtn.addEventListener('click', async () => {
    if (!window.supabaseClient) {
        showError('Connection error. Please refresh the page.');
        return;
    }

    const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/complete-profile.html'
        }
    });

    if (error) {
        showError(error.message);
    }
});

// ===== Check for Verification Success =====
// urlParams is already declared at the top
if (urlParams.get('verified') === 'true') {
    showSuccess('Email verified successfully! You can now log in.');
}

// ===== Check if Already Logged In =====
async function checkExistingSession() {
    if (!window.supabaseClient) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();

    if (user) {
        // Check if user has completed profile (has practice info)
        const metadata = user.user_metadata;

        // Handle Redirect Param (e.g. back to demo)
        const redirectTarget = urlParams.get('redirect');

        if (!metadata?.practice_name && !metadata?.practice_type) {
            // Redirect to complete profile
            window.location.href = redirectTarget ?
                `complete-profile.html?redirect=${redirectTarget}` :
                'complete-profile.html';
        } else {
            // Already logged in with complete profile
            if (redirectTarget === 'demo') {
                window.location.href = 'index.html#demo';
            } else {
                window.location.href = 'index.html';
            }
        }
    }
}

// Run on page load
setTimeout(checkExistingSession, 100);

// ===== Multi-Device Verification Polling =====
let verificationPollInterval = null;

function startVerificationPolling() {
    // Poll every 3 seconds to check if user has been verified
    if (verificationPollInterval) clearInterval(verificationPollInterval);

    verificationPollInterval = setInterval(async () => {
        if (!window.supabaseClient) return;

        try {
            // Try to get the current session
            const { data: { session } } = await window.supabaseClient.auth.getSession();

            if (session && session.user) {
                // User is now verified and logged in!
                clearInterval(verificationPollInterval);

                // Get the saved redirect intent
                const pendingRedirect = localStorage.getItem('pendingRedirect');

                // Clean up localStorage
                localStorage.removeItem('pendingVerificationEmail');
                localStorage.removeItem('pendingRedirect');

                // Redirect based on intent
                if (pendingRedirect === 'demo') {
                    window.location.href = 'index.html#demo';
                } else {
                    window.location.href = 'index.html';
                }
            }
        } catch (e) {
            console.log('Verification polling error:', e);
        }
    }, 3000); // Check every 3 seconds
}

// ===== Check if we should resume polling =====
const pendingEmail = localStorage.getItem('pendingVerificationEmail');
if (pendingEmail) {
    // User registered but hasn't verified yet - resume polling
    showSuccess('Waiting for email verification... Check your inbox!');
    startVerificationPolling();
}
