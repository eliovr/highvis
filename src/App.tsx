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
      <div className="Container">
        <Route path="/" exact={true} render={() => (
          <ul className="list-group">
            <li className="list-group-item"><a href="/spiral">Spiral</a></li>
            <li className="list-group-item"><a href="/devise">Devise</a></li>
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