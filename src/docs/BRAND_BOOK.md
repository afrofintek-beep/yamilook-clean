# 📖 YAMILOOK BRAND BOOK
## Identidade Visual & Diretrizes de Marca

---

## 1. ESSÊNCIA DA MARCA

### Nome
**yamilook** (sempre em minúsculas)

### Tagline
> "A vida como ela é."

### Slogan
> "Viver é na banda."

### Missão
Criar conexões digitais autênticas enraizadas na cultura africana, celebrando a vida real e as relações genuínas.

### Valores
- **Autenticidade** — Sem filtros, sem pretensões
- **Ubuntu** — "Eu sou porque nós somos"
- **Celebração** — A vida merece ser vivida e partilhada
- **Respeito** — Pela herança, pela comunidade, pelo indivíduo

---

## 2. SISTEMA DE LOGO

### Logotipo Principal
- Wordmark "yamilook" em lowercase
- Onda sinusoidal subtil abaixo do texto
- Cor primária: `--primary` (violeta vibrante)

### Variações
| Variante | Uso |
|----------|-----|
| Primário | Fundos claros |
| Invertido | Fundos escuros |
| Monocromático | Aplicações limitadas |

### Área de Proteção
Manter espaço mínimo equivalente à altura do "y" ao redor do logo.

### Uso Incorreto
❌ Não esticar ou distorcer  
❌ Não alterar as cores  
❌ Não adicionar efeitos (sombras, gradientes externos)  
❌ Não usar em fundos que comprometam a legibilidade

---

## 3. PALETA DE CORES

### Cores Principais

| Nome | HSL | Uso |
|------|-----|-----|
| **Primary** | `262 83% 58%` | Ações principais, CTAs, destaques |
| **Primary Foreground** | `0 0% 100%` | Texto sobre primary |
| **Background** | `0 0% 100%` | Fundo principal (light) |
| **Foreground** | `240 10% 4%` | Texto principal |

### Cores Secundárias

| Nome | HSL | Uso |
|------|-----|-----|
| **Secondary** | `240 5% 96%` | Elementos secundários |
| **Muted** | `240 5% 96%` | Fundos suaves |
| **Accent** | `262 83% 58%` | Destaques, hover states |

### Cores de Estado

| Nome | HSL | Uso |
|------|-----|-----|
| **Destructive** | `0 84% 60%` | Erros, ações destrutivas |
| **Success** | `142 76% 36%` | Confirmações, sucesso |
| **Warning** | `38 92% 50%` | Avisos |

---

## 4. SISTEMA DE REAÇÕES AFRICANAS

### Filosofia
As reações Yamilook são culturalmente enraizadas, não genéricas. Cada ícone carrega significado profundo.

### As 5 Reações Oficiais

| Ícone | Nome | Significado | Tipo de Emoção | HSL |
|-------|------|-------------|----------------|-----|
| 💛 | **Sankofa Love** | Amor com memória e respeito pelo passado | Positivo / Fundacional | `45 93% 58%` |
| 🤝🏾 | **Ubuntu** | Solidariedade e humanidade partilhada | Apoio / Empatia | `174 72% 40%` |
| 🪘 | **Djembe** | Ritmo, celebração, energia coletiva | Celebração / Movimento | `16 85% 66%` |
| 💢 | **Shango** | Raiva justificada, indignação moral | Alerta / Justiça | `199 89% 48%` |
| 😒 | **Eish** | Exaustão ou insatisfação honesta | Desconforto / Fadiga | `0 84% 60%` |

### Regras de UI para Reações
- ❌ Sem gradientes
- ❌ Sem animações em loop
- ✅ Hover/Active: +10% brilho apenas
- ✅ Nome sempre visível em long-press ou hover
- ✅ Não depender apenas de cor para significado

### Hierarquia Visual (Prioridade)
1. Sankofa Love (mais alta)
2. Ubuntu
3. Djembe
4. Shango
5. Eish (mais baixa)

---

## 5. TIPOGRAFIA

### Fonte Principal
**Inter** — Moderna, legível, versátil

### Escala Tipográfica

| Elemento | Tamanho | Peso | Tracking |
|----------|---------|------|----------|
| H1 | 2.25rem (36px) | 700 | -0.025em |
| H2 | 1.875rem (30px) | 600 | -0.02em |
| H3 | 1.5rem (24px) | 600 | -0.015em |
| H4 | 1.25rem (20px) | 500 | -0.01em |
| Body | 1rem (16px) | 400 | 0 |
| Small | 0.875rem (14px) | 400 | 0.01em |
| Caption | 0.75rem (12px) | 400 | 0.02em |

### Uso
- **Títulos**: Inter Bold/Semibold
- **Corpo**: Inter Regular
- **Ênfase**: Inter Medium
- **Dados**: Inter Tabular (números)

---

## 6. ICONOGRAFIA

### Estilo
- Lucide React como biblioteca principal
- Stroke width: 2px (padrão)
- Tamanhos: 16px, 20px, 24px, 32px

### Ícones de Navegação
| Função | Ícone |
|--------|-------|
| Home/Feed | `Home` |
| Chat | `MessageCircle` |
| Status | `Circle` |
| Chamadas | `Phone` |
| Perfil | `User` |

---

## 7. ESPAÇAMENTO & LAYOUT

### Sistema de Grid
Base de 4px para todos os espaçamentos.

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Micro espaçamentos |
| `space-2` | 8px | Espaçamentos internos |
| `space-3` | 12px | Gaps pequenos |
| `space-4` | 16px | Padding padrão |
| `space-6` | 24px | Seções |
| `space-8` | 32px | Separação de blocos |

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-sm` | 4px | Inputs, badges |
| `rounded-md` | 8px | Cards, botões |
| `rounded-lg` | 12px | Modais, sheets |
| `rounded-xl` | 16px | Containers principais |
| `rounded-full` | 9999px | Avatares, pills |

---

## 8. COMPONENTES UI

### Botões

#### Primário
```css
bg-gradient-primary /* gradiente violeta */
text-primary-foreground
rounded-md
px-4 py-2
```

#### Secundário
```css
bg-secondary
text-secondary-foreground
rounded-md
px-4 py-2
```

#### Ghost
```css
bg-transparent
hover:bg-accent
text-foreground
```

### Cards
```css
bg-card
border border-border
rounded-xl
p-4
shadow-sm
```

### Inputs
```css
bg-background
border border-input
rounded-md
px-3 py-2
focus:ring-2 focus:ring-primary
```

---

## 9. ANIMAÇÕES

### Princípios
- Subtis e propositadas
- Duração: 150-300ms
- Easing: `ease-out` para entradas, `ease-in` para saídas

### Animações Disponíveis
| Nome | Uso |
|------|-----|
| `fade-in` | Entrada de elementos |
| `scale-in` | Modais, popovers |
| `slide-in-right` | Drawers, sheets |
| `pulse` | Estados de loading |

### Código
```css
/* Entrada suave */
animation: fade-in 0.3s ease-out;

/* Escala */
animation: scale-in 0.2s ease-out;
```

---

## 10. VOZ & TOM

### Idioma
Português (contexto Angolano/Africano lusófono)

### Características
- **Caloroso** — Como conversar com um amigo
- **Autêntico** — Sem formalidades excessivas
- **Celebratório** — Positivo sem ser ingénuo
- **Respeitoso** — Cultural e pessoalmente

### Exemplos

| ❌ Evitar | ✅ Preferir |
|-----------|-------------|
| "Usuário" | "Tu" ou nome próprio |
| "Clique aqui" | "Vamos lá" |
| "Erro ocorrido" | "Algo correu mal" |
| "Sucesso!" | "Feito! 🎉" |

### Frases de Marca
- "A vida como ela é."
- "Viver é na banda."
- "Bem-vindo à banda."

---

## 11. MODO ESCURO

### Adaptações
Todas as cores têm variantes para dark mode definidas em CSS.

| Elemento | Light | Dark |
|----------|-------|------|
| Background | `0 0% 100%` | `240 10% 4%` |
| Foreground | `240 10% 4%` | `0 0% 98%` |
| Card | `0 0% 100%` | `240 10% 8%` |
| Border | `240 6% 90%` | `240 4% 16%` |

### Regras
- Manter contraste mínimo de 4.5:1
- Primary mantém-se consistente
- Reações africanas mantêm cores originais

---

## 12. ACESSIBILIDADE

### Requisitos
- Contraste WCAG AA (mínimo 4.5:1 para texto)
- Foco visível em todos os elementos interativos
- Labels para todos os ícones
- Reações não dependem apenas de cor

### Implementação
```css
/* Foco visível */
focus:outline-none focus-visible:ring-2 focus-visible:ring-primary

/* Skip links */
sr-only focus:not-sr-only
```

---

## 13. ASSETS

### Ficheiros de Logo
- `src/assets/yamilook-logo.png` — Logo principal
- `src/assets/logo.jpeg` — Alternativo

### Componentes de Marca
- `src/components/brand/YamilookLogo.tsx` — Wordmark animado
- `src/components/brand/SplashScreen.tsx` — Ecrã de carregamento

### Documentação Técnica
- `src/lib/reactions.ts` — Sistema de reações africanas
- `src/index.css` — Tokens de design
- `tailwind.config.ts` — Configuração Tailwind

---

## 14. APLICAÇÃO

### Onboarding
- Logo Yamilook com tagline
- Gradientes das reações africanas nos slides
- Slogan "Viver é na banda." no footer

### Feed
- Reações africanas em posts e comentários
- Cards com sombras subtis
- Hierarquia tipográfica clara

### Chat
- Bolhas com cores de marca
- Status com cores semânticas
- Animações de typing suaves

---

*Última atualização: Janeiro 2026*
*Versão: 1.0*
