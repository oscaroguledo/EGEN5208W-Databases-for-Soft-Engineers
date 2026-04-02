import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#1e293b'
          }
        }}
      />
    </ThemeProvider>
  </StrictMode>
);