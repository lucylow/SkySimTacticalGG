import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const ParticleField = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

export const HeroSection = () => {
  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to features function (kept for potential future use)
  void scrollToDemo; // Use to avoid unused variable warning

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      <FloatingOrb className="w-96 h-96 bg-primary/20 -top-48 -left-48" delay={0} />
      <FloatingOrb className="w-80 h-80 bg-secondary/20 top-1/4 -right-40" delay={2} />
      <FloatingOrb className="w-64 h-64 bg-accent/20 bottom-20 left-1/4" delay={4} />
      <ParticleField />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), 
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge
                variant="outline"
                className="mb-6 border-primary/50 bg-primary/10 text-primary px-4 py-2 font-medium"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                HACKATHON PROJECT
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-display leading-[1.1] mb-6 tracking-tight"
            >
              The AI-Powered <span className="gradient-text">Esports Coaching</span> Revolution
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Transform raw match data into winning strategies with our comprehensive assistant
              coach platform. Powered by GRID data and HY-Motion 1.0.
            </motion.p>

            {/* 3-Step CTA Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-8 p-4 rounded-xl bg-card/50 border border-primary/20 backdrop-blur-sm"
            >
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                How it works (3 steps):
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
                    1
                  </span>
                  <span>Paste your match data or prompt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
                    2
                  </span>
                  <span>AI analyzes and generates recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
                    3
                  </span>
                  <span>Review, accept, or adjust the insights</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-primary"
                asChild
              >
                <Link to="/app/ai-playground">
                  Try Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border/50 hover:bg-muted/50 text-lg px-8 py-6"
                onClick={scrollToDemo}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/30"
            >
              {[
                { value: '99%', label: 'Accuracy' },
                { value: '5x', label: 'Faster Analysis' },
                { value: '24/7', label: 'AI Coaching' },
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold font-display gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Demo Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="glass-card p-6 relative overflow-hidden">
              {/* Mock Dashboard */}
              <div className="aspect-[4/3] bg-background rounded-xl overflow-hidden relative">
                {/* Header Bar */}
                <div className="absolute top-0 inset-x-0 h-12 bg-muted/50 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                  <span className="ml-4 text-xs text-muted-foreground font-mono">
                    Live Analysis Dashboard
                  </span>
                </div>

                {/* Content Area */}
                <div className="pt-12 p-4 h-full flex flex-col">
                  {/* Chart Area */}
                  <div className="flex-1 relative mb-4">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                          <stop offset="100%" stopColor="hsl(172, 66%, 50%)" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M 20,150 Q 80,100 140,120 Q 200,140 260,80 Q 320,40 380,90"
                        fill="none"
                        stroke="url(#chartGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </svg>

                    {/* Floating Data Points */}
                    {[
                      { x: '15%', y: '60%', value: '+23%' },
                      { x: '55%', y: '35%', value: '87.5' },
                      { x: '85%', y: '45%', value: 'WIN' },
                    ].map((point, i) => (
                      <motion.div
                        key={i}
                        className="absolute glass-card px-2 py-1 text-xs font-mono"
                        style={{ left: point.x, top: point.y }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.3 }}
                      >
                        <span className="gradient-text font-bold">{point.value}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom Stats Bar */}
                  <div className="glass-card p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Round Win Probability</div>
                      <div className="text-lg font-bold gradient-text">65%</div>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    <Badge className="bg-accent/20 text-accent border-accent/30">LIVE</Badge>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-1 bg-gradient-primary opacity-20 blur-xl -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
