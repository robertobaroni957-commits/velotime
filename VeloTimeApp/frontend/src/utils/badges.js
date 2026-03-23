/**
 * Helper per la gestione dei Badge e della Gamification in VeloTime
 */

export const BADGE_TYPES = {
  WINNER: {
    id: 'winner',
    label: 'Campione',
    icon: '🏆',
    description: 'Hai vinto almeno una sfida ufficiale.',
    color: '#fbbf24'
  },
  MILESTONE_100: {
    id: 'milestone_100',
    label: 'Centenario',
    icon: '💯',
    description: 'Hai percorso oltre 100km totali nelle sfide.',
    color: '#3b82f6'
  },
  CLIMBER: {
    id: 'climber',
    label: 'Grimpeur',
    icon: '⛰️',
    description: 'Specialista delle salite con oltre 1000m di dislivello.',
    color: '#10b981'
  },
  EARLY_ADOPTER: {
    id: 'early_adopter',
    label: 'Pioniere',
    icon: '🚀',
    description: 'Uno dei primi membri fondatori del club.',
    color: '#8b5cf6'
  }
};

/**
 * Restituisce i badge per un utente specifico.
 */
export const getBadgesForUser = (userId, stats = {}) => {
  const badges = [];
  
  // Logica automatica base
  if (stats.total_wins > 0) badges.push(BADGE_TYPES.WINNER);
  if (stats.total_events >= 5) badges.push(BADGE_TYPES.EARLY_ADOPTER);
  
  // Badge mockati per test UI se l'utente ha partecipato a qualcosa
  if (userId && stats.total_events > 0) {
    if (!badges.find(b => b.id === 'milestone_100')) badges.push(BADGE_TYPES.MILESTONE_100);
  }

  return badges;
};
