import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
// import DeviseApp from './DeviseApp';
// import SpiralApp from './SpiralApp';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

ReactDOM.render(
  <App />,
  // <SpiralApp />,
  // <DeviseApp />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
