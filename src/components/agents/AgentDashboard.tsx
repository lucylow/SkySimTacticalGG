// Agent Dashboard Component
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { agentApi } from '@/services/agentApi';
import type { AgentStatus, WorkflowExecution } from '@/agents/types';
import { AgentRole } from '@/agents/types';

export const AgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({});
  const [_workflows, _setWorkflows] = useState<WorkflowExecution[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadAgentStatus();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      void loadAgentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadAgentStatus = async () => {
    try {
      const response = await agentApi.getAgentStatus();
      setAgents(response.agents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load agent status:', error);
      setLoading(false);
    }
  };

  const agentList = Object.values(agents);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">🤖 AI Agent Dashboard</h2>
        <p>Loading agent status...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">🤖 AI Agent Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor and manage AI agents powering the coaching system
        </p>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentList.map((agent) => (
          <AgentStatusCard
            key={agent.name}
            agent={agent}
            onSelect={() => setSelectedAgent(agent.name)}
            isSelected={selectedAgent === agent.name}
          />
        ))}
      </div>

      {/* Recent Workflows */}
      {_workflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Workflow Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowTimeline workflows={_workflows} />
          </CardContent>
        </Card>
      )}

      {/* Selected Agent Details */}
      {selectedAgent && agents[selectedAgent] && (
        <AgentDetailPanel agent={agents[selectedAgent]} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
};

interface AgentStatusCardProps {
  agent: AgentStatus;
  onSelect: () => void;
  isSelected: boolean;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ agent, onSelect, isSelected }) => {
  const statusColor = agent.healthy
    ? 'bg-green-500'
    : agent.success_rate > 0.5
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const statusText = agent.healthy ? 'Healthy' : agent.success_rate > 0.5 ? 'Issues' : 'Unhealthy';

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className={`${statusColor} text-white`}>
            <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{getRoleDisplayName(agent.role)}</p>
          </div>
          <Badge variant={agent.healthy ? 'default' : 'destructive'}>{statusText}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-semibold">{(agent.success_rate * 100).toFixed(1)}%</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tasks Processed</span>
            <span className="font-semibold">{agent.tasks_processed.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg Time</span>
            <span className="font-semibold">{agent.avg_processing_time_ms.toFixed(0)}ms</span>
          </div>
        </div>

        {/* Specialty Tags */}
        {Object.keys(agent.specialties || {}).length > 0 && (
          <div className="mt-4 flex gap-1 flex-wrap">
            {Object.keys(agent.specialties)
              .slice(0, 3)
              .map((specialty) => (
                <Badge key={specialty} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AgentDetailPanelProps {
  agent: AgentStatus;
  onClose: () => void;
}

const AgentDetailPanel: React.FC<AgentDetailPanelProps> = ({ agent, onClose }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{agent.name} Details</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-lg font-semibold">{(agent.success_rate * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks Processed</p>
              <p className="text-lg font-semibold">{agent.tasks_processed}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Processing Time</p>
              <p className="text-lg font-semibold">{agent.avg_processing_time_ms.toFixed(0)}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Active</p>
              <p className="text-lg font-semibold">
                {agent.last_active ? new Date(agent.last_active).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {Object.keys(agent.specialties || {}).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(agent.specialties).map(([specialty, accuracy]) => (
                <Badge key={specialty} variant="outline">
                  {specialty}: {(accuracy * 100).toFixed(0)}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {agent.recent_errors && agent.recent_errors.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Recent Errors</h4>
            <div className="space-y-2">
              {agent.recent_errors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  <p className="font-semibold">{error.error}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(error.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface WorkflowTimelineProps {
  workflows: WorkflowExecution[];
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ workflows }) => {
  return (
    <div className="space-y-4">
      {workflows.slice(0, 10).map((workflow) => (
        <div key={workflow.workflow_id} className="border-l-2 border-primary pl-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{workflow.workflow_type}</p>
              <p className="text-sm text-muted-foreground">
                {workflow.status} • {workflow.agents_used} agents • {workflow.total_time_ms}ms
              </p>
            </div>
            <Badge variant={workflow.status === 'completed' ? 'default' : 'destructive'}>
              {workflow.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

function getRoleDisplayName(role: AgentRole): string {
  const roleMap: Record<AgentRole, string> = {
    [AgentRole.ORCHESTRATOR]: 'Head Coach / Workflow Manager',
    [AgentRole.DATA_FETCHER]: 'Data Fetcher',
    [AgentRole.MICRO_ANALYZER]: 'Micro Pattern Detector',
    [AgentRole.STRATEGIC_ANALYZER]: 'Strategic Analyzer',
    [AgentRole.SIMULATION_AGENT]: 'Simulation Agent',
    [AgentRole.FORMATTER]: 'Insight Formatter',
    [AgentRole.VALIDATOR]: 'Insight Validator',
    [AgentRole.NARRATIVE_BUILDER]: 'Narrative Builder',
    [AgentRole.AGENDA_GENERATOR]: 'Agenda Generator',
    [AgentRole.PRIORITY_RANKER]: 'Priority Ranker',
  };
  return roleMap[role] || role;
}
