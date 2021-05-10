/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { app, ipcMain } from 'electron';
import { IncomingMessage } from 'http';
import Store from 'electron-store';
import LocalSyncServer from './SyncServer/SyncServer';
import Windows from './Windows';
import {
  ConfigurationKey,
  IpcToMain,
  IpcToRenderer,
  WindowTypes,
} from './Enums';
import CSGOClient from './CSGOClient';
import SyncClient, { SyncMessage } from './SyncClient';

/**
 * Env setup.
 */

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const DEFAULT_CONFIG: Record<ConfigurationKey, unknown> = {
  [ConfigurationKey.LOCAL_CSGO_TELNET_PORT]: 2121,
  [ConfigurationKey.SYNC_SERVER_IP]: 'csgo-demo-sync.com',
  [ConfigurationKey.SYNC_SERVER_PORT]: 3113,
};

/**
 * Create some new instances.
 */
const settings = new Store({
  defaults: DEFAULT_CONFIG,
  projectName: 'csgo-demo-sync',
});
const windows: Windows = new Windows();
const localSyncServer: LocalSyncServer = new LocalSyncServer();
const syncClient: SyncClient = new SyncClient();
const csgoClient: CSGOClient = new CSGOClient();

/**
 * Handle creating the main window.
 */
const createMainWindow = () => {
  const mainWindow = windows.createWindow(WindowTypes.Main);
  mainWindow.once('closed', () => {
    windows.closeAllWindows();
  });
};

const sendToMainWindow = (type, ...args) =>
  windows.getWindow(WindowTypes.Main)?.webContents.send(type, ...args);

const sendToLocalSyncServerManagerWindow = (
  type = IpcToRenderer.ServerLogMessage,
  ...args
) =>
  windows
    .getWindow(WindowTypes.LocalSyncServer)
    ?.webContents.send(type, ...args);

/**
 * Handle Local Websocket events to pass to renderer as server log events
 */
const createLocalSyncServerListeners = () => {
  localSyncServer.on('listening', (port: number) => {
    sendToLocalSyncServerManagerWindow(
      IpcToRenderer.StartedLocalSyncServer,
      port
    );
  });
  localSyncServer.on('error', (error: Error) => {
    sendToLocalSyncServerManagerWindow(
      IpcToRenderer.ErrorStartingLocalSyncServer,
      error
    );
  });
  localSyncServer.on(
    'connected',
    (connectionId: string, req: IncomingMessage) => {
      return sendToLocalSyncServerManagerWindow(
        undefined,
        `[${connectionId}] New connection from ${req.socket.remoteAddress}`
      );
    }
  );
  localSyncServer.on('disconnected', (connectionId: string) =>
    sendToLocalSyncServerManagerWindow(
      undefined,
      `[${connectionId}] Disconnected.`
    )
  );
  localSyncServer.on(
    'message',
    (connectionId: string, message: Record<string, unknown>) =>
      sendToLocalSyncServerManagerWindow(
        undefined,
        `-> [${connectionId}] ${JSON.stringify(message)}`
      )
  );
  localSyncServer.on(
    'sent',
    (connectionId: string, message: Record<string, unknown>) =>
      sendToLocalSyncServerManagerWindow(
        undefined,
        `<- [${connectionId}] ${JSON.stringify(message)}`
      )
  );
};

/**
 * Handle messages coming in from the renderer.
 */
const createIpcListeners = () => {
  ipcMain.on(IpcToMain.LaunchLocalSyncServer, async (event) => {
    windows.createWindow(WindowTypes.LocalSyncServer, {
      width: 550,
      height: 350,
    });
    event.sender.send(IpcToRenderer.LaunchedLocalSyncServer);
  });

  ipcMain.on(IpcToMain.StartLocalSyncServer, async (event, port: number) => {
    localSyncServer.startServer(port);
  });

  ipcMain.on(IpcToMain.StopLocalSyncServer, async (event) => {
    localSyncServer.stopServer();
    event.sender.send(IpcToRenderer.StoppedLocalSyncServer);
  });

  ipcMain.on(
    IpcToMain.ChangeConfiguration,
    (event, key: ConfigurationKey, value: unknown) => {
      console.log(`Changing configuration: ${key} => ${value}`);
      settings.set(key, value);
    }
  );

  ipcMain.on(IpcToMain.SyncServerSend, (event, message: SyncMessage) => {
    syncClient.send(message);
  });
};

const createSyncClientListeners = () => {
  syncClient.on('message', (message: SyncMessage) => {
    sendToMainWindow(
      `${IpcToRenderer.SyncServerReceive}-${message.msg}`,
      message
    );
  });
};

const connectToSyncServer = async () => {
  if (syncClient.isConnected()) {
    return;
  }

  const syncServerIp = await settings.get(ConfigurationKey.SYNC_SERVER_IP);
  const syncServerPort = await settings.get(ConfigurationKey.SYNC_SERVER_PORT);

  console.log(`Trying to connect to ${syncServerIp}:${syncServerPort}`);

  try {
    await syncClient.connect(syncServerIp, syncServerPort);
    sendToMainWindow(
      IpcToRenderer.SyncConnectionStatus,
      true,
      syncServerIp,
      syncServerPort
    );
  } catch (e) {
    // timed out probably.
    sendToMainWindow(IpcToRenderer.SyncConnectionStatus, false);
  }
};

const connectToCSGO = async () => {
  if (csgoClient.isConnected()) {
    return;
  }

  const csgoTelnetPort = await settings.get(
    ConfigurationKey.LOCAL_CSGO_TELNET_PORT
  );

  try {
    await csgoClient.connect(csgoTelnetPort);
    sendToMainWindow(IpcToRenderer.ConnectedToCSGO);
    sendToMainWindow(IpcToRenderer.CSGOConnectionStatus, true);
  } catch (e) {
    // timed out probably.
    sendToMainWindow(IpcToRenderer.CSGOConnectionStatus, false);
  }
};

const getCurrentlyPlayingDemo = async () => {
  if (!csgoClient.isConnected()) {
    return;
  }

  const result = await csgoClient.getDemoTickInfo();
  sendToMainWindow(IpcToRenderer.CSGOConnectionStatus, true, result);
};

/**
 * Handle process events.
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const initializeConnections = () => {
  createLocalSyncServerListeners();
  createIpcListeners();
  createSyncClientListeners();

  setInterval(connectToCSGO, 2000);
  setInterval(connectToSyncServer, 2000);
  setInterval(getCurrentlyPlayingDemo, 1000);
};

app
  .whenReady()
  .then(createMainWindow)
  .then(initializeConnections)
  .catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindowId === null) createMainWindow();
});
