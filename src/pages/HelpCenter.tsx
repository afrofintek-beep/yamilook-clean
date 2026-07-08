import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, Mail, FileText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "contacto@afrofintek.com";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Como crio uma conta?",
    a: "Na página de entrada, toca em \"Criar conta\", indica o teu email e uma palavra-passe, e confirma o email que recebes. Também podes entrar com a tua conta Google.",
  },
  {
    q: "Esqueci-me da palavra-passe. E agora?",
    a: "Na página de entrada, toca em \"Esqueceu a palavra-passe?\" e segue o link que enviamos para o teu email para definires uma nova.",
  },
  {
    q: "Como ativo a verificação em dois passos (2FA)?",
    a: "Vai a Definições → Privacidade e Segurança → Autenticação de dois fatores → Ativar. Lê o QR com uma app como o Google Authenticator ou Authy e confirma o código de 6 dígitos.",
  },
  {
    q: "Como bloqueio ou desbloqueio alguém?",
    a: "Podes bloquear um contacto a partir do perfil ou da conversa. Para ver e desbloquear, vai a Definições → Privacidade e Segurança → Utilizadores bloqueados.",
  },
  {
    q: "O que é o Kumbu?",
    a: "É a moeda da Yamilook que ganhas ao participar (publicar, interagir, criar). Podes ver o teu saldo e histórico na Carteira Kumbu, a partir do teu perfil.",
  },
  {
    q: "Como me torno criador?",
    a: "Na Carteira Kumbu, toca em \"Tornar-me criador\" e submete a candidatura. Depois de aprovada, ganhas o selo \"Criador Verificado\" e podes pedir a conversão de Kumbu (payouts).",
  },
  {
    q: "Como promovo o meu negócio ou as minhas publicações?",
    a: "Cria um perfil de negócio e compra créditos de publicidade. Podes promover uma publicação diretamente pelo menu \"Promover\" da própria publicação.",
  },
  {
    q: "As chamadas não ligam bem. O que faço?",
    a: "As chamadas funcionam por internet. Em redes muito restritas pode ajudar mudar de Wi-Fi para dados móveis (ou o contrário) e garantir que deste permissão ao microfone/câmara.",
  },
  {
    q: "Como mudo o tema ou o idioma?",
    a: "Em Definições → Aparência podes escolher o tema (Claro, Escuro ou Sistema) e o idioma da app.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

export default function HelpCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Centro de Ajuda</h1>
          <p className="text-muted-foreground mb-8">Respostas às perguntas mais comuns. Não encontras o que procuras? Fala connosco.</p>

          <ScrollArea className="h-[calc(100vh-260px)]">
            <div className="space-y-3 pr-3">
              {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}

              {/* Contact & legal */}
              <div className="mt-6 rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-base font-semibold text-foreground">Ainda precisas de ajuda?</h2>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Ajuda%20Yamilook`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">Contactar suporte — <span className="text-muted-foreground">{SUPPORT_EMAIL}</span></span>
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/terms")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" /> Termos
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/privacy")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm hover:bg-secondary/50 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Privacidade
                  </button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </div>
  );
}
