import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Play,
  TrendingUp,
  Target,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { backendApi } from '@/services/backendApi';
import type {
  WhatIfPrediction,
  WhatIfModification,
  MacroReview,
} from '@/types/backend';
import { Loader2 } from 'lucide-react';

interface WhatIfQueryProps {
  matchId: string;
  currentReview?: MacroReview;
  onPredictionComplete?: (prediction: WhatIfPrediction | EnhancedPredictionResult) => void;
}

interface EnhancedPredictionResult {
  query: string;
  parsed_query: any;
  actual_scenario: {
    success_probability: number;
    outcome: string;
    key_factors: string[];
  };
  hypothetical_scenario: {
    success_probability: number;
    outcome: string;
    key_factors: string[];
  };
  strategic_recommendation: string;
  confidence_score: number;
  supporting_data: Record<string, unknown>;
  visualization_prompt?: string;
  specialized_analysis?: {
    scenario: string;
    retake_success_probability: number;
    save_impact: {
      next_round_win_probability: number;
      economic_advantage: number;
      full_buy_probability: number;
      momentum_impact: number;
    };
    recommendation: string;
    key_factors: Array<{ factor: string; impact: number; explanation: string }>;
    confidence: number;
  };
}

interface QueryTemplate {
  label: string;
  query: Partial<WhatIfModification>;
  description: string;
}

export const WhatIfQuery: React.FC<WhatIfQueryProps> = ({
  matchId,
  currentReview,
  onPredictionComplete,
}) => {
  const [query, setQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [prediction, setPrediction] = useState<WhatIfPrediction | null>(null);
  const [enhancedPrediction, setEnhancedPrediction] = useState<EnhancedPredictionResult | null>(
    null
  );
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [changeType, setChangeType] =
    useState<WhatIfModification['change_type']>('economic_decision');
  const [originalAction, setOriginalAction] = useState<string>('');
  const [hypotheticalAction, setHypotheticalAction] = useState<string>('');
  const [useNaturalLanguage] = useState<boolean>(true);

  // Generate suggestion templates from macro review
  const suggestionTemplates: QueryTemplate[] = currentReview
    ? currentReview.review_agenda.flatMap((phase) =>
        phase.items
          .filter(
            (item) => item.type === 'CRITICAL_ECONOMIC_DECISION' || item.type === 'FAILED_EXECUTE'
          )
          .map((item) => ({
            label: `What if in Round ${item.round_number}?`,
            description: item.title,
            query: {
              round_number: item.round_number,
              change_type:
                item.type === 'CRITICAL_ECONOMIC_DECISION'
                  ? 'economic_decision'
                  : 'strategy_change',
              original_action: extractActionFromDescription(item.description),
              hypothetical_action: item.recommendation.includes('save')
                ? 'save'
                : 'different strategy',
            },
          }))
      )
    : [];

  // Extract action from description (simplified)
  function extractActionFromDescription(desc: string): string {
    if (desc.toLowerCase().includes('force')) return 'force buy';
    if (desc.toLowerCase().includes('save')) return 'save';
    if (desc.toLowerCase().includes('execute')) return 'execute';
    return 'original action';
  }

  const handleQuery = async (template?: QueryTemplate): Promise<void> => {
    setIsProcessing(true);
    setPrediction(null);
    setEnhancedPrediction(null);

    try {
      // Use enhanced natural language analysis if query is provided
      if (useNaturalLanguage && query.trim() && !template) {
        const result = await backendApi.analyzeWhatIfQuery(matchId, query);
        setEnhancedPrediction(result as EnhancedPredictionResult);
        onPredictionComplete?.(result as EnhancedPredictionResult);
        return;
      }

      // Otherwise use structured modification approach
      let modification: WhatIfModification;

      if (template) {
        modification = {
          round_number: template.query.round_number || selectedRound || 1,
          change_type: template.query.change_type || 'economic_decision',
          original_action: template.query.original_action || originalAction || 'unknown',
          hypothetical_action:
            template.query.hypothetical_action || hypotheticalAction || 'unknown',
          context: { description: template.description },
        };
      } else {
        // Parse natural language query or use form inputs
        if (query.trim()) {
          // Simple parsing - in production would use NLP
          modification = parseNaturalLanguageQuery(query, selectedRound);
        } else {
          modification = {
            round_number: selectedRound || 1,
            change_type: changeType,
            original_action: originalAction || 'unknown',
            hypothetical_action: hypotheticalAction || 'unknown',
          };
        }
      }

      const result = await backendApi.predictHypothetical(matchId, modification);
      setPrediction(result);
      onPredictionComplete?.(result);
    } catch (error) {
      console.error('Prediction failed:', error);
      // In production, show error toast
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple natural language parsing (would be enhanced with NLP in production)
  function parseNaturalLanguageQuery(queryText: string, defaultRound: number): WhatIfModification {
    const lowerQuery = queryText.toLowerCase();
    let roundNumber = defaultRound;
    let changeType: WhatIfModification['change_type'] = 'economic_decision';
    let originalAction = 'unknown';
    let hypotheticalAction = 'unknown';

    // Extract round number
    const roundMatch = queryText.match(/round\s+(\d+)/i);
    if (roundMatch && roundMatch[1]) {
      roundNumber = parseInt(roundMatch[1], 10);
    }

    // Detect change type
    if (
      lowerQuery.includes('save') ||
      lowerQuery.includes('economy') ||
      lowerQuery.includes('buy')
    ) {
      changeType = 'economic_decision';
      if (lowerQuery.includes('save')) {
        originalAction = 'force buy';
        hypotheticalAction = 'save';
      } else if (lowerQuery.includes('force')) {
        originalAction = 'save';
        hypotheticalAction = 'force buy';
      }
    } else if (lowerQuery.includes('execute') || lowerQuery.includes('strategy')) {
      changeType = 'strategy_change';
      originalAction = 'original strategy';
      hypotheticalAction = 'alternative strategy';
    }

    return {
      round_number: roundNumber,
      change_type: changeType,
      original_action: originalAction,
      hypothetical_action: hypotheticalAction,
      context: { query: queryText },
    };
  }

  // Wrapper functions for onClick handlers to avoid ESLint no-misused-promises
  const handleTemplateClick = (template: QueryTemplate): void => {
    handleQuery(template).catch(() => {
      // Error handled in handleQuery
    });
  };

  const handleQueryClick = (): void => {
    handleQuery().catch(() => {
      // Error handled in handleQuery
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Strategy Simulator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore hypothetical scenarios and predict outcomes using Monte Carlo simulation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Builder */}
        <div className="space-y-4">
          {suggestionTemplates.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Quick Suggestions from Macro Review:
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestionTemplates.slice(0, 5).map((template, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 px-3 py-1.5"
                    onClick={() => handleTemplateClick(template)}
                  >
                    {template.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="round-number">Round Number</Label>
              <Select
                value={selectedRound.toString()}
                onValueChange={(val) => setSelectedRound(parseInt(val, 10))}
              >
                <SelectTrigger id="round-number">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((round) => (
                    <SelectItem key={round} value={round.toString()}>
                      Round {round}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="change-type">Change Type</Label>
              <Select
                value={changeType}
                onValueChange={(val) => setChangeType(val as WhatIfModification['change_type'])}
              >
                <SelectTrigger id="change-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economic_decision">Economic Decision</SelectItem>
                  <SelectItem value="strategy_change">Strategy Change</SelectItem>
                  <SelectItem value="player_action">Player Action</SelectItem>
                  <SelectItem value="timing_adjustment">Timing Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="original-action">Original Action</Label>
              <Textarea
                id="original-action"
                placeholder="e.g., force buy"
                value={originalAction}
                onChange={(e) => setOriginalAction(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="hypothetical-action">Hypothetical Action</Label>
              <Textarea
                id="hypothetical-action"
                placeholder="e.g., save"
                value={hypotheticalAction}
                onChange={(e) => setHypotheticalAction(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="natural-query">Or ask in natural language:</Label>
            <Textarea
              id="natural-query"
              placeholder="e.g., 'What if we saved in round 4 instead of force-buying?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            variant="default"
            onClick={handleQueryClick}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run Prediction
              </>
            )}
          </Button>
        </div>

        {/* Enhanced Prediction Results (Natural Language) */}
        {enhancedPrediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Brain className="h-5 w-5" />
                  Strategic Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strategic Recommendation */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <Label className="text-sm font-semibold mb-2 block">
                        Strategic Recommendation
                      </Label>
                      <p className="text-sm leading-relaxed">
                        {enhancedPrediction.strategic_recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Probability Comparison */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Actual Decision Success
                    </div>
                    <div className="text-3xl font-bold text-red-500">
                      {Math.round(enhancedPrediction.actual_scenario.success_probability * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {enhancedPrediction.actual_scenario.outcome}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">Hypothetical Success</div>
                    <div className="text-3xl font-bold text-green-500">
                      {Math.round(
                        enhancedPrediction.hypothetical_scenario.success_probability * 100
                      )}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {enhancedPrediction.hypothetical_scenario.outcome}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                    <div
                      className={`text-3xl font-bold ${
                        enhancedPrediction.confidence_score > 70
                          ? 'text-green-500'
                          : enhancedPrediction.confidence_score > 50
                            ? 'text-yellow-500'
                            : 'text-orange-500'
                      }`}
                    >
                      {Math.round(enhancedPrediction.confidence_score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Model Confidence</div>
                  </div>
                </div>

                {/* Specialized Analysis (Retake) */}
                {enhancedPrediction.specialized_analysis && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Specialized Retake Analysis
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Scenario</div>
                        <div className="text-sm font-medium">
                          {enhancedPrediction.specialized_analysis.scenario}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Retake Success Probability
                          </div>
                          <div className="text-lg font-bold">
                            {Math.round(
                              enhancedPrediction.specialized_analysis.retake_success_probability *
                                100
                            )}
                            %
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Next Round Win Probability
                          </div>
                          <div className="text-lg font-bold text-green-500">
                            {Math.round(
                              enhancedPrediction.specialized_analysis.save_impact
                                .next_round_win_probability * 100
                            )}
                            %
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Economic Advantage (if saved)
                        </div>
                        <div className="text-sm font-medium">
                          $
                          {Math.round(
                            enhancedPrediction.specialized_analysis.save_impact.economic_advantage
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Key Factors</div>
                        <div className="space-y-1">
                          {enhancedPrediction.specialized_analysis.key_factors.map(
                            (factor, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                • {factor.factor}: {factor.explanation}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Factors */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-semibold mb-2 block">Key Decision Factors</Label>
                  <div className="space-y-2">
                    {enhancedPrediction.actual_scenario.key_factors.map((factor, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        <span className="font-medium">Actual:</span> {factor}
                      </div>
                    ))}
                    {enhancedPrediction.hypothetical_scenario.key_factors.map((factor, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        <span className="font-medium">Hypothetical:</span> {factor}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visualization Button */}
                {enhancedPrediction.visualization_prompt && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      console.log('Launch visualization:', enhancedPrediction.visualization_prompt);
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    View Hypothetical Scenario Animation
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Prediction Results */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Target className="h-5 w-5" />
                  Simulation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {Math.round(prediction.predicted_outcome.win_probability * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Probability</div>
                  </div>

                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div className="text-3xl font-bold mb-1">
                      {prediction.predicted_outcome.most_likely_score}
                    </div>
                    <div className="text-xs text-muted-foreground">Predicted Score</div>
                  </div>

                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div
                      className={`text-3xl font-bold mb-1 ${
                        prediction.confidence_score > 70
                          ? 'text-green-500'
                          : prediction.confidence_score > 50
                            ? 'text-yellow-500'
                            : 'text-orange-500'
                      }`}
                    >
                      {Math.round(prediction.confidence_score)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Model Confidence</div>
                  </div>

                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div
                      className={`text-3xl font-bold mb-1 ${
                        prediction.comparison_to_actual.round_difference > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {prediction.comparison_to_actual.round_difference > 0 ? '+' : ''}
                      {prediction.comparison_to_actual.round_difference.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Rounds Gained/Lost</div>
                  </div>
                </div>

                {/* Probability Distribution */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Outcome Probability Distribution
                  </Label>
                  <div className="space-y-2">
                    {Object.entries(prediction.probability_distribution)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([score, prob]) => (
                        <div key={score} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{score}</span>
                            <span className="font-medium">{Math.round(prob * 100)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Strategic Insights */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="insights">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Strategic Insights from Simulation
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {prediction.key_findings.map((finding, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {finding}
                          </div>
                        ))}
                        <div className="mt-3 pt-3 border-t">
                          <Badge variant="default" className="w-full justify-center py-2">
                            Recommendation: {prediction.recommended_strategy}
                          </Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Comparison to Actual */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Comparison to Actual Outcome
                  </Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Actual Score</div>
                      <div className="font-medium">
                        {prediction.comparison_to_actual.actual_score}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Predicted Score</div>
                      <div className="font-medium">
                        {prediction.comparison_to_actual.predicted_score}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visualization Button */}
                {prediction.visualization && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // In production, would launch visualization
                      console.log('Launch visualization:', prediction.visualization);
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    View Hypothetical Scenario Animation
                  </Button>
                )}

                {/* Simulation Metadata */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Based on {prediction.simulation_metadata.num_simulations.toLocaleString()}{' '}
                  simulations
                  {prediction.simulation_metadata.historical_scenarios_found > 0 && (
                    <>
                      {' '}
                      • {prediction.simulation_metadata.historical_scenarios_found} similar
                      historical scenarios
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
