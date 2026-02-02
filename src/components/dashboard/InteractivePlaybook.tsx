// Interactive Playbook Component
// Library of generated animations from HY-Motion, tagged by strategy, player, and outcome

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Filter, Search, Tag, User, Trophy, X, BookOpen, Save, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MotionViewer } from '@/components/motion/MotionViewer';

export interface PlaybookEntry {
  id: string;
  title: string;
  strategy_type: 'execute' | 'default' | 'retake' | 'save';
  player_id?: string;
  player_name?: string;
  agent?: string;
  outcome: 'win' | 'loss';
  map: string;
  tags: string[];
  motion_data_id?: string;
  motion_storage_url?: string;
  created_at: string;
  description: string;
  round_number?: number;
  key_insights?: string[];
  micro_macro_connection?: {
    micro_action: string;
    macro_outcome: string;
    correlation_strength: number;
  };
  lesson_plan_notes?: string;
}

interface InteractivePlaybookProps {
  entries?: PlaybookEntry[];
}

export const InteractivePlaybook: React.FC<InteractivePlaybookProps> = ({ entries = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<PlaybookEntry | null>(null);
  const [motionDialogOpen, setMotionDialogOpen] = useState(false);
  const [lessonPlanDialogOpen, setLessonPlanDialogOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [lessonPlanNotes, setLessonPlanNotes] = useState('');

  // Mock data if none provided
  const mockEntries: PlaybookEntry[] =
    entries.length > 0
      ? entries
      : [
          {
            id: '1',
            title: 'A Site Execute - Successful',
            strategy_type: 'execute',
            player_name: 'OXY',
            agent: 'Jett',
            outcome: 'win',
            map: 'Bind',
            tags: ['execute', 'smoke', 'flash', 'success'],
            created_at: new Date().toISOString(),
            description: 'Successful A site execute with coordinated utility',
          },
          {
            id: '2',
            title: 'B Site Retake - Failed',
            strategy_type: 'retake',
            player_name: 'NOVA',
            agent: 'Sage',
            outcome: 'loss',
            map: 'Haven',
            tags: ['retake', 'utility', 'failed'],
            created_at: new Date().toISOString(),
            description: 'Failed retake due to poor utility timing',
          },
          {
            id: '3',
            title: 'Default Pattern - Map Control',
            strategy_type: 'default',
            player_name: 'SMOKE',
            agent: 'Omen',
            outcome: 'win',
            map: 'Split',
            tags: ['default', 'map-control', 'success'],
            created_at: new Date().toISOString(),
            description: 'Successful default with good map control',
          },
        ];

  const filteredEntries = mockEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter === 'all' || entry.strategy_type === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const strategyTypes = ['all', 'execute', 'default', 'retake', 'save'];

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Interactive Playbook
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Library of HY-Motion animations tagged by strategy, player, and outcome. Build
                visual lesson plans.
              </p>
            </div>
            <div className="flex gap-2">
              {selectedEntries.size > 0 && (
                <Button variant="outline" size="sm" onClick={() => setLessonPlanDialogOpen(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Build Lesson Plan ({selectedEntries.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search playbook entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
            <TabsList className="grid w-full grid-cols-5">
              {strategyTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type === 'all' ? 'All' : type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Playbook Entries */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedEntry(entry);
                  setMotionDialogOpen(true);
                }}
              >
                <Card
                  className={`glass-card transition-all hover:border-primary/50 ${
                    selectedEntries.has(entry.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={selectedEntries.has(entry.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedEntries);
                              if (e.target.checked) {
                                newSet.add(entry.id);
                              } else {
                                newSet.delete(entry.id);
                              }
                              setSelectedEntries(newSet);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-border"
                          />
                          <h4 className="font-semibold">{entry.title}</h4>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {entry.description}
                        </p>
                        {entry.micro_macro_connection && (
                          <div className="mt-2 p-2 rounded bg-muted/50 border border-border">
                            <p className="text-xs font-medium text-primary mb-1">
                              Micro-Macro Connection:
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.micro_macro_connection.micro_action} →{' '}
                              {entry.micro_macro_connection.macro_outcome}
                            </p>
                            <div className="mt-1 flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Correlation:</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(
                                  entry.micro_macro_connection.correlation_strength * 100
                                )}
                                %
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={entry.outcome === 'win' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {entry.outcome === 'win' ? (
                          <Trophy className="mr-1 h-3 w-3" />
                        ) : (
                          <X className="mr-1 h-3 w-3" />
                        )}
                        {entry.outcome}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {entry.player_name && (
                          <>
                            <User className="h-3 w-3" />
                            <span>{entry.player_name}</span>
                          </>
                        )}
                        {entry.agent && (
                          <>
                            <span>•</span>
                            <span>{entry.agent}</span>
                          </>
                        )}
                      </div>
                      <span>{entry.map}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntry(entry);
                        setMotionDialogOpen(true);
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      View Animation
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Play className="mx-auto mb-4 h-12 w-12" />
              <p>No playbook entries found</p>
              <p className="text-xs">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motion Viewer Dialog */}
      <Dialog open={motionDialogOpen} onOpenChange={setMotionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedEntry?.title || 'Motion Animation'}</DialogTitle>
            <DialogDescription>{selectedEntry?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEntry?.key_insights && selectedEntry.key_insights.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium mb-2">Key Insights:</p>
                <ul className="space-y-1">
                  {selectedEntry.key_insights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      • {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <MotionViewer />
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Plan Builder Dialog */}
      <Dialog open={lessonPlanDialogOpen} onOpenChange={setLessonPlanDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Build Visual Lesson Plan</DialogTitle>
            <DialogDescription>
              Create a lesson plan from selected playbook entries. These animations will be used for
              coaching sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Selected Entries ({selectedEntries.size}):</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredEntries
                  .filter((e) => selectedEntries.has(e.id))
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 rounded border border-border bg-muted/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.strategy_type} • {entry.map} • {entry.outcome}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newSet = new Set(selectedEntries);
                          newSet.delete(entry.id);
                          setSelectedEntries(newSet);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Lesson Plan Notes</label>
              <Textarea
                placeholder="Add notes about how to use these animations in coaching sessions, key points to emphasize, common mistakes to highlight..."
                value={lessonPlanNotes}
                onChange={(e) => setLessonPlanNotes(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setLessonPlanDialogOpen(false);
                  setLessonPlanNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // In production, this would save the lesson plan
                  console.warn('Saving lesson plan:', {
                    entries: Array.from(selectedEntries),
                    notes: lessonPlanNotes,
                  });
                  setLessonPlanDialogOpen(false);
                  setSelectedEntries(new Set());
                  setLessonPlanNotes('');
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Lesson Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
