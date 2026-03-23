import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import SegmentLeaderboard from '../components/features/segments/SegmentLeaderboard';
import SegmentCard from '../components/features/segments/SegmentCard';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, leaderboard, segments
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [userParticipation, setUserParticipation] = useState(null);
  const [results, setResults] = useState([]);
  const [segments, setSegments] = useState([]); // Assuming we fetch segments too
  const [computing, setComputing] = useState(false);
  
  // Data Fetching
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (eventError) throw eventError;
      setEvent(eventData);

      // 2. Fetch Participants
      const { data: partData } = await supabase
        .from('event_participants')
        .select('status, user_id, profiles:user_id(full_name, avatar_url)')
        .eq('event_id', id);
      
      setParticipants(partData || []);
      if (user && partData) {
        setUserParticipation(partData.find(p => p.user_id === user.id));
      }

      // 3. Fetch Results (Leaderboard)
      const { data: resData } = await supabase
        .from('event_results')
        .select('rank, total_time, user_id, profiles:user_id(full_name, avatar_url)')
        .eq('event_id', id)
        .order('rank', { ascending: true });
      setResults(resData || []);

      // 4. Fetch Segments (Mock or Real)
      // Note: Assuming 'event_segments' table exists or JSON column. 
      // For now, using mock or reading from a hypothetical relation if it existed.
      // Adjusting to common pattern:
      /* 
      const { data: segData } = await supabase
        .from('event_segments')
        .select('*, segment:segments(*)') 
        .eq('event_id', id);
      */
      // Using placeholder for now as schema wasn't fully inspected for segments relation
      setSegments([]); 

    } catch (err) {
      console.error('Error loading event:', err);
      showError('Impossibile caricare la sfida.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Actions
  const handleJoin = async () => {
    if (!user) return showError('Devi effettuare il login.');
    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke('join-event', { body: { event_id: id } });
      if (error) throw error;
      if (data.success) {
        showSuccess('Iscrizione confermata!');
        fetchAllData();
      }
    } catch (err) {
      showError(err.message || 'Errore durante l\'iscrizione');
    } finally {
      setJoining(false);
    }
  };

  const handleCompute = async () => {
    setComputing(true);
    try {
      const { data, error } = await supabase.functions.invoke('compute-leaderboard', { body: { event_id: id } });
      if (error) throw error;
      showSuccess('Classifica aggiornata!');
      fetchAllData();
    } catch (err) {
      showError('Errore aggiornamento classifica.');
    } finally {
      setComputing(false);
    }
  };

  if (loading) return (
    <div className="container">
      <div className="page-loader">
        <div className="skeleton" style={{ height: '300px', marginBottom: '20px' }}></div>
        <div className="skeleton" style={{ height: '100px' }}></div>
      </div>
    </div>
  );

  if (!event) return <div className="container error-state">Sfida non trovata.</div>;

  const isCreator = user && event.creator_id === user.id;

  return (
    <div className="event-page">
      {/* Mobile Header / Hero */}
      <header className="event-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <Link to="/events" className="back-nav">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Torna
          </Link>
          <div className="hero-badge-row">
            <span className={`badge badge-orange`}>{event.status}</span>
            {userParticipation && <span className="badge badge-active">Iscritto</span>}
          </div>
          <h1 className="text-h1">{event.name}</h1>
          <div className="hero-meta">
            <span>📅 {new Date(event.date).toLocaleDateString()}</span>
            <span>📍 {(event.distance / 1000).toFixed(1)} km</span>
            <span>⛰️ {Math.round(event.elevation_gain)} m</span>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="sticky-tabs-container">
        <div className="container">
          <nav className="tabs-nav">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Dettagli
            </button>
            <button 
              className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              Classifica
            </button>
            <button 
              className={`tab-btn ${activeTab === 'segments' ? 'active' : ''}`}
              onClick={() => setActiveTab('segments')}
            >
              Segmenti
            </button>
          </nav>
        </div>
      </div>

      <main className="container main-content">
        
        {/* VIEW: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in grid-2">
            <div className="content-col">
              <section className="card section-map">
                 <h3 className="text-h3 mb-2">Percorso</h3>
                 <div className="map-placeholder">
                    {/* Map Component would go here */}
                    <div className="map-mockup">MAPPA INTERATTIVA</div>
                 </div>
              </section>
              
              <section className="mt-4">
                <h3 className="text-h3 mb-2">Descrizione</h3>
                <p className="text-desc">{event.description || 'Nessuna descrizione fornita.'}</p>
              </section>
            </div>

            <aside className="sidebar-col">
              <div className="card participants-card">
                <h3 className="text-h3 mb-3">Partecipanti ({participants.length})</h3>
                <div className="participants-grid">
                  {participants.map((p, i) => (
                    <div key={i} className="participant-chip" title={p.profiles?.full_name}>
                       {p.profiles?.avatar_url ? (
                         <img src={p.profiles.avatar_url} alt="p" />
                       ) : (
                         <span className="initial">{p.profiles?.full_name?.charAt(0) || '?'}</span>
                       )}
                    </div>
                  ))}
                  {participants.length === 0 && <span className="text-sm">Nessun iscritto.</span>}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* VIEW: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="animate-fade-in">
             {isCreator && (
               <div className="admin-actions mb-4">
                 <button className="btn btn-secondary btn-full" onClick={handleCompute} disabled={computing}>
                   {computing ? 'Calcolo in corso...' : 'Aggiorna Classifica'}
                 </button>
               </div>
             )}
             <SegmentLeaderboard entries={results} />
          </div>
        )}

        {/* VIEW: SEGMENTS */}
        {activeTab === 'segments' && (
          <div className="animate-fade-in segment-list-view">
             {segments.length > 0 ? (
               segments.map(seg => <SegmentCard key={seg.id} segment={seg} />)
             ) : (
               <div className="empty-state">
                 <p className="text-sm">I segmenti per questo evento verranno caricati automaticamente.</p>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Sticky Action Footer (Mobile First) */}
      <div className="sticky-footer">
        <div className="container">
          {!userParticipation && event.status === 'active' ? (
             <button className="btn btn-primary btn-full" onClick={handleJoin} disabled={joining}>
               {joining ? 'Iscrizione...' : 'Partecipa alla Sfida'}
             </button>
          ) : (
             <div className="status-message">
               {userParticipation ? '✅ Sei iscritto a questo evento' : 'Evento concluso'}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
