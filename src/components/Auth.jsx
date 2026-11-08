import React, { useState } from 'react';
import { PBox, PBtn, PInput, PLbl } from './ui';
import { Wordmark } from './Brand';
import { supabase } from '../utils/supabaseClient';
import { PALETTE as P } from '../styles/palette';
import './auth.css';

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.9z" />
    </svg>
  );
}

const TITLES = {
  login: 'Welcome back',
  register: 'Create your account',
  forgot_password: 'Reset your password',
  update_password: 'Choose a new password',
};

/** The title in the scrapbook type: the last word is the glowing one ("Welcome <em>back</em>"). */
function Title({ text }) {
  const i = text.lastIndexOf(' ');
  return <>{text.slice(0, i + 1)}<em>{text.slice(i + 1)}</em></>;
}

const SUBMIT = {
  login: 'Sign in',
  register: 'Create account',
  forgot_password: 'Send reset link',
  update_password: 'Update password',
};

/**
 * variant "card": the sign-in card embedded in the landing's final chapter.
 * variant "page": standalone centered card (password-recovery link lands here).
 * All Supabase auth logic is unchanged from the previous version.
 */
export default function Auth({ onAuthSuccess, initialMode = 'login', variant = 'page' }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot_password', 'update_password'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!form.email || !form.password) throw new Error('Please fill in all fields');
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (authError) throw authError;
        onAuthSuccess(data.user);
      } else if (mode === 'register') {
        if (!form.name || !form.email || !form.password) throw new Error('Please fill in all fields');
        const { data, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } }
        });
        if (authError) throw authError;

        if (data.user) {
           await supabase.from('profiles').insert([{
             user_id: data.user.id,
             data: {
               name: form.name,
               defaultBaseRate: 25,
               presets: [],
               branding: { companyName: "", logoBase64: "", surfaceColor: "", bgColor: "", textColor: "", accentColor: "" }
             }
           }]);
        }
        onAuthSuccess(data.user);
      } else if (mode === 'forgot_password') {
        if (!form.email) throw new Error('Please enter your email');
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setMessage('Reset link sent. Check your email.');
      } else if (mode === 'update_password') {
        if (!form.password) throw new Error('Please enter a new password');
        const { error: updateError } = await supabase.auth.updateUser({
          password: form.password
        });
        if (updateError) throw updateError;
        setMessage('Password updated. Signing you in…');

        // Give the user a moment to see the confirmation, then reveal the dashboard
        setTimeout(async () => {
          const { data } = await supabase.auth.getUser();
          onAuthSuccess(data.user);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => { setMode(next); setError(''); setMessage(''); };

  const card = (
    <PBox bg="var(--paper)" className="auth-card" style={{ padding: 'clamp(22px, 5vw, 36px)', width: '100%', maxWidth: 460 }}>
      {variant === 'page' && (
        <div className="auth-mark">
          <Wordmark size={26} />
        </div>
      )}
      <h2 className="auth-title">
        <Title text={TITLES[mode]} />
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <PLbl>Full name</PLbl>
            <PInput
              value={form.name}
              onChange={(v) => setForm(f => ({ ...f, name: v }))}
              placeholder="Your name"
              autoComplete="name"
              aria-label="Full name"
            />
          </div>
        )}

        {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
          <div style={{ marginBottom: 16 }}>
            <PLbl>Email</PLbl>
            <PInput
              type="email"
              value={form.email}
              onChange={(v) => setForm(f => ({ ...f, email: v }))}
              placeholder="you@studio.com"
              autoComplete="email"
              aria-label="Email address"
            />
          </div>
        )}

        {(mode === 'login' || mode === 'register' || mode === 'update_password') && (
          <div style={{ marginBottom: 20 }}>
            <PLbl>{mode === 'update_password' ? 'New password' : 'Password'}</PLbl>
            <PInput
              type="password"
              value={form.password}
              onChange={(v) => setForm(f => ({ ...f, password: v }))}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-label={mode === 'update_password' ? 'New password' : 'Password'}
            />
            {mode === 'register' && <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>At least 6 characters.</div>}
            {mode === 'login' && (
              <button type="button" className="auth-link" onClick={() => switchMode('forgot_password')} style={{ marginTop: 10, marginLeft: 'auto', display: 'block' }}>
                Forgot password?
              </button>
            )}
          </div>
        )}

        {error && (
          <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-soft)', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {message && (
          <div role="status" style={{ color: 'var(--mint-deep)', background: 'var(--mint-soft)', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
            {message}
          </div>
        )}

        <PBtn full color="var(--butter)" type="submit" disabled={loading} className="auth-go" style={{ marginBottom: 16 }}>
          {loading ? 'One moment…' : SUBMIT[mode]}
        </PBtn>

        {mode === 'login' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '4px 0 16px', color: 'var(--ink-3)', fontSize: 13 }}>
              <span style={{ height: 1, background: 'var(--line-strong)', flex: 1 }} />
              or
              <span style={{ height: 1, background: 'var(--line-strong)', flex: 1 }} />
            </div>

            <PBtn full color="var(--paper)" className="lq-btn--neutral" type="button" onClick={handleGoogleLogin} disabled={loading} style={{ marginBottom: 18 }}>
              <GoogleG /> Continue with Google
            </PBtn>
          </>
        )}

        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--ink-2)' }}>
          {mode === 'login' ? (
            <>New here? <button type="button" className="auth-link" onClick={() => switchMode('register')}>Create an account</button></>
          ) : mode === 'update_password' ? null : (
            <>Back to <button type="button" className="auth-link" onClick={() => switchMode('login')}>sign in</button></>
          )}
        </div>
      </form>
    </PBox>
  );

  // The scrapbook world's page scope (.wp, src/world/pages.css): the inputs, buttons and paper tokens come from there. The standalone page sits on the scene (App draws it).
  if (variant === 'card') return <div className="wp wp--paper auth-wrap">{card}</div>;

  return (
    <div className="wp wp--paper auth-page">
      {card}
    </div>
  );
}
