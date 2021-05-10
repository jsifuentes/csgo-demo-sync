import React from 'react';
import { Button, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    textAlign: 'center',
  },
  button: {
    width: 300,
    height: 48,
    padding: '0 30px',
    marginRight: 8,
    marginBottom: 8,
  },
});

const JoinRoom = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Button
        className={classes.button}
        color="primary"
        component={Link}
        to="/"
      >
        Go Back
      </Button>
    </div>
  );
};

export default JoinRoom;
