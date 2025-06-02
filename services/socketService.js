const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const logger = require('../config/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
  }

  // Initialize socket server
  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO server initialized');
  }

  // Handle new socket connection
  handleConnection(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Store user connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);

    logger.info(`User connected: ${userId} (${userRole}) - Socket: ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${userId}`);

    // Join role-specific rooms
    socket.join(`role_${userRole}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected successfully',
      userId,
      role: userRole
    });

    // Handle appointment-related events
    this.handleAppointmentEvents(socket);

    // Handle notification events
    this.handleNotificationEvents(socket);

    // Handle chat/messaging events
    this.handleChatEvents(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  // Handle appointment-related socket events
  handleAppointmentEvents(socket) {
    const userId = socket.userId;

    // Join appointment-specific rooms
    socket.on('join_appointment', (appointmentId) => {
      socket.join(`appointment_${appointmentId}`);
      logger.info(`User ${userId} joined appointment room: ${appointmentId}`);
    });

    // Leave appointment room
    socket.on('leave_appointment', (appointmentId) => {
      socket.leave(`appointment_${appointmentId}`);
      logger.info(`User ${userId} left appointment room: ${appointmentId}`);
    });

    // Handle appointment status updates
    socket.on('appointment_status_update', (data) => {
      this.broadcastAppointmentUpdate(data.appointmentId, data);
    });
  }

  // Handle notification events
  handleNotificationEvents(socket) {
    const userId = socket.userId;

    // Mark notifications as read
    socket.on('mark_notifications_read', (notificationIds) => {
      // This would update the database to mark notifications as read
      logger.info(`User ${userId} marked notifications as read:`, notificationIds);
    });

    // Request unread notification count
    socket.on('get_unread_count', async () => {
      try {
        // This would fetch from a notifications table/collection
        const unreadCount = 0; // Placeholder
        socket.emit('unread_count', unreadCount);
      } catch (error) {
        logger.error('Error fetching unread count:', error);
      }
    });
  }

  // Handle chat/messaging events
  handleChatEvents(socket) {
    const userId = socket.userId;

    // Join chat room between patient and doctor
    socket.on('join_chat', (data) => {
      const { patientId, doctorId } = data;
      const chatRoom = `chat_${Math.min(patientId, doctorId)}_${Math.max(patientId, doctorId)}`;
      socket.join(chatRoom);
      logger.info(`User ${userId} joined chat room: ${chatRoom}`);
    });

    // Send message in chat
    socket.on('send_message', (data) => {
      const { patientId, doctorId, message } = data;
      const chatRoom = `chat_${Math.min(patientId, doctorId)}_${Math.max(patientId, doctorId)}`;
      
      // Broadcast message to chat room
      this.io.to(chatRoom).emit('new_message', {
        senderId: userId,
        message,
        timestamp: new Date().toISOString()
      });

      logger.info(`Message sent in chat room ${chatRoom} by user ${userId}`);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { patientId, doctorId } = data;
      const chatRoom = `chat_${Math.min(patientId, doctorId)}_${Math.max(patientId, doctorId)}`;
      socket.to(chatRoom).emit('user_typing', { userId });
    });

    socket.on('stop_typing', (data) => {
      const { patientId, doctorId } = data;
      const chatRoom = `chat_${Math.min(patientId, doctorId)}_${Math.max(patientId, doctorId)}`;
      socket.to(chatRoom).emit('user_stop_typing', { userId });
    });
  }

  // Handle disconnection
  handleDisconnection(socket) {
    const userId = this.userSockets.get(socket.id);
    
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);
      logger.info(`User disconnected: ${userId} - Socket: ${socket.id}`);
    }
  }

  // Broadcast appointment update to relevant users
  broadcastAppointmentUpdate(appointmentId, data) {
    this.io.to(`appointment_${appointmentId}`).emit('appointment_updated', data);
    logger.info(`Appointment update broadcasted for appointment: ${appointmentId}`);
  }

  // Send real-time notification to specific user
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
      logger.info(`Notification sent to user ${userId}:`, notification.title);
    }
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds, notification) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Broadcast to all users with specific role
  broadcastToRole(role, event, data) {
    this.io.to(`role_${role}`).emit(event, data);
    logger.info(`Broadcasted ${event} to all ${role}s`);
  }

  // Send appointment reminder
  sendAppointmentReminder(appointmentId, patientId, doctorId, appointmentData) {
    const reminderData = {
      type: 'appointment_reminder',
      appointmentId,
      data: appointmentData
    };

    this.sendNotificationToUser(patientId, reminderData);
    this.sendNotificationToUser(doctorId, reminderData);
  }

  // Send appointment confirmation
  sendAppointmentConfirmation(appointmentId, patientId, doctorId, appointmentData) {
    const confirmationData = {
      type: 'appointment_confirmed',
      appointmentId,
      data: appointmentData
    };

    this.sendNotificationToUser(patientId, confirmationData);
    this.sendNotificationToUser(doctorId, confirmationData);
  }

  // Send appointment cancellation
  sendAppointmentCancellation(appointmentId, patientId, doctorId, reason) {
    const cancellationData = {
      type: 'appointment_cancelled',
      appointmentId,
      reason,
      timestamp: new Date().toISOString()
    };

    this.sendNotificationToUser(patientId, cancellationData);
    this.sendNotificationToUser(doctorId, cancellationData);
  }

  // Send system maintenance notification
  sendMaintenanceNotification(message, scheduledTime) {
    this.io.emit('system_maintenance', {
      message,
      scheduledTime,
      timestamp: new Date().toISOString()
    });
    logger.info('System maintenance notification broadcasted');
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Get online users by role
  getOnlineUsersByRole(role) {
    const onlineUsers = [];
    this.io.sockets.adapter.rooms.get(`role_${role}`)?.forEach(socketId => {
      const userId = this.userSockets.get(socketId);
      if (userId) {
        onlineUsers.push(userId);
      }
    });
    return onlineUsers;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Force disconnect user (for admin actions)
  disconnectUser(userId, reason = 'Admin action') {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('force_disconnect', { reason });
        socket.disconnect(true);
        logger.info(`User ${userId} forcefully disconnected: ${reason}`);
      }
    }
  }
}

module.exports = new SocketService();
