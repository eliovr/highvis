import * as React from 'react';
import DeviseApp from './DeviseApp';
import SpiralApp from './SpiralApp';
import PerspectiveApp from './PerspectiveApp';
import { Router, Route, Link } from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';

class App extends React.Component {
  render() {
    const history = createHistory();
    let width = 1500, height = 800;

    return (
      <Router history={history}>
      <div className="Container">
        <Route path={process.env.PUBLIC_URL + '/'} exact={true} render={() => (
          <ul className="list-group">
            <li><Link className="list-group-item" to={process.env.PUBLIC_URL + '/spiral'}>Spiral</Link></li>
            <li><Link className="list-group-item" to={process.env.PUBLIC_URL + '/devise'}>Devise</Link></li>
            <li><Link className="list-group-item" to={process.env.PUBLIC_URL + '/perspective'}>Perspective</Link></li>
          </ul>
        )}/>
        <Route path={process.env.PUBLIC_URL + '/spiral'} render={({match}) => (<SpiralApp width={width} height={height} />)} />
        <Route path={process.env.PUBLIC_URL + '/devise'} render={({match}) => (<DeviseApp width={width} height={height} />)} />
        <Route path={process.env.PUBLIC_URL + '/perspective'} render={({match}) => (<PerspectiveApp width={width} height={height} />)} />
      </div>
      </Router>
    );
  }
}

export default App;