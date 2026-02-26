import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { Toaster } from 'sonner';

// Ensure dark mode is applied before first paint
if (!document.documentElement.classList.contains('dark')) {
  document.documentElement.classList.add('dark');
}

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
          },
        }}
      />
    </AppProvider>
  );
}