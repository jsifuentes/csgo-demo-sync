/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import { IpcToRenderer } from '../Enums';
import { DemoStatus } from '../CSGOClient';
import SyncConnectionContext, { SyncConnection } from './Contexts';

const useStyles = makeStyles({
  statusBar: {
    background: '#dedede',
    padding: 12,
    fontSize: 12,
    borderBottom: '1px solid #c5c5c5',
  },
  statusRow: {
    clear: 'both',
    '&:after': {
      content: '""',
      clear: 'both',
      display: 'table',
    },
  },
  statusLabel: {
    display: 'inline-block',
    float: 'left',
    fontWeight: 700,
  },
  statusValue: {
    display: 'inline-block',
    float: 'right',
  },
});

function StatusRow(props) {
  const { statusLabel, statusValue } = props;
  const classes = useStyles();

  return (
    <div className={classes.statusRow}>
      <div className={classes.statusLabel}>{statusLabel}</div>
      <div className={classes.statusValue}>{statusValue}</div>
    </div>
  );
}

function CSGOStatus() {
  const defaultStatus = 'Not connected to CSGO';
  const [csgoStatus, setCSGOStatus] = useState(defaultStatus);

  useEffect(() => {
    const onReceivedStatusUpdate = (
      event,
      status,
      demoStatus: DemoStatus | undefined
    ) => {
      let phrase;

      if (!status) {
        phrase = defaultStatus;
      } else if (demoStatus?.currentlyPlaying) {
        phrase = `Currently playing ${demoStatus.fileName} (${demoStatus.currentTick} / ${demoStatus.totalTicks})`;
      } else {
        phrase = 'Waiting for a demo to start playing';
      }

      setCSGOStatus(phrase);
    };

    ipcRenderer.on(IpcToRenderer.CSGOConnectionStatus, onReceivedStatusUpdate);

    return () => {
      ipcRenderer.removeListener(
        IpcToRenderer.CSGOConnectionStatus,
        onReceivedStatusUpdate
      );
    };
  }, []);

  return <StatusRow statusLabel="CSGO Connection" statusValue={csgoStatus} />;
}

function SyncClientStatus() {
  return (
    <SyncConnectionContext.Consumer>
      {([syncConnection]: [SyncConnection]) => {
        const value = syncConnection.connected
          ? `Connected to ${syncConnection.ip}:${syncConnection.port}`
          : `Disconnected`;

        return <StatusRow statusLabel="Sync Server" statusValue={value} />;
      }}
    </SyncConnectionContext.Consumer>
  );
}

export default function StatusBar(props) {
  const { display } = props;
  const classes = useStyles();

  return (
    <Box className={classes.statusBar} display={display}>
      {/* <CSGOStatus /> */}
      <SyncClientStatus />
    </Box>
  );
}
