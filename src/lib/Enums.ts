export enum Urls {
  Home = '/',
  JoinRoom = '/join',
  CreateRoom = '/start',
  LocalServerManager = '/local-server',
}

export enum WindowTypes {
  Main = 'browser/index.html',
  LocalSyncServer = `browser/index.html#/local-server`,
}

export enum ConfigurationKey {
  LocalCSGOTelnetPort = 'local_csgo_telnet_port',
  SyncServerIP = 'sync_server_ip',
  SyncServerPort = 'sync_server_port',
}

export enum WebsocketMessageType {
  // Client => Server
  CreateRoom = 'create_room',
  DestroyRoom = 'destroy_room',

  // Server => Client
  Ready = 'ready',
  RoomCreated = 'room_created',
  RoomDestroyed = 'room_destroyed',
  RoomDemoState = 'room_demo_state',
}

export enum ServerStatus {
  Started,
  Stopped,
  Starting,
  Stopping,
}

export enum IpcToRenderer {
  LaunchedLocalSyncServer = 'launched_local_server',
  ServerLogMessage = 'server_log_message',
  StartedLocalSyncServer = 'started_local_server',
  ErrorStartingLocalSyncServer = 'error_starting_local_server',
  StoppedLocalSyncServer = 'stopped_local_server',
  ConnectedToCSGO = 'connected_to_csgo',
  DisconnectedFromCSGO = 'disconnected_from_csgo',
  CSGOConnectionStatus = 'csgo_connection_status',
  SyncConnectionStatus = 'sync_connection_status',
  SyncServerReceive = 'sync_server_receive',
}

export enum IpcToMain {
  LaunchLocalSyncServer = 'launch_local_server',
  StartLocalSyncServer = 'start_local_server',
  StopLocalSyncServer = 'stop_local_server',
  ChangeConfiguration = 'change_configuration',
  SyncServerSend = 'sync_server_send',
  StartUpdatingRoom = 'start_updating_room',
  StopUpdatingRooms = 'stop_updating_rooms',
  SendSyncStatusPlease = 'send_sync_status_please',
}
