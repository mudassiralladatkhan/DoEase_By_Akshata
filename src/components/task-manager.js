import { api } from '../services/api.js';
import { createIcons, Trash2, FileText, AlertTriangle, ChevronDown, Minus } from 'lucide';

export class TaskManager {
  constructor(userId, filter, onAddTask) {
    this.userId = userId;
    this.filter = filter; // 'today', 'tomorrow'
    this.onAddTask = onAddTask;
    this.tasks = [];
    this.isLoading = true;
    this.element = document.createElement('div');
    this.element.className = 'task-section';
  }

  async render() {
    this.element.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    await this.fetchTasks();
    this.isLoading = false;
    
    const title = this.filter === 'today' ? "Today's Tasks" : "Tomorrow's Tasks";
    
    this.element.innerHTML = `
      ${this.filter === 'today' ? this.renderProgressCard() : ''}
      
      <div class="task-list-header">
        <h3>${title}</h3>
      </div>
      <div id="taskList" class="task-list"></div>
    `;

    this.renderTasks(this.element.querySelector('#taskList'));
    return this.element;
  }

  renderProgressCard() {
    const completedTasks = this.tasks.filter(t => t.completed).length;
    const totalTasks = this.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return `
      <div class="task-progress-card">
        <div class="progress-label">
          <span>Daily Progress</span>
          <span><strong>${completedTasks} / ${totalTasks} Completed</strong></span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  }

  async fetchTasks() {
    try {
      const allTasks = await api.getTasks(this.userId);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (this.filter === 'today') {
        this.tasks = allTasks.filter(t => t.due_date && t.due_date.startsWith(todayStr));
      } else if (this.filter === 'tomorrow') {
        this.tasks = allTasks.filter(t => t.due_date && t.due_date.startsWith(tomorrowStr));
      } else {
        this.tasks = allTasks;
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      alert("Could not load your tasks.");
      this.tasks = [];
    }
  }

  renderTasks(container) {
    container.innerHTML = '';
    
    if (this.tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="file-text"></i></div>
          <p>No tasks scheduled for ${this.filter}.</p>
          <button class="btn btn-primary btn-small empty-state-btn" id="emptyStateAddTaskBtn">Add a Task</button>
        </div>
      `;
      createIcons({ icons: { FileText } });

      if (this.onAddTask) {
        container.querySelector('#emptyStateAddTaskBtn').addEventListener('click', () => {
          this.onAddTask();
        });
      }
      return;
    }

    this.tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    }).forEach(task => {
      const taskItem = this.createTaskItem(task);
      container.appendChild(taskItem);
    });

    createIcons({ icons: { Trash2, AlertTriangle, ChevronDown, Minus } });
  }

  createTaskItem(task) {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;

    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      // Input is now a full ISO string, create Date object directly.
      return new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const priorityIcons = {
      high: 'alert-triangle',
      medium: 'minus',
      low: 'chevron-down'
    };

    item.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" />
      <div class="task-content">
        <h4 class="task-title">${task.name}</h4>
        <div class="task-meta">
          ${task.start_time ? `<span>${formatTime(task.start_time)}${task.end_time ? ` - ${formatTime(task.end_time)}` : ''}</span>` : ''}
          <span class="priority-badge priority-${task.priority}">
            <i data-lucide="${priorityIcons[task.priority] || 'chevron-down'}"></i>
            ${task.priority}
          </span>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn delete-btn" data-task-id="${task.id}" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    `;

    item.querySelector('.task-checkbox').addEventListener('change', async (e) => {
      const isCompleted = e.target.checked;
      try {
        await api.updateTask(task.id, { completed: isCompleted });
        if (isCompleted) {
          await api.updateStreakOnTaskCompletion(this.userId);
        }
        // Refresh view to update progress card
        await this.fetchTasks();
        this.renderTasks(item.parentElement);
        if (this.filter === 'today') {
            const progressCard = this.element.querySelector('.task-progress-card');
            if(progressCard) progressCard.outerHTML = this.renderProgressCard();
        }
      } catch (error) {
        alert(`Failed to update task: ${error.message}`);
        e.target.checked = !isCompleted;
      }
    });

    item.querySelector('.delete-btn').addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this task?')) {
        try {
          await api.deleteTask(task.id);
          await this.fetchTasks();
          this.renderTasks(item.parentElement);
        } catch (error) {
          alert(`Failed to delete task: ${error.message}`);
        }
      }
    });

    return item;
  }
}
