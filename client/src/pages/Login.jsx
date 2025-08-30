import React from 'react';
import LoginForm from '../components/auth/LoginForm.jsx';
import './Login.css';

export default function Login() {
  return (
    <section className="login">
      <div className="login__wrap">
        {/* Left: brand / mood */}
        <aside className="login__brand">
          <div className="login__brand-inner">
            <h1 className="login__title metal-text sheen">Lunara</h1>
            <p className="login__subtitle">
              Sign in to your Book of Shadows to journal, pull a daily card, and track tonight's moon.
            </p>
          </div>
        </aside>

        {/* Right: centered, form column */}
        <div className="login__card">
          <header className="login__form-head">
            <h2 className="login__form-title">Welcome back</h2>
            <p className="login__form-subtitle">Log in to continue your practice</p>
          </header>

          <div className="login__form">
            <LoginForm />
            <p className="login__hint">
              New here? <a href="/signup">Create an account</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
