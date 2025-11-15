import { createIcons, AlertTriangle, Info, CheckCircle } from 'lucide';

const PUBLIC_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
const RESEND_DEV_EMAIL = 'onboarding@resend.dev';

export class SettingsScreen {
  constructor(user, onUserUpdate) {
    this.user = user;
    this.onUserUpdate = onUserUpdate;
    this.element = document.createElement('div');
    this.element.className = 'settings-section-wrapper';
    this.fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || '';
  }

  isPublicDomain(email) {
    if (!email || email === 'YOUR_API_KEY' || email === RESEND_DEV_EMAIL) return false;
    const domain = email.split('@')[1];
    return PUBLIC_EMAIL_DOMAINS.includes(domain);
  }

  renderStatusBox() {
    const isDevSender = this.fromEmail === RESEND_DEV_EMAIL;
    const isPublicSender = this.isPublicDomain(this.fromEmail);
    const isUnconfigured = !this.fromEmail || this.fromEmail === 'YOUR_API_KEY' || isPublicSender;

    if (isDevSender) {
      return `
        <div class="info-box warning">
          <div class="icon"><i data-lucide="info"></i></div>
          <div>
            <strong>Development Mode Active</strong>
            <p>
              You are using <code>${this.fromEmail}</code>. Emails will be sent, but <strong>only to your verified Resend account email</strong> (${this.user.email}). This is perfect for testing.
            </p>
          </div>
        </div>
      `;
    }

    if (isUnconfigured) {
      return `
        <div class="info-box error">
          <div class="icon"><i data-lucide="alert-triangle"></i></div>
          <div>
            <strong>Configuration Status: Action Required</strong>
            <p>
              Your sender email is not configured or is using a public domain (<code>${this.fromEmail || 'Not Set'}</code>). <strong>This will not work.</strong> Please follow the setup guide to use a verified custom domain or the development email.
            </p>
          </div>
        </div>
      `;
    }

    // Configured properly with a custom domain
    return `
      <div class="info-box success">
        <div class="icon"><i data-lucide="check-circle"></i></div>
        <div>
          <strong>Configuration Status: Active</strong>
          <p>
            Your sender email (<code>${this.fromEmail}</code>) is configured. If emails fail, ensure the domain is fully <strong>verified</strong> in Resend and the API key is correct.
          </p>
        </div>
      </div>
    `;
  }

  render() {
    this.element.innerHTML = `
      <div class="content-header">
        <h2>Settings</h2>
      </div>
      <div class="settings-section">

        <div class="email-config-warning">
            <div class="warning-icon"><i data-lucide="alert-triangle"></i></div>
            <div class="warning-content">
                <h4>Final Step: Enable Email Notifications</h4>
                <p>To receive task reminders and streak alerts, you must configure your email service. <strong>Emails will fail until this is done.</strong></p>
                <p>Follow the <strong>"Next Steps"</strong> guide in the chat to complete this setup, even if you don't have a custom domain.</p>
            </div>
        </div>

        ${this.renderStatusBox()}

        <h3>Notifications</h3>
        <div class="setting-item">
          <div class="setting-text">
            <label for="emailNotifications">Enable Email Notifications</label>
            <p>Receive reminders for tasks and updates on your productivity streak.</p>
          </div>
          <div class="setting-toggle">
            <label class="switch">
              <input type="checkbox" id="emailNotifications" ${this.user.email_notifications_enabled ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    `;

    this.element.querySelector('#emailNotifications').addEventListener('change', async (e) => {
      const isEnabled = e.target.checked;
      try {
        await this.onUserUpdate({ email_notifications_enabled: isEnabled });
        this.user.email_notifications_enabled = isEnabled;
        alert('Notification settings updated successfully!');
      } catch (error) {
        alert(`Failed to update settings: ${error.message}`);
        e.target.checked = !isEnabled;
      }
    });

    createIcons({ icons: { AlertTriangle, Info, CheckCircle } });

    return this.element;
  }
}
