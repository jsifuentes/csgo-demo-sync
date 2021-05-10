import WebSocket, { Server } from 'ws';
import { EventEmitter } from 'events';
import { WebsocketAction, WebsocketResponse } from './Enums';
import { SyncMessage } from './SyncServer/SyncServer';

export default class SyncClient extends EventEmitter {
  connection: WebSocket | null = null;

  async connect(ip, port) {
    return new Promise((resolve, reject) => {
      if (this.connection) {
        this.disconnect();
      }

      try {
        this.connection = new WebSocket(`ws://${ip}:${port}`);
      } catch (e) {
        reject(e);
        return;
      }

      const onOpen = () => {
        this.emit('connect', ip, port);
        resolve();
      };

      const onError = (error: Error) => {
        reject(error);
      };

      this.connection.onopen = onOpen;
      this.connection.onmessage = this.onMessage.bind(this);
      this.connection.onerror = onError;
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
