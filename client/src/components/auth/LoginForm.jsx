import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const schema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  displayName: Yup.string().max(60, 'Max 60 chars').nullable(),
  password: Yup.string().min(8, 'Min 8 chars').required('Required')
});

export default function LoginForm() {
  const { login } = useAuth();

  return (
    <Formik
      initialValues={{ email: '', displayName: '', password: '' }}
      validationSchema={schema}
      onSubmit={async (values, { setStatus, setSubmitting }) => {
        setStatus(undefined);
        try {
          await login(values.email, values.password);
        } catch (err) {
          setStatus(err.message || 'Login failed');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status }) => (
        <Form className="auth-form">
          <label>Email</label>
          <Field name="email"
            placeholder="email" />
          <ErrorMessage name="email"
            component="div"
            className="form-error" />

          <label>Password</label>
          <Field name="password"
            type="password"
            placeholder="password" />
          <ErrorMessage name="password"
            component="div"
            className="form-error" />

          <button type="submit"
            disabled={isSubmitting}>Login</button>
          {status && <div className="form-status">{status}</div>}
        </Form>
      )}
    </Formik>
  );
}