import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { UpvoteWidget } from './components/UpvoteWidget';
import { Toaster } from 'sonner';

// Ensure dark mode is applied before first paint
if (!document.documentElement.classList.contains('dark')) {
  document.documentElement.classList.add('dark');
}

function UpvoteWidgetMount() {
  const { authUser } = useApp();
  return <UpvoteWidget userId={authUser?.id} email={authUser?.email} />;
}

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <UpvoteWidgetMount />
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
