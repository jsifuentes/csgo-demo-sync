/* eslint-disable react/prop-types */
import React from 'react';
import { ipcRenderer } from 'electron';
import { Box, Button, TextField, withStyles } from '@material-ui/core';
import BackButton from './BackButton';
import {
  IpcToMain,
  IpcToRenderer,
  Urls,
  WebsocketMessageType,
} from '../../lib/Enums';
import Title from './Title';
import { SyncMessage } from '../../lib/SyncServer';

const styles = () => ({
  root: {
    textAlign: 'center',
  },
  form: {
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  joinButton: {
    width: 220,
    height: 48,
    padding: '0 30px',
    marginRight: 8,
    marginBottom: 8,
  },
});

const onRoomJoinedEventName = `${IpcToRenderer.SyncServerReceive}-${WebsocketMessageType.RoomJoined}`;
const onRoomFailedToJoinEventName = `${IpcToRenderer.SyncServerReceive}-${WebsocketMessageType.RoomFailedToJoin}`;

class JoinForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roomIdEntered: '',
      error: '',
      joining: false,
    };
    this.onRoomJoinedBinded = this.onRoomJoined.bind(this);
    this.onRoomFailedToJoinBinded = this.onRoomFailedToJoin.bind(this);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(onRoomJoinedEventName, this.onRoomJoinedBinded);
    ipcRenderer.removeListener(
      onRoomFailedToJoinEventName,
      this.onRoomFailedToJoinBinded
    );
  }

  onRoomJoined(event, message: SyncMessage) {
    const { setRoomIdJoined } = this.props;
    this.setState({
      joining: false,
    });
    setRoomIdJoined(message.roomId);
  }

  onRoomFailedToJoin(event, message: SyncMessage) {
    this.setState({
      error: message.error,
      joining: false,
    });
  }

  onTryJoinRoom() {
    const { roomIdEntered } = this.state;

    this.setState({
      joining: true,
    });

    ipcRenderer.send(IpcToMain.SyncServerSend, {
      msg: WebsocketMessageType.JoinRoom,
      roomId: roomIdEntered,
    });

    ipcRenderer.once(onRoomJoinedEventName, this.onRoomJoinedBinded);
    ipcRenderer.once(
      onRoomFailedToJoinEventName,
      this.onRoomFailedToJoinBinded
    );
  }

  onRoomIdChanged(event) {
    this.setState({
      roomIdEntered: event.target.value,
      error: '',
    });
  }

  render() {
    const { classes } = this.props;
    const { joining, error } = this.state;

    const toInputUppercase = (e) => {
      e.target.value = `${e.target.value}`.toUpperCase();
    };

    return (
      <div className={classes.root}>
        <Title
          title="Join a Room"
          subTitle="Join an existing room to watch demos in sync with a friend"
        />

        <form className={classes.form} noValidate autoComplete="off">
          <div className={classes.field}>
            <TextField
              label="Room ID"
              onChange={(e) => this.onRoomIdChanged(e)}
              placeholder="ABCDEF"
              onInput={toInputUppercase}
              disabled={joining}
            />
          </div>
          <div>
            <Button
              className={classes.joinButton}
              color="primary"
              variant="contained"
              onClick={() => this.onTryJoinRoom()}
              disabled={joining}
            >
              Join Room
            </Button>
          </div>

          <Box
            className={classes.error}
            visibility={!error ? 'hidden' : 'visible'}
          >
            {error}
          </Box>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(JoinForm);
