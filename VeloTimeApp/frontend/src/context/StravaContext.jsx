import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthContext';

const StravaContext = createContext(null);

export const StravaProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [stravaAthleteId, setStravaAthleteId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const getRedirectUri = () => `${window.location.origin}/strava-callback`;

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('strava-get-activities');
      
      if (error) {
        console.error('STRAVA_CONTEXT: Errore recupero attività:', error.message);
        setActivities([]);
      } else {
        setIsStravaConnected(data.isConnected);
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('STRAVA_CONTEXT: Eccezione recupero attività:', err.message);
      setActivities([]);
    }
  }, [user]);

  const checkConnectionStatus = useCallback(async () => {
    if (!user) {
      setIsStravaConnected(false);
      setStravaAthleteId(null);
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('strava_tokens')
        .select('athlete_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsStravaConnected(true);
        setStravaAthleteId(data.athlete_id);
        // Se è connesso, recuperiamo anche le attività
        await fetchActivities();
      } else {
        setIsStravaConnected(false);
        setStravaAthleteId(null);
        setActivities([]);
      }
    } catch (err) {
      console.error('STRAVA_CONTEXT: Errore status:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, fetchActivities]);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const connectStrava = () => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const redirectUri = getRedirectUri();
    const scope = 'read,activity:read_all';
    
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=${scope}`;
    
    console.log('STRAVA_CONTEXT: Avvio redirect OAuth...');
    window.location.href = authUrl;
  };

  const value = {
    isStravaConnected,
    stravaAthleteId,
    activities,
    loading,
    connectStrava,
    refreshStatus: checkConnectionStatus,
    redirectUri: getRedirectUri()
  };

  return (
    <StravaContext.Provider value={value}>
      {children}
    </StravaContext.Provider>
  );
};

export const useStravaContext = () => {
  const context = useContext(StravaContext);
  if (!context) {
    throw new Error('useStravaContext must be used within a StravaProvider');
  }
  return context;
};
