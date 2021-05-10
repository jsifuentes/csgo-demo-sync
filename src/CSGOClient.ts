import { EventEmitter } from 'events';
import { Socket } from 'net';

export interface DemoStatus {
  currentTick: number;
  totalTicks: number;
  currentlyPlaying: boolean;
  fileName: string | null;
  totalPlaytimeMinutes: number;
}

export default class CSGOClient extends EventEmitter {
  socket: Socket | null = null;

  waitingForResponses: Record<string, Record<string, unknown>> = [];

  responseIndex = 0;

  connect(port) {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.disconnect();
      }

      this.socket = new Socket();
      this.socket.connect(port, '127.0.0.1', () => {
        this.socket.removeListener('error', reject);
        this.socket.on('error', this.onError);
        resolve();
      });

      this.socket.once('error', reject);
      this.socket.on('data', this.onDataReceived.bind(this));
      this.socket.on('close', () => {
        this.socket = null;
      });
    });
  }

  isConnected() {
    return this.socket?.readyState === 'open';
  }

  onError(e: Error) {
    this.emit(error, e);
  }

  disconnect() {
    this.socket?.destroy();
    this.socket = null;
  }

  waitForResponse(response: string, timeout) {
    const currentIndex = this.responseIndex;
    this.responseIndex += 1;

    return new Promise((resolve, reject) => {
      const rejector = setTimeout(() => {
        reject(new Error(`Timed out receiving a response.`));
      }, timeout);

      this.waitingForResponses[currentIndex] = {
        response,
        resolve: (...args) => {
          clearTimeout(rejector);
          resolve(...args);
        },
      };
    });
  }

  onDataReceived(data: string) {
    const utf8Data = data.toString('utf8');
    const indexes = Object.keys(this.waitingForResponses);

    for (let i = 0; i < indexes.length; i += 1) {
      const { response, resolve } = this.waitingForResponses[indexes[i]];

      if (utf8Data.indexOf(response) > -1) {
        delete this.waitingForResponses[indexes[i]];
        resolve(utf8Data);
      }
    }
  }

  send(command, responsePattern) {
    if (!this.socket || !this.isConnected()) {
      throw new Error('Not connected yet.');
    }

    this.socket?.write(`${command}\n`);
    return this.waitForResponse(responsePattern, 1000);
  }

  async getDemoTickInfo() {
    const regex = /Currently playing ([0-9]+) of ([0-9]+) ticks. Minutes:([0-9]+\.[0-9]+) File:([A-Za-z0-9-_.]+)/gm;

    let response;
    let matches = [];

    try {
      response = await this.send('demo_goto', 'Currently playing ');
      matches = [...response.matchAll(regex)];
    } catch (e) {
      if (e.message.indexOf('Timed out') === -1) {
        throw e;
      }
    }

    const demoStatus: DemoStatus = {};
    if (matches.length === 0) {
      demoStatus.currentlyPlaying = false;
      return demoStatus;
    }

    const [
      ,
      currentTick,
      totalTicks,
      totalPlaytimeMinutes,
      fileName,
    ] = matches[0];

    return {
      currentlyPlaying: true,
      currentTick: parseInt(currentTick, 10),
      totalTicks: parseInt(totalTicks, 10),
      totalPlaytimeMinutes: parseFloat(totalPlaytimeMinutes),
      fileName,
    };
  }
}
