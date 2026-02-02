import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Github, ArrowRight, LayoutDashboard, Gamepad2, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Tech Stack", href: "#tech-stack" },
];

const appPages = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard, description: "Overview and key metrics" },
  { label: "Match Analysis", href: "/app/match", icon: Gamepad2, description: "Detailed match breakdowns" },
  { label: "Player Development", href: "/app/player", icon: Users, description: "Track player progress" },
  { label: "AI Playground", href: "/app/ai-playground", icon: Sparkles, description: "Interactive AI agent" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  const scrollToSection = (href: string) => {
    if (!isLandingPage) {
      window.location.href = "/" + href;
      return;
    }
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center font-bold text-lg font-display">
                AC
              </div>
              <span className="font-bold text-lg hidden sm:block font-display gradient-text">
                AssistantCoach.ai
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground 
                    hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {link.label}
                </button>
              ))}
              
              {/* App Pages Dropdown */}
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground">
                      App
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[320px] gap-1 p-2">
                        {appPages.map((page) => (
                          <li key={page.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={page.href}
                                className={cn(
                                  "flex items-center gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                )}
                              >
                                <page.icon className="h-5 w-5 text-primary" />
                                <div>
                                  <div className="text-sm font-medium">{page.label}</div>
                                  <p className="text-xs text-muted-foreground">{page.description}</p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-border/50 hover:bg-muted/50"
                asChild
              >
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                asChild
              >
                <Link to="/app">
                  Launch App
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-x-0 top-16 z-40 md:hidden"
        >
          <div className="bg-background/95 backdrop-blur-xl border-b border-border/50 p-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="px-4 py-3 text-left font-medium text-muted-foreground 
                    hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 mt-2 border-t border-border/50 space-y-1">
                <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">App Pages</p>
                {appPages.map((page) => (
                  <Link
                    key={page.href}
                    to={page.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-left font-medium text-muted-foreground 
                      hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                  >
                    <page.icon className="h-4 w-4 text-primary" />
                    {page.label}
                  </Link>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-border/50 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full border-border/50"
                  asChild
                >
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
                <Button className="w-full bg-gradient-primary" asChild>
                  <Link to="/app">
                    Launch App
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
