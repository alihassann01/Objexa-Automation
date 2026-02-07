// ===== Initialize AOS Animation =====
AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50
});

// ===== Force Scroll to Top on Page Load/Refresh =====
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ===== Mobile Menu Toggle =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');
let isMenuOpen = false;

function openMobileMenu() {
    if (isMenuOpen) return;
    isMenuOpen = true;

    mobileMenuBtn.classList.add('active');
    navLinks.classList.add('active');
    navOverlay.classList.add('active');

    // Prevent body scroll without causing page jump
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
}

function closeMobileMenu() {
    if (!isMenuOpen) return;
    isMenuOpen = false;

    mobileMenuBtn.classList.remove('active');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
}

function toggleMobileMenu(e) {
    e.stopPropagation();
    if (isMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

mobileMenuBtn.addEventListener('click', toggleMobileMenu);
navOverlay.addEventListener('click', closeMobileMenu);

// Close mobile menu when clicking a link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Small delay to allow click to register before closing
        setTimeout(closeMobileMenu, 10);
    });
});

// Close menu on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
        closeMobileMenu();
    }
});

// ===== FAQ Accordion =====
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        // Close all other items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });

        // Toggle current item
        item.classList.toggle('active');
    });
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Authentication & User Profile =====
const authBtn = document.getElementById('authBtn');
const userProfile = document.getElementById('userProfile');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// Check auth state and enforce profile completion (prevents auth bypass)
async function checkAuth() {
    if (!window.supabaseClient) {
        console.warn('Supabase not fully loaded yet. Build might be offline.');
        // Show sign in button anyway so user can try (and maybe trigger reload)
        if (authBtn) authBtn.style.display = 'inline-block';
        return;
    }

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (user) {
            // ===== Auth Bypass Protection =====
            // Check if user has completed their profile setup
            const metadata = user.user_metadata;
            const hasGoogleIdentity = user.identities?.some(id => id.provider === 'google');
            const hasEmailIdentity = user.identities?.some(id => id.provider === 'email');
            
            // If profile is incomplete OR Google user without password, redirect to setup
            const profileIncomplete = !metadata?.practice_name || !metadata?.practice_type;
            const googleNeedsPassword = hasGoogleIdentity && !hasEmailIdentity;
            
            if (profileIncomplete || googleNeedsPassword) {
                // User has not completed setup - redirect to complete-profile
                // This prevents the back button exploit
                window.location.href = 'complete-profile.html';
                return;
            }
        }
        
        updateAuthUI(user);
    } catch (e) {
        console.error("Auth check failed:", e);
        if (authBtn) authBtn.style.display = 'inline-block';
    }
}

function updateAuthUI(user) {
    if (user) {
        authBtn.style.display = 'none';
        userProfile.style.display = 'flex';
        userName.textContent = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
    } else {
        authBtn.style.display = 'inline-block';
        userProfile.style.display = 'none';
        userName.textContent = '';
    }
}

// Sign In Button
if (authBtn) {
    authBtn.addEventListener('click', () => {
        window.location.href = 'auth.html';
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (!window.supabaseClient) return;

        // Clear any saved demo form data on logout to prevent data leaks
        sessionStorage.removeItem('demoFormData');
        
        await window.supabaseClient.auth.signOut();
        window.location.reload();
    });
}

// Init Auth Check
// Wait small time for everything to settle
setTimeout(checkAuth, 100);

// ===== Form Submission with Supabase =====
const demoForm = document.getElementById('demoForm');

if (demoForm) {
    // ===== Pre-fill Form from Saved Data =====
    window.addEventListener('load', async () => {
        const savedDemoData = sessionStorage.getItem('demoFormData');
        
        // Check URL hash - only restore data if we're coming from auth flow with #demo
        const shouldRestoreData = window.location.hash === '#demo' && savedDemoData;
        
        if (shouldRestoreData) {
            // Check if user is actually logged in before restoring
            if (window.supabaseClient) {
                // Small delay to ensure auth state is ready
                setTimeout(async () => {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();

                    if (user) {
                        try {
                            const formObj = JSON.parse(savedDemoData);
                            
                            // Only restore if data matches current session context
                            // This prevents stale data from different users
                            if (formObj.name) demoForm.querySelector('[name="name"]').value = formObj.name;
                            if (formObj.email) demoForm.querySelector('[name="email"]').value = formObj.email;
                            if (formObj.phone) demoForm.querySelector('[name="phone"]').value = formObj.phone;
                            if (formObj.practice) demoForm.querySelector('[name="practice"]').value = formObj.practice;

                            // Scroll to demo section
                            const demoSection = document.getElementById('demo');
                            if (demoSection) {
                                demoSection.scrollIntoView({ behavior: 'smooth' });
                            }
                            
                            // Clear the saved data after restoring to prevent reuse
                            sessionStorage.removeItem('demoFormData');
                        } catch (e) {
                            // Clear corrupted data
                            sessionStorage.removeItem('demoFormData');
                        }
                    } else {
                        // No user logged in, clear stale data
                        sessionStorage.removeItem('demoFormData');
                    }
                }, 500);
            }
        } else if (!window.location.hash.includes('demo')) {
            // If not navigating to demo section, clear any stale demo data
            sessionStorage.removeItem('demoFormData');
        }
    });

    demoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!window.supabaseClient) {
            alert('Service temporary unavailable. Please try again later.');
            return;
        }

        const formData = new FormData(demoForm);

        // 2. Auth Check
        const { data: { user } } = await window.supabaseClient.auth.getUser();

        if (!user) {
            // Save form data to Session Storage
            const formObj = {};
            formData.forEach((value, key) => (formObj[key] = value));
            sessionStorage.setItem('demoFormData', JSON.stringify(formObj));

            // Redirect immediately to REGISTER (Client requested)
            window.location.href = 'auth.html?mode=register&redirect=demo';
            return;
        }

        // Get the submit button
        const submitBtn = demoForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // ===== Email Format Validation =====
        const email = formData.get('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        try {
            const bookingData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                practice_name: formData.get('practice'),
                created_at: new Date()
            };

            // Insert into Supabase
            const { error } = await window.supabaseClient
                .from('demo_bookings')
                .insert([bookingData]);

            if (error) throw error;

            // Call Edge Function to send confirmation email
            try {
                const emailResponse = await fetch('https://vtlblicmwoaohjgbjpix.supabase.co/functions/v1/send-demo-confirmation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bGJsaWNtd29hb2hqZ2JqcGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODQ3MjEsImV4cCI6MjA4NTQ2MDcyMX0.E3gGxIhO3rvhoL61DhvnEjX-2BYA_oXAnHi3klgLDpI'
                    },
                    body: JSON.stringify(bookingData)
                });

                if (!emailResponse.ok) {
                    const errorData = await emailResponse.json();
                    console.error('Edge Function Error:', errorData);
                    // SHOW FULL ERROR STRUCTURE
                    alert('Debug Error Details:\n' + JSON.stringify(errorData, null, 2));
                }
            } catch (emailError) {
                console.log('Email sending failed, but booking was saved:', emailError);
                alert('Network Error sending email: ' + emailError.message);
            }

            // Show success message
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Demo Booked!';
            submitBtn.style.background = 'var(--success)';

            // Show confirmation message
            // Show confirmation message
            document.getElementById('successModal').classList.add('active');

            // Clear saved form data
            sessionStorage.removeItem('demoFormData');

            // Reset form
            demoForm.reset();

            // Reset button after 3 seconds
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);

        } catch (error) {
            alert('Error submitting form: ' + error.message);
            console.error('Form submission error:', error);
            submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error. Try again.';
            submitBtn.style.background = 'var(--danger)';

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
        }
    });
}

// ===== Typing Animation for Hero =====
const aiResponseText = document.querySelector('.ai-response p');
const originalText = aiResponseText?.textContent || '';

function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Start typing animation when page loads
if (aiResponseText) {
    setTimeout(() => {
        typeWriter(aiResponseText, originalText, 30);
    }, 1000);
}

// ===== Counter Animation for Stats =====
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }

    updateCounter();
}

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements
document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
    observer.observe(el);
});

// ===== Phone Number Formatting =====
const phoneInputs = document.querySelectorAll('input[type="tel"]');

phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length >= 10) {
            value = value.substring(0, 10);
            value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
        } else if (value.length >= 6) {
            value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
        } else if (value.length >= 3) {
            value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
        }

        e.target.value = value;
    });
});

// ===== Console Easter Egg =====
console.log('%c� Objexa Automation', 'font-size: 24px; font-weight: bold; color: #6366f1;');
console.log('%cInterested in working with us? Email: hello@objexaautomation.com', 'font-size: 14px; color: #a1a1aa;');
