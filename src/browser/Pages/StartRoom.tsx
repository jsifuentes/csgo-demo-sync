/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Box, withStyles } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import {
  IpcToMain,
  IpcToRenderer,
  Urls,
  WebsocketMessageType,
} from '../../lib/Enums';
import { SyncMessage } from '../../lib/SyncClient';
import BackButton from '../Components/BackButton';
import RoomCreated from '../Components/RoomCreated';
import RoomCreating from '../Components/RoomCreating';

const onRoomCreatedEventName = `${IpcToRenderer.SyncServerReceive}-${WebsocketMessageType.RoomCreated}`;

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
    this.onRoomCreatedBinded = this.onRoomCreated.bind(this);
  }

  componentDidMount() {
    // Create a room.
    this.tryCreateRoom();
  }

  componentWillUnmount() {
    const { roomId } = this.state;

    ipcRenderer.removeListener(
      onRoomCreatedEventName,
      this.onRoomCreatedBinded
    );

    if (!roomId) {
      return;
    }

    ipcRenderer.send(IpcToMain.StopUpdatingRooms);
    ipcRenderer.send(IpcToMain.SyncServerSend, {
      msg: WebsocketMessageType.DestroyRoom,
      roomId,
    });
  }

  onRoomCreated(event, message: SyncMessage) {
    const { roomId } = message;
    ipcRenderer.send(IpcToMain.StartUpdatingRoom);
    this.setState({
      roomId,
    });
  }

  tryCreateRoom() {
    ipcRenderer.once(onRoomCreatedEventName, this.onRoomCreatedBinded);
    ipcRenderer.send(IpcToMain.SyncServerSend, {
      msg: WebsocketMessageType.CreateRoom,
    });
  }

  render() {
    const { classes } = this.props;
    const { roomId } = this.state;

    return (
      <>
        <Box>
          <BackButton url={Urls.Home} />
        </Box>
        <div className={classes.root}>
          {!roomId ? <RoomCreating /> : <RoomCreated roomId={roomId} />}
        </div>
      </>
    );
  }
}

export default withStyles(styles)(StartRoom);
