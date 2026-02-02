import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share,
  Timer,
  AlertTriangle,
  Play,
  Brain,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type {
  ReviewAgenda as ReviewAgendaType,
  ReviewAgendaSection,
} from '@/services/agendaGenerator';

interface MacroReviewAgendaProps {
  agenda: ReviewAgendaType;
  onVisualize?: (section: ReviewAgendaSection) => void;
}

export const MacroReviewAgenda: React.FC<MacroReviewAgendaProps> = ({ agenda, onVisualize }) => {
  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  const handleSectionClick = (sectionTitle: string) => {
    setExpandedSection(expandedSection === sectionTitle ? false : sectionTitle);
  };

  // Match info display
  const MatchInfoHeader = () => (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-white">
              {agenda.match_info.map} vs {agenda.match_info.opponent}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-slate-800/50 border-slate-600 text-slate-200">
                {agenda.match_info.match_type}
              </Badge>
              {agenda.match_info.score && (
                <Badge
                  variant="outline"
                  className="bg-slate-800/50 border-slate-600 text-slate-200"
                >
                  Score: {agenda.match_info.score}
                </Badge>
              )}
              {agenda.match_info.duration && (
                <Badge
                  variant="outline"
                  className="bg-slate-800/50 border-slate-600 text-slate-200"
                >
                  {agenda.match_info.duration}
                </Badge>
              )}
              {agenda.match_info.composition && (
                <Badge
                  variant="outline"
                  className="bg-slate-800/50 border-slate-600 text-slate-200"
                >
                  Composition: {agenda.match_info.composition}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {agenda.quick_stats.estimated_review_time}
              </Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {agenda.quick_stats.critical_issues} Critical
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <MatchInfoHeader />

      {/* Executive Summary */}
      {agenda.executive_summary && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Executive Summary
            </h3>
            <p className="text-muted-foreground">{agenda.executive_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {agenda.review_agenda.length}
              </div>
              <div className="text-sm text-muted-foreground">Key Areas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {agenda.quick_stats.total_issues_identified}
              </div>
              <div className="text-sm text-muted-foreground">Issues Found</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive mb-1">
                {agenda.quick_stats.critical_issues}
              </div>
              <div className="text-sm text-muted-foreground">Critical Issues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {agenda.quick_stats.key_focus_areas.length}
              </div>
              <div className="text-sm text-muted-foreground">Focus Areas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Sections */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Review Agenda
        </h3>

        <AnimatePresence>
          {agenda.review_agenda.map((section, index) => (
            <motion.div
              key={section.section_title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Accordion
                type="single"
                collapsible
                value={
                  expandedSection === section.section_title ? section.section_title : undefined
                }
                onValueChange={() => handleSectionClick(section.section_title)}
              >
                <AccordionItem value={section.section_title} className="border-border">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold">{section.section_title}</h4>
                          <Badge
                            variant={section.priority.length >= 4 ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {section.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {section.time_allocation}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground text-left line-clamp-1">
                          {section.key_findings[0]}
                        </p>
                      </div>
                      {section.visualization_available && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onVisualize?.(section);
                          }}
                          className="ml-4"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      {/* Key Findings */}
                      <div>
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Key Findings
                        </h5>
                        <div className="space-y-2">
                          {section.key_findings.map((finding, idx) => (
                            <Card
                              key={idx}
                              className={
                                idx === 0
                                  ? 'border-l-4 border-l-destructive bg-destructive/5'
                                  : 'border-l-4 border-l-warning bg-warning/5'
                              }
                            >
                              <CardContent className="p-4">
                                <p className="text-sm">{finding}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Evidence */}
                      {section.evidence.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold mb-3">Supporting Evidence</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {section.evidence.map((evidence, idx) => (
                              <Card key={idx} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="text-xs text-muted-foreground mb-2">
                                    {evidence.metric || `Evidence ${idx + 1}`}
                                  </div>
                                  <div className="space-y-1">
                                    {evidence.pattern && (
                                      <p className="text-sm font-medium">{evidence.pattern}</p>
                                    )}
                                    {evidence.our_team !== undefined &&
                                      evidence.their_team !== undefined && (
                                        <p className="text-sm">
                                          {evidence.our_team} vs {evidence.their_team}
                                          {evidence.differential !== undefined && (
                                            <span
                                              className={
                                                evidence.differential < 0
                                                  ? 'text-destructive ml-2'
                                                  : 'text-green-600 ml-2'
                                              }
                                            >
                                              ({evidence.differential > 0 ? '+' : ''}
                                              {evidence.differential})
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    {evidence.rounds && (
                                      <p className="text-xs text-muted-foreground">
                                        Rounds: {evidence.rounds.join(', ')}
                                      </p>
                                    )}
                                    {evidence.impact && (
                                      <p className="text-xs text-muted-foreground">
                                        Impact: {evidence.impact}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coaching Points */}
                      <div>
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          Coaching Discussion Points
                        </h5>
                        <div className="space-y-3">
                          {section.coaching_points.map((point, idx) => (
                            <Card key={idx} className="bg-primary/5 border-primary/20">
                              <CardContent className="p-4">
                                <h6 className="text-sm font-semibold text-primary mb-2">
                                  {point.question}
                                </h6>
                                <p className="text-sm text-muted-foreground">
                                  {point.discussion_prompt}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Actions */}
                      <div>
                        <h5 className="text-sm font-semibold mb-3">Recommended Practice Drills</h5>
                        <div className="flex flex-wrap gap-2">
                          {section.recommended_actions.map((action, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Agenda Footer */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Generated {new Date(agenda.generated_at).toLocaleDateString()} • v
            {agenda.agenda_version}
          </p>
          <p className="text-xs text-muted-foreground">
            This agenda was automatically generated based on match telemetry data. Use as a starting
            point for team review sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MacroReviewAgenda;
