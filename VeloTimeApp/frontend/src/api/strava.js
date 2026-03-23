// Mock Strava API integration service
import { events } from '../data/events';
import { resultsByEvent } from '../data/results';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const stravaApi = {
  getEvents: async () => {
    await delay(500); // Simulate network latency
    return events;
  },

  getEventById: async (id) => {
    await delay(300);
    return events.find(e => e.id === parseInt(id));
  },

  getResults: async (eventId) => {
    await delay(600);
    return resultsByEvent[parseInt(eventId)] || [];
  },

  // In a real app, this would use OAuth2 to connect to Strava
  connectStrava: async () => {
    await delay(1000);
    return { status: 'success', athlete: 'John Doe' };
  },

  createEvent: async (eventData) => {
    await delay(800);
    console.log('Event created:', eventData);
    return { status: 'success', event: { ...eventData, id: Date.now() } };
  },

  updateEvent: async (id, eventData) => {
    await delay(800);
    console.log('Event updated:', id, eventData);
    return { status: 'success' };
  },

  deleteEvent: async (id) => {
    await delay(800);
    console.log('Event deleted:', id);
    return { status: 'success' };
  }
};
