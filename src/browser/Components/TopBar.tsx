/* eslint-disable react/prop-types */
import { Box, makeStyles } from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles({
  root: {
    '&:after': {
      content: '""',
      display: 'table',
      clear: 'both',
    },
  },
});

export default function TopBar(props) {
  const { children } = props;
  const classes = useStyles();

  return <Box className={classes.root}>{children}</Box>;
}
