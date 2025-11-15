import { createIcons, AlarmCheck, Plus, Calendar, BarChart2, User, Settings, LogOut } from 'lucide';

export class Sidebar {
  constructor(user, activeView, onNavigate, onLogout, onAddTask) {
    this.user = user;
    this.activeView = activeView;
    this.onNavigate = onNavigate;
    this.onLogout = onLogout;
    this.onAddTask = onAddTask;
    this.element = null;
  }

  render() {
    this.element = document.createElement('aside');
    this.element.className = 'sidebar';

    const initials = this.user.username.substring(0, 2).toUpperCase();

    this.element.innerHTML = `
      <div class="sidebar-header">
        <div class="logo">
          <i data-lucide="alarm-check"></i>
          <span class="logo-text">DoEase</span>
        </div>
      </div>

      <button class="btn btn-primary add-task-btn">
        <i data-lucide="plus"></i>
        <span>Add New Task</span>
      </button>

      <nav class="sidebar-nav">
        <a href="#" class="nav-link ${this.activeView === 'today' ? 'active' : ''}" data-view="today">
          <i data-lucide="calendar"></i>
          <span>Today</span>
        </a>
        <a href="#" class="nav-link ${this.activeView === 'tomorrow' ? 'active' : ''}" data-view="tomorrow">
          <i data-lucide="calendar"></i>
          <span>Tomorrow</span>
        </a>
        <a href="#" class="nav-link ${this.activeView === 'analytics' ? 'active' : ''}" data-view="analytics">
          <i data-lucide="bar-chart-2"></i>
          <span>Analytics</span>
        </a>
        <a href="#" class="nav-link ${this.activeView === 'settings' ? 'active' : ''}" data-view="settings">
          <i data-lucide="settings"></i>
          <span>Settings</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-profile-section" data-view="profile">
          <div class="user-avatar">${initials}</div>
          <div class="user-details">
            <span class="username">${this.user.username}</span>
            <span class="email">${this.user.email}</span>
          </div>
        </div>
        <button id="signOutBtn" class="btn btn-danger btn-small" style="width: 100%; margin-top: 1rem;">
          <i data-lucide="log-out"></i>
          <span>Sign Out</span>
        </button>
      </div>
    `;

    this.element.querySelector('.add-task-btn').addEventListener('click', () => this.onAddTask());

    this.element.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.onNavigate(link.dataset.view);
      });
    });
    
    this.element.querySelector('.user-profile-section').addEventListener('click', () => this.onNavigate('profile'));

    this.element.querySelector('#signOutBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out?')) {
        this.onLogout();
      }
    });

    createIcons({
      icons: {
        AlarmCheck,
        Plus,
        Calendar,
        BarChart2,
        User,
        Settings,
        LogOut
      }
    });

    return this.element;
  }

  setActiveView(view) {
    if (!this.element) return;
    this.element.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.view === view) {
        link.classList.add('active');
      }
    });
    const profileSection = this.element.querySelector('.user-profile-section');
    if (view === 'profile') {
        profileSection.style.backgroundColor = 'var(--sidebar-hover-bg)';
    } else {
        profileSection.style.backgroundColor = 'transparent';
    }
  }
}
