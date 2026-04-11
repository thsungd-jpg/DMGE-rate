import React, { useState, useCallback } from 'react';
import { PBox, PBtn, PInput, PLbl } from './ui';
import { IconStar, IconGoogle, IconCheck } from '../icons';
import { supabase } from '../utils/supabaseClient';
import GlitchLogo from './GlitchLogo';
import HexBackground from './HexBackground';
import LoadingBar from './LoadingBar';

export default function Auth({ onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot_password', 'update_password'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBooted, setIsBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    setIsBooted(true);
  }, []);

  const handleGoogleLogin = async () => {
    if (!isBooted) return;
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBooted) return;
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
               branding: { companyName: "", logoBase64: "", surfaceColor: "#1A1A1A", bgColor: "#0A0A0A", textColor: "#FFB347", accentColor: "#E91E63" }
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
        setMessage('RECOVERY LINK TRANSMITTED... CHECK COMMS');
      } else if (mode === 'update_password') {
        if (!form.password) throw new Error('Please enter a new password');
        const { error: updateError } = await supabase.auth.updateUser({
          password: form.password
        });
        if (updateError) throw updateError;
        setMessage('ENCRYPTION UPDATED... ACCESS GRANTED');
        
        // Wait for the user to see the success message, then reveal the dashboard
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

  const getTitle = () => {
    if (mode === 'login') return 'LOGIN';
    if (mode === 'register') return 'REGISTER';
    if (mode === 'forgot_password') return 'RECOVERY';
    if (mode === 'update_password') return 'NEW PASS';
    return '';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Press Start 2P', monospace",
      background: '#0A0A0A',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <HexBackground color="#FFB347" opacity={0.1} />
      
      <div style={{ maxWidth: 600, width: '100%', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <GlitchLogo text="DMGE" fontSize="clamp(1.8rem, 6vw, 3rem)" primaryColor="#FFB347" secondaryColor="#E91E63" isLoaded={isBooted} />
          <div style={{ color: isBooted ? '#E91E63' : '#FFB347', marginTop: 30, fontSize: 14, letterSpacing: '4px', transition: 'color 0.5s ease' }}>RATE SYSTEM</div>
          
          <LoadingBar primaryColor="#FFB347" secondaryColor="#E91E63" duration={2500} onComplete={handleBootComplete} style={{ marginTop: '20px' }} />

          {!isBooted && (
            <div style={{ fontFamily: "'DM Mono', monospace", color: '#888', fontSize: '10px', marginTop: '12px', letterSpacing: '2px' }}>
              INITIALIZING BOOT LOADER...
            </div>
          )}
        </div>

        <PBox 
          bg="#1A1A1A" 
          shadowColor={isBooted ? "#E91E63" : "#333"} 
          style={{ 
            padding: 'clamp(1rem, 5vw, 3rem)', 
            boxShadow: isBooted ? '12px 12px 0 #E91E63' : '12px 12px 0 #222', 
            border: `6px solid ${isBooted ? '#FFB347' : '#333'}`,
            opacity: isBooted ? 1 : 0.3,
            pointerEvents: isBooted ? 'auto' : 'none',
            transition: 'all 0.5s ease'
          }}
        >
          <div style={{ fontSize: 18, color: '#FFB347', marginBottom: 35, textAlign: 'center', letterSpacing: '2px' }}>
            <span style={{display:"flex",gap:"1rem",alignItems:"center",justifyContent:"center"}}>
              <IconStar size={24} color="#FFB347"/> {getTitle()} <IconStar size={24} color="#FFB347"/>
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom: 25 }}>
                <PLbl accent="#FFB34788">▸ FULL NAME</PLbl>
                <PInput 
                  value={form.name}
                  onChange={(v) => setForm(f => ({ ...f, name: v }))}
                  placeholder="INSERT COIN..."
                  style={{ fontSize: 14, padding: '20px', background: '#0A0A0A', border: '4px solid #FFB347', color: '#FFB347' }}
                />
              </div>
            )}
            
            {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
              <div style={{ marginBottom: 25 }}>
                <PLbl accent="#FFB34788">▸ EMAIL ADDRESS</PLbl>
                <PInput 
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm(f => ({ ...f, email: v }))}
                  placeholder="PLAYER1@DMGE.COM"
                  style={{ fontSize: 14, padding: '20px', background: '#0A0A0A', border: '4px solid #FFB347', color: '#FFB347' }}
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'update_password') && (
              <div style={{ marginBottom: 35 }}>
                <PLbl accent="#FFB34788">▸ {mode === 'update_password' ? 'NEW PASSWORD' : 'PASSWORD'}</PLbl>
                <PInput 
                  type="password"
                  value={form.password}
                  onChange={(v) => setForm(f => ({ ...f, password: v }))}
                  placeholder="******"
                  style={{ fontSize: 14, padding: '20px', background: '#0A0A0A', border: '4px solid #FFB347', color: '#FFB347' }}
                />
                {mode === 'register' && <div style={{ fontSize: 10, color: '#E91E63', marginTop: 12 }}>MINIMUM 6 CHARACTERS</div>}
                
                {mode === 'login' && (
                  <div 
                    onClick={() => setMode('forgot_password')}
                    style={{ fontSize: 10, color: '#E91E63', marginTop: 15, cursor: 'pointer', textAlign: 'right', letterSpacing: '1px' }}
                  >
                    _ FORGOT PASSWORD?
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ color: '#E91E63', fontSize: 12, marginBottom: 25, textAlign: 'center', textTransform: 'uppercase', background: 'rgba(233, 30, 99, 0.1)', padding: '10px', border: '2px solid #E91E63' }}>
                ! {error} !
              </div>
            )}

            {message && (
              <div style={{ color: '#4CAF50', fontSize: 12, marginBottom: 25, textAlign: 'center', textTransform: 'uppercase', background: 'rgba(76, 175, 80, 0.1)', padding: '10px', border: '2px solid #4CAF50', display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <IconCheck size={18} color="#4CAF50" /> {message}
              </div>
            )}

            <PBtn full color="#FFB347" type="submit" style={{ marginBottom: 25, fontSize: 18, color: '#0A0A0A' }} disabled={loading}>
              {loading ? 'LOADING...' : mode === 'login' ? 'CONNECT' : mode === 'register' ? 'INITIALIZE' : mode === 'forgot_password' ? 'SEND LINK' : 'UPDATE'}
            </PBtn>

            {mode === 'login' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 25 }}>
                   <div style={{ height: '4px', background: '#333', flexGrow: 1 }}></div>
                   <div style={{ fontSize: 10, color: '#666' }}>OR</div>
                   <div style={{ height: '4px', background: '#333', flexGrow: 1 }}></div>
                </div>

                <PBtn full color="#1A1A1A" type="button" onClick={handleGoogleLogin} style={{ marginBottom: 25, border: '4px solid #FFB347', color: '#FFB347', display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <IconGoogle size={24} color="#FFB347" /> <span style={{fontSize: 14}}>GOOGLE LOGIN</span>
                </PBtn>
              </>
            )}

            <div 
              onClick={() => {
                if (mode === 'login') setMode('register');
                else setMode('login');
                setError('');
                setMessage('');
              }} 
              style={{ fontSize: 11, color: '#888', textAlign: 'center', cursor: 'pointer', textDecoration: 'none', letterSpacing: '1px' }}
            >
              {mode === 'login' ? '_ CREATE NEW ACCOUNT' : '_ RETURN TO TERMINAL'}
            </div>
          </form>
        </PBox>
      </div>
    </div>
  );
}

