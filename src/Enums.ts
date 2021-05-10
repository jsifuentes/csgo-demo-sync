export enum WindowTypes {
  Main = 'browser/index.html',
  LocalSyncServer = 'browser/index.html#/local-server',
}

export enum ConfigurationKey {
  LOCAL_CSGO_TELNET_PORT = 'local_csgo_telnet_port',
  SYNC_SERVER_IP = 'sync_server_ip',
  SYNC_SERVER_PORT = 'sync_server_port',
}

export enum WebsocketAction {
  CREATE_ROOM,
}

export enum WebsocketResponse {
  READY,
  ROOM_CREATED,
}

export enum ServerStatus {
  Started,
  Stopped,
  Starting,
  Stopping,
}

export enum IpcToRenderer {
  LaunchedLocalSyncServer = 'launched-local-server',
  ServerLogMessage = 'server-log-message',
  StartedLocalSyncServer = 'started-local-server',
  ErrorStartingLocalSyncServer = 'error-starting-local-server',
  StoppedLocalSyncServer = 'stopped-local-server',
  ConnectedToCSGO = 'connected-to-csgo',
  DisconnectedFromCSGO = 'disconnected-from-csgo',
  CSGOConnectionStatus = 'csgo-connection-status',
  SyncConnectionStatus = 'sync-connection-status',
  SyncServerReceive = 'sync-server-receive',
}

export enum IpcToMain {
  LaunchLocalSyncServer = 'launch-local-server',
  StartLocalSyncServer = 'start-local-server',
  StopLocalSyncServer = 'stop-local-server',
  ChangeConfiguration = 'change-configuration',
  SyncServerSend = 'sync-server-send',
}
