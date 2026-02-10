import React from 'react';
import { authAPI } from '../api';

function Login() {
  const handleLogin = () => {
    authAPI.login();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: '700',
            color: '#4f46e5',
            marginBottom: '0.5rem',
          }}>
            KaSh
          </h1>
          <p style={{ color: '#6b7280', fontSize: 'clamp(0.875rem, 3vw, 1.125rem)' }}>
            Money Management Made Simple
          </p>
        </div>

        <div style={{
          background: '#f9fafb',
          padding: '1.25rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <p style={{ color: '#4b5563', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Manage your finances with ease
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            textAlign: 'left',
            color: '#6b7280',
            fontSize: '0.8125rem',
          }}>
            <li style={{ marginBottom: '0.5rem' }}>✓ Track income and expenses</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Manage multiple accounts</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Set and monitor budgets</li>
            <li>✓ View detailed reports</li>
          </ul>
        </div>

        <button
          onClick={handleLogin}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '0.875rem',
            fontSize: '1rem',
            fontWeight: '600',
          }}
        >
          Sign in with Konnect
        </button>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.875rem',
          color: '#6b7280',
        }}>
          Secure authentication powered by Konnect Service
        </p>
      </div>
    </div>
  );
}

export default Login;
