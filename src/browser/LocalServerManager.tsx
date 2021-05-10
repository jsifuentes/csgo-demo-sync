/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React from 'react';
import { Button, withStyles } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import { IpcToMain, IpcToRenderer, ServerStatus } from '../Enums';

const styles = () => ({
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
  logs: {
    width: '100%',
    height: 225,
    background: '#000',
    color: '#fff',
    overflow: 'hidden',
    overflowY: 'scroll',
    fontFamily: 'monospace',
    textAlign: 'left',
    padding: '12px',
    boxSizing: 'border-box',
    fontSize: 12,
  },
  log: {
    margin: '0 0 4px 0',
    padding: '0',
  },
});

class LocalServerManager extends React.Component {
  logsEndRef = React.createRef();

  isActuallyMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      logs: [],
      serverStatus: ServerStatus.Stopped,
    };
  }

  componentDidMount() {
    const { setStatusBarVisible } = this.props;
    this.isActuallyMounted = true;

    console.log('creating event listener');
    setStatusBarVisible(false);

    ipcRenderer.on(
      IpcToRenderer.ServerLogMessage,
      this.onServerLogMessage.bind(this)
    );
  }

  componentDidUpdate() {
    this.scrollToBottomOfLogs();
  }

  componentWillUnmount() {
    this.isActuallyMounted = false;
    ipcRenderer.removeListener(
      IpcToRenderer.ServerLogMessage,
      this.onServerLogMessage.bind(this)
    );
  }

  onServerLogMessage(event: never, message: string) {
    this.addToLog(message);
  }

  scrollToBottomOfLogs() {
    this.logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  addToLog(log) {
    if (!this.isActuallyMounted) {
      // TODO: Figure out why this function is called on an unmounted component.
      console.log('called while unmounted?');
      return;
    }
    const { logs } = this.state;
    const updateArray = [...logs];
    updateArray.push(log);
    this.setState({ logs: updateArray });
  }

  startServer() {
    this.addToLog('Starting server...');

    const onStartedLocalSyncServer = () => {
      this.addToLog(`Server is now listening for connections.`);
      this.setState({ serverStatus: ServerStatus.Started });

      ipcRenderer.removeListener(
        IpcToRenderer.ErrorStartingLocalSyncServer,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        onErrorStartingLocalSyncServer
      );
    };

    const onErrorStartingLocalSyncServer = (error: Error) => {
      this.addToLog(`Server error: ${error.message}`);
      this.setState({ serverStatus: ServerStatus.Stopped });

      ipcRenderer.removeListener(
        IpcToRenderer.StartedLocalSyncServer,
        onStartedLocalSyncServer
      );
    };

    ipcRenderer.send(IpcToMain.StartLocalSyncServer, 3113);
    ipcRenderer.once(
      IpcToRenderer.StartedLocalSyncServer,
      onStartedLocalSyncServer
    );
    ipcRenderer.once(
      IpcToRenderer.ErrorStartingLocalSyncServer,
      onErrorStartingLocalSyncServer
    );

    this.setState({ serverStatus: ServerStatus.Starting });
  }

  stopServer() {
    this.addToLog('Stopping server...');
    ipcRenderer.send(IpcToMain.StopLocalSyncServer);
    ipcRenderer.once(IpcToRenderer.StoppedLocalSyncServer, () => {
      this.addToLog('Server has been stopped.');
      this.setState({ serverStatus: ServerStatus.Stopped });
    });
    this.setState({ serverStatus: ServerStatus.Stopping });
  }

  toggleServer() {
    const { serverStatus } = this.state;

    if (serverStatus === ServerStatus.Stopped) {
      this.startServer();
    } else if (serverStatus === ServerStatus.Started) {
      this.stopServer();
    }
  }

  render() {
    const { logs, serverStatus } = this.state;
    const { classes } = this.props;

    const buttonTitle = {
      [ServerStatus.Stopped]: 'Start Server',
      [ServerStatus.Started]: 'Stop Server',
      [ServerStatus.Starting]: 'Server Starting...',
      [ServerStatus.Stopping]: 'Server Stopping...',
    };

    const isButtonDisabled =
      [ServerStatus.Starting, ServerStatus.Stopping].indexOf(serverStatus) > -1;

    return (
      <div className={classes.root}>
        <Button
          className={classes.button}
          color="primary"
          variant="contained"
          onClick={() => this.toggleServer()}
          disabled={isButtonDisabled}
        >
          {buttonTitle[serverStatus]}
        </Button>

        <div className={classes.logs}>
          {logs.map((log, i) => (
            <p className={classes.log} key={i}>
              {log}
            </p>
          ))}
          <div style={{ float: 'left', clear: 'both' }} ref={this.logsEndRef} />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(LocalServerManager);
