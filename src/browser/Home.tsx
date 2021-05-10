import React, { useEffect } from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import SyncConnectionContext, { SyncConnection } from './Contexts';
import { ConfigurationKey, IpcToMain } from '../Enums';

const useStyles = makeStyles({
  wrapper: {
    textAlign: 'center',
  },
  button: {
    width: 300,
    height: 48,
    padding: '0 30px',
    marginBottom: 16,
    background: '#5d79ae',

    '&:hover': {
      background: '#334b77',
    },
  },
  statusbar: {
    background: '#dedede',
    padding: 10,
    marginBottom: 12,
    fontSize: 12,
  },
  statuslabel: {
    fontWeight: 700,
  },
});

export default function Home() {
  const classes = useStyles();

  const launchLocalServer = () => {
    ipcRenderer.send(IpcToMain.LaunchLocalSyncServer);
    ipcRenderer.send(
      IpcToMain.ChangeConfiguration,
      ConfigurationKey.SYNC_SERVER_IP,
      '127.0.0.1'
    );
    ipcRenderer.send(
      IpcToMain.ChangeConfiguration,
      ConfigurationKey.SYNC_SERVER_PORT,
      3113
    );
  };

  return (
    <SyncConnectionContext.Consumer>
      {(context) => {
        const [syncConnectionStatus]: [SyncConnection] = context;

        return (
          <div className={classes.root}>
            <div>
              <Button
                className={classes.button}
                color="primary"
                variant="contained"
                component={Link}
                to="/start"
                disabled={!syncConnectionStatus.connected}
              >
                Start a New Session
              </Button>
            </div>
            <div>
              <Button
                className={classes.button}
                color="primary"
                variant="contained"
                component={Link}
                to="/join"
                disabled={!syncConnectionStatus.connected}
              >
                Join a Session
              </Button>
            </div>

            <Button
              className={classes.launchLocalServer}
              onClick={launchLocalServer}
            >
              Launch Local Server
            </Button>
          </div>
        );
      }}
    </SyncConnectionContext.Consumer>
  );
}
