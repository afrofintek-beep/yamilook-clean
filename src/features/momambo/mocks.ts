export const mockPerformance = {
  views: 12_430,
  viewsDelta: 18,
  newFollowers: 87,
  followersDelta: 12,
  likes: 1_820,
  likesDelta: -3,
  comments: 342,
  commentsDelta: 24,
  shares: 156,
  sharesDelta: 8,
  kumbuEarned: 245,
  kumbuDelta: 15,
};

export const mockTrending = {
  hotTopics: [
    { name: 'Kuduro Revival', heat: 92 },
    { name: 'Luanda Night Market', heat: 85 },
    { name: 'Tech em Angola', heat: 78 },
    { name: 'Moda Africana', heat: 71 },
  ],
  activeConversations: 48,
  popularCategories: ['Música', 'Cultura', 'Tecnologia', 'Gastronomia'],
  growingSignals: [
    { label: 'Novos membros na tua banda', value: '+23 esta semana' },
    { label: 'Engajamento nos Ritmos', value: '↑ 34%' },
    { label: 'Audiência no Palco', value: '↑ 18%' },
  ],
};

export const mockStrength = {
  bestContentType: { type: 'Ritmos', icon: '🎵', confidence: 89 },
  bestTime: { time: '19:00 – 21:00', day: 'Sexta-feira', confidence: 76 },
  strongestCategory: { name: 'Música & Cultura', score: 94 },
  audienceBehavior: {
    peakDay: 'Sexta',
    avgSessionMin: 4.2,
    returnRate: 68,
    topCity: 'Luanda',
  },
};

export const mockOpportunities = [
  {
    id: 'roda',
    title: 'Criar uma Roda',
    description: 'A tua audiência está activa no Palco — aproveita e cria uma Roda agora.',
    icon: '🎤',
    route: '/palco/create',
    urgency: 'high' as const,
  },
  {
    id: 'live',
    title: 'Abrir sessão Live',
    description: 'Tens 45 Wis online agora. Perfeito para um Live.',
    icon: '📡',
    route: '/live',
    urgency: 'medium' as const,
  },
  {
    id: 'publish',
    title: 'Publicar conteúdo',
    description: 'Não publicas há 3 dias. A tua banda sente falta.',
    icon: '✍️',
    route: '/feed',
    urgency: 'medium' as const,
  },
  {
    id: 'academia',
    title: 'Criar sessão Academia',
    description: 'O teu tópico forte (Música) tem procura na Academia.',
    icon: '🎓',
    route: '/academia/create',
    urgency: 'low' as const,
  },
  {
    id: 'monetize',
    title: 'Monetizar conteúdo',
    description: 'Tens 245 Kumbu. Desbloqueia novas recompensas.',
    icon: '💰',
    route: '/kumbu',
    urgency: 'low' as const,
  },
];

export const mockTopPerformance = {
  posts: [
    { id: '1', title: 'A evolução do Kuduro em 2026', views: 3420, likes: 289, type: 'post' as const },
    { id: '2', title: 'Receita de Muamba', views: 2810, likes: 234, type: 'post' as const },
  ],
  voices: [
    { id: '3', title: 'Freestyle Session #12', views: 1890, likes: 178, type: 'voice' as const },
  ],
  lives: [
    { id: '4', title: 'Conversa sobre Tech em Luanda', views: 4200, likes: 312, type: 'live' as const },
  ],
  academy: [
    { id: '5', title: 'Produção Musical Básica', views: 1340, likes: 156, type: 'academy' as const },
  ],
};
