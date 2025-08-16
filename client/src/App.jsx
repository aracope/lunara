import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      <NavBar />
      <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
