export class SignInScreen {
  constructor(onSignIn, onSwitchToSignUp) {
    this.onSignIn = onSignIn;
    this.onSwitchToSignUp = onSwitchToSignUp;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'container';

    const screen = document.createElement('div');
    screen.className = 'screen auth-screen active';

    screen.innerHTML = `
      <div class="auth-card">
        <h2>Welcome Back!</h2>
        <p>Sign in to continue your productive journey</p>
        <form id="signInForm">
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
            <label class="form-label" for="password">Password</label>
            <div class="password-input-container">
              <input 
                type="password" 
                id="password" 
                class="form-input" 
                placeholder="Enter your password" 
                required
              />
              <button type="button" class="password-toggle-btn" title="Show password">👁️</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Sign In</button>
        </form>
        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem;">
          Don't have an account? 
          <a href="#" id="switchToSignUp" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">Sign Up</a>
        </p>
      </div>
    `;

    const passwordInput = screen.querySelector('#password');
    const toggleBtn = screen.querySelector('.password-toggle-btn');
    const form = screen.querySelector('#signInForm');
    const submitButton = form.querySelector('button[type="submit"]');

    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
      toggleBtn.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitButton.disabled = true;
      submitButton.textContent = 'Signing In...';
      const credentials = {
        email: screen.querySelector('#email').value,
        password: screen.querySelector('#password').value
      };
      this.onSignIn(credentials).finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
      });
    });

    screen.querySelector('#switchToSignUp').addEventListener('click', (e) => {
      e.preventDefault();
      this.onSwitchToSignUp();
    });

    container.appendChild(screen);
    return container;
  }
}
