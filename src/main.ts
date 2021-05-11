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
import LocalSyncServer from './lib/SyncServer';
import Windows from './lib/Windows';
import {
  ConfigurationKey,
  IpcToMain,
  IpcToRenderer,
  WebsocketMessageType,
  WindowTypes,
} from './lib/Enums';
import CSGOClient from './lib/CSGOClient';
import SyncClient, { SyncMessage } from './lib/SyncClient';

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
  [ConfigurationKey.LocalCSGOTelnetPort]: 2121,
  [ConfigurationKey.SyncServerIP]: 'csgo-demo-sync.com',
  [ConfigurationKey.SyncServerPort]: 3113,
};

/**
 * Create some new instances and flags.
 */
const settings = new Store({
  defaults: DEFAULT_CONFIG,
  projectName: 'csgo-demo-sync',
});
const windows: Windows = new Windows();
const localSyncServer: LocalSyncServer = new LocalSyncServer();
const syncClient: SyncClient = new SyncClient();
const csgoClient: CSGOClient = new CSGOClient();

let shouldTellSyncServerOnCsgoUpdate = false;

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
  localSyncServer.on('listening', (port: number) =>
    sendToLocalSyncServerManagerWindow(
      IpcToRenderer.StartedLocalSyncServer,
      port
    )
  );
  localSyncServer.on('closed', () =>
    sendToLocalSyncServerManagerWindow(IpcToRenderer.StoppedLocalSyncServer)
  );
  localSyncServer.on('error', (error: Error) =>
    sendToLocalSyncServerManagerWindow(
      IpcToRenderer.ErrorStartingLocalSyncServer,
      error
    )
  );
  localSyncServer.on(
    'connected',
    (connectionId: string, req: IncomingMessage) =>
      sendToLocalSyncServerManagerWindow(
        undefined,
        `[${connectionId}] New connection from ${req.socket.remoteAddress}`
      )
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
const launchLocalServerManager = (event) => {
  windows.createWindow(WindowTypes.LocalSyncServer, {
    width: 550,
    height: 350,
  });
  event.sender.send(IpcToRenderer.LaunchedLocalSyncServer);
};

const changeConfiguration = (event, key: ConfigurationKey, value: unknown) => {
  console.log(`Changing configuration: ${key} => ${value}`);
  settings.set(key, value);
};

const sendToSyncServer = (message: SyncMessage) => {
  if (!syncClient.isConnected()) {
    return;
  }

  syncClient.send(message);
};

const startUpdatingRoom = () => {
  shouldTellSyncServerOnCsgoUpdate = true;
};

const stopUpdatingRooms = () => {
  shouldTellSyncServerOnCsgoUpdate = false;
};

const sendSyncStatus = () => {
  console.log('sure');
  sendToMainWindow(
    IpcToRenderer.SyncConnectionStatus,
    syncClient.isConnected(),
    syncClient.ip,
    syncClient.port
  );
};

const createIpcListeners = () => {
  ipcMain.on(IpcToMain.LaunchLocalSyncServer, launchLocalServerManager);
  ipcMain.on(IpcToMain.StartLocalSyncServer, (_event, port: number) =>
    localSyncServer.startServer(port)
  );
  ipcMain.on(IpcToMain.StopLocalSyncServer, () => localSyncServer.stopServer());
  ipcMain.on(IpcToMain.ChangeConfiguration, changeConfiguration);
  ipcMain.on(IpcToMain.SyncServerSend, (_, m) => sendToSyncServer(m));
  ipcMain.on(IpcToMain.StartUpdatingRoom, startUpdatingRoom);
  ipcMain.on(IpcToMain.StopUpdatingRooms, stopUpdatingRooms);
  ipcMain.on(IpcToMain.SendSyncStatusPlease, sendSyncStatus);
};

const createSyncClientListeners = () => {
  syncClient.on('message', (message: SyncMessage) => {
    sendToMainWindow(
      `${IpcToRenderer.SyncServerReceive}-${message.msg}`,
      message
    );
  });

  syncClient.on('connected', sendSyncStatus);
  syncClient.on('disconnected', sendSyncStatus);
};

const connectToSyncServer = async () => {
  if (syncClient.isConnected()) {
    return;
  }

  const syncServerIp = await settings.get(ConfigurationKey.SyncServerIP);
  const syncServerPort = await settings.get(ConfigurationKey.SyncServerPort);

  console.log(`Trying to connect to ${syncServerIp}:${syncServerPort}`);

  try {
    await syncClient.connect(syncServerIp, syncServerPort);
  } catch (e) {
    // timed out probably.
  }
};

const connectToCSGO = async () => {
  if (csgoClient.isConnected()) {
    return;
  }

  const csgoTelnetPort = await settings.get(
    ConfigurationKey.LocalCSGOTelnetPort
  );

  try {
    await csgoClient.connect(csgoTelnetPort);
    sendToMainWindow(IpcToRenderer.ConnectedToCSGO);
  } catch (e) {
    // timed out probably.
  }
};

const updateCsgoData = async () => {
  const status = csgoClient.isConnected();
  let demoStatus: DemoStatus = {
    currentlyPlaying: false,
  };

  sendToMainWindow(IpcToRenderer.CSGOConnectionStatus, status, demoStatus);

  // Should we send to sync server?
  if (shouldTellSyncServerOnCsgoUpdate) {
    if (status) {
      demoStatus = await csgoClient.getDemoTickInfo();
    }

    sendToSyncServer({
      msg: WebsocketMessageType.RoomDemoState,
      demoStatus,
    });
  }
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
  setInterval(updateCsgoData, 150);
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
