import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, CheckCircle2, ExternalLink, Mail } from "lucide-react";
import {
  LEGAL_METADATA,
  TERMS_OF_USE_SECTIONS,
  PRIVACY_POLICY_SECTIONS,
  LegalSection,
} from "@/constants/legal";
import { MedicalDisclaimerCard } from "./MedicalDisclaimerCard";
import { Link } from "@tanstack/react-router";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  initialTab?: "terms" | "privacy";
}

export function TermsDialog({
  open,
  onOpenChange,
  onAccept,
  initialTab = "terms",
}: TermsDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onOpenChange(false);
  };

  const renderSection = (sec: LegalSection) => {
    if (sec.isWarning) {
      return <MedicalDisclaimerCard key={sec.id} className="my-3" />;
    }

    return (
      <div key={sec.id} className="space-y-2 border-b border-border/40 pb-4 last:border-b-0">
        <h4 className="font-semibold text-foreground text-sm tracking-wide flex items-center gap-2">
          <span className="text-primary font-mono text-xs">{sec.number}</span>
          {sec.title}
        </h4>

        {sec.intro && <p className="text-xs text-muted-foreground leading-relaxed">{sec.intro}</p>}

        {sec.bullets && sec.bullets.length > 0 && (
          <ul className="space-y-1.5 pl-4 text-xs text-muted-foreground list-disc marker:text-primary">
            {sec.bullets.map((bullet, idx) => (
              <li key={idx} className="leading-relaxed">
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {sec.subsections && sec.subsections.length > 0 && (
          <div className="space-y-2 pl-2">
            {sec.subsections.map((sub, idx) => (
              <div key={idx} className="space-y-0.5">
                {sub.subtitle && (
                  <p className="text-xs font-medium text-foreground">• {sub.subtitle}:</p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed pl-2">{sub.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-gradient-card p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1.5 shrink-0 text-left border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-glow">
                <Shield className="h-4 w-4" />
              </div>
              <DialogTitle className="font-display text-xl sm:text-2xl tracking-wide">
                Documentación Legal
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
              Vigencia: {LEGAL_METADATA.effectiveDate}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Términos y Condiciones de Uso y Política de Privacidad de {LEGAL_METADATA.appName}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col min-h-0 pt-2"
        >
          <TabsList className="grid grid-cols-2 w-full bg-background/60 p-1 shrink-0">
            <TabsTrigger
              value="terms"
              className="text-xs font-medium flex items-center gap-1.5 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              1. Términos de Uso
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="text-xs font-medium flex items-center gap-1.5 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="h-3.5 w-3.5" />
              2. Política de Privacidad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="flex-1 min-h-0 mt-3 outline-none">
            <ScrollArea className="h-[48vh] sm:h-[52vh] pr-3">
              <div className="space-y-4 pr-1">
                <div className="rounded-lg bg-card/60 border border-border/60 p-3 text-xs text-muted-foreground leading-relaxed">
                  Bienvenido a {LEGAL_METADATA.appName}. Estos Términos y Condiciones regulan el
                  acceso y uso de nuestra aplicación móvil y sitio web para nuestra comunidad de
                  Gente Fit.
                </div>
                {TERMS_OF_USE_SECTIONS.map(renderSection)}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="privacy" className="flex-1 min-h-0 mt-3 outline-none">
            <ScrollArea className="h-[48vh] sm:h-[52vh] pr-3">
              <div className="space-y-4 pr-1">
                <div className="rounded-lg bg-card/60 border border-border/60 p-3 text-xs text-muted-foreground leading-relaxed">
                  En {LEGAL_METADATA.appName}, valoramos profundamente la privacidad de nuestra
                  comunidad de Gente Fit. Esta política describe cómo recopilamos, usamos y
                  protegemos tu información.
                </div>
                {PRIVACY_POLICY_SECTIONS.map(renderSection)}

                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">¿Preguntas sobre privacidad?</span>
                  </div>
                  <a
                    href={`mailto:${LEGAL_METADATA.supportEmail}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {LEGAL_METADATA.supportEmail}
                  </a>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-3 border-t border-border/60">
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 self-start sm:self-center"
          >
            Abrir en página completa <ExternalLink className="h-3 w-3" />
          </Link>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial"
            >
              Cerrar
            </Button>
            {onAccept && (
              <Button
                type="button"
                variant="hero"
                size="sm"
                onClick={handleAccept}
                className="flex-1 sm:flex-initial"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Aceptar y Continuar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
