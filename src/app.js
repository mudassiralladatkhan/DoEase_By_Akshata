import { api } from './services/api.js';
import { isSupabaseConfigured, supabaseConfigurationError } from './services/supabase.js';
import { LandingScreen } from './screens/landing.js';
import { SignInScreen } from './screens/signin.js';
import { SignUpScreen } from './screens/signup.js';
import { DashboardScreen } from './screens/dashboard.js';
import { createIcons, CheckCircle } from 'lucide';

export class App {
  constructor(container) {
    this.container = container;
    this.currentUser = null;
    this.currentScreen = null;
    this.authView = 'landing'; // 'landing', 'signin', 'signup', 'check-email'
    this.loader = document.getElementById('globalLoader');
  }

  async init() {
    if (!isSupabaseConfigured) {
      this.renderConfigurationError();
      return;
    }

    this.showLoader();
    try {
      const session = await api.getSession();
      if (session) {
        this.currentUser = await api.getUser();
        // Backfill timezone for existing users if it's not set
        if (this.currentUser && !this.currentUser.timezone) {
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await api.updateUser(this.currentUser.id, { timezone: userTimezone });
          this.currentUser.timezone = userTimezone; // Update local object immediately
        }
        await api.checkAndResetStreak(session.user.id);
      }
      this.render();
    } catch (error) {
      console.error("Initialization error:", error);
      this.renderGenericError(error);
    } finally {
      this.hideLoader();
    }

    api.onAuthStateChange(async (event, session) => {
      this.showLoader();
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          this.currentUser = await api.getUser();
          this.render();
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.authView = 'landing';
        this.render();
      }
      this.hideLoader();
    });
  }

  renderConfigurationError() {
    this.hideLoader();
    this.container.innerHTML = `
      <div class="config-error-container">
        <div class="auth-card">
          <h2>Configuration Error</h2>
          <p>There seems to be an issue with the application's configuration.</p>
          <div class="error-message-box">
            <p><strong>Error:</strong> ${supabaseConfigurationError}</p>
          </div>
          <h4>Next Steps:</h4>
          <ol>
            <li>Go to the <strong>Integrations</strong> tab in the sidebar.</li>
            <li>Connect your Supabase account and link a project.</li>
            <li>The application will automatically reload with the correct settings.</li>
          </ol>
        </div>
      </div>
    `;
  }

  renderGenericError(error) {
    this.hideLoader();
    this.container.innerHTML = `
      <div class="config-error-container">
        <div class="auth-card">
          <h2>Application Error</h2>
          <p>An unexpected error occurred while trying to load the application.</p>
          <div class="error-message-box">
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Please check the console for more details and try refreshing the page.</p>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.currentScreen && typeof this.currentScreen.destroy === 'function') {
      this.currentScreen.destroy();
    }
    this.container.innerHTML = '';

    if (this.currentUser) {
      const dashboard = new DashboardScreen(
        this.currentUser, 
        () => this.handleLogout(),
        (userData) => this.handleUserUpdate(userData)
      );
      this.container.appendChild(dashboard.render());
      this.currentScreen = dashboard;
    } else {
      const authContainer = document.createElement('div');
      authContainer.className = 'auth-screens-container';
      
      if (this.authView === 'landing') {
        const landingScreen = new LandingScreen(
          () => this.handleSwitchToSignUp(),
          () => this.handleSwitchToSignIn()
        );
        authContainer.appendChild(landingScreen.render());
        this.currentScreen = landingScreen;
      } else if (this.authView === 'check-email') {
        authContainer.classList.add('form-view');
        authContainer.innerHTML = this.renderCheckEmailScreen();
        this.currentScreen = null;
        
        setTimeout(() => {
          const btn = authContainer.querySelector('#go-to-signin');
          if (btn) {
            btn.addEventListener('click', () => this.handleSwitchToSignIn());
          }
          createIcons({ icons: { CheckCircle } });
        }, 0);
      } else {
        authContainer.classList.add('form-view');
        if (this.authView === 'signup') {
          const signUpScreen = new SignUpScreen(
            (userData) => this.handleSignUp(userData),
            () => this.handleSwitchToSignIn()
          );
          authContainer.appendChild(signUpScreen.render());
          this.currentScreen = signUpScreen;
        } else { // 'signin'
          const signInScreen = new SignInScreen(
            (credentials) => this.handleSignIn(credentials),
            () => this.handleSwitchToSignUp()
          );
          authContainer.appendChild(signInScreen.render());
          this.currentScreen = signInScreen;
        }
      }
      this.container.appendChild(authContainer);
    }
  }

  renderCheckEmailScreen() {
    return `
      <div class="auth-card">
        <h2>Check Your Inbox</h2>
        <p style="margin-bottom: 1.5rem;">We've sent a confirmation link to your email address. Please click the link in the email to activate your account.</p>
        <div class="info-box success" style="text-align: left;">
          <div class="icon"><i data-lucide="check-circle"></i></div>
          <div>
            <p>Once your account is active, you can sign in to start your productivity journey.</p>
          </div>
        </div>
        <button class="btn btn-primary" id="go-to-signin" style="margin-top: 2rem;">Go to Sign In Page</button>
      </div>
    `;
  }

  handleSwitchToSignUp() {
    this.authView = 'signup';
    this.render();
  }

  handleSwitchToSignIn() {
    this.authView = 'signin';
    this.render();
  }

  async handleSignIn(credentials) {
    this.showLoader();
    try {
      await api.signIn(credentials.email, credentials.password);
      // onAuthStateChange will handle the re-render
    } catch (error) {
      alert(`Sign in failed: ${error.message}`);
    } finally {
      this.hideLoader();
    }
  }

  async handleSignUp(userData) {
    this.showLoader();
    try {
      const data = await api.signUp(userData);
      // If a user is created but there's no session, it means email confirmation is required.
      if (data.user && !data.session) {
        this.authView = 'check-email';
        this.render();
      }
      // If a session is created (email confirmation disabled), onAuthStateChange will handle the rest.
    } catch (error) {
      console.error("Sign up failed:", error);
      // Re-throw the error so the UI component can catch it and display it locally.
      throw error;
    } finally {
      this.hideLoader();
    }
  }

  async handleLogout() {
    this.showLoader();
    try {
      await api.signOut();
    } catch (error) {
      alert(`Sign out failed: ${error.message}`);
    } finally {
      this.hideLoader();
    }
  }

  async handleUserUpdate(userData) {
    if (this.currentUser) {
      this.showLoader();
      try {
        await api.updateUser(this.currentUser.id, userData);
        alert("Profile updated successfully!");
        // onAuthStateChange will trigger a re-render with the updated user data
      } catch (error) {
        alert(`Update failed: ${error.message}`);
      } finally {
        this.hideLoader();
      }
    }
  }

  showLoader() {
    this.loader.classList.add('show');
  }

  hideLoader() {
    this.loader.classList.remove('show');
  }
}
