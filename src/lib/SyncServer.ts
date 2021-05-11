import WebSocket, { Server } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { WebsocketMessageType } from './Enums';

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
  msg: WebsocketMessageType | WebsocketMessageType;
  [key: string]: unknown;
}

export interface DestroyRoomMessage extends SyncMessage {
  roomId: string;
}

export interface CreateRoomResponse extends SyncMessage {
  roomId: string;
}

export interface CurrentlyPlaying {
  currentlyPlaying: boolean;
  currentTick?: number;
  totalTicks?: number;
  fileName?: string;
  totalPlaytimeMinutes?: number;
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
        JSON.stringify({ msg: WebsocketMessageType.Ready })
      );
      this.emit('connected', connectionId, req);
    });

    this.server.on('listening', () => this.emit('listening', port));
    this.server.on('error', this.emit.bind(this, 'error'));

    this.setupMessageHandlers();
  }

  stopServer() {
    this.server?.close();
    this.emit('closed');
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
    this.on(`message-${WebsocketMessageType.CreateRoom}`, this.onCreateRoom);
    this.on(`message-${WebsocketMessageType.DestroyRoom}`, this.onDestroyRoom);
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

    const response: CreateRoomResponse = {
      msg: WebsocketMessageType.RoomCreated,
      roomId,
    };

    this.send(connectionId, response);
  }

  onDestroyRoom(_connectionId: string, message: DestroyRoomMessage) {
    if (!message.roomId) {
      return;
    }

    const { roomId } = message;
    const room: Room = this.rooms[roomId];

    if (room.members.length > 0) {
      // Tell everyone that the room is destroyed.
      room.members.forEach((memberId) => {
        this.send(memberId, {
          msg: WebsocketMessageType.RoomDestroyed,
          roomId,
        });
      });
    }

    delete this.rooms[roomId];
  }
}
