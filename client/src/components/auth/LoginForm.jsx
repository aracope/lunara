import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

/**
 * LoginForm
 *
 * Purpose:
 *  - Handles user sign-in with Formik + Yup validation.
 *  - On success, calls `login(email, password)` from AuthContext and navigates to `/dashboard`.
 *  - On failure, shows a status message from the thrown error.
 *
 * Validation (Yup):
 *  - email: required, valid email format
 *  - password: required, min length 8
 *
 * Accessibility:
 *  - Associates labels with inputs via `htmlFor` / `id`.
 *  - Surfaces inline validation via <ErrorMessage /> and proper ARIA attributes.
 *  - Server/status errors rendered in an element with `role="status"`.
 *
 * Behavior:
 *  - While submitting, disables the submit button and shows "Signing in…".
 *  - Clears any previous status on new submit.
 *
 * Usage:
 *  <LoginForm />
 *  Typically used inside the Login page routed at `/login`.
 */

const schema = Yup.object({
  email: Yup.string().email('Please enter a valid email').required('Email is required'),
  password: Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
});

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={schema}
      onSubmit={async (values, { setStatus, setSubmitting }) => {
        setStatus(undefined);
        try {
          const user = await login(values.email, values.password);
          const name =
            user?.display_name || user?.email || values.email;

          navigate("/dashboard", {
            state: { flash: `Welcome back, ${name}!` },
          });
        } catch (err) {
          setStatus(err.message || 'Login failed');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status, errors, touched }) => (
        <Form className="auth__form" noValidate>
          {/* Field stack */}
          <div className="auth__fields">
            <div className="field">
              <label htmlFor="email">Email</label>
              <Field
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
              />
              <ErrorMessage
                id="email-error"
                name="email"
                component="div"
                className="form-error"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <Field
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
              />
              <ErrorMessage
                id="password-error"
                name="password"
                component="div"
                className="form-error"
              />
            </div>

            {/* Remember + forgot row (POST MVP) */}
            <div className="login__row">
              {/* <label className="login__checkbox">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
              <a href="/reset-password">Forgot password?</a> */}
            </div>
          </div>

          {/* Actions */}
          <div className="auth__actions">
            <button
              type="submit"
              className="btn btn--metal"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Login'}
            </button>
          </div>

          {/* Status / server errors */}
          {status && (
            <div
              role="status"
              className="form-status"
            >
              {status}
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
}
