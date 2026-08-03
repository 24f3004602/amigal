import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Video, Shield, Zap, Users, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-pink-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Nav */}
        <nav className="flex h-16 items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-white">
              <Video className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-gradient">Amigal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-warning" />
            <span>Now with AI-powered meeting summaries</span>
          </div>

          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl animate-slide-up">
            Connect without
            <br />
            <span className="text-gradient">boundaries</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Crystal-clear video meetings, end-to-end encryption, and intelligent collaboration tools — all in one beautiful platform.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button asChild size="lg" className="gap-2">
              <Link href="/match">
                Start a Meeting <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Join a Room</Link>
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="mt-24 grid max-w-5xl gap-6 sm:grid-cols-3 px-4">
            {[
              { icon: Shield, title: 'Secure by Default', desc: 'E2E encryption, SOC-2 compliant infrastructure, and zero-trust architecture.' },
              { icon: Zap, title: 'Lightning Fast', desc: 'Optimized WebRTC with adaptive bitrate and global edge routing.' },
              { icon: Users, title: 'Built for Teams', desc: 'From 1:1s to town halls. Host up to 500 participants seamlessly.' },
            ].map((f, i) => (
              <div
                key={f.title}
                className="glass-card p-6 text-left animate-slide-up"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Amigal. Built for the future of work.
        </footer>
      </div>
    </div>
  );
}
