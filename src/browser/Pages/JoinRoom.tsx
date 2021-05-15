/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Box } from '@material-ui/core';
import React from 'react';
import { Urls } from '../../lib/Enums';
import BackButton from '../Components/BackButton';
import JoinForm from '../Components/JoinForm';
import RoomCount from '../Components/RoomCount';
import RoomJoined from '../Components/RoomJoined';
import TopBar from '../Components/TopBar';

export default class JoinRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roomId: null,
      roomCount: 0,
    };
    this.setRoomIdJoinedBinded = this.setRoomIdJoined.bind(this);
  }

  setRoomIdJoined(roomId) {
    this.setState({
      roomId,
      roomCount: 10,
    });
  }

  setRoomCount(roomCount) {
    this.setState({
      roomCount,
    });
  }

  render() {
    const { roomId, roomCount } = this.state;

    return (
      <>
        <TopBar>
          <BackButton url={Urls.Home} />
          <RoomCount visible={roomCount > 0} count={roomCount} />
        </TopBar>

        {!roomId ? (
          <JoinForm setRoomIdJoined={this.setRoomIdJoinedBinded} />
        ) : (
          <RoomJoined roomId={roomId} />
        )}
      </>
    );
  }
}
