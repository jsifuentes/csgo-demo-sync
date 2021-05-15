/* eslint-disable react/prop-types */
import React from 'react';
import { Button, makeStyles } from '@material-ui/core';
import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace';
import { Link } from 'react-router-dom';

const useStyles = makeStyles({
  backButton: {
    minWidth: 36,
    float: 'left',
  },
});

const BackButton = (props) => {
  const classes = useStyles();
  const { url, onClick } = props;

  return (
    <Button
      className={classes.backButton}
      component={Link}
      to={url}
      onClick={onClick}
    >
      <KeyboardBackspaceIcon />
    </Button>
  );
};

export default BackButton;
