/* eslint-disable react/prop-types */
import { makeStyles } from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles({
  root: {
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    margin: 0,
  },
  subTitle: {
    margin: '4px 0',
    fontSize: 13,
  },
});

const Title = (props) => {
  const { title, subTitle } = props;
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <h1 className={classes.title}>{title}</h1>
      {subTitle ? <p className={classes.subTitle}>{subTitle}</p> : ''}
    </div>
  );
};

export default Title;
