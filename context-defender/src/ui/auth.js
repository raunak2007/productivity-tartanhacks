import { signIn, signUp, signInWithGoogle, signOut, onAuthStateChange } from '../services/supabase.js';

// ============================================
// AUTH UI COMPONENTS
// ============================================

/**
 * Create and show the authentication modal
 */
export function showAuthModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById('authModal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-modal-overlay"></div>
    <div class="auth-modal-content">
      <button class="auth-modal-close" onclick="document.getElementById('authModal').remove()">
        <i class="fas fa-times"></i>
      </button>
      
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="signin">Sign In</button>
        <button class="auth-tab" data-tab="signup">Sign Up</button>
      </div>

      <!-- Sign In Form -->
      <div id="signinForm" class="auth-form active">
        <h2>Welcome Back</h2>
        <p class="auth-subtitle">Sign in to continue your productivity journey</p>
        
        <form id="signinFormElement">
          <div class="form-group">
            <label for="signinEmail">Email</label>
            <input type="email" id="signinEmail" required placeholder="you@example.com" />
          </div>
          
          <div class="form-group">
            <label for="signinPassword">Password</label>
            <input type="password" id="signinPassword" required placeholder="••••••••" />
          </div>
          
          <button type="submit" class="btn-primary btn-full">
            Sign In
          </button>
        </form>

        <div class="auth-divider">
          <span>or</span>
        </div>

        <button class="btn-google" id="googleSigninBtn">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div id="signinError" class="auth-error"></div>
      </div>

      <!-- Sign Up Form -->
      <div id="signupForm" class="auth-form">
        <h2>Create Account</h2>
        <p class="auth-subtitle">Start optimizing your productivity today</p>
        
        <form id="signupFormElement">
          <div class="form-group">
            <label for="signupName">Full Name</label>
            <input type="text" id="signupName" required placeholder="John Doe" />
          </div>

          <div class="form-group">
            <label for="signupEmail">Email</label>
            <input type="email" id="signupEmail" required placeholder="you@example.com" />
          </div>
          
          <div class="form-group">
            <label for="signupPassword">Password</label>
            <input type="password" id="signupPassword" required placeholder="••••••••" minlength="6" />
          </div>

          <div class="form-group">
            <label for="signupPasswordConfirm">Confirm Password</label>
            <input type="password" id="signupPasswordConfirm" required placeholder="••••••••" minlength="6" />
          </div>
          
          <button type="submit" class="btn-primary btn-full">
            Create Account
          </button>
        </form>

        <div class="auth-divider">
          <span>or</span>
        </div>

        <button class="btn-google" id="googleSignupBtn">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div id="signupError" class="auth-error"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  initializeAuthModal();
}

/**
 * Initialize auth modal event listeners
 */
function initializeAuthModal() {
  // Tab switching
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      switchAuthTab(targetTab);
    });
  });

  // Sign in form
  const signinForm = document.getElementById('signinFormElement');
  signinForm.addEventListener('submit', handleSignIn);

  // Sign up form
  const signupForm = document.getElementById('signupFormElement');
  signupForm.addEventListener('submit', handleSignUp);

  // Google OAuth buttons
  document.getElementById('googleSigninBtn').addEventListener('click', handleGoogleAuth);
  document.getElementById('googleSignupBtn').addEventListener('click', handleGoogleAuth);

  // Close modal on overlay click
  document.querySelector('.auth-modal-overlay').addEventListener('click', () => {
    document.getElementById('authModal').remove();
  });
}

/**
 * Switch between sign in and sign up tabs
 */
function switchAuthTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(t => t.classList.remove('active'));
  forms.forEach(f => f.classList.remove('active'));

  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`${tab}Form`).classList.add('active');

  // Clear errors
  document.getElementById('signinError').textContent = '';
  document.getElementById('signupError').textContent = '';
}

/**
 * Handle sign in form submission
 */
async function handleSignIn(e) {
  e.preventDefault();
  
  const email = document.getElementById('signinEmail').value;
  const password = document.getElementById('signinPassword').value;
  const errorDiv = document.getElementById('signinError');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Clear previous errors
  errorDiv.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  const { user, error } = await signIn(email, password);

  if (error) {
    errorDiv.textContent = error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  } else {
    // Success! Redirect to dashboard
    window.location.href = '/pages/dashboard.html';
  }
}

/**
 * Handle sign up form submission
 */
async function handleSignUp(e) {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
  const errorDiv = document.getElementById('signupError');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Clear previous errors
  errorDiv.textContent = '';

  // Validate passwords match
  if (password !== passwordConfirm) {
    errorDiv.textContent = 'Passwords do not match';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  const { user, error } = await signUp(email, password, name);

  if (error) {
    errorDiv.textContent = error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  } else {
    // Success! Show success message
    errorDiv.classList.remove('auth-error');
    errorDiv.classList.add('auth-success');
    errorDiv.textContent = 'Account created! Please check your email to verify your account.';
    submitBtn.textContent = 'Account Created!';
    
    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = '/pages/dashboard.html';
    }, 2000);
  }
}

/**
 * Handle Google OAuth
 */
async function handleGoogleAuth() {
  const { error } = await signInWithGoogle();
  
  if (error) {
    const errorDiv = document.querySelector('.auth-form.active .auth-error');
    errorDiv.textContent = error.message;
  }
  // OAuth will redirect automatically
}

/**
 * Initialize auth state listener
 */
export function initializeAuthState() {
  onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_IN') {
      updateUIForAuthenticatedUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      updateUIForUnauthenticatedUser();
    }
  });
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser(user) {
  // Update user profile display
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar');

  if (userName) {
    userName.textContent = user.user_metadata?.full_name || user.email.split('@')[0];
  }

  if (userEmail) {
    userEmail.textContent = user.email;
  }

  if (userAvatar) {
    const initial = (user.user_metadata?.full_name || user.email)[0].toUpperCase();
    userAvatar.textContent = initial;
  }

  // Show/hide appropriate UI elements
  const authButtons = document.querySelectorAll('.auth-required');
  authButtons.forEach(btn => btn.style.display = 'block');

  const guestButtons = document.querySelectorAll('.guest-only');
  guestButtons.forEach(btn => btn.style.display = 'none');
}

/**
 * Update UI for unauthenticated user
 */
function updateUIForUnauthenticatedUser() {
  // Redirect to landing if on protected page
  const protectedPages = ['/pages/dashboard.html', '/dashboard.html'];
  if (protectedPages.some(page => window.location.pathname.includes(page))) {
    window.location.href = '/pages/landing.html';
  }

  // Show/hide appropriate UI elements
  const authButtons = document.querySelectorAll('.auth-required');
  authButtons.forEach(btn => btn.style.display = 'none');

  const guestButtons = document.querySelectorAll('.guest-only');
  guestButtons.forEach(btn => btn.style.display = 'block');
}

/**
 * Handle logout
 */
export async function handleLogout() {
  const { error } = await signOut();
  
  if (error) {
    console.error('Logout error:', error);
    alert('Error signing out. Please try again.');
  } else {
    window.location.href = '/pages/landing.html';
  }
}

/**
 * Check if user is authenticated
 */
export async function requireAuth() {
  const { getCurrentUser } = await import('../services/supabase.js');
  const { user, error } = await getCurrentUser();
  
  if (error || !user) {
    window.location.href = '/pages/landing.html';
    return false;
  }
  
  return true;
}
