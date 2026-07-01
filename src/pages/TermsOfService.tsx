import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Serviço</h1>
          <p className="text-muted-foreground mb-8">Última atualização: 12 de Janeiro de 2026</p>

          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-6 pr-4 text-foreground/90">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
                <p className="leading-relaxed">
                  Ao acessar e utilizar o Yamilook, você concorda em cumprir e estar vinculado a estes Termos de Serviço. 
                  Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
                <p className="leading-relaxed">
                  O Yamilook é uma plataforma de comunicação social que permite aos usuários:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Enviar e receber mensagens de texto, voz e mídia</li>
                  <li>Realizar chamadas de voz e vídeo</li>
                  <li>Compartilhar status e publicações</li>
                  <li>Conectar-se com outros usuários</li>
                  <li>Participar de grupos e comunidades</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Elegibilidade</h2>
                <p className="leading-relaxed">
                  Para usar o Yamilook, você deve ter pelo menos 13 anos de idade. Ao usar nosso serviço, 
                  você declara e garante que tem idade legal para formar um contrato vinculativo e que 
                  não está proibido de usar o serviço sob as leis aplicáveis.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Conta do Usuário</h2>
                <p className="leading-relaxed">
                  Você é responsável por manter a confidencialidade de sua conta e senha. 
                  Você concorda em aceitar responsabilidade por todas as atividades que ocorrem 
                  em sua conta. Você deve nos notificar imediatamente sobre qualquer uso não 
                  autorizado de sua conta.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Conduta do Usuário</h2>
                <p className="leading-relaxed mb-2">Você concorda em não:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Usar o serviço para fins ilegais ou não autorizados</li>
                  <li>Publicar conteúdo ofensivo, difamatório ou prejudicial</li>
                  <li>Assediar, ameaçar ou intimidar outros usuários</li>
                  <li>Compartilhar spam ou conteúdo enganoso</li>
                  <li>Tentar acessar contas de outros usuários</li>
                  <li>Interferir ou interromper o funcionamento do serviço</li>
                  <li>Violar direitos de propriedade intelectual de terceiros</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Conteúdo do Usuário</h2>
                <p className="leading-relaxed">
                  Você mantém a propriedade de todo o conteúdo que publica no Yamilook. 
                  Ao publicar conteúdo, você nos concede uma licença mundial, não exclusiva e 
                  livre de royalties para usar, reproduzir e exibir esse conteúdo em conexão 
                  com o serviço.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Propriedade Intelectual</h2>
                <p className="leading-relaxed">
                  O serviço Yamilook, incluindo seu design, logotipos, software e todo o conteúdo 
                  criado por nós, são protegidos por direitos autorais, marcas registradas e 
                  outras leis de propriedade intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Limitação de Responsabilidade</h2>
                <p className="leading-relaxed">
                  O Yamilook é fornecido "como está" sem garantias de qualquer tipo. Não seremos 
                  responsáveis por quaisquer danos indiretos, incidentais, especiais ou consequenciais 
                  resultantes do uso ou incapacidade de usar o serviço.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Modificações do Serviço</h2>
                <p className="leading-relaxed">
                  Reservamos o direito de modificar ou descontinuar o serviço a qualquer momento, 
                  com ou sem aviso prévio. Não seremos responsáveis perante você ou terceiros por 
                  qualquer modificação, suspensão ou descontinuação do serviço.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Encerramento</h2>
                <p className="leading-relaxed">
                  Podemos encerrar ou suspender sua conta e acesso ao serviço imediatamente, 
                  sem aviso prévio, por qualquer motivo, incluindo violação destes Termos de Serviço.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Lei Aplicável</h2>
                <p className="leading-relaxed">
                  Estes termos serão regidos e interpretados de acordo com as leis aplicáveis, 
                  sem consideração aos seus conflitos de disposições legais.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Contato</h2>
                <p className="leading-relaxed">
                  Se você tiver alguma dúvida sobre estes Termos de Serviço, entre em contato 
                  conosco através do email: suporte@yamilook.com
                </p>
              </section>

              <div className="h-8" />
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </div>
  );
}
