import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected: boolean = false;

  constructor() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
    try {
      this.socket = io(wsUrl, {
        autoConnect: false,
        reconnectionAttempts: 3,
        timeout: 3000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.notify('connection_change', { status: 'online' });
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.notify('connection_change', { status: 'offline' });
      });
    } catch {
      this.isConnected = false;
    }
  }

  public connect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  public subscribe(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  private notify(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  public getStatus() {
    return this.isConnected ? 'online' : 'synced_local';
  }
}

export const socketService = new SocketService();
export default socketService;
