import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallback({ onSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (error) {
      alert('Authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token && refresh) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh);
      onSuccess();
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, onSuccess]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>
          Completing authentication...
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;
