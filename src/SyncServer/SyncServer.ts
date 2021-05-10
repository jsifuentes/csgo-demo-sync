import WebSocket, { Server } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { WebsocketAction, WebsocketResponse } from '../Enums';

const createId = () => {
  const length = 5;
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * length)];
  }

  return result;
};

export interface SyncMessage {
  msg: WebsocketAction | WebsocketResponse;
  [key: string]: unknown;
}

export interface CreateRoomResponse extends SyncMessage {
  roomId: string;
}

export interface CurrentlyPlaying {
  currentlyPlaying: boolean;
  currentTick: number | null;
  totalTicks: number | null;
  fileName: string | null;
  totalPlaytimeMinutes: number | null;
}

export interface Room {
  members: string[];
  currentlyPlaying: CurrentlyPlaying;
}

export default class SyncServer extends EventEmitter {
  server: Server | null;

  connections: Record<string, WebSocket>;

  rooms: Record<string, Room>;

  constructor() {
    super();
    this.server = null;
    this.connections = {};
    this.rooms = {};
    this.emit('ready');
  }

  startServer(port: number) {
    this.server?.close();
    this.server = new Server({ port });

    this.server.on('connection', (ws, req) => {
      const connectionId = uuidv4();
      this.connections[connectionId] = ws;
      this.connections[connectionId].on('message', (message: string) =>
        this.handleMessage(connectionId, message)
      );
      this.connections[connectionId].on('close', () =>
        this.emit('disconnected', connectionId)
      );
      this.connections[connectionId].send(
        JSON.stringify({ msg: WebsocketResponse.READY })
      );
      this.emit('connected', connectionId, req);
    });

    this.server.on('listening', () => this.emit('listening', port));
    this.server.on('error', this.emit.bind(this, 'error'));

    this.setupMessageHandlers();
  }

  stopServer() {
    this.server?.close();
  }

  send(connectionId: string, message: SyncMessage) {
    this.connections[connectionId].send(JSON.stringify(message));
    this.emit('sent', connectionId, message);
  }

  handleMessage(connectionId: string, message: string) {
    const syncMessage: SyncMessage = JSON.parse(message);
    this.emit('message', connectionId, syncMessage);
    this.emit(`message-${syncMessage.msg}`, connectionId, syncMessage);
  }

  setupMessageHandlers() {
    this.on(`message-${WebsocketAction.CREATE_ROOM}`, this.onCreateRoom);
  }

  onCreateRoom(connectionId: string) {
    let roomId = null;

    while (roomId === null) {
      roomId = createId();

      if (typeof this.rooms[roomId] !== 'undefined') {
        roomId = null;
      }
    }

    this.rooms[roomId] = {
      members: [connectionId],
      currentlyPlaying: {
        currentlyPlaying: false,
      },
    };

    console.log(`Created room: ${roomId}`);

    const response: CreateRoomResponse = {
      msg: WebsocketResponse.ROOM_CREATED,
      roomId,
    };

    this.send(connectionId, response);
  }
}
