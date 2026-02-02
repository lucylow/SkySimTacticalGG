import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Play,
  Download,
  AlertCircle,
  CheckCircle2,
  Brain,
  Target,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { backendApi } from '@/services/backendApi';
import type { MacroReview as MacroReviewType, MacroReviewEvent } from '@/types/backend';
import type { ReviewAgenda } from '@/services/agendaGenerator';
import { MacroReviewAgenda } from '@/components/reviews/MacroReviewAgenda';
import { Skeleton } from '@/components/ui/skeleton';

export const MacroReviewPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<MacroReviewType | null>(null);
  const [agenda, setAgenda] = useState<ReviewAgenda | null>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [useAgendaFormat, setUseAgendaFormat] = useState(true);
  const [motionDialogOpen, setMotionDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MacroReviewEvent | null>(null);

  useEffect(() => {
    if (matchId) {
      void loadReview().catch((error) => {
        console.error('Failed to load review:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const loadReview = async () => {
    if (!matchId) return;

    setLoading(true);
    try {
      // Try to load agenda format first
      try {
        const agendaData = await backendApi.generateReviewAgenda(matchId);
        setAgenda(agendaData);
        setUseAgendaFormat(true);
      } catch {
        // Fallback to legacy format
        const data = await backendApi.getMacroReview(matchId);
        setReview(data);
        setUseAgendaFormat(false);
      }
    } catch (error) {
      console.error('Failed to load review:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReview = async () => {
    if (!matchId) return;

    setGenerating(true);
    try {
      if (useAgendaFormat) {
        // Generate new agenda format
        const agendaData = await backendApi.generateReviewAgenda(matchId);
        setAgenda(agendaData);
      } else {
        // Generate legacy format
        const data = await backendApi.generateMacroReview(matchId);
        setReview(data);
      }
    } catch (error) {
      console.error('Failed to generate review:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Wrapper function for onClick handler to avoid ESLint no-misused-promises
  const handleGenerateReviewClick = (): void => {
    generateReview().catch((error) => {
      console.error('Failed to generate review:', error);
    });
  };

  const handleVisualize = (section: import('@/services/agendaGenerator').ReviewAgendaSection) => {
    // Handle visualization for agenda section
    console.log('Visualize section:', section);
    // You can open motion viewer or navigate to visualization
  };

  const launchMotionViewer = (event: MacroReviewEvent) => {
    setSelectedEvent(event);
    setMotionDialogOpen(true);
  };

  const getEventTypeIcon = (type: MacroReviewEvent['type']) => {
    switch (type) {
      case 'CRITICAL_ECONOMIC_DECISION':
        return <TrendingUp className="h-4 w-4" />;
      case 'FAILED_EXECUTE':
        return <AlertCircle className="h-4 w-4" />;
      case 'MOMENTUM_SHIFT':
        return <BarChart3 className="h-4 w-4" />;
      case 'MAP_CONTROL_LOSS':
        return <Target className="h-4 w-4" />;
      case 'CLUTCH_SITUATION':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'PISTOL_ROUND_IMPACT':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: MacroReviewEvent['type']) => {
    switch (type) {
      case 'CRITICAL_ECONOMIC_DECISION':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'FAILED_EXECUTE':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'MOMENTUM_SHIFT':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'MAP_CONTROL_LOSS':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'CLUTCH_SITUATION':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'PISTOL_ROUND_IMPACT':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!review && !agenda) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Macro Game Review</h1>
              <p className="text-muted-foreground">Automated strategic analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={useAgendaFormat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseAgendaFormat(true)}
            >
              Agenda Format
            </Button>
            <Button
              variant={!useAgendaFormat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseAgendaFormat(false)}
            >
              Legacy Format
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Review Available</h2>
            <p className="text-muted-foreground mb-6">
              Generate an automated macro review for this match to identify critical strategic
              moments.
            </p>
            <Button onClick={handleGenerateReviewClick} disabled={generating} size="lg">
              {generating ? 'Generating Review...' : 'Generate Review'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Render new agenda format if available
  if (agenda) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Game Review Agenda</h1>
              <p className="text-muted-foreground">Automated macro review generation</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setAgenda(null);
              setReview(null);
            }}
          >
            Regenerate
          </Button>
        </div>
        <MacroReviewAgenda agenda={agenda} onVisualize={handleVisualize} />
      </motion.div>
    );
  }

  if (!review) return null;

  const activePhase = review.review_agenda[activePhaseIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Match Review Agenda</h1>
            <p className="text-muted-foreground">
              Auto-generated strategic analysis • {review.summary}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export to Playbook
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-white">Executive Summary</h2>
              <p className="text-slate-300 mb-4">{review.summary}</p>
              <div className="flex flex-wrap gap-2">
                {review.key_themes.map((theme, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-slate-800/50 border-slate-600 text-slate-200"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Agenda Stepper */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Review Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {review.review_agenda.map((phase, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhaseIndex(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      activePhaseIndex === index
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{phase.phase}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{phase.focus}</p>
                      </div>
                      {activePhaseIndex === index && (
                        <div className="h-2 w-2 rounded-full bg-primary ml-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{phase.time_allocation}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Key Themes Summary */}
              <Card className="mt-6 bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Key Strategic Themes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {review.key_themes.map((theme, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Active Phase Details */}
        <div className="lg:col-span-3">
          {activePhase && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{activePhase.phase}</CardTitle>
                    <p className="text-primary font-medium">{activePhase.coaching_question}</p>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {activePhase.time_allocation}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Critical Events in this Phase */}
                <Accordion type="single" collapsible className="w-full">
                  {activePhase.items.map((event, index) => (
                    <AccordionItem key={index} value={`event-${index}`} className="border-border">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-start gap-4 w-full pr-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getEventTypeIcon(event.type)}
                              <span className="font-semibold">
                                Round {event.round_number}: {event.title}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground text-left">
                              {event.description}
                            </p>
                          </div>
                          <Badge
                            className={`${getEventTypeColor(event.type)} ${
                              event.impact_score > 0.7 ? 'font-bold' : ''
                            }`}
                          >
                            Impact: {Math.round(event.impact_score * 100)}%
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          <div className="md:col-span-2 space-y-4">
                            <Card className="bg-muted/50">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-2 text-primary">
                                  Strategic Insight
                                </h4>
                                <p className="text-sm">{event.strategic_insight}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-secondary/50">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-2 text-secondary-foreground">
                                  Recommended Action
                                </h4>
                                <p className="text-sm">{event.recommendation}</p>
                              </CardContent>
                            </Card>
                          </div>
                          <div className="flex flex-col gap-2">
                            {event.needs_visualization && (
                              <Button
                                variant="default"
                                className="w-full h-full"
                                onClick={() => launchMotionViewer(event)}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                View 3D Playback
                              </Button>
                            )}
                            <Card className="bg-muted/30">
                              <CardContent className="p-3">
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="font-medium">
                                      {event.type.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  {event.round_ids && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Rounds:</span>
                                      <span className="font-medium">
                                        {event.round_ids.join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Items Footer */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Next Practice Focus Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {review.action_items.slice(0, 3).map((item, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {item.drills[0]?.description || 'Focus area for improvement'}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={item.estimated_impact > 0.7 ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {item.estimated_impact > 0.7 ? 'High' : 'Medium'} Priority
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.implementation_time}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motion Viewer Dialog */}
      <Dialog open={motionDialogOpen} onOpenChange={setMotionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.title} - Round {selectedEvent?.round_number}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedEvent?.motion_visualization ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.motion_prompt || '3D Motion Visualization'}
                </p>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">
                      Motion visualization would be displayed here. In production, this would show
                      the 3D team movement sequence.
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>Action Type: {selectedEvent.motion_visualization.action_type}</p>
                      <p>
                        Duration:{' '}
                        {selectedEvent.motion_visualization.duration_frames /
                          selectedEvent.motion_visualization.fps}
                        s
                      </p>
                      <p>
                        Quality Score:{' '}
                        {(selectedEvent.motion_visualization.quality_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-2">
                    Motion visualization will be generated for:
                  </p>
                  <p className="font-medium">
                    {selectedEvent?.motion_prompt || 'Team movement sequence'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
