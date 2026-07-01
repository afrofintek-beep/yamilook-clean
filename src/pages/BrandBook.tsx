import { motion } from "framer-motion";
import { ArrowLeft, Book, Palette, Type, Sparkles, Heart, MessageCircle, Zap, AlertTriangle, Frown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import YamilookLogo from "@/components/brand/YamilookLogo";

const africanReactions = [
  { name: "Sankofa Love", emoji: "💛", meaning: "Amor com memória e respeito pelo passado", color: "bg-sankofa", textColor: "text-sankofa" },
  { name: "Ubuntu", emoji: "🤝🏾", meaning: "Solidariedade e humanidade partilhada", color: "bg-ubuntu", textColor: "text-ubuntu" },
  { name: "Djembe", emoji: "🪘", meaning: "Ritmo, celebração, energia coletiva", color: "bg-djembe", textColor: "text-djembe" },
  { name: "Shango", emoji: "💢", meaning: "Raiva justificada, indignação moral", color: "bg-shango", textColor: "text-shango" },
  { name: "Eish", emoji: "😒", meaning: "Exaustão ou insatisfação honesta", color: "bg-eish", textColor: "text-eish" },
];

const colorPalette = [
  { name: "Primary", hsl: "262 83% 58%", className: "bg-primary" },
  { name: "Secondary", hsl: "240 5% 96%", className: "bg-secondary" },
  { name: "Accent", hsl: "262 83% 58%", className: "bg-accent" },
  { name: "Muted", hsl: "240 5% 96%", className: "bg-muted" },
  { name: "Destructive", hsl: "0 84% 60%", className: "bg-destructive" },
];

const typographyScale = [
  { element: "H1", size: "2.25rem", weight: "700", example: "Título Principal" },
  { element: "H2", size: "1.875rem", weight: "600", example: "Título Secundário" },
  { element: "H3", size: "1.5rem", weight: "600", example: "Subtítulo" },
  { element: "Body", size: "1rem", weight: "400", example: "Texto do corpo principal" },
  { element: "Small", size: "0.875rem", weight: "400", example: "Texto pequeno" },
];

export default function BrandBook() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-top">
        <div className="container flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Brand Book</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-4xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <YamilookLogo size="xl" showTagline={false} animate={false} />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">YAMILOOK</h1>
          <p className="text-xl text-muted-foreground italic">"A vida como ela é."</p>
          <Badge variant="secondary" className="text-sm">Versão 1.0 • Janeiro 2026</Badge>
        </section>

        <Separator />

        {/* Essência da Marca */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Essência da Marca</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tagline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-medium text-primary">"A vida como ela é."</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Slogan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-medium text-primary">"Viver é na banda."</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Missão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Criar conexões digitais autênticas enraizadas na cultura africana, 
                celebrando a vida real e as relações genuínas.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Autenticidade", "Ubuntu", "Celebração", "Respeito"].map((value) => (
              <Card key={value} className="text-center">
                <CardContent className="pt-6">
                  <p className="font-medium">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Paleta de Cores */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Paleta de Cores</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {colorPalette.map((color) => (
              <Card key={color.name}>
                <div className={`h-20 rounded-t-lg ${color.className}`} />
                <CardContent className="pt-4">
                  <p className="font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.hsl}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Sistema de Reações Africanas */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-sankofa" />
            <h2 className="text-2xl font-semibold">Reações Africanas</h2>
          </div>

          <p className="text-muted-foreground">
            As reações Yamilook são culturalmente enraizadas, não genéricas. 
            Cada ícone carrega significado profundo.
          </p>

          <div className="grid gap-4">
            {africanReactions.map((reaction, index) => (
              <motion.div
                key={reaction.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`w-12 h-12 rounded-full ${reaction.color} flex items-center justify-center text-2xl`}>
                      {reaction.emoji}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${reaction.textColor}`}>{reaction.name}</p>
                      <p className="text-sm text-muted-foreground">{reaction.meaning}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Tipografia */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Type className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Tipografia</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inter</CardTitle>
              <p className="text-sm text-muted-foreground">Fonte principal — Moderna, legível, versátil</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {typographyScale.map((item) => (
                <div key={item.element} className="flex items-baseline gap-4 border-b border-border pb-3 last:border-0">
                  <Badge variant="outline" className="w-16 justify-center">{item.element}</Badge>
                  <span 
                    style={{ 
                      fontSize: item.size, 
                      fontWeight: parseInt(item.weight) 
                    }}
                  >
                    {item.example}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto font-mono">
                    {item.size} / {item.weight}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Voz & Tom */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Voz & Tom</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Evitar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">"Usuário"</p>
                <p className="text-muted-foreground">"Clique aqui"</p>
                <p className="text-muted-foreground">"Erro ocorrido"</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/50">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Preferir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-foreground">"Tu" ou nome próprio</p>
                <p className="text-foreground">"Vamos lá"</p>
                <p className="text-foreground">"Algo correu mal"</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-lg text-muted-foreground mb-4">Características:</p>
              <div className="flex flex-wrap gap-2">
                <Badge>Caloroso</Badge>
                <Badge>Autêntico</Badge>
                <Badge>Celebratório</Badge>
                <Badge>Respeitoso</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            📖 Brand Book Yamilook
          </p>
          <p className="text-xl font-medium text-primary italic">
            "Viver é na banda."
          </p>
        </footer>
      </main>
    </motion.div>
  );
}
