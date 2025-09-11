import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Journal from './pages/Journal.jsx';
import Moon from './pages/Moon.jsx';
import Tarot from './pages/Tarot.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicHome from './pages/PublicHome.jsx';
import AccountManagement from './pages/AccountManagement.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      
      { path: '/', element: <PublicHome /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/moon', element: <Moon /> },
      { path: '/tarot', element: <Tarot /> },

      // Protected group
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/journal', element: <Journal /> },
          { path: '/account', element: <AccountManagement /> }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
