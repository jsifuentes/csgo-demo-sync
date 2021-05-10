import { createContext } from 'react';

export interface SyncConnection {
  connected: boolean;
  ip: string | null;
  port: number | null;
}

const defaultSyncConnection: SyncConnection = {
  connected: false,
};

const SyncConnectionContext = createContext(defaultSyncConnection);
export default SyncConnectionContext;
