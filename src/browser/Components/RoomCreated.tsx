/* eslint-disable react/prop-types */
import { Box, makeStyles } from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles({
  root: {},
  roomHeader: {
    borderBottom: '1px solid #dedede',
    paddingBottom: 18,
  },
  roomId: {
    fontSize: 32,
  },
  roomIdSubtext: {
    fontSize: 12,
    color: '#6d6d6d',
  },
});

export default function RoomCreated(props) {
  const { roomId } = props;
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <div className={classes.roomHeader}>
        <div className={classes.roomId}>{roomId}</div>
        <div className={classes.roomIdSubtext}>
          This is your Room ID
          <br />
          Share this with your friends so they can join
        </div>
      </div>
    </Box>
  );
}
