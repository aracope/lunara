import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm.jsx';
import '../styles/forms.css';
import '../styles/AuthLayout.css';
import './Login.css';

/**
 * Login page
 *
 * Purpose:
 *  - Presents the branded login layout and hosts the <LoginForm />.
 *  - Provides a link to the signup page for new users.
 *
 * Structure:
 *  - Left: brand/mood copy (title + subtitle).
 *  - Right: card with page title, subtitle, and <LoginForm />.
 *
 * Behavior:
 *  - All authentication logic lives inside <LoginForm />.
 *  - This page is unprotected (public) so users can sign in.
 *
 * Usage:
 *  - Route at "/login".
 */

export default function Login() {
  return (
    <section className="auth login">
      <div className="auth__wrap">
        {/* Left: brand / mood */}
        <aside className="auth__brand">
          <div className="auth__brand-inner">
            <h1 className="auth__title metal-text sheen">Lunara</h1>
            <p className="auth__subtitle">
              Sign in to your Book of Shadows to journal, pull a daily card, and track tonight's moon.
            </p>
          </div>
        </aside>

        {/* Right: centered, form column */}
        <div className="auth__card">
          <header className="login__form-head">
            <h2 className="login__form-title">Welcome back</h2>
            <p className="login__form-subtitle">Log in to continue your practice</p>
          </header>


          <LoginForm />
          <p className="login__hint">
            New here? <Link to="/signup">Create an account</Link>
          </p>

        </div>
      </div>
    </section>
  );
}
