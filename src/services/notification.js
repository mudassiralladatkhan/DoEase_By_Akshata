export class NotificationService {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    // We can only ask if the permission is not 'denied'.
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  static showNotification(title, options) {
    if (Notification.permission === 'granted') {
      const defaultOptions = {
        icon: 'https://i.ibb.co/d6rTzJc/doease-logo.jpg',
        badge: 'https://i.ibb.co/d6rTzJc/doease-logo.jpg'
      };
      new Notification(title, { ...defaultOptions, ...options });
    }
  }
}
