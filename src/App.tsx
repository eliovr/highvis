import * as React from 'react';
import DeviseApp from './DeviseApp';
import SpiralApp from './SpiralApp';
import { Router, Route } from 'react-router';
import createHistory from 'history/createBrowserHistory';

class App extends React.Component {
  render() {
    const history = createHistory();
    let width = 1200, height = 700;

    return (
      <Router history={history}>
      <div className="App Container">
        <Route path="/" exact={true} render={() => (
          <ul>
            <li><a href="/spiral">Spiral</a></li>
            <li><a href="/devise">Devise</a></li>
          </ul>
        )}/>
        <Route path="/spiral" render={({match}) => (<SpiralApp width={width} height={height} />)} />
        <Route path="/devise" render={({match}) => (<DeviseApp width={width} height={height} />)} />
      </div>
      </Router>
    );
  }
}

export default App;