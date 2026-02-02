import { motion } from "framer-motion";
import { Gamepad2, Cpu, Code2, Zap } from "lucide-react";

const technologies = [
  {
    icon: Gamepad2,
    name: "GRID Esports Data",
    description: "Official, real-time match data",
  },
  {
    icon: Cpu,
    name: "HY-Motion 1.0",
    description: "Advanced motion generation AI",
  },
  {
    icon: Code2,
    name: "React + TypeScript",
    description: "Modern frontend framework",
  },
  {
    icon: Zap,
    name: "FastAPI Backend",
    description: "High-performance Python API",
  },
];

export const TechStackSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-card" />

      <div className="container relative z-10 px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
            Powered by{" "}
            <span className="gradient-text">Cutting-Edge Tech</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built on the latest AI and data science technologies for maximum
            accuracy and performance.
          </p>
        </motion.div>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {technologies.map((tech, index) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div
                  className="glass-card p-6 text-center h-full transition-all duration-300 
                    hover:-translate-y-1 hover:border-primary/50"
                >
                  <div
                    className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 
                      flex items-center justify-center mx-auto mb-4 transition-transform 
                      group-hover:scale-110 duration-300"
                  >
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1">{tech.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tech.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
