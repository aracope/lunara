import React from 'react';
import { Outlet } from 'react-router-dom';

import './styles/variables.css';
import './styles/base.css';
import './styles/utilities.css';
import './styles/forms.css';
import './styles/buttons.css';
import './styles/surfaces.css';

export default function App() {
  return (
    <>
      <main>
        <Outlet />
      </main>
    </>
  );
}
