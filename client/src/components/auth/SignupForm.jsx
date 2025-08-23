import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const schema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  displayName: Yup.string().max(60, 'Max 60 chars').nullable(),
  password: Yup.string().min(8, 'Min 8 chars').required('Required')
});

export default function SignupForm() {
  const { signup } = useAuth();

  return (
    <Formik
      initialValues={{ email: '', displayName: '', password: '' }}
      validationSchema={schema}
      onSubmit={async (values, { setStatus, setSubmitting }) => {
        setStatus(undefined);
        const { email, password, displayName } = values;
        try {
          // Don’t send empty string; our server treats missing as optional
          await signup(
            email,
            password,
            displayName?.trim() ? displayName.trim() : undefined
          );
        } catch (err) {
          setStatus(err.message || 'Signup failed');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status }) => (
        <Form className="auth-form">
          <label>Email</label>
          <Field name="email"
            placeholder="email"
            autoComplete="email" />
          <ErrorMessage name="email"
            component="div"
            className="form-error" />

          <label>Display name (optional)</label>
          <Field name="displayName"
            placeholder="display name" />
          <ErrorMessage name="displayName"
            component="div"
            className="form-error" />

          <label>Password</label>
          <Field name="password"
            type="password"
            autoComplete="new-password" />
          <ErrorMessage name="password"
            component="div"
            className="form-error" />

          <button type="submit" disabled={isSubmitting}>Create account</button>

          {status && <div className="form-status">{status}</div>}
        </Form>
      )}
    </Formik>
  );
}