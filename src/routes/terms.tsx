import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PyrosLogo } from "@/components/brand/PyrosLogo";
import {
  Shield,
  FileText,
  Printer,
  ArrowLeft,
  Mail,
  CheckCircle,
  ExternalLink,
  HeartPulse,
} from "lucide-react";
import {
  LEGAL_METADATA,
  TERMS_OF_USE_SECTIONS,
  PRIVACY_POLICY_SECTIONS,
  LegalSection,
} from "@/constants/legal";
import { MedicalDisclaimerCard } from "@/components/legal/MedicalDisclaimerCard";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones & Política de Privacidad — PYROSFIT" },
      {
        name: "description",
        content:
          "Documentación legal oficial de PYROSFIT: Términos y Condiciones de Uso y Política de Privacidad para nuestra comunidad de Gente Fit.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("terminos");

  const handlePrint = () => {
    window.print();
  };

  const renderSection = (sec: LegalSection) => {
    if (sec.isWarning) {
      return (
        <section key={sec.id} id={sec.id} className="scroll-mt-24 pt-2 pb-4">
          <MedicalDisclaimerCard />
        </section>
      );
    }

    return (
      <section
        key={sec.id}
        id={sec.id}
        className="scroll-mt-24 rounded-xl border border-border/50 bg-card/40 p-5 space-y-3 transition-all hover:border-border"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            {sec.number}
          </span>
          <h3 className="font-display text-base sm:text-lg tracking-wide text-foreground">
            {sec.title}
          </h3>
        </div>

        {sec.intro && (
          <p className="text-sm text-muted-foreground leading-relaxed">{sec.intro}</p>
        )}

        {sec.bullets && sec.bullets.length > 0 && (
          <ul className="space-y-2 pl-5 text-sm text-muted-foreground list-disc marker:text-primary">
            {sec.bullets.map((bullet, idx) => (
              <li key={idx} className="leading-relaxed">
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {sec.subsections && sec.subsections.length > 0 && (
          <div className="space-y-2.5 pl-2 pt-1">
            {sec.subsections.map((sub, idx) => (
              <div key={idx} className="space-y-1">
                {sub.subtitle && (
                  <p className="text-sm font-semibold text-foreground">• {sub.subtitle}:</p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed pl-3">{sub.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ backgroundImage: "var(--gradient-mesh)", backgroundAttachment: "fixed" }}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2.5 rounded-lg border border-border/60 hover:bg-card/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Link to="/" className="flex items-center gap-2">
              <PyrosLogo variant="icon" size="sm" iconClassName="h-7 w-7" />
              <span className="font-display text-lg tracking-wider font-bold">PyrosFit</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Link to="/login">
              <Button variant="hero" size="sm" className="text-xs h-8">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8 sm:mb-12 space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
              Documentación Legal Oficial
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Vigencia: {LEGAL_METADATA.effectiveDate}
            </Badge>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide font-bold">
            Términos y Condiciones & Política de Privacidad
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Regulaciones de acceso, derechos, deberes, exención de responsabilidad médica y
            protección de datos de la plataforma {LEGAL_METADATA.appName} para nuestra comunidad de
            Gente Fit.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Table of Contents (Desktop Sidebar) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 space-y-4">
              <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Índice de Contenidos
              </h2>

              <div className="space-y-1 text-xs">
                <a
                  href="#terminos-uso"
                  className="block font-medium text-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-card"
                >
                  1. Términos y Condiciones de Uso
                </a>
                <div className="pl-3 space-y-1 text-muted-foreground border-l border-border/60 ml-2">
                  {TERMS_OF_USE_SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block hover:text-primary transition-colors py-0.5"
                    >
                      {s.number} {s.title}
                    </a>
                  ))}
                </div>

                <a
                  href="#politica-privacidad"
                  className="block font-medium text-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-card mt-3"
                >
                  2. Política de Privacidad
                </a>
                <div className="pl-3 space-y-1 text-muted-foreground border-l border-border/60 ml-2">
                  {PRIVACY_POLICY_SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block hover:text-primary transition-colors py-0.5"
                    >
                      {s.number} {s.title}
                    </a>
                  ))}
                </div>
              </div>

              {/* Support Card */}
              <div className="pt-3 border-t border-border/60 text-xs space-y-2">
                <p className="text-muted-foreground">¿Dudas o solicitudes de privacidad?</p>
                <a
                  href={`mailto:${LEGAL_METADATA.supportEmail}`}
                  className="flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {LEGAL_METADATA.supportEmail}
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Clauses Body */}
          <div className="lg:col-span-8 space-y-10">
            {/* SECCIÓN 1: Términos y Condiciones */}
            <section id="terminos-uso" className="scroll-mt-24 space-y-5">
              <div className="border-b border-border/80 pb-3">
                <h2 className="font-display text-2xl sm:text-3xl tracking-wide font-bold flex items-center gap-2.5">
                  <span className="text-primary">1.</span> Términos y Condiciones de Uso
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Bienvenido a {LEGAL_METADATA.appName} (en adelante, la "Plataforma", la "Aplicación" o
                  el "Servicio"). Estos Términos y Condiciones regulan el acceso y uso de nuestra
                  aplicación móvil, sitio web (pyrosfit.com) y todos los servicios ofrecidos para
                  nuestra comunidad de Gente Fit.
                </p>
              </div>

              <div className="space-y-4">{TERMS_OF_USE_SECTIONS.map(renderSection)}</div>
            </section>

            {/* SECCIÓN 2: Política de Privacidad */}
            <section id="politica-privacidad" className="scroll-mt-24 space-y-5">
              <div className="border-b border-border/80 pb-3">
                <h2 className="font-display text-2xl sm:text-3xl tracking-wide font-bold flex items-center gap-2.5">
                  <span className="text-primary">2.</span> Política de Privacidad
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  En {LEGAL_METADATA.appName}, valoramos profundamente la privacidad de nuestra
                  comunidad de Gente Fit. Esta Política de Privacidad describe cómo recopilamos,
                  utilizamos, almacenamos y protegemos tu información personal al utilizar nuestra
                  aplicación móvil y sitio web.
                </p>
              </div>

              <div className="space-y-4">{PRIVACY_POLICY_SECTIONS.map(renderSection)}</div>
            </section>

            {/* Bottom Contact and Acceptance Notice */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-card p-6 text-center space-y-3 shadow-glow">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl tracking-wide font-semibold">
                Compromiso PyrosFit con la Transparencia
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Nuestra misión es impulsarte a superar tus límites con seguridad, confianza y
                estricto respeto a tu privacidad.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link to="/login">
                  <Button variant="hero" size="sm">
                    Ir al Inicio de Sesión
                  </Button>
                </Link>
                <a href={`mailto:${LEGAL_METADATA.supportEmail}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Contactar Soporte
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/60 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} PyrosFit by{" "}
            <a
              href="https://geek-solutions-landing-page-front.vercel.app/#inicio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              GeekSolutions
            </a>
            . Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span>Vigencia: {LEGAL_METADATA.effectiveDate}</span>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Términos & Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
