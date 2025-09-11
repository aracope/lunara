import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate } from "react-router-dom";
import * as Yup from 'yup';

/**
 * SignupForm
 *
 * Purpose:
 *  - Creates a new user account using Formik + Yup for form state & validation.
 *  - On submit, calls `signup(email, password, displayName?)` from AuthContext.
 *  - Trims `displayName` and passes `undefined` if it's blank (server treats it as optional).
 *
 * Validation (Yup):
 *  - email: required, valid email format ("Invalid email" / "Required")
 *  - displayName: optional, max 60 chars
 *  - password: required, min length 8
 *
 * Accessibility:
 *  - Labels are associated with inputs via `label` + `Field name`.
 *  - Inline errors rendered via <ErrorMessage /> with `.form-error`.
 *  - Server/status errors appear in `.form-status`.
 *
 * Behavior:
 *  - Disables the submit button while submitting.
 *  - Clears previous status at the start of each submission.
 *
 * Accessibility:
 *  - Labels bound via `htmlFor`/`id`.
 *  - Inline errors rendered via <ErrorMessage/> with ids.
 *  - ARIA ties inputs to their error with `aria-describedby` and `aria-invalid`.
 *  - Server/status errors in an element with `role="status"`.
 */

const schema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  displayName: Yup.string().max(60, 'Max 60 chars').nullable(),
  password: Yup.string().min(8, 'Min 8 chars').required('Required')
});

export default function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{ email: "", displayName: "", password: "" }}
      validationSchema={schema}
      onSubmit={async (values, { setStatus, setSubmitting }) => {
        setStatus(undefined);
        const { email, password, displayName } = values;
        try {
          const user = await signup(
            email,
            password,
            displayName?.trim() ? displayName.trim() : undefined
          );
          const name = user?.display_name || user?.email || email;

          // Redirect to dashboard with flash message
          navigate("/dashboard", { state: { flash: `Welcome, ${name}!` } });
        } catch (err) {
          setStatus(err.message || "Signup failed");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status, errors, touched }) => (
        <Form className="auth__form" noValidate>
          <div className="auth__fields">
            <div className="field">
              <label htmlFor="email">Email</label>
              <Field
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={
                  touched.email && errors.email ? "email-error" : undefined
                }
              />
              <ErrorMessage
                id="email-error"
                name="email"
                component="div"
                className="form-error"
              />
            </div>

            <div className="field">
              <label htmlFor="displayName">Display name (optional)</label>
              <Field
                id="displayName"
                name="displayName"
                placeholder="e.g., Ara"
                aria-invalid={touched.displayName && !!errors.displayName}
                aria-describedby={
                  touched.displayName && errors.displayName
                    ? "displayName-error"
                    : undefined
                }
              />
              <ErrorMessage
                id="displayName-error"
                name="displayName"
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
                required
                autoComplete="new-password"
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={
                  touched.password && errors.password
                    ? "password-error"
                    : undefined
                }
              />
              <ErrorMessage
                id="password-error"
                name="password"
                component="div"
                className="form-error"
              />
            </div>
          </div>

          <div className="auth__actions">
            <button
              type="submit"
              className="btn btn--metal"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create account"}
            </button>
          </div>

          {status && (
            <div role="status" className="form-status">
              {status}
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
}
