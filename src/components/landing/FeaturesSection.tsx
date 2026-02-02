import { motion } from "framer-motion";
import { Brain, BarChart3, GitBranch, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Brain,
    title: "Personalized AI Insights",
    description:
      "Get data-backed feedback on individual player performance. Identify recurring mistakes and improvement areas.",
    stat: "78% accuracy in predicting round outcomes",
    color: "primary" as const,
  },
  {
    icon: BarChart3,
    title: "Automated Macro Review",
    description:
      "Generate complete match review agendas in seconds. Focus coaching time on strategy, not analysis.",
    stat: "Saves 2-3 hours per match review",
    color: "secondary" as const,
  },
  {
    icon: GitBranch,
    title: "Hypothetical Predictions",
    description:
      'Simulate "what if" scenarios. Test strategic decisions before making them in real matches.',
    stat: "Predicts strategic outcomes with 85% confidence",
    color: "accent" as const,
  },
];

const colorVariants = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
    glow: "group-hover:shadow-[0_0_40px_hsla(262,83%,58%,0.3)]",
  },
  secondary: {
    bg: "bg-secondary/10",
    border: "border-secondary/20",
    text: "text-secondary",
    glow: "group-hover:shadow-[0_0_40px_hsla(217,91%,60%,0.3)]",
  },
  accent: {
    bg: "bg-accent/10",
    border: "border-accent/20",
    text: "text-accent",
    glow: "group-hover:shadow-[0_0_40px_hsla(172,66%,50%,0.3)]",
  },
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card" />

      <div className="container relative z-10 px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge
            variant="outline"
            className="mb-6 border-primary/50 bg-primary/10 text-primary px-4 py-2"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            POWERFUL FEATURES
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 tracking-tight">
            Everything You Need to{" "}
            <span className="gradient-text">Win</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three core features that transform how teams analyze, review, and
            improve their gameplay.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const colors = colorVariants[feature.color];
            const Icon = feature.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div
                  className={`glow-card h-full p-6 lg:p-8 transition-all duration-500 
                    hover:-translate-y-2 ${colors.glow}`}
                >
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border 
                      flex items-center justify-center mb-6 transition-transform 
                      group-hover:scale-110 duration-300`}
                  >
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl lg:text-2xl font-bold font-display mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Stat Badge */}
                  <Badge
                    variant="outline"
                    className={`${colors.bg} ${colors.border} ${colors.text} font-medium`}
                  >
                    {feature.stat}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
