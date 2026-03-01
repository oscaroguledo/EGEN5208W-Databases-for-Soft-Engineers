import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { Toaster } from 'sonner';
import { App } from './App';
import { ThemeProvider } from './components/ThemeProvider';
render(
  <ThemeProvider>
    <App />
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        duration: 3500,
        style: {
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      }} />

  </ThemeProvider>,
  document.getElementById('root')
);