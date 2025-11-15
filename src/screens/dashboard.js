import { api } from '../services/api.js';
import { TaskManager } from '../components/task-manager.js';
import { Analytics } from '../components/analytics.js';
import { ProfileScreen } from './profile.js';
import { SettingsScreen } from './settings.js';
import { Sidebar } from '../components/sidebar.js';
import { createIcons, X } from 'lucide';
import { NotificationService } from '../services/notification.js';

export class DashboardScreen {
  constructor(user, onLogout, onUserUpdate) {
    this.user = user;
    this.onLogout = onLogout;
    this.onUserUpdate = onUserUpdate;
    this.currentView = 'today';
    this.element = document.createElement('div');
    this.element.className = 'dashboard-container';

    this.sidebar = new Sidebar(
      this.user,
      this.currentView,
      this.handleNavigate.bind(this),
      this.onLogout,
      this.showAddTaskModal.bind(this)
    );

    this.notificationInterval = null;
    this.notificationsSent = { start: new Set(), end: new Set() };
  }

  render() {
    this.element.innerHTML = '';

    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-nav-toggle';
    mobileToggle.innerHTML = `<span></span><span></span><span></span>`;
    mobileToggle.addEventListener('click', () => {
      this.element.querySelector('.sidebar').classList.toggle('open');
    });

    const sidebarEl = this.sidebar.render();

    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    mainContent.id = 'mainContent';

    this.element.appendChild(mobileToggle);
    this.element.appendChild(sidebarEl);
    this.element.appendChild(mainContent);

    this.renderViewContent();
    this.initNotificationScheduler();

    return this.element;
  }

  handleNavigate(view) {
    this.currentView = view;
    this.sidebar.setActiveView(view);
    this.renderViewContent();

    const sidebarEl = this.element.querySelector('.sidebar');
    if (sidebarEl && sidebarEl.classList.contains('open')) {
      sidebarEl.classList.remove('open');
    }
  }

  async renderViewContent() {
    const contentContainer = this.element.querySelector('#mainContent');
    if (!contentContainer) return;

    contentContainer.innerHTML = '';

    let viewComponent;

    if (this.currentView === 'today' || this.currentView === 'tomorrow') {
      viewComponent = new TaskManager(
        this.user.id, 
        this.currentView,
        this.showAddTaskModal.bind(this)
      );
    } else if (this.currentView === 'analytics') {
      viewComponent = new Analytics(this.user);
    } else if (this.currentView === 'profile') {
      viewComponent = new ProfileScreen(this.user, this.onUserUpdate);
    } else if (this.currentView === 'settings') {
      viewComponent = new SettingsScreen(this.user, this.onUserUpdate);
    }

    if (viewComponent) {
      const renderedView = await viewComponent.render();
      contentContainer.appendChild(renderedView);
    }
  }
  
  showAddTaskModal() {
    const modalContainer = document.getElementById('modal-container');
    const today = new Date().toISOString().split('T')[0];

    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add New Task</h3>
            <button class="icon-btn" id="closeModalBtn"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <form id="taskForm">
              <div class="form-group">
                <label class="form-label" for="taskName">Task Name</label>
                <input type="text" id="taskName" class="form-input" placeholder="e.g., Finish project report" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="dueDate">Due Date</label>
                <input type="date" id="dueDate" class="form-input" value="${today}" />
              </div>
              <div class="time-group">
                <div class="form-group">
                  <label class="form-label" for="startTime">Start Time</label>
                  <input type="time" id="startTime" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="endTime">End Time</label>
                  <input type="time" id="endTime" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="priority">Priority</label>
                <select id="priority" class="form-input">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low" selected>Low</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">Add Task</button>
            </form>
          </div>
        </div>
      </div>
    `;
    modalContainer.innerHTML = modalHTML;
    createIcons({ icons: { X } });

    const closeModal = () => modalContainer.innerHTML = '';

    modalContainer.querySelector('#closeModalBtn').addEventListener('click', closeModal);
    modalContainer.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    });

    modalContainer.querySelector('#taskForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Adding...';

      const dueDateValue = form.querySelector('#dueDate').value;
      const startTimeValue = form.querySelector('#startTime').value;
      const endTimeValue = form.querySelector('#endTime').value;

      const fullStartTime = startTimeValue && dueDateValue ? new Date(`${dueDateValue}T${startTimeValue}`).toISOString() : null;
      const fullEndTime = endTimeValue && dueDateValue ? new Date(`${dueDateValue}T${endTimeValue}`).toISOString() : null;

      const taskData = {
        name: form.querySelector('#taskName').value,
        start_time: fullStartTime,
        end_time: fullEndTime,
        due_date: dueDateValue || null,
        priority: form.querySelector('#priority').value
      };

      try {
        await api.addTask(this.user.id, taskData);
        closeModal();
        this.handleNavigate(this.currentView);
      } catch (error) {
        alert(`Failed to add task: ${error.message}`);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Task';
      }
    });
  }

  async initNotificationScheduler() {
    const permissionGranted = await NotificationService.requestPermission();
    if (permissionGranted) {
      this.checkTasksForNotifications(); // Initial check
      this.notificationInterval = setInterval(() => this.checkTasksForNotifications(), 60000); // Check every minute
    }
  }

  async checkTasksForNotifications() {
    try {
      const tasks = await api.getTasks(this.user.id);
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      for (const task of tasks) {
        if (task.completed) continue;

        // Check for start time notification
        if (task.start_time && !this.notificationsSent.start.has(task.id)) {
          const startTime = new Date(task.start_time);
          if (startTime > oneMinuteAgo && startTime <= now) {
            NotificationService.showNotification(`Task Starting: ${task.name}`, {
              body: `Your task is scheduled to start now. You got this!`,
            });
            this.notificationsSent.start.add(task.id);
          }
        }

        // Check for end time notification
        if (task.end_time && !this.notificationsSent.end.has(task.id)) {
          const endTime = new Date(task.end_time);
          if (endTime > oneMinuteAgo && endTime <= now) {
            NotificationService.showNotification(`Task Ending: ${task.name}`, {
              body: `Your task is scheduled to end now. Time to wrap up!`,
            });
            this.notificationsSent.end.add(task.id);
          }
        }
      }
    } catch (error) {
      console.error("Error checking for task notifications:", error);
    }
  }

  destroy() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }
}
