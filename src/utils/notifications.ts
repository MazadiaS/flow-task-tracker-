// Browser notification utilities for Flow

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });

    // Auto-close notification after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
};

export const showTimerCompleteNotification = (taskName: string, duration: number) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  showNotification('⏰ Timer Complete!', {
    body: `${taskName} - ${timeStr}`,
    tag: 'timer-complete',
    requireInteraction: true,
  });
};

export const showTaskReminderNotification = (taskName: string) => {
  showNotification('📋 Task Reminder', {
    body: `Don't forget: ${taskName}`,
    tag: 'task-reminder',
  });
};

export const showDayStartReminder = () => {
  showNotification('🌅 Start Your Day', {
    body: 'Ready to track your productivity? Click "START DAY" to begin!',
    tag: 'day-start',
  });
};

export const showDayEndReminder = () => {
  showNotification('🌙 End Your Day', {
    body: 'Great work today! End your day session to see your stats.',
    tag: 'day-end',
  });
};

// Check if notifications are supported
export const areNotificationsSupported = (): boolean => {
  return 'Notification' in window;
};

// Get current permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
};
