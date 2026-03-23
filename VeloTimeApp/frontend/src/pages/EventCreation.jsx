import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStrava } from '../hooks/useStrava';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import gpxParser from 'gpxparser';
import polyline from '@mapbox/polyline';
import PageTransition from '../components/common/PageTransition';
import SegmentSelector from '../components/features/segments/SegmentSelector';
import './EventCreation.css';

const EventCreation = () => {
  const navigate = useNavigate();
  const { activities, loading: stravaLoading } = useStrava();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);
  
  const [creationMode, setCreationMode] = useState('strava');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strava_activity_id: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [gpxData, setGpxData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlContent = event.target.result;
        const gpx = new gpxParser();
        gpx.parse(xmlContent);

        let points = [];
        let distance = 0;
        let elevation = 0;

        // Estrazione punti da tracce o percorsi
        if (gpx.tracks && gpx.tracks.length > 0) {
          const track = gpx.tracks[0];
          points = track.points.map(p => [p.lat, p.lon]);
          distance = track.distance.total;
          elevation = track.elevation?.pos || 0;
        } 
        else if (gpx.routes && gpx.routes.length > 0) {
          const route = gpx.routes[0];
          points = route.points.map(p => [p.lat, p.lon]);
          distance = route.distance.total;
          elevation = route.elevation?.pos || 0;
        }

        if (points.length === 0) throw new Error('Il file GPX non contiene punti GPS validi.');

        // Calcolo manuale dei Bounds (SW, NE per Strava Explore API)
        // Strava vuole: [sw_lat, sw_lng, ne_lat, ne_lng]
        let minLat = points[0][0], maxLat = points[0][0];
        let minLng = points[0][1], maxLng = points[0][1];

        for (let i = 1; i < points.length; i++) {
          const [lat, lng] = points[i];
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        }

        setGpxData({
          distance: distance,
          elevation_gain: elevation,
          map_polyline: polyline.encode(points),
          start_latlng: points[0],
          // Array ordinato come richiesto dal backend per Strava Explore: sw_lat, sw_lng, ne_lat, ne_lng
          bounds: [minLat, minLng, maxLat, maxLng]
        });
        
        showSuccess('File GPX analizzato con successo!');
      } catch (err) {
        console.error('GPX_PARSER_ERROR:', err);
        showError(`Errore lettura GPX: ${err.message}`);
        setGpxData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let response;
      if (creationMode === 'strava') {
        if (!formData.strava_activity_id) throw new Error('Seleziona un percorso Strava.');
        response = await supabase.functions.invoke('create-event', { body: formData });
      } else {
        if (!gpxData) throw new Error('Carica un file GPX valido.');
        response = await supabase.functions.invoke('create-event-manual', {
          body: { ...formData, ...gpxData }
        });
      }

      const { data, error } = response;
      if (error) {
          const body = await error.context?.json();
          throw new Error(body?.error || error.message);
      }

      setCreatedEventId(data.event_id);
      showSuccess('Sfida creata! Ora seleziona i segmenti per la classifica.');
    } catch (err) {
      showError(`Errore: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectionComplete = () => {
    showSuccess('Sfida configurata con successo! 🏁');
    navigate(`/events/${createdEventId}`);
  };

  if (stravaLoading) return <div className="creation-loading"><div className="loader"></div><p>Sincronizzazione...</p></div>;

  return (
    <PageTransition>
      <div className="event-creation-container">
        {createdEventId ? (
            <div className="selection-step fade-in">
                <SegmentSelector 
                    eventId={createdEventId} 
                    onComplete={handleSelectionComplete} 
                />
            </div>
        ) : (
            <>
                <header className="creation-header">
                    <h1>Lancia una Sfida</h1>
                    <p>Configura il percorso e scegli i segmenti cronometrati.</p>
                </header>

                <div className="mode-selector">
                    <button className={`mode-btn ${creationMode === 'strava' ? 'active' : ''}`} onClick={() => setCreationMode('strava')}>Strava</button>
                    <button className={`mode-btn ${creationMode === 'gpx' ? 'active' : ''}`} onClick={() => setCreationMode('gpx')}>File GPX</button>
                </div>
                
                <form onSubmit={handleSubmit} className="creation-form fade-in">
                    <div className="form-group">
                      <label>Titolo Sfida</label>
                      <input type="text" required placeholder="es: Cronoscalata Paderno" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>

                    <div className="form-group">
                      <label>Data</label>
                      <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    </div>

                    {creationMode === 'strava' ? (
                        <div className="form-group">
                            <label>Percorso Strava</label>
                            <select required value={formData.strava_activity_id} onChange={(e) => setFormData({...formData, strava_activity_id: e.target.value})} className="activity-select">
                                <option value="">-- Seleziona attività --</option>
                                {activities.map(act => (
                                    <option key={act.id} value={act.id}>{act.name} ({(act.distance / 1000).toFixed(1)} km)</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Percorso (GPX)</label>
                            <div className={`gpx-upload-zone ${gpxData ? 'has-file' : ''}`} onClick={() => fileInputRef.current.click()}>
                                <input type="file" accept=".gpx" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                                {gpxData ? (
                                    <div className="gpx-info">
                                        <strong>✅ Percorso caricato</strong>
                                        <span>{(gpxData.distance/1000).toFixed(1)} km | {Math.round(gpxData.elevation_gain)}m D+</span>
                                    </div>
                                ) : (
                                    <div className="gpx-placeholder"><span>Seleziona file .gpx</span><small>Tracce, percorsi o waypoints</small></div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Descrizione (opzionale)</label>
                        <textarea 
                            placeholder="Aggiungi dettagli sulla sfida, regole o premi..." 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="btn-submit-glow" disabled={submitting}>
                        {submitting ? 'Creazione in corso...' : 'Continua alla scelta segmenti 🏁'}
                    </button>
                </form>
            </>
        )}
      </div>
    </PageTransition>
  );
};

export default EventCreation;
