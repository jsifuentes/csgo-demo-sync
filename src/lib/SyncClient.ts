import WebSocket, { Server } from 'ws';
import { EventEmitter } from 'events';
import { WebsocketMessageType } from './Enums';
import { SyncMessage } from './SyncServer';

export default class SyncClient extends EventEmitter {
  connection: WebSocket | null = null;

  ip: string;

  port: number;

  async connect(ip, port) {
    return new Promise((resolve, reject) => {
      if (this.connection) {
        this.disconnect();
      }

      try {
        this.connection = new WebSocket(`ws://${ip}:${port}`);
        this.ip = ip;
        this.port = port;
      } catch (e) {
        reject(e);
        return;
      }

      const onOpen = () => {
        this.emit('connected', ip, port);
        resolve();
      };

      const onError = (error: Error) => {
        reject(error);
      };

      const onClose = () => {
        this.emit('disconnected', ip, port);
      };

      this.connection.onopen = onOpen;
      this.connection.onmessage = this.onMessage.bind(this);
      this.connection.onerror = onError;
      this.connection.onclose = onClose;
    });
  }

  disconnect() {
    this.connection?.close();
    this.connection = null;
  }

  isConnected() {
    return this.connection?.readyState === 1;
  }

  send(message: SyncMessage) {
    this.connection?.send(JSON.stringify(message));
  }

  onMessage(event: MessageEvent) {
    const req = JSON.parse(event.data);

    if (req.action) {
      this.emit(`msg-${req.msg}`, req);
    }

    this.emit('message', req);
  }
}
