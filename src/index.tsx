import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import DeviseApp from './DeviseApp';
import SpiralApp from './SpiralApp';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

ReactDOM.render(
  <SpiralApp />,
  // <DeviseApp />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
