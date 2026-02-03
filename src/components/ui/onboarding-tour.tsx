import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  storageKey?: string; // localStorage key to track if tour was completed
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  onComplete,
  storageKey = 'onboarding-tour-completed',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(storageKey);
    if (!completed && steps.length > 0) {
      setIsVisible(true);
    }
  }, [storageKey, steps.length]);

  useEffect(() => {
    const currentStepData = steps[currentStep];
    if (isVisible && currentStepData?.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetElement(null);
      }
    } else {
      setTargetElement(null);
    }
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    onComplete?.();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  if (!step) return null;
  
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Calculate position for tooltip
  let tooltipPosition = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const position = step.position || 'bottom';

    switch (position) {
      case 'top':
        tooltipPosition = {
          top: `${rect.top + window.scrollY - 10}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
        break;
      case 'bottom':
        tooltipPosition = {
          top: `${rect.bottom + window.scrollY + 10}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, 0)',
        };
        break;
      case 'left':
        tooltipPosition = {
          top: `${rect.top + window.scrollY + rect.height / 2}px`,
          left: `${rect.left + window.scrollX - 10}px`,
          transform: 'translate(-100%, -50%)',
        };
        break;
      case 'right':
        tooltipPosition = {
          top: `${rect.top + window.scrollY + rect.height / 2}px`,
          left: `${rect.right + window.scrollX + 10}px`,
          transform: 'translate(0, -50%)',
        };
        break;
      default:
        tooltipPosition = {
          top: `${rect.top + window.scrollY + rect.height / 2}px`,
          left: `${rect.left + window.scrollX + rect.width / 2}px`,
          transform: 'translate(-50%, -50%)',
        };
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={handleSkip}
          />

          {/* Highlight overlay for target element */}
          {targetElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: `${targetElement.getBoundingClientRect().top + window.scrollY - 4}px`,
                left: `${targetElement.getBoundingClientRect().left + window.scrollX - 4}px`,
                width: `${targetElement.getBoundingClientRect().width + 8}px`,
                height: `${targetElement.getBoundingClientRect().height + 8}px`,
              }}
            >
              <div className="absolute inset-0 rounded-lg border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
            </motion.div>
          )}

          {/* Tooltip Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-[10000] max-w-sm"
            style={tooltipPosition}
          >
            <Card className="glass-card p-6 shadow-2xl border-primary/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleSkip}
                  aria-label="Skip tour"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{step.content}</p>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={handlePrevious} disabled={isFirst}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                <Button size="sm" onClick={handleNext} className="bg-gradient-primary">
                  {isLast ? 'Get Started' : 'Next'}
                  {!isLast && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Predefined tour steps for AI Playground
export const aiPlaygroundTourSteps: TourStep[] = [
  {
    id: 'prompt-editor',
    title: 'Prompt Editor',
    content:
      'Start here! Type your question or paste match data. Try sample prompts or use ⌘+Enter to run.',
    target: '[data-tour="prompt-editor"]',
    position: 'bottom',
  },
  {
    id: 'run-agent',
    title: 'Run Analysis',
    content:
      'Click "Run Agent" to start. The AI will analyze your data and stream results in real-time.',
    target: '[data-tour="run-button"]',
    position: 'top',
  },
  {
    id: 'console',
    title: 'View Results',
    content:
      "Watch the AI's analysis appear here. You'll see tool calls, reasoning, and recommendations.",
    target: '[data-tour="console"]',
    position: 'left',
  },
  {
    id: 'events-log',
    title: 'Events Log',
    content: 'A detailed log of all system events and token streams.',
    target: '[data-tour="events-log"]',
    position: 'top',
  },
  {
    id: 'agent-toolbox',
    title: 'Agent Toolbox',
    content: 'View the tools the agent can use to perform tasks.',
    target: '[data-tour="agent-toolbox"]',
    position: 'left',
  },
  {
    id: 'agent-timeline',
    title: 'Strategic Timeline',
    content: 'Key milestones identified by the agent during analysis.',
    target: '[data-tour="agent-timeline"]',
    position: 'left',
  },
  {
    id: 'agent-memory',
    title: 'Memory Panel',
    content: 'Long-term context that persists across different agent runs.',
    target: '[data-tour="agent-memory"]',
    position: 'left',
  },
];