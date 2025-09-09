import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Formik, Form, Field, ErrorMessage } from 'formik';
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

  return (
    <Formik
      initialValues={{ email: "", displayName: "", password: "" }}
      validationSchema={schema}
      onSubmit={async (values, { setStatus, setSubmitting }) => {
        setStatus(undefined);
        const { email, password, displayName } = values;
        try {
          await signup(
            email,
            password,
            displayName?.trim() ? displayName.trim() : undefined
          );
        } catch (err) {
          setStatus(err.message || "Signup failed");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status, errors, touched }) => (
        <Form className="auth-form" noValidate>
          <label htmlFor="email">Email</label>
          <Field
            id="email"
            name="email"
            placeholder="email"
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

          <label htmlFor="displayName">Display name (optional)</label>
          <Field
            id="displayName"
            name="displayName"
            placeholder="display name"
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

          <label htmlFor="password">Password</label>
          <Field
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={touched.password && !!errors.password}
            aria-describedby={
              touched.password && errors.password ? "password-error" : undefined
            }
          />
          <ErrorMessage
            id="password-error"
            name="password"
            component="div"
            className="form-error"
          />

          <button type="submit" disabled={isSubmitting}>
            Create account
          </button>

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
