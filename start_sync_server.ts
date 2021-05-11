/* eslint-disable no-console */
import { IncomingMessage } from 'http';
import SyncServer from './src/lib/SyncServer';

let reqPort = 3113;
if (process.argv.length > 2) {
  reqPort = parseInt(process.argv[2], 10) || 3113;
}

const server = new SyncServer();
server.on('listening', (port: number) => {
  console.log(`Listening on port ${port}`);
});

server.on('error', (error: Error) => {
  console.error(error);
});

server.on('connected', (connectionId: string, req: IncomingMessage) => {
  console.log(
    `[${connectionId}] New connection from ${req.socket.remoteAddress}`
  );
});

server.on('disconnected', (connectionId: string) =>
  console.log(`[${connectionId}] Disconnected.`)
);

server.on('message', (connectionId: string, message: Record<string, unknown>) =>
  console.log(`-> [${connectionId}] ${JSON.stringify(message)}`)
);
server.on('sent', (connectionId: string, message: Record<string, unknown>) => {
  return console.log(`<- [${connectionId}] ${JSON.stringify(message)}`);
});

console.log(`Starting server on port ${reqPort}...`);
server.startServer(reqPort);
