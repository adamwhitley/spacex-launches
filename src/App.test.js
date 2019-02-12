import React from 'react';

import App from './App';
import { render, cleanup, waitForElement } from 'react-testing-library';
afterEach(cleanup);

test('renders launches', async () => {
  const component = render(<App />);
  await waitForElement(() => component.getByTestId('launches'));
  expect(component).toMatchSnapshot();
});
