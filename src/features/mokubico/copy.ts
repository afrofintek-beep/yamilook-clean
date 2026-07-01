/** Exact UI copy for MOKUBICO feature */

export const MOKUBICO_COPY = {
  title: 'MOKUBICO',
  subtitle: 'Onde a tua banda vive',
  liveLabel: 'Ao vivo no MOKUBICO',
  liveBadge: 'Ao vivo',
  openRoda: 'Abrir Roda',
  enterPalco: 'Entrar no Palco',
  palcoLiveNow: 'Palco ao vivo agora',
  bandaActive: 'Banda ativa',
  news: 'Novidades',
  chooseSpace: 'Escolhe o teu espaço',
  noActiveRodas: 'Nenhuma roda ativa.',
  beFirst: 'Sê o primeiro a abrir uma roda.',
  listeners: 'ouvintes',
  emptySpace: 'Este espaço está tranquilo.',
} as const;

export interface SpaceConfig {
  key: string;
  route: string;
  title: string;
  headline: string;
  description: string;
  lines: string[];
  access: string;
  emoji: string;
}

export const SPACES: SpaceConfig[] = [
  {
    key: 'quintal',
    route: '/mokubico/quintal',
    title: 'QUINTAL',
    headline: 'O palco aberto da banda',
    description: 'Conversas ao vivo, debates e vibes para todos. Aqui qualquer wis pode ouvir e participar.',
    lines: ['Conversas abertas', 'Debates ao vivo', 'Vibes para todos'],
    access: 'Wis',
    emoji: '🌴',
  },
  {
    key: 'sala',
    route: '/mokubico/sala',
    title: 'SALA',
    headline: 'O espaço dos kambas',
    description: 'Rodas mais íntimas entre kambas. Partilha ideias, projetos e planos com quem confias.',
    lines: ['Rodas entre kambas', 'Projetos e ideias', 'Mais íntimo'],
    access: 'Kambas',
    emoji: '🛋️',
  },
  {
    key: 'cozinha',
    route: '/mokubico/cozinha',
    title: 'COZINHA DAS SIS',
    headline: 'O refúgio dos bradas',
    description: 'Espaço seguro para as sis. Girl talk, apoio mútuo e empoderamento sem filtros.',
    lines: ['Girl talk', 'Apoio mútuo', 'Sem filtros'],
    access: 'Bradas / Sis',
    emoji: '🍳',
  },
  {
    key: 'quarto',
    route: '/mokubico/quarto',
    title: 'QUARTO',
    headline: 'Só nós dois',
    description: 'Privacidade total. Chamadas e rodas exclusivas para o teu par. Intimidade é o mambo.',
    lines: ['Privacidade total', 'Intimidade é o mambo', 'Só nós'],
    access: 'Só Nós',
    emoji: '🔒',
  },
];
