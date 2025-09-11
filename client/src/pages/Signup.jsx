import React from 'react';
import '../styles/forms.css';
import '../styles/AuthLayout.css';
import './Signup.css';
import SignupForm from '../components/auth/SignupForm.jsx';

/**
 * Signup page
 *
 * Purpose:
 *  - Presents the same branded two-column layout as Login.
 *  - Hosts a simple, controlled signup form that calls api.signup.
 *
 * Structure:
 *  - Left: brand/mood copy (title + subtitle).
 *  - Right: card with page title, subtitle, and form.
 *
 * Usage:
 *  - Public route at "/signup".
 */

export default function Signup() {
  return (
    <section className="auth signup">
      <div className="auth__wrap">
        {/* Left: brand / mood */}
        <aside className="auth__brand">
          <div className="auth__brand-inner">
            <h1 className="auth__title metal-text sheen">Lunara</h1>
            <p className="auth__subtitle">
              Create your account to start journaling, pull daily cards, and track the moon.
            </p>
          </div>
        </aside>

        {/* Right: card with form */}
        <div className="auth__card">
          <header className="signup__form-head">
            <h2 className="signup__form-title">Create an account</h2>
            <p className="signup__form-subtitle">Join and continue your practice</p>
          </header>

          <SignupForm />
        </div>
      </div>
    </section>
  );
}

