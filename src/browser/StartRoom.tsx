/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Box, withStyles } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import {
  IpcToMain,
  IpcToRenderer,
  WebsocketAction,
  WebsocketResponse,
} from '../Enums';
import { SyncMessage } from '../SyncClient';

const onRoomCreatedEventName = `${IpcToRenderer.SyncServerReceive}-${WebsocketResponse.ROOM_CREATED}`;

const styles = () => ({
  root: {
    textAlign: 'center',
  },
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

class StartRoom extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      roomId: null,
    };
  }

  componentDidMount() {
    // Create a room.
    ipcRenderer.once(onRoomCreatedEventName, this.onRoomCreated.bind(this));
    ipcRenderer.send(IpcToMain.SyncServerSend, {
      msg: WebsocketAction.CREATE_ROOM,
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(
      onRoomCreatedEventName,
      this.onRoomCreated.bind(this)
    );
  }

  onRoomCreated(event, message: SyncMessage) {
    const { roomId } = message;
    this.setState({
      roomId,
    });
  }

  render() {
    const { classes } = this.props;
    const { roomId } = this.state;

    const waitingForRoom = (
      <Box className={classes.waitingForRoom}>
        <span>Please wait while the room is created...</span>
      </Box>
    );

    const roomCreated = (
      <Box className={classes.roomCreated}>
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

    return (
      <div className={classes.root}>
        {!roomId ? waitingForRoom : roomCreated}
      </div>
    );
  }
}

export default withStyles(styles)(StartRoom);
