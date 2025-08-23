import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';

import './App.css';
import './styles/variables.css';
import './styles/base.css';
import './styles/utilities.css';
import './styles/forms.css';

export default function App() {
  return (
    <div id="navbar" className="app-root">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
