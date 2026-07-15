import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import YamilookLogo from "@/components/brand/YamilookLogo";
import {
  Users, Shield, Store, Eye, Coins, UserPlus, Crown, CheckCircle2,
  Smartphone, Globe, Lock, Heart, ArrowRight,
} from "lucide-react";

/* ── brand tokens (match index.css) ── */
const BG = "#111111";
const AMBER = "#F2A900";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.55)";
const MUTED2 = "rgba(255,255,255,0.35)";

/* ── reusable pieces ── */
function PageNumber({ n, total }: { n: number; total: number }) {
  return (
    <span className="absolute bottom-4 right-6 text-[10px] font-mono" style={{ color: MUTED2 }}>
      {n} / {total}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl font-bold text-center leading-tight" style={{ color: WHITE }}>
      {children}
    </h2>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-center text-lg max-w-2xl" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-base" style={{ color: "rgba(255,255,255,0.8)" }}>
      <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: AMBER }} />
      {children}
    </li>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 p-4 rounded-2xl" style={{ background: `${AMBER}22`, color: AMBER }}>
      {children}
    </div>
  );
}

function TableRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  return (
    <tr>
      {cells.map((cell, i) => {
        const Tag = header ? "th" : "td";
        return (
          <Tag
            key={i}
            className={`px-4 py-2 text-left text-sm ${header ? "font-semibold" : "font-normal"}`}
            style={{
              color: header ? WHITE : "rgba(255,255,255,0.8)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {cell}
          </Tag>
        );
      })}
    </tr>
  );
}

/* ── PAGES ── */
const TOTAL = 12;

function CoverPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center" style={{ background: BG }}>
      <PageNumber n={1} total={TOTAL} />
      <YamilookLogo size="xl" showTagline={false} animate={false} />
      <h1 className="mt-8 text-5xl font-bold" style={{ color: WHITE }}>
        Manual de Contas
      </h1>
      <p className="mt-3 text-xl" style={{ color: MUTED }}>
        Guia completo do sistema de utilizadores
      </p>
      <div className="mt-8 flex items-center gap-2 px-5 py-2 rounded-full" style={{ background: `${AMBER}22` }}>
        <span className="text-sm font-medium" style={{ color: AMBER }}>Documento interno — Março 2026</span>
      </div>
    </div>
  );
}

function OverviewPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={2} total={TOTAL} />
      <IconBox><Globe className="h-12 w-12" /></IconBox>
      <SectionTitle>Visão Geral</SectionTitle>
      <Subtitle>O sistema de contas YamiLook é composto por múltiplas camadas complementares.</Subtitle>
      <table className="mt-8 w-full max-w-xl">
        <tbody>
          <TableRow cells={["Camada", "Descrição"]} header />
          <TableRow cells={["Autenticação", "Email/password + Google, Apple, Facebook"]} />
          <TableRow cells={["Perfil", "Dados pessoais, avatar, localização, nível"]} />
          <TableRow cells={["Roles", "Permissões administrativas (admin, moderator)"]} />
          <TableRow cells={["Negócio", "Perfil comercial opcional + publicidade"]} />
          <TableRow cells={["Definições", "Preferências de privacidade e notificações"]} />
        </tbody>
      </table>
    </div>
  );
}

function FlowPage() {
  const steps = [
    { label: "/apply", desc: "Candidatura MVP" },
    { label: "Admin", desc: "Aprovação + Código XXXX-XXXX" },
    { label: "/welcome", desc: "Ecrã de boas-vindas" },
    { label: "/onboarding", desc: "Género → Aniversário → Banda → Foto → Bio" },
    { label: "Registo", desc: "Nome + Email + Password + Código MVP" },
    { label: "Perfil criado", desc: "profiles + user_settings automáticos" },
  ];

  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={3} total={TOTAL} />
      <IconBox><UserPlus className="h-12 w-12" /></IconBox>
      <SectionTitle>Fluxo de Criação de Conta</SectionTitle>
      <Subtitle>Da candidatura MVP ao perfil completo.</Subtitle>
      <div className="mt-8 space-y-3 max-w-lg w-full">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: AMBER, color: BG }}>
              {i + 1}
            </div>
            <div>
              <span className="font-semibold text-sm" style={{ color: WHITE }}>{step.label}</span>
              <span className="ml-2 text-sm" style={{ color: MUTED }}>{step.desc}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 ml-auto shrink-0" style={{ color: MUTED2 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileFieldsPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-12" style={{ background: BG }}>
      <PageNumber n={4} total={TOTAL} />
      <IconBox><Users className="h-12 w-12" /></IconBox>
      <SectionTitle>Estrutura do Perfil</SectionTitle>
      <Subtitle>Campos principais da tabela profiles.</Subtitle>
      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-1 max-w-2xl w-full">
        {[
          ["display_name", "Nome de exibição"],
          ["username", "Nome único (@)"],
          ["avatar_url", "Foto de perfil"],
          ["bio", "Biografia"],
          ["birthday", "Data de nascimento"],
          ["gender", "male / female / other"],
          ["city / neighborhood", "Identidade territorial (Banda)"],
          ["level", "default / verified_creator / founder"],
          ["kumbu_available", "Kumbu para gastar"],
          ["kumbu_lifetime", "Kumbu total (rank)"],
          ["afroloc_code", "Código AfroLoc único"],
          ["profile_theme_color", "Cor personalizada"],
          ["is_online", "Estado online (heartbeat 30s)"],
          ["status_message", "Mensagem de status"],
        ].map(([field, desc], i) => (
          <div key={i} className="flex items-baseline gap-2 py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <code className="text-xs font-mono shrink-0" style={{ color: AMBER }}>{field}</code>
            <span className="text-xs" style={{ color: MUTED }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountTypesPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={5} total={TOTAL} />
      <IconBox><Heart className="h-12 w-12" /></IconBox>
      <SectionTitle>Tipos de Conta</SectionTitle>
      <Subtitle>Três níveis de perfil com funcionalidades progressivas.</Subtitle>
      <div className="mt-8 grid grid-cols-3 gap-6 max-w-3xl w-full">
        {[
          { title: "Padrão", level: "default", ring: "rgba(255,255,255,0.2)", icon: <Users className="w-8 h-8" />, features: ["Todas funcionalidades base", "Publicações, stories, ritmos", "Chat, chamadas, rodas", "Acumular Kumbu"] },
          { title: "Criador Verificado", level: "verified_creator", ring: "rgba(255,255,255,0.5)", icon: <CheckCircle2 className="w-8 h-8" />, features: ["Tudo do Padrão +", "Monetização (payouts)", "Mentor na Academia", "Badge de verificação"] },
          { title: "Fundador", level: "founder", ring: AMBER, icon: <Crown className="w-8 h-8" />, features: ["Acesso total", "Anel dourado #C9A23F", "Badge Crown dourada", "Verificação dourada"] },
        ].map((type, i) => (
          <div key={i} className="rounded-2xl p-5 flex flex-col items-center text-center"
            style={{ border: `2px solid ${type.ring}`, background: "rgba(255,255,255,0.03)" }}>
            <div className="mb-3" style={{ color: type.ring }}>{type.icon}</div>
            <h3 className="text-lg font-bold" style={{ color: WHITE }}>{type.title}</h3>
            <code className="text-[10px] font-mono mt-1 mb-4" style={{ color: MUTED2 }}>{type.level}</code>
            <ul className="space-y-1.5 text-left w-full">
              {type.features.map((f, j) => (
                <li key={j} className="text-xs flex items-start gap-2" style={{ color: MUTED }}>
                  <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: type.ring }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={6} total={TOTAL} />
      <IconBox><Shield className="h-12 w-12" /></IconBox>
      <SectionTitle>Roles Administrativos</SectionTitle>
      <Subtitle>Separados da tabela de perfis por segurança (anti-escalação de privilégios).</Subtitle>
      <div className="mt-8 space-y-6 max-w-xl w-full">
        {[
          { role: "Admin", route: "/admin", perms: ["Gestão de tópicos e categorias", "Aprovação de candidatos MVP", "Gestão de monetização e payouts", "Promoção de moderadores"] },
          { role: "Moderator", route: "/moderation", perms: ["Revisão de denúncias", "Emissão de strikes", "Gestão de apelações", "Log de ações de moderação"] },
        ].map((r, i) => (
          <div key={i} className="rounded-xl p-5" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg font-bold" style={{ color: WHITE }}>{r.role}</span>
              <code className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: `${AMBER}22`, color: AMBER }}>{r.route}</code>
            </div>
            <ul className="space-y-1.5">
              {r.perms.map((p, j) => <Bullet key={j}>{p}</Bullet>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={7} total={TOTAL} />
      <IconBox><Store className="h-12 w-12" /></IconBox>
      <SectionTitle>Perfil de Negócio</SectionTitle>
      <Subtitle>Qualquer utilizador pode criar um perfil comercial para aceder à publicidade.</Subtitle>
      <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-2 max-w-2xl w-full">
        {[
          ["business_name", "Nome do negócio"],
          ["business_category", "Categoria"],
          ["logo_url / cover_image_url", "Imagens da marca"],
          ["city / neighborhood", "Localização"],
          ["phone / email / website", "Contactos"],
          ["latitude / longitude", "Identidade digital territorial"],
          ["credit_balance", "Saldo de créditos"],
          ["is_verified", "Estado de verificação"],
        ].map(([field, desc], i) => (
          <div key={i} className="flex items-baseline gap-2 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <code className="text-xs font-mono shrink-0" style={{ color: AMBER }}>{field}</code>
            <span className="text-xs" style={{ color: MUTED }}>{desc}</span>
          </div>
        ))}
      </div>
      <ul className="mt-6 space-y-2 max-w-lg w-full">
        <Bullet>Dashboard de publicidade com métricas em tempo real</Bullet>
        <Bullet>Anúncios patrocinados no feed e negócios em destaque</Bullet>
        <Bullet>Segmentação por cidade, bairro e demografia</Bullet>
      </ul>
    </div>
  );
}

function PresencePage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={8} total={TOTAL} />
      <IconBox><Smartphone className="h-12 w-12" /></IconBox>
      <SectionTitle>Sistema de Presença</SectionTitle>
      <Subtitle>Rastreamento de estado online/offline com heartbeat automático.</Subtitle>
      <div className="mt-8 space-y-4 max-w-lg w-full">
        {[
          { step: "Login", desc: "updatePresence(userId, true) → online" },
          { step: "Heartbeat", desc: "A cada 30 segundos confirma presença" },
          { step: "Tab oculta", desc: "stopPresenceHeartbeat → offline" },
          { step: "Tab visível", desc: "startPresenceHeartbeat → online" },
          { step: "Fechar browser", desc: "fetch com keepalive → offline" },
          { step: "Logout", desc: "stopPresenceHeartbeat → offline" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: i < 2 ? "#22c55e" : i < 4 ? AMBER : "#ef4444", color: BG }}>
              {i + 1}
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: WHITE }}>{s.step}</span>
              <span className="ml-2 text-sm" style={{ color: MUTED }}>{s.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KumbuPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={9} total={TOTAL} />
      <IconBox><Coins className="h-12 w-12" /></IconBox>
      <SectionTitle>Sistema Kumbu</SectionTitle>
      <Subtitle>Economia de participação com progressão por níveis.</Subtitle>
      <div className="mt-8 grid grid-cols-4 gap-4 max-w-2xl w-full">
        {[
          { name: "Bronze", range: "0 – 200", color: "#CD7F32" },
          { name: "Prata", range: "200 – 800", color: "#C0C0C0" },
          { name: "Ouro", range: "800 – 2000", color: AMBER },
          { name: "KOTA", range: "2000+", color: "#FFD700" },
        ].map((level, i) => (
          <div key={i} className="rounded-xl p-4 flex flex-col items-center text-center"
            style={{ border: `2px solid ${level.color}`, background: "rgba(255,255,255,0.03)" }}>
            <span className="text-2xl font-bold" style={{ color: level.color }}>{level.name}</span>
            <span className="text-xs mt-1" style={{ color: MUTED }}>{level.range}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 px-5 py-3 rounded-xl max-w-lg text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
        <p className="text-sm italic" style={{ color: MUTED }}>
          "Na Yamilook, quem participa ganha Kumbu."
        </p>
        <p className="text-xs mt-1" style={{ color: MUTED2 }}>
          Kumbu não é transferível entre utilizadores.
        </p>
      </div>
    </div>
  );
}

function SecurityPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={10} total={TOTAL} />
      <IconBox><Lock className="h-12 w-12" /></IconBox>
      <SectionTitle>Segurança & Privacidade</SectionTitle>
      <Subtitle>Proteção de dados sensíveis com estratégia de whitelist.</Subtitle>
      <div className="mt-8 space-y-3 max-w-lg w-full">
        <Bullet>SELECT direto a profiles bloqueado para colunas sensíveis (email, telefone)</Bullet>
        <Bullet>Vista public_profiles expõe apenas campos seguros</Bullet>
        <Bullet>get_my_profile() — SECURITY DEFINER para dados próprios</Bullet>
        <Bullet>get_public_profiles_by_ids() — dados públicos de terceiros</Bullet>
      </div>
      <h3 className="mt-8 text-lg font-semibold" style={{ color: WHITE }}>Definições de Privacidade</h3>
      <table className="mt-3 max-w-lg w-full">
        <tbody>
          <TableRow cells={["Definição", "Default"]} header />
          <TableRow cells={["show_online_status", "true"]} />
          <TableRow cells={["show_last_seen", "true"]} />
          <TableRow cells={["show_read_receipts", "true"]} />
          <TableRow cells={["show_typing_indicators", "true"]} />
          <TableRow cells={["two_factor_enabled", "false"]} />
        </tbody>
      </table>
    </div>
  );
}

function VisibilityPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center px-16" style={{ background: BG }}>
      <PageNumber n={11} total={TOTAL} />
      <IconBox><Eye className="h-12 w-12" /></IconBox>
      <SectionTitle>Visibilidade & Relações</SectionTitle>
      <Subtitle>Controlo granular de quem vê o quê.</Subtitle>
      <div className="mt-8 grid grid-cols-2 gap-6 max-w-2xl w-full">
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: WHITE }}>Níveis de Visibilidade</h3>
          <ul className="space-y-2">
            <Bullet>Público — Visível para todos</Bullet>
            <Bullet>Contacts — Apenas Kambas</Bullet>
            <Bullet>Close Friends — Apenas Bradas</Bullet>
            <Bullet>Private — Apenas o próprio</Bullet>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: WHITE }}>Tipos de Relação</h3>
          <ul className="space-y-2">
            <Bullet>Contactos (contacts) — Lista com favoritos</Bullet>
            <Bullet>Bradas (close_friends) — Acesso exclusivo</Bullet>
            <Bullet>Seguidores (followers) — Unidirecional</Bullet>
            <Bullet>Bloqueados (blocked_users) — Restrição total</Bullet>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ClosingPage() {
  return (
    <div className="print-page flex flex-col items-center justify-center" style={{ background: BG }}>
      <PageNumber n={12} total={TOTAL} />
      <YamilookLogo size="lg" showTagline={false} animate={false} />
      <h2 className="mt-6 text-3xl font-bold" style={{ color: WHITE }}>
        Onde a tua banda vive.
      </h2>
      <p className="mt-3 text-base" style={{ color: MUTED }}>
        Documento interno — Versão 1.0 — Março 2026
      </p>
      <p className="mt-1 text-xs" style={{ color: MUTED2 }}>
        Confidencial — Apenas para equipa YamiLook
      </p>
    </div>
  );
}

const PAGES = [
  CoverPage, OverviewPage, FlowPage, ProfileFieldsPage,
  AccountTypesPage, RolesPage, BusinessPage, PresencePage,
  KumbuPage, SecurityPage, VisibilityPage, ClosingPage,
];

export default function UserAccountsManualPrint() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = () => navigate(-1);
    window.addEventListener("afterprint", handler);
    return () => window.removeEventListener("afterprint", handler);
  }, [navigate]);

  return (
    <>
      <style>{`
        @media screen {
          .print-page {
            width: 100%;
            aspect-ratio: 16 / 9;
            page-break-after: always;
            break-after: page;
          }
        }
        @media print {
          @page { size: landscape; margin: 0; }
          body, html {
            margin: 0 !important; padding: 0 !important;
            background: ${BG} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, header, footer, .bottom-nav {
            display: none !important;
          }
          .print-page {
            width: 100vw; height: 100vh;
            page-break-after: always; break-after: page;
            page-break-inside: avoid; break-inside: avoid;
          }
          .print-page:last-child {
            page-break-after: auto; break-after: auto;
          }
        }
      `}</style>
      <div className="print-container">
        {PAGES.map((Page, i) => <Page key={i} />)}
      </div>
    </>
  );
}
