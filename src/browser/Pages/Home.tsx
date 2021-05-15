import React from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import SyncConnectionContext, { SyncConnection } from '../Contexts';
import { ConfigurationKey, IpcToMain, Urls } from '../../lib/Enums';
import Title from '../Components/Title';

const useStyles = makeStyles({
  root: {
    paddingTop: 8,
    textAlign: 'center',
  },
  button: {
    width: 300,
    height: 48,
    padding: '0 30px',
    marginBottom: 16,
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
      ConfigurationKey.SyncServerIP,
      '127.0.0.1'
    );
    ipcRenderer.send(
      IpcToMain.ChangeConfiguration,
      ConfigurationKey.SyncServerPort,
      3113
    );
  };

  return (
    <SyncConnectionContext.Consumer>
      {(context) => {
        const [syncConnectionStatus]: [SyncConnection] = context;

        return (
          <div className={classes.root}>
            <Title
              title="CS:GO Demo Sync"
              subTitle="Get started by either creating a new room or joining an existing room."
            />

            <div>
              <Button
                className={classes.button}
                color="primary"
                variant="contained"
                component={Link}
                to={Urls.CreateRoom}
                disabled={!syncConnectionStatus.connected}
              >
                Start a New Room
              </Button>
            </div>
            <div>
              <Button
                className={classes.button}
                color="primary"
                variant="contained"
                component={Link}
                to={Urls.JoinRoom}
                disabled={!syncConnectionStatus.connected}
              >
                Join a Room
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
