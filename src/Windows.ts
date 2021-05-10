import { app, BrowserWindow } from 'electron';
import path from 'path';
import { WindowTypes } from './Enums';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export default class Windows {
  windows: Record<string, BrowserWindow> = {};

  createWindow(type: WindowTypes, args: Record<string, unknown> = {}) {
    // is window already created?
    if (this.windows[type] && !this.windows[type].isDestroyed()) {
      this.windows[type].show();
      this.windows[type].focus();
      return this.windows[type];
    }

    const opts = {
      show: false,
      width: 600,
      height: 400,
      icon: getAssetPath('icon.png'),
      webPreferences: {
        nodeIntegration: true,
      },
      resizable: false,
      autoHideMenuBar: true,
      ...args,
    };

    const window = new BrowserWindow(opts);
    window.loadURL(`file://${__dirname}/${type}`);

    window.webContents.on('did-finish-load', () => {
      if (process.env.START_MINIMIZED) {
        window?.minimize();
      } else {
        window?.show();
        window?.focus();
      }
    });

    this.windows[type] = window;
    return window;
  }

  getWindows() {
    return this.windows;
  }

  getWindowIds() {
    return Object.keys(this.windows);
  }

  getWindow(id) {
    return this.windows[id]?.isDestroyed() ? null : this.windows[id];
  }

  closeAllWindows() {
    this.getWindowIds()
      .filter((x) => !this.windows[x].isDestroyed())
      .forEach((x) => this.windows[x].close());
  }
}
