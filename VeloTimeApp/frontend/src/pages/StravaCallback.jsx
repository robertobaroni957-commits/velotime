import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { useStrava } from '../hooks/useStrava';
import PageTransition from '../components/common/PageTransition';

const StravaCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { refreshStatus, redirectUri } = useStrava();
  const processedRef = useRef(false);
  const [status, setStatus] = useState('Ricezione codice...');
  
  useEffect(() => {
    const handleCallback = async () => {
      if (processedRef.current) return;
      
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        showError(`Strava ha negato l'accesso: ${error}`);
        navigate('/profile');
        return;
      }

      if (!code) {
        setStatus('Nessun codice trovato nel link.');
        return;
      }

      processedRef.current = true;
      setStatus('Inviando codice al server Supabase...');

      try {
        console.log('DEBUG: Chiamata a strava-exchange con code:', code);
        
        const { data, error: invokeError } = await supabase.functions.invoke('strava-exchange', {
          body: { 
            code,
            redirect_uri: redirectUri 
          },
        });

        // Gestione errore esplicito dall'SDK Supabase
        if (invokeError) {
            console.error('DEBUG: invokeError ricevuto:', invokeError);
            let message = 'Il server ha restituito un errore.';
            
            // Tentativo di leggere il messaggio JSON dalla Edge Function
            if (invokeError.context && invokeError.context.json) {
                try {
                    const body = await invokeError.context.json();
                    message = body.error || message;
                } catch (e) {
                    message = invokeError.message;
                }
            } else {
                message = invokeError.message;
            }
            throw new Error(message);
        }

        if (data?.success) {
          setStatus('Sincronizzazione completata!');
          showSuccess('Strava collegato con successo!');
          await refreshStatus();
          navigate('/profile');
        } else {
          throw new Error('Il server non ha confermato il successo.');
        }
      } catch (err) {
        console.error('ERRORE CRITICO CALLBACK:', err);
        setStatus(`Errore: ${err.message}`);
        showError(`Errore di collegamento: ${err.message}`);
        // Lasciamo il messaggio a video per 5 secondi prima di uscire
        setTimeout(() => navigate('/profile'), 5000);
      }
    };

    handleCallback();
  }, [location, navigate, showSuccess, showError, refreshStatus, redirectUri]);

  return (
    <PageTransition>
      <div className="callback-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '70vh',
        color: '#fff',
        textAlign: 'center',
        background: '#111',
        padding: '20px'
      }}>
        <div className="loader" style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid rgba(255,255,255,0.1)', 
            borderTop: '4px solid #fc4c02', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{status}</h2>
        <p style={{ color: '#888' }}>Non chiudere questa pagina...</p>
        
        {status.startsWith('Errore:') && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,0,0,0.1)', border: '1px solid red', borderRadius: '8px', color: '#ff6b6b' }}>
                <strong>Dettaglio Errore:</strong><br/>
                {status.replace('Errore:', '')}
            </div>
        )}
      </div>
    </PageTransition>
  );
};

export default StravaCallback;
