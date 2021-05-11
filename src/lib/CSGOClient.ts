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
    });
  }

  isConnected() {
    return this.socket?.readyState === 'open';
  }

  onError(e: Error) {
    this.emit('error', e);
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
    let matches;
    let returnVal = utf8Data;

    for (let i = 0; i < indexes.length; i += 1) {
      const {
        response,
        resolve,
      }: {
        response: RegExp | string;
      } = this.waitingForResponses[indexes[i]];

      if (response instanceof RegExp) {
        matches = [...utf8Data.matchAll(response)];
        // doesn't match regex
        if (!matches.length) {
          return;
        }
        returnVal = [utf8Data, matches];
      } else if (utf8Data.indexOf(response) === -1) {
        return;
      }

      delete this.waitingForResponses[indexes[i]];
      resolve(returnVal);
    }
  }

  send(command: string, responsePattern: RegExp | string) {
    if (!this.socket || !this.isConnected()) {
      throw new Error('Not connected yet.');
    }

    this.socket?.write(`${command}\n`);
    return this.waitForResponse(responsePattern, 1000);
  }

  async getDemoTickInfo() {
    const regex = /Currently playing ([0-9]+) of ([0-9]+) ticks. Minutes:([0-9]+\.[0-9]+) File:([A-Za-z0-9-_.]+)/gm;

    let matches = [];

    try {
      [, matches] = await this.send('demo_goto', regex);
    } catch (e) {
      if (e.message.indexOf('Timed out') === -1) {
        throw e;
      }
    }

    const demoStatus: DemoStatus = {};
    if (matches.length === 0) {
      demoStatus.currentlyPlaying = false;
    } else {
      const [
        ,
        currentTick,
        totalTicks,
        totalPlaytimeMinutes,
        fileName,
      ] = matches[0];

      demoStatus.currentlyPlaying = true;
      demoStatus.currentTick = parseInt(currentTick, 10);
      demoStatus.totalTicks = parseInt(totalTicks, 10);
      demoStatus.totalPlaytimeMinutes = parseFloat(totalPlaytimeMinutes);
      demoStatus.fileName = fileName;
    }

    return demoStatus;
  }
}
