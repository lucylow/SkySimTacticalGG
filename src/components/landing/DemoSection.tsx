import { motion } from "framer-motion";
import { CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const benefits = [
  "Real-time player movement analysis with HY-Motion 1.0",
  "Automatic detection of strategic patterns",
  'Predictive modeling for "what if" scenarios',
  "Integration with GRID esports data",
  "Personalized improvement recommendations",
];

export const DemoSection = () => {
  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-accent/50 bg-accent/10 text-accent px-4 py-2"
            >
              INTERACTIVE DEMO
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
              See It <span className="gradient-text-accent">In Action</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience how Assistant Coach transforms complex data into
              actionable insights with our interactive demo.
            </p>

            {/* Benefits List */}
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/90">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-gradient-accent hover:opacity-90 transition-opacity text-accent-foreground font-semibold px-8 py-6 glow-accent"
            >
              <Play className="mr-2 w-5 h-5" />
              Try Live Demo
            </Button>
          </motion.div>

          {/* Right Content - Demo Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="glass-card p-4 relative">
              <div className="aspect-video bg-background rounded-xl overflow-hidden relative">
                {/* Top Bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                  <span className="text-sm text-muted-foreground font-mono">
                    Live Player Analysis
                  </span>
                  <Badge className="bg-accent/20 text-accent border-accent/30 animate-pulse">
                    87% Accuracy
                  </Badge>
                </div>

                {/* Center Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Radial Grid */}
                  <div className="absolute inset-0 opacity-10">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute border border-primary/30 rounded-full"
                        style={{
                          width: `${(i + 1) * 20}%`,
                          height: `${(i + 1) * 20}%`,
                          left: `${50 - (i + 1) * 10}%`,
                          top: `${50 - (i + 1) * 10}%`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Animated Nodes */}
                  {[
                    { x: "30%", y: "40%", delay: 0 },
                    { x: "70%", y: "35%", delay: 0.5 },
                    { x: "50%", y: "60%", delay: 1 },
                    { x: "25%", y: "70%", delay: 1.5 },
                    { x: "75%", y: "65%", delay: 2 },
                  ].map((node, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-4 h-4"
                      style={{ left: node.x, top: node.y }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: node.delay,
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-gradient-primary" />
                      <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
                    </motion.div>
                  ))}

                  {/* Connection Lines */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <motion.line
                      x1="30"
                      y1="40"
                      x2="70"
                      y2="35"
                      stroke="url(#lineGradient)"
                      strokeWidth="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <motion.line
                      x1="50"
                      y1="60"
                      x2="70"
                      y2="35"
                      stroke="url(#lineGradient)"
                      strokeWidth="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <motion.line
                      x1="25"
                      y1="70"
                      x2="50"
                      y2="60"
                      stroke="url(#lineGradient)"
                      strokeWidth="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 1, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                        <stop offset="100%" stopColor="hsl(172, 66%, 50%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Bottom Stats Bar */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">Round Win Probability</span>
                      <span className="text-2xl font-black gradient-text">65%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-primary rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "65%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-1 bg-gradient-accent opacity-10 blur-2xl -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
