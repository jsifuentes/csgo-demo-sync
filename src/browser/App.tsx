/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import JoinRoom from './Pages/JoinRoom';
import StartRoom from './Pages/StartRoom';
import ServerManager from './Pages/ServerManager';
import Home from './Pages/Home';
import StatusBar from './Components/StatusBar';
import SyncConnectionContext, { SyncConnection } from './Contexts';
import { IpcToMain, IpcToRenderer, Urls } from '../lib/Enums';

const useStyles = makeStyles({
  wrapper: {
    padding: 8,
  },
});

export default function App() {
  const classes = useStyles();
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const syncConnectionState = useState(false);
  const [syncConnection, setSyncConnection] = syncConnectionState;

  const ContextedComponent = (props) => {
    const { Component } = props;
    return (
      <SyncConnectionContext.Provider value={syncConnectionState}>
        {Component}
      </SyncConnectionContext.Provider>
    );
  };

  useEffect(() => {
    const onReceivedStatusUpdate = (
      event: never,
      status: boolean,
      server: string,
      port: number
    ) => {
      const sc: SyncConnection = {
        connected: status,
        ip: server,
        port,
      };

      if (JSON.stringify(syncConnection) !== JSON.stringify(sc)) {
        setSyncConnection(sc);
      }
    };

    ipcRenderer.on(IpcToRenderer.SyncConnectionStatus, onReceivedStatusUpdate);

    // Ask dad for the sync status
    ipcRenderer.send(IpcToMain.SendSyncStatusPlease);

    return () => {
      ipcRenderer.removeListener(
        IpcToRenderer.SyncConnectionStatus,
        onReceivedStatusUpdate
      );
    };
  }, [setSyncConnection, syncConnection]);

  return (
    <>
      <ContextedComponent
        Component={<StatusBar display={statusBarVisible ? 'block' : 'none'} />}
      />

      <Box className={classes.wrapper}>
        <Router>
          <Switch>
            <Route
              exact
              path={Urls.Home}
              component={() => <ContextedComponent Component={<Home />} />}
            />
            <Route exact path={Urls.CreateRoom} component={StartRoom} />
            <Route exact path={Urls.JoinRoom} component={JoinRoom} />
            <Route
              exact
              path={Urls.ServerManager}
              component={() => (
                <ServerManager setStatusBarVisible={setStatusBarVisible} />
              )}
            />
          </Switch>
        </Router>
      </Box>
    </>
  );
}
