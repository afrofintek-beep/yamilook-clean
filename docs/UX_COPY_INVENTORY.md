# YamiLook UX Copy Inventory

Complete inventory of all visible text content across the application.  
**Generated:** 2026-02-02  
**Purpose:** Copy mapping reference (no redesign suggestions)

---

## 1. Splash Screen (`SplashScreen.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Logo alt | `yamilook` |
| Tagline | `O mambo começa na banda.` |

---

## 2. Index / Landing Page (`Index.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Logo | `yamilook` (wordmark) |
| Main tagline | `O mambo começa na banda.` |
| Section label | `Reações Africanas` |
| CTA Button | `Entrar na tua banda` |
| Footer text | `O mambo começa na banda.` |

### African Reactions (from `reactions.ts`)
| Reaction | Label | Meaning |
|----------|-------|---------|
| 🌿 Sankofa | Sankofa | Voltar e buscar. Honrar o passado para seguir em frente. |
| 🔥 Ubuntu | Ubuntu | Eu sou porque nós somos. Partilha profunda, conexão humana. |
| 🥁 Djembe | Djembe | Ritmo que une. Alegria comunitária, celebração. |
| ☀️ Ìmọ̀lẹ̀ | Ìmọ̀lẹ̀ | Clareza e iluminação. Reconhecer sabedoria. |
| 🌍 Uhuru | Uhuru | Liberdade. Apoiar ideias de liberdade e justiça. |

---

## 3. Login Page (`Login.tsx`, `LoginForm.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Title | `Bem-vindo à tua banda 👋🏾` |
| Subtitle | `O mambo começa na banda.` |
| Tagline | `Pessoas reais. Histórias da tua banda.` |
| Footer note | `Viver o melhor da vida contigo.` |
| Email label | `Email` |
| Email placeholder | `tu@exemplo.com` |
| Password label | `Palavra-passe` |
| Password placeholder | `••••••••` |
| Forgot password link | `Esqueceu a palavra-passe?` |
| Submit button | `Entrar na YamiLook` |
| Loading state | `A entrar...` |
| Divider (social) | `Ou entra com` |
| Divider (register) | `Novo na YamiLook?` |
| Create account button | `Criar conta` |
| Email validation error | `Por favor insere um email válido` |
| Password validation error | `A palavra-passe deve ter pelo menos 6 caracteres` |
| Terms footer | `Ao continuar, aceitas os nossos Termos de Serviço e Política de Privacidade` |

### Dev Quick Login (dev only)
| UI Element | Current Text |
|------------|-------------|
| Button | `Login Rápido (Dev)` |
| Action label | `Preencher` |

---

## 4. Register Page (`Register.tsx`, `RegisterForm.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Title | `Junta-te à tua banda` |
| Subtitle | `Pessoas reais. Histórias da tua banda.` |
| Display name label | `Nome de exibição` |
| Display name placeholder | `O teu nome` |
| Username label | `Nome de utilizador` |
| Username placeholder | `utilizador` |
| Username taken error | `Nome de utilizador já está em uso` |
| Email label | `Email` |
| Email placeholder | `tu@exemplo.com` |
| Password label | `Palavra-passe` |
| Password placeholder | `••••••••` |
| Submit button | `Criar conta` |
| Loading state | `A criar conta...` |
| Divider | `Ou continua com` |
| Have account text | `Já tens conta?` |
| Login link | `Entrar` |

### Password Requirements
| Requirement | Text |
|-------------|------|
| Min length | `Pelo menos 8 caracteres` |
| Uppercase | `Uma letra maiúscula` |
| Lowercase | `Uma letra minúscula` |
| Number | `Um número` |

---

## 5. Forgot Password Page

| UI Element | Current Text |
|------------|-------------|
| Title | `Recuperar palavra-passe` |
| Subtitle | `Introduz o teu email para receber um link de recuperação` |
| Submit button | `Enviar link de recuperação` |
| Loading state | `A enviar...` |
| Success title | `Verifica o teu email` |
| Success message | `Enviámos um link de recuperação para o teu email` |
| Spam hint | `Se não vires o email, verifica a pasta de spam` |
| Try different | `Tentar outro email` |
| Back to login | `Voltar ao login` |

---

## 6. Reset Password Page

| UI Element | Current Text |
|------------|-------------|
| Title | `Criar nova palavra-passe` |
| Subtitle | `A tua nova palavra-passe deve ser diferente da anterior` |
| New password label | `Nova palavra-passe` |
| Submit button | `Atualizar palavra-passe` |
| Loading state | `A atualizar...` |
| Success message | `Palavra-passe atualizada!` |
| Redirect message | `A redirecionar para o login...` |

---

## 7. Onboarding (`Onboarding.tsx`)

### Step: Welcome
| UI Element | Current Text |
|------------|-------------|
| Title | `Bem-vindo, {name}!` |
| Description | `Vamos configurar o teu perfil para que os teus kambas te encontrem facilmente.` |
| CTA button | `Começar` |

### Step: Avatar
| UI Element | Current Text |
|------------|-------------|
| Title | `Adiciona a tua foto` |
| Description | `Ajuda os teus kambas a reconhecer-te` |
| Skip button | `Saltar` |
| Continue button | `Continuar` |
| Toast success | `Foto carregada!` |
| Toast error | `Falha ao carregar foto` |

### Step: Bio
| UI Element | Current Text |
|------------|-------------|
| Title | `Sobre ti` |
| Description | `Adiciona uma bio curta para os teus kambas te conhecerem melhor.` |
| Placeholder | `Adoro caminhadas, café e boas conversas...` |
| Character count | `{n}/150` |
| Skip button | `Saltar` |
| Continue button | `Continuar` |

### Step: Tour
| Slide | Title | Description |
|-------|-------|-------------|
| 1 | `Mensagens em tempo real` | `Envia textos, áudios, fotos e muito mais com entrega instantânea.` |
| 2 | `Chamadas em HD` | `Chamadas de voz e vídeo em alta definição com partilha de ecrã.` |
| 3 | `Grupos e comunidades` | `Cria grupos com até 512 membros, com controlos de admin e média partilhada.` |
| 4 | `Estados e momentos` | `Partilha momentos com os teus contactos através de stories de 24 horas.` |

| UI Element | Current Text |
|------------|-------------|
| Skip tour button | `Saltar Tour` |
| Next button | `Próximo` |
| Finish button | `Começar a Conversar` |
| Skip all button | `Saltar tudo` |
| Tagline | `O mambo começa na banda.` |
| Footer | `O mambo começa na banda.` |
| Toast success | `Tudo pronto!` |

---

## 8. Bottom Navigation (`BottomNav.tsx`)

| Nav Item | Label |
|----------|-------|
| Chat | `Conversas` (i18n: nav.chat) |
| Feed | `Feed` (i18n: nav.feed) |
| Ritmos | `Ritmos` |
| Palco | `Palco` |
| Discover | `Descobrir` (i18n: nav.discover) |
| Contacts | `Contactos` (i18n: nav.contacts) |
| Profile | `Perfil` (i18n: nav.profile) |

---

## 9. Home Page - Chat Tab (`Home.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Tab: Chat | `Conversas` |
| Tab: Status | `Estados` |
| Tab: Calls | `Chamadas` |
| Empty title | `Sem mensagens` |
| Empty description | `Inicia uma conversa` |
| New chat button | `Nova conversa` |
| Cancel selection | `Cancelar` |
| Select conversations tooltip | `Selecionar conversas` |

### Toast Messages
| Context | Text |
|---------|------|
| Archive (bulk) | `{n} conversa(s) arquivada(s)` |
| Pin (bulk) | `{n} conversa(s) fixada(s)` |
| Mute (bulk) | `{n} conversa(s) silenciada(s)` |
| Archive (single) | `Conversa arquivada` |
| Pin toggle | `Chat fixado` / `Chat desafixado` |
| Mute toggle | `Chat silenciado` / `Notificações ativadas` |
| Copy | `Mensagem copiada` |
| Forward error | `Sem mensagem para encaminhar` |
| Error | `Erro` |

---

## 10. Feed Page (`Feed.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Header title | `yamilook` |
| Empty title | `Ainda não há partilhas na tua banda` |
| Empty description | `O mambo começa na banda.` |
| Create post button | `Criar na tua banda` |

---

## 11. Chat Page (`Chat.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Default group name | `Group Chat` |
| Default name | `Chat` |
| Loading | `Joining stream...` |

### Toast Messages
| Context | Text |
|---------|------|
| Error | `Error` |
| Star toggle | `Removed from starred` / `Added to starred` |
| Pin toggle | `Unpinned` / `Pinned` |
| Highlight | `Message highlighted` |
| Remove highlight | `Highlight removed` |
| Scheduled | `Message scheduled` |
| Bulk delete | `{n} mensagem(ns) apagada(s)` |
| Bulk copy | `Mensagens copiadas` |
| Bulk star | `{n} mensagem(ns) com estrela` |
| Delete own only | `Só podes apagar as tuas mensagens` |
| Open chat error | `Não foi possível abrir o chat` |

---

## 12. Contacts Page (`Contacts.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Header title | `Contactos` (i18n: contacts.title) |
| Subtitle | `{n} contactos` |
| Search placeholder | `Pesquisar...` |
| Tab: All | `Todos` (i18n: contacts.all) |
| Tab: Favorites | `Favoritos` (i18n: contacts.favorites) |
| Tab: Requests | `Pedidos de amizade` (i18n: contacts.friendRequests) |
| Close friends tooltip | `Kambas` (i18n: closeFriends.title) |
| Empty requests title | `Sem pedidos pendentes` (i18n: contacts.noPendingRequests) |
| Empty requests desc | `Pedidos de amizade aparecerão aqui` (i18n: contacts.requestsAppearHere) |
| Received section | `Recebidos ({n})` |
| Sent section | `Enviados ({n})` |
| Empty contacts title | `Sem contactos` (i18n: contacts.noContacts) |
| Empty favorites title | `Sem favoritos ainda` (i18n: contacts.noFavorites) |
| Search no results | `Nenhum contacto encontrado` (i18n: contacts.noContactsFound) |
| Search hint | `Tenta um termo diferente` (i18n: contacts.tryDifferentSearch) |
| Add friends hint | `Adiciona amigos para começar a conversar` (i18n: contacts.addFriendsToChat) |
| Add contact button | `Adicionar contacto` (i18n: contacts.addContact) |

### Toast Messages
| Context | Text |
|---------|------|
| Contact removed | `Contact removed` |
| User blocked | `User blocked` |
| Request accepted | `Friend request accepted!` |
| Error | `Error` |

---

## 13. Calls Page (`Calls.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Header title | `Chamadas` (i18n: calls.title) |
| Clear history | `Limpar histórico de chamadas` (i18n: calls.clearHistory) |
| Stats: Total calls | `Total de chamadas` (i18n: calls.totalCalls) |
| Stats: Duration | `Duração` (i18n: calls.duration) |
| Stats: Video calls | `Videochamadas` (i18n: calls.videoCalls) |
| Tab: All | `Todos` (i18n: contacts.all) |
| Tab: Missed | `Perdida` (i18n: calls.missed) |
| Tab: Scheduled | `Agendadas` (i18n: calls.scheduled) |
| Call type: Video | `Videochamada` (i18n: calls.videoCall) |
| Call type: Voice | `Chamada de voz` (i18n: calls.voiceCall) |
| Empty title | `Sem chamadas ainda` (i18n: calls.noCallsYet) |
| Empty description | `Inicia uma chamada com os teus contactos` (i18n: calls.startCall) |
| Empty missed title | `Sem chamadas perdidas` (i18n: calls.noMissedCalls) |
| Empty missed desc | `Não perdeste nenhuma chamada` (i18n: calls.noMissedCallsDesc) |
| Empty scheduled title | `Sem chamadas agendadas` (i18n: calls.noScheduledCalls) |
| Empty scheduled desc | `Agenda uma chamada com os teus contactos` (i18n: calls.scheduleCallDesc) |
| Schedule button | `Agendar chamada` (i18n: calls.scheduleCall) |
| Date: Today | `Today` |
| Date: Yesterday | `Yesterday` |

---

## 14. Status Page (`Status.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Header title | `Estados` (i18n: status.title) |
| My status | `O Meu Estado` (i18n: status.myStatus) |
| Tap to add | `Toca para adicionar estado` (i18n: status.tapToAdd) |
| Status count | `{n} estado(s) • {time}` |
| Recent section | `Atualizações Recentes` (i18n: status.recentUpdates) |
| Viewed section | `Atualizações Vistas` (i18n: status.viewedUpdates) |
| Muted section | `Atualizações Silenciadas` (i18n: status.mutedUpdates) |
| Mute action | `Silenciar {name}` (i18n: status.mute) |
| Empty title | `Sem atualizações de estado` (i18n: status.noUpdates) |
| Empty description | `Atualizações de estado dos teus contactos aparecerão aqui` (i18n: status.noUpdatesDesc) |
| Muted count | `{n} contacto(s) silenciado(s)` |
| Menu: Archived | `Ver arquivados` (i18n: status.viewArchived) |
| Menu: Privacy | `Privacidade do estado` (i18n: status.privacy) |

---

## 15. Discover Page (`Discover.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Search placeholder | i18n: discover.searchPlaceholder |
| Trending topics label | `O que está a crescer na tua banda hoje` |
| Posts count | `{n} publicações` (i18n: discover.posts) |
| Tab: Trending | `A bater` (i18n: discover.trending) |
| Tab: People | `Pessoas` (i18n: discover.people) |
| Tab: Topics | `Tópicos` (i18n: discover.topics) |
| Empty trending title | `Ainda nada a bater` (i18n: discover.nothingTrending) |
| Empty trending desc | `Volta mais tarde — a tua banda vai mexer.` (i18n: discover.checkBackLater) |
| No posts for topic | `Sem publicações para este tópico` (i18n: discover.noPostsForTopic) |
| View all posts | `Ver todas as publicações` (i18n: discover.viewAllPosts) |
| Empty users title | `Sem utilizadores` (i18n: discover.noUsers) |
| Follow button | `Seguir` (i18n: profile.follow) |
| Local businesses | `Destaques da banda` (i18n: discover.localBusinesses) |

---

## 16. Palco Page (`Palco.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Header title | `PALCO` |
| Header tagline | `Onde a banda ganha voz.` |
| My palcos button | `Meus Palcos` |
| Other palcos section | `Outros Palcos` |
| Empty title | `Nenhum palco encontrado` |
| Empty description | `Seja o primeiro a criar um palco!` |
| Create button | `Criar Palco` |
| Voices count | `+ {n} Vozes pagas` |
| Tip | `Com perguntas mais aprofundadas 🏆, a tua voz ganha destaque.` |

### Featured Palco Card
| UI Element | Current Text |
|------------|-------------|
| Live badge | `AO VIVO • {time} restantes` |
| CTA button | `Entrar na Roda` |

### Palco Grid Card
| UI Element | Current Text |
|------------|-------------|
| Live badge | `LIVE` |
| Voices text | `+{n} Vozes Disponíveis` |
| Price prefix | `A partir de` |
| Date: Today | `Hoje` |
| Date: Tomorrow | `Amanhã` |

---

## 17. Live Stream Page (`Live.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Loading text | `Joining stream...` |
| Live badge | `LIVE` |
| Viewer count | `{n}` (with Users icon) |

---

## 18. Notifications Page (`Notifications.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Header title | `Notificações` |
| Tab: All | `Todas` |
| Tab: Requests | `Pedidos` |
| Tab: Reactions | `Reações` |
| Tab: Comments | `Comentários` |
| Empty title | `Sem notificações` |
| Empty description | `As tuas notificações aparecerão aqui` |

### Notification Messages
| Type | Message Template |
|------|-----------------|
| Friend request | `mandou-te um pedido para ser kamba` |
| Request accepted | `aceitou o teu pedido para ser kamba 🎉` |
| Post reaction | `reagiu ao teu post com {emoji}` |
| Comment | `comentou: "{content}..."` |
| Missed call | `perdeste uma chamada de vídeo/voz` |
| Status view | `viu o teu estado` |

### Toast Messages
| Context | Text |
|---------|------|
| Accept request | `Pedido aceite!` |
| Reject request | `Pedido rejeitado` |
| Error | `Erro ao aceitar/rejeitar pedido` |

---

## 19. Settings Page (`Settings.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Header title | `Definições` (i18n: settings.title) |
| Profile: User name | `{display_name}` |
| Profile: Status | `{status_message}` or `Editar perfil` |

### Quick Actions
| Action | Label |
|--------|-------|
| Starred | `Favoritos` (i18n: settings.starred) |
| Backup | `Backup` (i18n: settings.backup) |
| Invite | `Convidar` (i18n: settings.invite) |

### Sections & Items
| Section | Item | Description |
|---------|------|-------------|
| Aparência | Tema | `Sistema` / `Claro` / `Escuro` |
| Aparência | Idioma | Language selector |
| Notificações | - | `Sons, vibração, horas silenciosas` |
| Privacidade e Segurança | - | `Estado online, confirmação de leitura, utilizadores bloqueados` |
| Armazenamento e Dados | - | Storage and backup options |
| Conversas | Papel de parede | `Personalizar fundo do chat` |
| Conversas | Arquivadas | Archived chats |
| Chamadas | Toque | Ringtone settings |
| Conta | Alterar palavra-passe | - |
| Conta | Terminar sessão | - |
| Conta | Eliminar conta | - |
| Ajuda | Centro de ajuda | - |
| Ajuda | Termos de serviço | - |
| Ajuda | Política de privacidade | - |
| Ajuda | Sobre Yamilook | Version info |

### Dialog: Log Out
| UI Element | Current Text |
|------------|-------------|
| Title | `Terminar sessão?` (i18n: settings.logOutConfirm) |
| Description | `Precisarás de iniciar sessão novamente para aceder à tua conta.` |
| Cancel button | `Cancelar` |
| Confirm button | `Terminar sessão` |
| Loading state | `A terminar sessão...` |

### Dialog: Delete Account
| UI Element | Current Text |
|------------|-------------|
| Title | `Eliminar a tua conta?` |
| Description | `Esta ação não pode ser desfeita. Todos os teus dados, mensagens e media serão eliminados permanentemente.` |

---

## 20. Profile Page (`Profile.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Menu: Share | `Partilhar` (i18n: feed.share) |
| Menu: Settings | `Definições` (i18n: nav.settings) |
| Menu: Log out | `Terminar sessão` (i18n: settings.logOut) |
| Stats: Publicações | `Publicações` |
| Stats: Momambos | `Momambos` |
| Stats: Ritmos | `Ritmos` |
| Stats: Kambas | `Kambas` (owner only) |
| Stats: Fotos | `Fotos` (owner only) |
| Follow button | `Seguir` (i18n: profile.follow) |
| Pending button | `Pendente` (i18n: profile.pending) |
| Accept button | `Aceitar` (i18n: profile.acceptRequest) |
| Message button | `Mensagem` (i18n: profile.message) |
| Not found | `Não encontrado` (i18n: errors.notFound) |

### QR Code Sheet
| UI Element | Current Text |
|------------|-------------|
| Description | `Digitalize este código QR para ver o meu perfil` |
| Copy link button | `Copiar Link` |
| Save QR button | `Guardar QR` |

---

## 21. Purchase Success Page (`PurchaseSuccess.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Title (voice) | `Voz confirmada!` |
| Title (qa_pass) | `Passe ativo!` |
| Title (default) | `Pagamento confirmado!` |
| Subtitle (voice) | `A tua Voz foi registada. Receberás a resposta conforme o tipo escolhido.` |
| Subtitle (qa_pass) | `Agora já podes ouvir a sessão de perguntas.` |
| Subtitle (default) | `O teu pagamento foi processado com sucesso.` |
| Receipt label | `Recibo` |
| Receipt format | `#YML-{id}` |
| Back button | `Voltar à Roda` |
| My voices button | `Ver as minhas Vozes` |

---

## 22. Not Found Page (`NotFound.tsx`)

| UI Element | Current Text |
|------------|-------------|
| Title | `404` |
| Message | `Oops! Page not found` |
| Link | `Return to Home` |

---

## 23. Common Components

### Typing Indicator (`TypingIndicator.tsx`)
| Scenario | Text |
|----------|------|
| 1 user | `{name} is typing` |
| 2 users | `{name1} and {name2} are typing` |
| 3+ users | `{name1} and {n} others are typing` |

### Credit Display (`CreditDisplay.tsx`)
| UI Element | Current Text |
|------------|-------------|
| Credits label | `créditos` |
| Refresh tooltip | `Última atualização: {time}` / `Atualizar taxas` |

### Currency Selector (`CurrencySelector.tsx`)
| UI Element | Current Text |
|------------|-------------|
| Reference section | `Moedas de Referência` |
| Local section | `Moedas Locais` |

---

## 24. Form Validation Messages

### General
| Field | Error Message |
|-------|--------------|
| Email | `Por favor insere um email válido` |
| Password (min) | `A palavra-passe deve ter pelo menos 6 caracteres` |
| Display name | `Name must be at least 2 characters` |
| Username (min) | `Username must be at least 3 characters` |
| Username (max) | `Username must be less than 20 characters` |
| Username (format) | `Username can only contain letters, numbers, and underscores` |
| Password (8 chars) | `Password must be at least 8 characters` |
| Password (uppercase) | `Password must contain at least one uppercase letter` |
| Password (lowercase) | `Password must contain at least one lowercase letter` |
| Password (number) | `Password must contain at least one number` |

---

## 25. Error Messages

| Context | Message |
|---------|---------|
| Invalid credentials | `Email ou palavra-passe incorretos` (i18n: auth.invalidCredentials) |
| Email not confirmed | `Por favor confirma o teu email primeiro` (i18n: auth.emailNotConfirmed) |
| Generic error | i18n: errors.generic |
| Not found | i18n: errors.notFound |
| Unauthorized | i18n: errors.unauthorized |

---

## Notes

- All i18n keys reference `src/i18n/locales/pt.json` as the primary language
- Brand copy uses Portuguese (European variant)
- Reactions use African cultural terminology
- "Kambas" is the localized term for "Close Friends"
- "Momambos" is used instead of "Highlights"
