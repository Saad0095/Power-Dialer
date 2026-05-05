import io from 'socket.io-client';

// Extract base URL from API URL (remove /api path)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const SOCKET_BASE_URL = API_BASE_URL.replace('/api', '') || 'http://localhost:3000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.wrappedListeners = new Map();
    this.isConnecting = false;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.socket?.connected) {
      console.log('✅ WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ WebSocket connection in progress...');
      return;
    }

    this.isConnecting = true;
    console.log(`🔌 Attempting WebSocket connection to: ${SOCKET_BASE_URL}`);

    try {
      this.socket = io(SOCKET_BASE_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ["websocket", "polling"],
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected:', this.socket.id);
        this.isConnecting = false;

        // If an agent is logged in, register them for targeted events.
        try {
          const rawUser = localStorage.getItem('user');
          const user = rawUser ? JSON.parse(rawUser) : null;
          const userId = user?._id || user?.id;
          
          if (userId) {
            // Register for generic user events (notifications, etc)
            this.socket.emit('user:register', userId);
            console.log(`✅ User registered on socket: ${userId}`);
            
            // Legacy agent registration for specific dialer features
            if (user?.role === 'caller-agent') {
              this.socket.emit('agent:register', userId);
              console.log(`✅ Agent registered on socket: ${userId}`);
            }
          }
        } catch (e) {
          // Ignore malformed localStorage user
        }
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        this.isConnecting = false;
      });

      this.socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn(`WebSocket not initialized, cannot listen to ${event}`);
      return;
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);

    const wrappedCallback = (data) => {
      console.log(`📡 Event received: ${event}`, data);
      callback(data);
    };

    if (!this.wrappedListeners.has(event)) {
      this.wrappedListeners.set(event, new Map());
    }
    this.wrappedListeners.get(event).set(callback, wrappedCallback);

    this.socket.on(event, wrappedCallback);
    console.log(`📡 Listening to event: ${event}`);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (!this.socket) return;

    const wrappedCallback = this.wrappedListeners.get(event)?.get(callback);
    if (wrappedCallback) {
      this.socket.off(event, wrappedCallback);
      this.wrappedListeners.get(event).delete(callback);
    }

    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id || null;
  }
}

export default new WebSocketService();
