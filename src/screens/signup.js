export class SignUpScreen {
  constructor(onSignUp, onSwitchToSignIn) {
    this.onSignUp = onSignUp;
    this.onSwitchToSignIn = onSwitchToSignIn;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'container';

    const screen = document.createElement('div');
    screen.className = 'screen auth-screen active';

    screen.innerHTML = `
      <div class="auth-card">
        <h2>Create an Account</h2>
        <p>Join DoEase and start your productivity journey</p>
        <div id="signup-error" class="error-message-box" style="display: none; margin-bottom: 1.5rem;"></div>
        <form id="signUpForm">
          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              class="form-input" 
              placeholder="Enter your username" 
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              class="form-input" 
              placeholder="Enter your email" 
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="mobile">Mobile Number</label>
            <input 
              type="tel" 
              id="mobile" 
              class="form-input" 
              placeholder="Enter your mobile number"
              pattern="[0-9]{10,}"
              title="Please enter a valid mobile number (at least 10 digits)."
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="password-input-container">
              <input 
                type="password" 
                id="password" 
                class="form-input" 
                placeholder="Create a password (min. 6 characters)" 
                required
                minlength="6"
              />
              <button type="button" class="password-toggle-btn" title="Show password">👁️</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Create Account</button>
        </form>
        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem;">
          Already have an account? 
          <a href="#" id="switchToSignIn" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">Sign In</a>
        </p>
      </div>
    `;

    const passwordInput = screen.querySelector('#password');
    const toggleBtn = screen.querySelector('.password-toggle-btn');
    const form = screen.querySelector('#signUpForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const errorContainer = screen.querySelector('#signup-error');

    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
      toggleBtn.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitButton.disabled = true;
      submitButton.textContent = 'Creating Account...';
      errorContainer.style.display = 'none';

      const userData = {
        username: screen.querySelector('#username').value,
        email: screen.querySelector('#email').value,
        mobile: screen.querySelector('#mobile').value,
        password: screen.querySelector('#password').value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      try {
        await this.onSignUp(userData);
        // On success, app.js will navigate away to the 'check-email' screen.
      } catch (error) {
        errorContainer.textContent = error.message;
        errorContainer.style.display = 'block';
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
      }
    });

    screen.querySelector('#switchToSignIn').addEventListener('click', (e) => {
      e.preventDefault();
      this.onSwitchToSignIn();
    });

    container.appendChild(screen);
    return container;
  }
}
