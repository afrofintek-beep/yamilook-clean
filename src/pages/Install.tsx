import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Share, MoreVertical, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import YamilookLogo from "@/components/brand/YamilookLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone || installed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <CheckCircle className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-semibold text-foreground mb-2">Yamilook instalado!</h1>
        <p className="text-muted-foreground">A app já está no teu ecrã inicial.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        className="max-w-sm w-full text-center space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <YamilookLogo size="xl" showTagline={false} />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Instala o Yamilook</h1>
          <p className="text-muted-foreground text-sm">
            Acede mais rápido, direto do ecrã inicial. Sem loja, sem espera.
          </p>
        </div>

        {deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2">
            <Download className="w-5 h-5" />
            Instalar agora
          </Button>
        ) : isIOS ? (
          <div className="bg-muted rounded-xl p-4 text-left space-y-3 text-sm text-foreground">
            <p className="font-medium">No Safari:</p>
            <div className="flex items-center gap-3">
              <Share className="w-5 h-5 text-primary shrink-0" />
              <span>Toca em <strong>Partilhar</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-primary shrink-0" />
              <span>Depois em <strong>Adicionar ao ecrã inicial</strong></span>
            </div>
          </div>
        ) : (
          <div className="bg-muted rounded-xl p-4 text-left space-y-3 text-sm text-foreground">
            <p className="font-medium">No browser:</p>
            <div className="flex items-center gap-3">
              <MoreVertical className="w-5 h-5 text-primary shrink-0" />
              <span>Abre o menu <strong>(⋮)</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-primary shrink-0" />
              <span>Toca em <strong>Instalar app</strong></span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
