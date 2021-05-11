import React from 'react';
import { Button, makeStyles, TextField } from '@material-ui/core';
import BackButton from './BackButton';
import { Urls } from '../../lib/Enums';
import Title from './Title';

const useStyles = makeStyles({
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

const JoinRoom = () => {
  const classes = useStyles();

  return (
    <>
      <BackButton url={Urls.Home} />
      <div className={classes.root}>
        <Title
          title="Join a Room"
          subTitle="Join an existing room to watch demos in sync with a friend"
        />

        <form className={classes.form} noValidate autoComplete="off">
          <div className={classes.field}>
            <TextField label="Room ID" />
          </div>
          <div>
            <Button
              className={classes.joinButton}
              color="primary"
              variant="contained"
            >
              Join Room
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default JoinRoom;
