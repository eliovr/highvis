import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SpiralApp from './SpiralApp';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<SpiralApp />, div);
});
