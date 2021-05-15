/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import Check from '@material-ui/icons/Check';
import Close from '@material-ui/icons/Close';
import { IpcToRenderer } from '../../lib/Enums';
import { DemoStatus } from '../../lib/CSGOClient';
import SyncConnectionContext, { SyncConnection } from '../Contexts';

const useStyles = makeStyles({
  statusBar: {
    background: '#dedede',
    padding: '0 8px',
    fontSize: 12,
    borderBottom: '1px solid #c5c5c5',
  },
  statusRow: {
    clear: 'both',
    padding: '5px 0',
    borderBottom: '1px solid #ccc',
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
    float: 'right',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',

    '& svg': {
      fontSize: '16px',
      marginRight: 2,
    },
  },
  bad: {
    color: '#ff0000',
  },
  good: {
    color: '#009800',
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

function Connected() {
  const classes = useStyles();
  return (
    <>
      <Check className={classes.good} /> Connected
    </>
  );
}

function Disconnected() {
  const classes = useStyles();
  return (
    <>
      <Close className={classes.bad} /> Disconnected
    </>
  );
}

function CSGOStatus() {
  const [csgoStatus, setCSGOStatus] = useState(<Disconnected />);

  useEffect(() => {
    const onReceivedStatusUpdate = (event, status) => {
      const phrase = !status ? <Disconnected /> : <Connected />;
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
        const status = syncConnection.connected;
        const phrase = !status ? <Disconnected /> : <Connected />;

        return <StatusRow statusLabel="Sync Server" statusValue={phrase} />;
      }}
    </SyncConnectionContext.Consumer>
  );
}

export default function StatusBar(props) {
  const { display } = props;
  const classes = useStyles();

  return (
    <Box className={classes.statusBar} display={display}>
      <CSGOStatus />
      <SyncClientStatus />
    </Box>
  );
}
