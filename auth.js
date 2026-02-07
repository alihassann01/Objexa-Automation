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

// ===== Password Toggle Function =====
function togglePassword(inputId, buttonEl) {
    const input = document.getElementById(inputId);
    const icon = buttonEl.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
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

        // Helper to show modal errors
        const modalError = document.getElementById('modalErrorMessage');
        function showModalError(msg) {
            if (modalError) {
                modalError.textContent = msg;
                modalError.style.display = 'block';
            }
        }

        if (!window.supabaseClient) {
            showModalError('Connection error. Please refresh.');
            setLoading(btn, false);
            return;
        }

        // Check if email exists in database first
        const { data: emailExists, error: rpcError } = await window.supabaseClient
            .rpc('check_email_exists', { email_to_check: email });

        if (rpcError) {
            showModalError('Error checking email. Please try again.');
            setLoading(btn, false);
            return;
        }

        if (!emailExists) {
            showModalError('This email is not registered. Please check your email or create an account.');
            setLoading(btn, false);
            return;
        }

        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        setLoading(btn, false);

        if (error) {
            showModalError(error.message);
        } else {
            // Show styled modal for success
            const resetLinkModal = document.getElementById('resetLinkSentModal');
            if (resetLinkModal) {
                resetLinkModal.classList.add('active');
            }
            forgotPasswordModal.classList.remove('active');
            forgotPasswordForm.reset();
            if (modalError) modalError.style.display = 'none';
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

    // ===== Password Strength Validation =====
    const password = formData.get('password');
    const passwordErrors = [];

    if (password.length < 8) {
        passwordErrors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        passwordErrors.push('1 uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        passwordErrors.push('1 number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        passwordErrors.push('1 special character (!@#$%^&*)');
    }

    if (passwordErrors.length > 0) {
        showError(`Password must contain: ${passwordErrors.join(', ')}`);
        setLoading(btn, false);
        return;
    }

    // ===== Password Match Validation =====
    const confirmPassword = formData.get('confirmPassword');
    if (password !== confirmPassword) {
        showError('Passwords do not match. Please check and try again.');
        setLoading(btn, false);
        return;
    }

    // ===== Phone Number Format Validation =====
    const phone = formData.get('phone');
    // Remove all non-digit characters for checking
    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        showError('Please enter a valid phone number (10-15 digits)');
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

            // Start polling for verification with credentials (cross-device support)
            startVerificationPolling(formData.get('email'), password);

            // Show verification modal
            showVerificationModal(formData.get('email'));
            registerForm.reset();
        }
    }
});

// ===== Google Auth Handler =====
googleAuthBtn.addEventListener('click', async () => {
    if (!window.supabaseClient) {
        showError('Connection error. Please refresh the page.');
        return;
    }

    // Preserve redirect param through OAuth flow
    const redirectTarget = urlParams.get('redirect');
    const redirectUrl = redirectTarget
        ? `${window.location.origin}/complete-profile.html?redirect=${redirectTarget}`
        : `${window.location.origin}/complete-profile.html`;

    const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl
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
    const loadingOverlay = document.getElementById('authLoadingOverlay');
    const authContainer = document.getElementById('authContainer');
    
    if (!window.supabaseClient) {
        // No supabase - show form anyway
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
        return;
    }

    const { data: { user } } = await window.supabaseClient.auth.getUser();

    if (user) {
        // Check if user has completed profile (has practice info)
        const metadata = user.user_metadata;

        // Handle Redirect Param (e.g. back to demo)
        const redirectTarget = urlParams.get('redirect');

        // Check if this is a Google-only user without password
        const hasGoogleIdentity = user.identities?.some(id => id.provider === 'google');
        const hasEmailIdentity = user.identities?.some(id => id.provider === 'email');

        if (!metadata?.practice_name && !metadata?.practice_type) {
            // Redirect to complete profile (no flash - stay on loading)
            window.location.href = redirectTarget ?
                `complete-profile.html?redirect=${redirectTarget}` :
                'complete-profile.html';
        } else if (hasGoogleIdentity && !hasEmailIdentity) {
            // Google user without password - needs to set one (no flash - stay on loading)
            window.location.href = redirectTarget ?
                `complete-profile.html?redirect=${redirectTarget}` :
                'complete-profile.html';
        } else {
            // Already logged in with complete profile - redirect immediately (no flash)
            if (redirectTarget === 'demo') {
                window.location.href = 'index.html#demo';
            } else {
                window.location.href = 'index.html';
            }
        }
    } else {
        // No user - show the auth form
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
    }
}

// Run on page load - immediately to prevent flash
checkExistingSession();

// ===== Multi-Device Verification Polling =====
let verificationPollInterval = null;
let verificationPollAttempts = 0;
const MAX_POLL_ATTEMPTS = 60; // ~4 minutes at 4 second intervals
let pendingCredentials = { email: null, password: null };

function startVerificationPolling(email, password) {
    // Store credentials for polling
    pendingCredentials = { email, password };
    verificationPollAttempts = 0;

    if (verificationPollInterval) clearInterval(verificationPollInterval);

    verificationPollInterval = setInterval(async () => {
        if (!window.supabaseClient) return;

        verificationPollAttempts++;

        // Stop polling after max attempts and show resend option
        if (verificationPollAttempts >= MAX_POLL_ATTEMPTS) {
            clearInterval(verificationPollInterval);
            showResendOption();
            return;
        }

        try {
            // Attempt silent login - will succeed only if email is verified
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: pendingCredentials.email,
                password: pendingCredentials.password
            });

            if (data?.session) {
                // User is now verified and logged in!
                clearInterval(verificationPollInterval);
                hideVerificationModal();

                // Get the saved redirect intent
                const pendingRedirect = localStorage.getItem('pendingRedirect');
                localStorage.removeItem('pendingRedirect');

                // Show success briefly then redirect
                showSuccess('Email verified! Logging you in...');

                setTimeout(() => {
                    if (pendingRedirect === 'demo') {
                        window.location.href = 'index.html#demo';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            }
            // If error is "Email not confirmed", just keep waiting...
        } catch (e) {
            console.log('Verification polling error:', e);
        }
    }, 4000); // Check every 4 seconds
}

function showResendOption() {
    const resendBtn = document.getElementById('resendVerificationBtn');
    const pollingStatus = document.getElementById('pollingStatus');
    if (resendBtn) {
        resendBtn.style.display = 'inline-block';
    }
    if (pollingStatus) {
        pollingStatus.textContent = 'Verification link may have expired.';
    }
}

function showVerificationModal(email) {
    const modal = document.getElementById('verificationModal');
    const emailDisplay = document.getElementById('verificationEmail');
    if (modal) {
        modal.classList.add('active');
    }
    if (emailDisplay) {
        emailDisplay.textContent = email;
    }
}

function hideVerificationModal() {
    const modal = document.getElementById('verificationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Resend verification email handler
async function resendVerificationEmail() {
    if (!window.supabaseClient || !pendingCredentials.email) return;

    const resendBtn = document.getElementById('resendVerificationBtn');
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }

    const { error } = await window.supabaseClient.auth.resend({
        type: 'signup',
        email: pendingCredentials.email,
        options: {
            emailRedirectTo: window.location.origin + '/auth.html?verified=true'
        }
    });

    if (resendBtn) {
        if (error) {
            resendBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed - Try Again';
            resendBtn.disabled = false;
        } else {
            resendBtn.innerHTML = '<i class="fas fa-check"></i> Email Sent!';
            // Restart polling
            verificationPollAttempts = 0;
            startVerificationPolling(pendingCredentials.email, pendingCredentials.password);
            // Re-enable after delay
            setTimeout(() => {
                resendBtn.innerHTML = '<i class="fas fa-redo"></i> Resend Email';
                resendBtn.disabled = false;
                resendBtn.style.display = 'none';
            }, 30000); // 30 second cooldown
        }
    }
}

// Cancel verification and go back
function cancelVerification() {
    if (verificationPollInterval) clearInterval(verificationPollInterval);
    hideVerificationModal();
    localStorage.removeItem('pendingRedirect');
    pendingCredentials = { email: null, password: null };
}
