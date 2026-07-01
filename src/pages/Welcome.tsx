import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import YamilookLogo from "@/components/brand/YamilookLogo";
import { cn } from "@/lib/utils";

type ToneOption = "pt" | "pt-banda";

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedTone, setSelectedTone] = useState<ToneOption>(
    (i18n.language as ToneOption) || "pt"
  );

  const handleToneChange = (tone: ToneOption) => {
    setSelectedTone(tone);
    i18n.changeLanguage(tone);
    localStorage.setItem("i18nextLng", tone);
  };

  const toneOptions = [
    {
      id: "pt" as ToneOption,
      emoji: "🇦🇴",
      label: t("welcome.toneStandard"),
      description: t("welcome.toneStandardDesc"),
    },
    {
      id: "pt-banda" as ToneOption,
      emoji: "🇦🇴",
      label: t("welcome.toneBanda"),
      description: t("welcome.toneBandaDesc"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <YamilookLogo size="xl" showTagline={false} animate={true} />
        </motion.div>

        <motion.h1
          className="mt-6 text-2xl font-semibold text-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          key={`title-${selectedTone}`}
        >
          {t("welcome.title")} 👋🏾
        </motion.h1>

        <motion.p
          className="mt-2 text-lg text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          key={`subtitle-${selectedTone}`}
        >
          {t("welcome.subtitle")}
        </motion.p>

        <motion.p
          className="mt-1 text-sm text-muted-foreground/70 text-center max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          key={`tagline-${selectedTone}`}
        >
          {t("welcome.tagline")}
        </motion.p>

        <motion.p
          className="mt-1 text-sm text-muted-foreground/70 text-center max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          key={`tagline2-${selectedTone}`}
        >
          {t("welcome.tagline2")}
        </motion.p>

        {/* Tone Selector */}
        <motion.div
          className="mt-8 w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider font-medium">
            {t("welcome.toneQuestion")}
          </p>
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-2xl">
            {toneOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleToneChange(option.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-300",
                  selectedTone === option.id
                    ? "bg-background shadow-md"
                    : "hover:bg-background/50"
                )}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    selectedTone === option.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </span>
                <AnimatePresence>
                  {selectedTone === option.id && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-muted-foreground text-center"
                    >
                      {option.description}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom CTAs */}
      <motion.div
        className="px-6 pb-10 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Button asChild size="lg" className="w-full h-14 text-base font-semibold">
          <Link to="/onboarding">{t("welcome.createAccount")}</Link>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-base transition-colors duration-150 active:bg-primary active:text-primary-foreground active:border-primary"
          onClick={(e) => {
            const btn = e.currentTarget;
            btn.classList.add("bg-primary", "text-primary-foreground", "border-primary");
            setTimeout(() => {
              setTimeout(() => navigate("/login"), 200);
            }, 200);
          }}
        >
          {t("welcome.haveAccount")}
        </Button>

        <p className="text-xs text-muted-foreground text-center pt-2">
          {t("auth.termsAccept")}{" "}
          <Link to="/terms" className="underline hover:text-foreground">
            {t("auth.termsOfService")}
          </Link>{" "}
          {t("auth.and")}{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            {t("auth.privacyPolicy")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}