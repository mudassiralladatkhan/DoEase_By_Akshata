import { createIcons, AlarmCheck, CheckCircle, BarChart2, User } from 'lucide';

export class LandingScreen {
  constructor(onGetStarted, onSignIn) {
    this.onGetStarted = onGetStarted;
    this.onSignIn = onSignIn;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'landing-page-container';

    container.innerHTML = `
      <header class="landing-header">
        <a href="#" class="logo">
          <i data-lucide="alarm-check"></i>
          <span class="logo-text">DoEase</span>
        </a>
        <button class="btn btn-secondary btn-small" id="signInBtn">Sign In</button>
      </header>

      <main>
        <section class="hero-section">
          <h1>DoEase</h1>
          <p>DoEase is your personal companion to help you stay focused and beat procrastination.</p>
          <button class="btn btn-primary btn-large" id="getStartedBtn">Get Started for Free</button>
        </section>

        <section class="features-section">
          <h2 class="section-title">Everything You Need to Succeed</h2>
          <p class="section-subtitle">Powerful features designed to keep you on track.</p>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon"><i data-lucide="check-circle"></i></div>
              <h3>Smart Task Management</h3>
              <p>Easily add, organize, and prioritize your tasks with due dates and time tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon"><i data-lucide="bar-chart-2"></i></div>
              <h3>Insightful Analytics</h3>
              <p>Track your progress, monitor your completion rate, and build a productive streak.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon"><i data-lucide="user"></i></div>
              <h3>Personalized Experience</h3>
              <p>Customize your profile and manage your account details with ease.</p>
            </div>
          </div>
        </section>

        <section class="cta-section">
          <h2 class="section-title">Ready to Boost Your Productivity?</h2>
          <p class="section-subtitle">Join thousands of users who are taking control of their day.</p>
          <button class="btn btn-primary btn-large" id="getStartedBottomBtn">Join DoEase Now</button>
        </section>
      </main>

      <footer class="landing-footer">
        <p>&copy; ${new Date().getFullYear()} DoEase. All rights reserved.</p>
      </footer>
    `;

    container.querySelector('#signInBtn').addEventListener('click', (e) => {
      e.preventDefault();
      this.onSignIn();
    });

    container.querySelector('#getStartedBtn').addEventListener('click', (e) => {
      e.preventDefault();
      this.onGetStarted();
    });
    
    container.querySelector('#getStartedBottomBtn').addEventListener('click', (e) => {
      e.preventDefault();
      this.onGetStarted();
    });

    createIcons({
      icons: {
        AlarmCheck,
        CheckCircle,
        BarChart2,
        User,
      },
    });

    return container;
  }
}
