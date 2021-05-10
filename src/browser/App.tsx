/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import JoinRoom from './JoinRoom';
import StartRoom from './StartRoom';
import LocalServerManager from './LocalServerManager';
import Home from './Home';
import StatusBar from './StatusBar';
import SyncConnectionContext, { SyncConnection } from './Contexts';
import { IpcToRenderer } from '../Enums';

const useStyles = makeStyles({
  wrapper: {
    textAlign: 'center',
    padding: 16,
  },
});

export default function App() {
  const classes = useStyles();
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const syncConnectionState = useState(false);
  const [, setSyncConnection] = syncConnectionState;

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

      setSyncConnection(sc);
    };

    ipcRenderer.on(IpcToRenderer.SyncConnectionStatus, onReceivedStatusUpdate);

    return () => {
      ipcRenderer.removeListener(
        IpcToRenderer.SyncConnectionStatus,
        onReceivedStatusUpdate
      );
    };
  }, []);

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
              path="/"
              component={() => <ContextedComponent Component={<Home />} />}
            />
            <Route
              exact
              path="/start"
              component={() => <ContextedComponent Component={<StartRoom />} />}
            />
            <Route
              exact
              path="/join"
              component={() => <ContextedComponent Component={<JoinRoom />} />}
            />
            <Route
              exact
              path="/local-server"
              component={() => (
                <ContextedComponent
                  Component={
                    <LocalServerManager
                      setStatusBarVisible={setStatusBarVisible}
                    />
                  }
                />
              )}
            />
          </Switch>
        </Router>
      </Box>
    </>
  );
}
