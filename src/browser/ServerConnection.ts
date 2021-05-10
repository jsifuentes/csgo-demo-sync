import { EventEmitter } from 'events';

const createConnection = (ip: string) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${ip}`);

    setTimeout(() => {
      if (ws.readyState === 0) {
        ws.close();
        reject(new Error(`Timeout connecting to WebSocket ${ip}`));
      }
    }, 2000);

    ws.addEventListener('open', function resolver() {
      // connected.
      resolve(ws);
    });
  });
};

class ServerConnection extends EventEmitter {
  connection: Websocket | null = null;

  constructor() {
    super();
    this.emit('ready');
  }

  async connect(ip: string) {
    if (this.connection) {
      this.disconnect();
    }

    try {
      this.connection = await createConnection(ip);
    } catch (e) {
      throw new Error(`Timeout while connecting to server.`);
    }

    this.connection.addEventListener('open', this.emit.bind(this, 'open'));
    this.connection.addEventListener('close', function onClose() {
      this.connection = null;
    });
    this.connection.addEventListener('message', this.onMessage.bind(this));

    return this.connection;
  }

  disconnect() {
    this.connection?.close();
    this.connection = null;
  }

  getConnection() {
    return this.connection;
  }

  send(type, data: Record<string, unknown>) {
    this.connection.send(JSON.stringify({ msg: type, ...data }));
  }

  onMessage(event: MessageEvent) {
    const { data } = event;
    const req = JSON.parse(data);

    if (req.msg) {
      this.emit(`msg-${req.msg}`);
    }

    this.emit('message', req);
  }
}

export default new ServerConnection();
