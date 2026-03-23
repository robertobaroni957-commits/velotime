import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { StravaProvider } from './context/StravaContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Results from './pages/Results';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EventCreation from './pages/EventCreation';
import StravaCallback from './pages/StravaCallback';
import HallOfFame from './pages/HallOfFame';
import './styles/velotime.css';
import './App.css';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <StravaProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/events/:id/results" element={<Results />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-event" element={<EventCreation />} />
                <Route path="/strava-callback" element={<StravaCallback />} />
                <Route path="/hall-of-fame" element={<HallOfFame />} />
              </Routes>
            </Layout>
          </StravaProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
