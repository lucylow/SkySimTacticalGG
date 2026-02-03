import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Radio,
  Wifi,
  WifiOff,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';

interface LiveMessage {
  id: string;
  type: 'insight' | 'alert' | 'info';
  content: string;
  timestamp: Date;
}

export const LiveCoach: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    'wss://demo.skysimtactical.gg/ws',
    {
      onConnect: () => console.log('Connected to live feed'),
      onDisconnect: () => console.log('Disconnected from live feed'),
    }
  );

  useEffect(() => {
    if (lastMessage) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'insight',
          content: String(lastMessage.data),
          timestamp: new Date(),
        },
      ]);
    }
  }, [lastMessage]);

  // Simulate live messages for demo
  useEffect(() => {
    if (!isLive) return;

    const demoMessages: LiveMessage[] = [
      { id: '', type: 'alert', content: 'Round 5: OXY exposed during rotate - suggest smoke cover', timestamp: new Date() },
      { id: '', type: 'insight', content: 'Team economy advantage detected - force buy recommended', timestamp: new Date() },
      { id: '', type: 'info', content: 'Enemy AWP spotted A site - consider flash execution', timestamp: new Date() },
      { id: '', type: 'alert', content: 'Pattern detected: Enemy always stacks B on eco rounds', timestamp: new Date() },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < demoMessages.length) {
        const msg = demoMessages[index];
        if (msg) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: msg.type,
              content: msg.content,
              timestamp: new Date(),
            },
          ]);
        }
        index++;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'info',
        content: inputMessage,
        timestamp: new Date(),
      },
    ]);
    setInputMessage('');
  };

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      sendMessage({ type: 'subscribe', channel: 'live_insights' });
    } else {
      sendMessage({ type: 'unsubscribe', channel: 'live_insights' });
    }
  };

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
          <Button variant="ghost" size="icon" asChild>
            <Link to="/app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Live Coach</h1>
            <p className="text-muted-foreground">
              Real-time match insights and recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant={isLive ? 'default' : 'secondary'}
            className={isLive ? 'animate-pulse bg-destructive' : ''}
          >
            {isLive ? (
              <>
                <Radio className="mr-1 h-3 w-3" />
                LIVE
              </>
            ) : (
              'OFFLINE'
            )}
          </Badge>
          <Button
            onClick={toggleLive}
            variant={isLive ? 'destructive' : 'default'}
          >
            {isLive ? (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                Go Live
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Feed */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Live Insights Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {isLive
                    ? 'Waiting for insights...'
                    : 'Go live to receive real-time insights'}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-lg border p-4 ${
                        message.type === 'alert'
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : message.type === 'insight'
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {message.type === 'alert' ? (
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        ) : message.type === 'insight' ? (
                          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        ) : (
                          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Add a note..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              Flag Mistake
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CheckCircle className="mr-2 h-4 w-4 text-accent" />
              Mark Good Play
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="mr-2 h-4 w-4 text-primary" />
              Add Note
            </Button>

            <div className="border-t border-border pt-4">
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                Connection Status
              </h4>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-accent' : 'bg-destructive'
                  }`}
                />
                <span className="text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
