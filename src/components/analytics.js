import { api } from '../services/api.js';
import { createIcons, List, CheckSquare, Clock, AlertTriangle, ArrowLeft } from 'lucide';

export class Analytics {
  constructor(user) {
    this.user = user;
    this.userId = user.id;
    this.tasks = [];
    this.view = 'overview'; // 'overview' or 'list'
    this.listFilter = null; // 'total', 'completed', 'pending', 'high-priority'
    this.listTitle = '';
    this.element = document.createElement('div');
    this.element.className = 'analytics-section-wrapper';
    this.isLoading = true;
  }

  async render() {
    this.element.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    this.loadData(); // Fire and forget, the loadData method will handle updating the DOM
    return this.element;
  }

  async loadData() {
    try {
      await this.fetchTasks();
    } catch (error) {
      console.error("An error occurred while loading analytics data:", error);
      this.element.innerHTML = `<div class="error-message-box" style="margin: 2rem auto;">Could not load analytics data. Please try refreshing the page.</div>`;
    } finally {
      this.isLoading = false;
      // Only re-render if the element hasn't been replaced by an error message
      if (this.element.querySelector('.spinner-container')) {
        this.renderContent();
      }
    }
  }

  renderContent() {
    this.element.innerHTML = ''; // Clear the spinner
    if (this.view === 'overview') {
      this.renderOverview();
    } else {
      this.renderListView();
    }
  }

  async fetchTasks() {
    try {
      this.tasks = await api.getTasks(this.userId);
    } catch (error) {
      console.error("Failed to fetch tasks for analytics:", error);
      // Let the calling function handle the UI state
      throw error;
    }
  }

  renderOverview() {
    const completedTasks = this.tasks.filter(t => t.completed).length;
    const totalTasks = this.tasks.length;
    const pendingTasks = totalTasks - completedTasks;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const highPriorityTasks = this.tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const currentStreak = this.user.current_streak || 0;

    const overviewEl = document.createElement('div');
    overviewEl.className = 'analytics-section';
    overviewEl.innerHTML = `
      <div class="content-header">
        <h2>Analytics</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-card" data-filter="total" data-title="All Tasks">
          <div class="stat-icon"><i data-lucide="list"></i></div>
          <div class="stat-value">${totalTasks}</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        
        <div class="stat-card" data-filter="completed" data-title="Completed Tasks">
          <div class="stat-icon" style="color: var(--secondary-color)"><i data-lucide="check-square"></i></div>
          <div class="stat-value" style="color: var(--secondary-color)">${completedTasks}</div>
          <div class="stat-label">Completed</div>
        </div>
        
        <div class="stat-card" data-filter="pending" data-title="Pending Tasks">
          <div class="stat-icon" style="color: var(--warning-color)"><i data-lucide="clock"></i></div>
          <div class="stat-value" style="color: var(--warning-color)">${pendingTasks}</div>
          <div class="stat-label">Pending</div>
        </div>
        
        <div class="stat-card" data-filter="high-priority" data-title="High Priority Tasks">
          <div class="stat-icon" style="color: var(--danger-color)"><i data-lucide="alert-triangle"></i></div>
          <div class="stat-value" style="color: var(--danger-color)">${highPriorityTasks}</div>
          <div class="stat-label">High Priority</div>
        </div>
      </div>
      
      <div class="chart-container">
        <h3>Productivity Streak</h3>
        <div class="streak-display">
          <div class="streak-value">${currentStreak}</div>
          <div class="streak-label">Day Streak</div>
        </div>
        <p class="streak-explainer" style="text-align: center; font-size: 0.875rem; color: var(--text-secondary)">
          You're on a ${currentStreak}-day streak! Complete at least one task every day to keep it going.
        </p>
      </div>

      <div class="chart-container">
        <h3>Completion Rate</h3>
        <div class="progress-bar-container">
          <div class="progress-label">
            <span>Overall Progress</span>
            <span><strong>${progress}%</strong></span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
      </div>
    `;
    this.element.appendChild(overviewEl);

    this.element.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showList(card.dataset.filter, card.dataset.title);
      });
    });

    createIcons({
      icons: {
        List,
        CheckSquare,
        Clock,
        AlertTriangle
      }
    });
  }

  renderListView() {
    let filteredTasks = [];
    switch (this.listFilter) {
      case 'total':
        filteredTasks = this.tasks;
        break;
      case 'completed':
        filteredTasks = this.tasks.filter(t => t.completed);
        break;
      case 'pending':
        filteredTasks = this.tasks.filter(t => !t.completed);
        break;
      case 'high-priority':
        filteredTasks = this.tasks.filter(t => t.priority === 'high' && !t.completed);
        break;
    }

    const listEl = document.createElement('div');
    listEl.className = 'analytics-list-view chart-container';

    let taskListHtml = '';
    if (filteredTasks.length > 0) {
      taskListHtml = filteredTasks.map(task => `<li>${task.name}</li>`).join('');
    } else {
      taskListHtml = '<p class="empty-state" style="padding: 1rem 0; border: none;">No tasks in this category.</p>';
    }

    listEl.innerHTML = `
      <h3 style="display: flex; align-items: center; gap: 1rem;">
        <button class="btn btn-secondary back-btn"><i data-lucide="arrow-left"></i> Back</button>
        <span>${this.listTitle}</span>
      </h3>
      <ul class="task-name-list">
        ${taskListHtml}
      </ul>
    `;
    this.element.appendChild(listEl);

    this.element.querySelector('.back-btn').addEventListener('click', () => {
      this.showOverview();
    });

    createIcons({
      icons: {
        ArrowLeft
      }
    });
  }

  showList(filter, title) {
    this.view = 'list';
    this.listFilter = filter;
    this.listTitle = title;
    this.renderContent();
  }

  showOverview() {
    this.view = 'overview';
    this.listFilter = null;
    this.listTitle = '';
    this.renderContent();
  }
}
