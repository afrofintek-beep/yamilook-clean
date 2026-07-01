import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">Última atualização: 12 de Janeiro de 2026</p>

          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-6 pr-4 text-foreground/90">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
                <p className="leading-relaxed">
                  A sua privacidade é importante para nós. Esta Política de Privacidade explica como 
                  o Yamilook coleta, usa, armazena e protege suas informações pessoais quando você 
                  utiliza nosso serviço.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Informações que Coletamos</h2>
                <p className="leading-relaxed mb-2">Coletamos os seguintes tipos de informações:</p>
                
                <h3 className="font-medium mt-4 mb-2">2.1 Informações de Conta</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nome de usuário e nome de exibição</li>
                  <li>Endereço de email</li>
                  <li>Número de telefone (opcional)</li>
                  <li>Foto de perfil</li>
                  <li>Informações de biografia</li>
                </ul>

                <h3 className="font-medium mt-4 mb-2">2.2 Conteúdo do Usuário</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Mensagens enviadas e recebidas</li>
                  <li>Fotos, vídeos e outros arquivos compartilhados</li>
                  <li>Publicações e comentários</li>
                  <li>Status e stories</li>
                </ul>

                <h3 className="font-medium mt-4 mb-2">2.3 Informações de Uso</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Dados de login e atividade</li>
                  <li>Informações do dispositivo</li>
                  <li>Endereço IP</li>
                  <li>Preferências e configurações</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Como Usamos Suas Informações</h2>
                <p className="leading-relaxed mb-2">Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Fornecer e manter nosso serviço</li>
                  <li>Personalizar sua experiência</li>
                  <li>Processar e entregar mensagens</li>
                  <li>Melhorar e desenvolver novos recursos</li>
                  <li>Garantir a segurança da plataforma</li>
                  <li>Comunicar atualizações importantes</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Compartilhamento de Informações</h2>
                <p className="leading-relaxed mb-2">Podemos compartilhar suas informações com:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Outros usuários conforme suas configurações de privacidade</li>
                  <li>Prestadores de serviços que nos auxiliam na operação</li>
                  <li>Autoridades legais quando exigido por lei</li>
                  <li>Parceiros comerciais com seu consentimento</li>
                </ul>
                <p className="leading-relaxed mt-3">
                  Não vendemos suas informações pessoais a terceiros.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Armazenamento e Segurança</h2>
                <p className="leading-relaxed">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas 
                  informações contra acesso não autorizado, alteração, divulgação ou destruição. 
                  Suas mensagens são criptografadas em trânsito e em repouso.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Retenção de Dados</h2>
                <p className="leading-relaxed">
                  Mantemos suas informações pelo tempo necessário para fornecer o serviço ou 
                  conforme exigido por lei. Você pode solicitar a exclusão de sua conta e dados 
                  a qualquer momento através das configurações do aplicativo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Seus Direitos</h2>
                <p className="leading-relaxed mb-2">Você tem o direito de:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Acessar suas informações pessoais</li>
                  <li>Corrigir dados imprecisos</li>
                  <li>Solicitar exclusão de seus dados</li>
                  <li>Exportar seus dados</li>
                  <li>Retirar consentimento a qualquer momento</li>
                  <li>Apresentar reclamação a uma autoridade de proteção de dados</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Cookies e Tecnologias Similares</h2>
                <p className="leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
                  lembrar suas preferências e analisar como nosso serviço é usado. Você pode 
                  gerenciar suas preferências de cookies através das configurações do navegador.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Menores de Idade</h2>
                <p className="leading-relaxed">
                  Nosso serviço não é destinado a menores de 13 anos. Não coletamos intencionalmente 
                  informações pessoais de crianças. Se descobrirmos que coletamos informações de 
                  um menor, tomaremos medidas para excluir essas informações.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Transferências Internacionais</h2>
                <p className="leading-relaxed">
                  Suas informações podem ser transferidas e armazenadas em servidores localizados 
                  fora do seu país de residência. Garantimos que essas transferências estejam em 
                  conformidade com as leis de proteção de dados aplicáveis.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Alterações nesta Política</h2>
                <p className="leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você 
                  sobre quaisquer alterações significativas através do aplicativo ou por email. 
                  O uso continuado do serviço após as alterações constitui aceitação da política revisada.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Contato</h2>
                <p className="leading-relaxed">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
                  suas informações, entre em contato conosco:
                </p>
                <ul className="list-none mt-2 space-y-1 ml-4">
                  <li><strong>Email:</strong> privacidade@yamilook.com</li>
                  <li><strong>Suporte:</strong> suporte@yamilook.com</li>
                </ul>
              </section>

              <div className="h-8" />
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </div>
  );
}
