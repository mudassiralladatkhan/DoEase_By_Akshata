export class StorageService {
  constructor() {
    this.storageKey = 'doease_data';
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        users: [],
        currentUserId: null,
        tasks: [],
        appState: {}
      };
      localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  createUser(userData) {
    const data = this.getData();
    const newUser = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      password: userData.password,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    data.currentUserId = newUser.id;
    this.saveData(data);
    return newUser;
  }

  loginUser(email, password) {
    const data = this.getData();
    const user = data.users.find(u => u.email === email && u.password === password);
    if (user) {
      data.currentUserId = user.id;
      this.saveData(data);
      return user;
    }
    return null;
  }

  updateUser(userId, updates) {
    const data = this.getData();
    const userIndex = data.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      data.users[userIndex] = { ...data.users[userIndex], ...updates };
      this.saveData(data);
      return data.users[userIndex];
    }
    return null;
  }

  getCurrentUser() {
    const data = this.getData();
    if (!data.currentUserId) return null;
    return data.users.find(user => user.id === data.currentUserId);
  }

  logout() {
    const data = this.getData();
    data.currentUserId = null;
    this.saveData(data);
  }

  getTasks(userId) {
    const data = this.getData();
    return data.tasks.filter(task => task.userId === userId);
  }

  addTask(userId, taskData) {
    const data = this.getData();
    const newTask = {
      id: Date.now().toString(),
      userId,
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString()
    };
    data.tasks.push(newTask);
    this.saveData(data);
    return newTask;
  }

  updateTask(taskId, updates) {
    const data = this.getData();
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
      this.saveData(data);
      return data.tasks[taskIndex];
    }
    return null;
  }

  deleteTask(taskId) {
    const data = this.getData();
    data.tasks = data.tasks.filter(task => task.id !== taskId);
    this.saveData(data);
  }

  getAppState(key) {
    const data = this.getData();
    return data.appState[key];
  }

  setAppState(key, value) {
    const data = this.getData();
    data.appState[key] = value;
    this.saveData(data);
  }
}
