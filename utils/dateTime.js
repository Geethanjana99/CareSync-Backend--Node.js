class DateTimeUtils {
  // Format date to ISO string
  static toISOString(date) {
    return new Date(date).toISOString();
  }

  // Format date for display (e.g., "March 15, 2024")
  static formatDate(date, locale = 'en-US') {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format time for display (e.g., "2:30 PM")
  static formatTime(date, locale = 'en-US') {
    return new Date(date).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Format date and time for display
  static formatDateTime(date, locale = 'en-US') {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Get relative time (e.g., "2 hours ago", "in 3 days")
  static getRelativeTime(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((targetDate - now) / 1000);
    const absDiff = Math.abs(diffInSeconds);

    const units = [
      { name: 'year', seconds: 31536000 },
      { name: 'month', seconds: 2592000 },
      { name: 'week', seconds: 604800 },
      { name: 'day', seconds: 86400 },
      { name: 'hour', seconds: 3600 },
      { name: 'minute', seconds: 60 },
      { name: 'second', seconds: 1 }
    ];

    for (const unit of units) {
      const count = Math.floor(absDiff / unit.seconds);
      if (count >= 1) {
        const suffix = count === 1 ? unit.name : `${unit.name}s`;
        return diffInSeconds > 0 
          ? `in ${count} ${suffix}` 
          : `${count} ${suffix} ago`;
      }
    }

    return 'just now';
  }

  // Check if date is today
  static isToday(date) {
    const today = new Date();
    const targetDate = new Date(date);
    
    return today.getFullYear() === targetDate.getFullYear() &&
           today.getMonth() === targetDate.getMonth() &&
           today.getDate() === targetDate.getDate();
  }

  // Check if date is tomorrow
  static isTomorrow(date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = new Date(date);
    
    return tomorrow.getFullYear() === targetDate.getFullYear() &&
           tomorrow.getMonth() === targetDate.getMonth() &&
           tomorrow.getDate() === targetDate.getDate();
  }

  // Check if date is yesterday
  static isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = new Date(date);
    
    return yesterday.getFullYear() === targetDate.getFullYear() &&
           yesterday.getMonth() === targetDate.getMonth() &&
           yesterday.getDate() === targetDate.getDate();
  }

  // Get start of day
  static getStartOfDay(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  // Get end of day
  static getEndOfDay(date = new Date()) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  // Get start of week (Monday)
  static getStartOfWeek(date = new Date()) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  // Get end of week (Sunday)
  static getEndOfWeek(date = new Date()) {
    const endOfWeek = new Date(date);
    const day = endOfWeek.getDay();
    const diff = endOfWeek.getDate() - day + (day === 0 ? 0 : 7);
    endOfWeek.setDate(diff);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

  // Get start of month
  static getStartOfMonth(date = new Date()) {
    const startOfMonth = new Date(date);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return startOfMonth;
  }

  // Get end of month
  static getEndOfMonth(date = new Date()) {
    const endOfMonth = new Date(date);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    return endOfMonth;
  }

  // Add days to date
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Add hours to date
  static addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  // Add minutes to date
  static addMinutes(date, minutes) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  // Get age from birth date
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Get duration between two dates in human readable format
  static getDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = end - start;
    
    if (diffInMs < 0) {
      return 'Invalid duration';
    }

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else {
      return `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''}`;
    }
  }

  // Check if time is in business hours
  static isBusinessHours(date, startHour = 8, endHour = 18) {
    const hour = new Date(date).getHours();
    return hour >= startHour && hour < endHour;
  }

  // Check if date is a weekend
  static isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  // Get next business day (excluding weekends)
  static getNextBusinessDay(date = new Date()) {
    const nextDay = this.addDays(date, 1);
    
    if (this.isWeekend(nextDay)) {
      return this.getNextBusinessDay(nextDay);
    }
    
    return nextDay;
  }

  // Generate time slots for appointments
  static generateTimeSlots(startTime, endTime, slotDuration = 30) {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    let current = new Date(start);
    
    while (current < end) {
      const timeString = current.toTimeString().substring(0, 5);
      slots.push(timeString);
      current = this.addMinutes(current, slotDuration);
    }
    
    return slots;
  }

  // Convert timezone
  static convertTimezone(date, fromTimezone, toTimezone) {
    // This is a simplified version. In production, use a library like date-fns-tz or moment-timezone
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    return new Date(utcDate.toLocaleString('en-US', { timeZone: toTimezone }));
  }

  // Get time until appointment
  static getTimeUntilAppointment(appointmentDate) {
    const now = new Date();
    const appointment = new Date(appointmentDate);
    const diffInMs = appointment - now;
    
    if (diffInMs <= 0) {
      return 'Appointment time has passed';
    }
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      const remainingHours = diffInHours % 24;
      return `${diffInDays}d ${remainingHours}h`;
    } else if (diffInHours > 0) {
      const remainingMinutes = diffInMinutes % 60;
      return `${diffInHours}h ${remainingMinutes}m`;
    } else {
      return `${diffInMinutes}m`;
    }
  }

  // Check if appointment should send reminder
  static shouldSendReminder(appointmentDate, reminderType = '24h') {
    const now = new Date();
    const appointment = new Date(appointmentDate);
    const diffInMs = appointment - now;
    
    const reminderTimes = {
      '1h': 60 * 60 * 1000,        // 1 hour
      '24h': 24 * 60 * 60 * 1000,  // 24 hours
      '1w': 7 * 24 * 60 * 60 * 1000 // 1 week
    };
    
    const reminderTime = reminderTimes[reminderType];
    if (!reminderTime) {
      return false;
    }
    
    // Send reminder if appointment is within the reminder window
    // but not too close (give at least 5 minutes buffer)
    return diffInMs <= reminderTime && diffInMs > 5 * 60 * 1000;
  }

  // Format date for SQL/database queries
  static formatForDatabase(date) {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
  }

  // Parse various date formats
  static parseDate(dateString) {
    // Handle common date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];
    
    for (const format of formats) {
      if (format.test(dateString)) {
        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    
    // Try direct parsing as fallback
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Get working days between two dates
  static getWorkingDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    const current = new Date(start);
    
    while (current <= end) {
      if (!this.isWeekend(current)) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  }

  // Get calendar weeks in month
  static getCalendarWeeksInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstWeek = this.getWeekNumber(firstDay);
    const lastWeek = this.getWeekNumber(lastDay);
    
    return lastWeek - firstWeek + 1;
  }

  // Get week number of year
  static getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

module.exports = DateTimeUtils;
