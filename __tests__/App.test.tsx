/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  jest.useFakeTimers();
  let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;

  try {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
  } finally {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    jest.useRealTimers();
  }
});
