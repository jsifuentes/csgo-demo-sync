/* eslint-disable react/prop-types */
import { Box, makeStyles } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import React from 'react';

const useStyles = makeStyles({
  root: {
    float: 'right',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,

    '& svg': {
      fontSize: '16px',
      marginRight: 2,
    },
  },
});

export default function RoomCount(props) {
  const { count, visible } = props;
  const classes = useStyles();

  return (
    <Box visibility={!visible ? 'hidden' : 'visible'} className={classes.root}>
      <PersonIcon /> {count}
    </Box>
  );
}
