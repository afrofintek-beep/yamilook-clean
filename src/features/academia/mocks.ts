/** Centralized mock data for Academia da Banda */

export type SessionFormat = '1:1' | 'grupo' | 'masterclass';
export type SessionStatus = 'live' | 'scheduled' | 'ended';

export interface MockSession {
  id: string;
  title: string;
  description: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string;
  date: string;
  time: string;
  format: SessionFormat;
  scheduledAt?: string;
  spots: number;
  spotsLeft: number;
  isPremium: boolean;
  priceCoins: number;
  status: SessionStatus;
  isReserved: boolean;
  isReviewed: boolean;
}

export interface MockMentor {
  id: string;
  name: string;
  avatar?: string;
  specialty: string;
  rating: number;
  sessionCount: number;
  isVerified: boolean;
  bio: string;
}

export const MOCK_MENTORS: MockMentor[] = [
  { id: 'm1', name: 'DJ Marfox', specialty: 'Música', rating: 4.8, sessionCount: 12, isVerified: true, bio: 'Produtor e DJ de referência na cena kuduro e batida de Lisboa.' },
  { id: 'm2', name: 'Ana Bela', specialty: 'Negócios', rating: 4.9, sessionCount: 8, isVerified: true, bio: 'Empreendedora criativa com 10 anos de experiência em mercados africanos.' },
  { id: 'm3', name: 'Kiluanji', specialty: 'Fotografia', rating: 4.7, sessionCount: 38, isVerified: true, bio: 'Fotógrafo de rua com trabalhos publicados em Luanda e Lisboa.' },
  { id: 'm4', name: 'Tchissola', specialty: 'Moda', rating: 4.6, sessionCount: 4, isVerified: false, bio: 'Designer de moda emergente com foco em tecidos tradicionais.' },
];

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: 's1', title: 'Produção musical com Ableton', description: 'Aprende a produzir beats de kuduro e afrobeats usando Ableton Live.',
    mentorId: 'm1', mentorName: 'DJ Marfox', date: '28 Fev', time: '19h',
    format: 'grupo', spots: 20, spotsLeft: 5, isPremium: false, priceCoins: 0,
    status: 'live', isReserved: true, isReviewed: false,
  },
  {
    id: 's2', title: 'Empreendedorismo criativo em África', description: 'Como lançar um negócio criativo no mercado angolano e lusófono.',
    mentorId: 'm2', mentorName: 'Ana Bela', date: '2 Mar', time: '15h',
    format: 'masterclass', spots: 15, spotsLeft: 15, isPremium: true, priceCoins: 50,
    status: 'scheduled', isReserved: false, isReviewed: false,
  },
  {
    id: 's3', title: 'Fotografia de rua em Luanda', description: 'Técnicas de composição e iluminação natural para fotografia urbana.',
    mentorId: 'm3', mentorName: 'Kiluanji', date: '5 Mar', time: '10h',
    format: '1:1', spots: 1, spotsLeft: 0, isPremium: true, priceCoins: 30,
    status: 'ended', isReserved: true, isReviewed: false,
  },
  {
    id: 's4', title: 'Introdução ao design de moda', description: 'Primeiros passos no design de moda com tecidos tradicionais.',
    mentorId: 'm4', mentorName: 'Tchissola', date: '10 Mar', time: '14h',
    format: 'grupo', spots: 10, spotsLeft: 8, isPremium: false, priceCoins: 0,
    status: 'scheduled', isReserved: false, isReviewed: false,
  },
];

export function getMentor(id: string) {
  return MOCK_MENTORS.find((m) => m.id === id);
}

export function getSession(id: string) {
  return MOCK_SESSIONS.find((s) => s.id === id);
}

export function getSessionsByMentor(mentorId: string) {
  return MOCK_SESSIONS.filter((s) => s.mentorId === mentorId);
}
