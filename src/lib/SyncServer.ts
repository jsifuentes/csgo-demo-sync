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

interface Connection {
  websocket: WebSocket;
  currentRoom?: string | null;
}

export interface SyncMessage {
  msg: WebsocketMessageType | WebsocketMessageType;
  [key: string]: unknown;
}

export interface JoinRoomMessage extends SyncMessage {
  roomId: string;
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
  creator: string;
  members: string[];
  currentlyPlaying: CurrentlyPlaying;
}

export default class SyncServer extends EventEmitter {
  server: Server | null = null;

  connections: Record<string, Connection> = {};

  rooms: Record<string, Room> = {
    ABCDEF: {
      creator: 'doesnt matter',
      members: [],
      currentlyPlaying: {
        currentlyPlaying: false,
      },
    },
  };

  constructor() {
    super();
    this.emit('ready');
  }

  startServer(port: number) {
    this.server?.close();
    this.server = new Server({ port });

    this.server.on('connection', (ws, req) => {
      const connectionId = uuidv4();
      const connection: Connection = {
        websocket: ws,
        currentRoom: null,
      };

      ws.on('message', (message: string) =>
        this.handleMessage(connectionId, message)
      );
      ws.on('close', () => this.emit('disconnected', connectionId));
      ws.send(JSON.stringify({ msg: WebsocketMessageType.Ready }));

      this.connections[connectionId] = connection;
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
    const connection = this.connections[connectionId];

    if (!connection) {
      return;
    }

    connection.websocket.send(JSON.stringify(message));
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
    this.on(`message-${WebsocketMessageType.JoinRoom}`, this.onJoinRoom);
    // this.on(`message-${WebsocketMessageType.SetRoomDemo}`, this.onSetRoomDemo);
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
      creator: connectionId,
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

  onJoinRoom(connectionId: string, message: JoinRoomMessage) {
    if (!message.roomId) {
      return;
    }

    const { roomId }: { roomId?: string } = message;
    const room: Room = this.rooms[roomId];

    if (!room) {
      this.send(connectionId, {
        msg: WebsocketMessageType.RoomFailedToJoin,
        error: 'Room does not exist.',
      });
      return;
    }

    if (room.creator !== connectionId) {
      this.leaveRoom(connectionId);
      room.members.push(connectionId);
      this.connections[connectionId].currentRoom = roomId;

      this.send(connectionId, {
        msg: WebsocketMessageType.RoomJoined,
        roomId,
      });
    }
  }

  onDestroyRoom(connectionId: string, message: DestroyRoomMessage) {
    if (!message.roomId) {
      return;
    }

    const { roomId }: { roomId?: string } = message;
    const room: Room = this.rooms[roomId];

    if (!room || room.creator !== connectionId) {
      return;
    }

    this.destroyRoom(roomId);
  }

  destroyRoom(roomId: string) {
    this.messageRoom(roomId, {
      msg: WebsocketMessageType.DestroyRoom,
      roomId,
    });

    delete this.rooms[roomId];
  }

  messageRoom(roomId: string, message: SyncMessage, includeCreator = false) {
    const room = this.rooms[roomId];

    if (!room) {
      return;
    }

    const sendTo = this.rooms[roomId]?.members || [];

    if (includeCreator) {
      sendTo.push(room.creator);
    }

    sendTo.forEach((memberId) => {
      this.send(memberId, message);
    });
  }

  leaveRoom(connectionId: string) {
    const connection = this.connections[connectionId];

    if (!connection || !connection.currentRoom) {
      return;
    }

    const { currentRoom } = connection;
    const room = this.rooms[currentRoom];

    if (!room) {
      // weird.
      connection.currentRoom = null;
    } else if (room.creator === connectionId) {
      // also weird.
      this.destroyRoom(currentRoom);
    } else {
      const index = room.members.indexOf(connectionId);
      const message: SyncMessage = {
        msg: WebsocketMessageType.LeftRoom,
        roomId: currentRoom,
        connectionId,
      };

      if (index > -1) {
        room.members.splice(index, 1);
        this.messageRoom(currentRoom, message);
      }

      this.send(connectionId, message);
    }
  }
}
