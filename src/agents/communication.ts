// Agent Communication Protocol
import type { AgentMessage } from './types';

export type MessageCallback = (message: AgentMessage) => Promise<void> | void;

export class MessageBus {
  private subscriptions: Map<string, MessageCallback[]>;
  private messageHistory: AgentMessage[];
  private responseFutures: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;

  constructor() {
    this.subscriptions = new Map();
    this.messageHistory = [];
    this.responseFutures = new Map();
  }

  /**
   * Publish message to interested agents
   */
  async publish(message: AgentMessage): Promise<void> {
    this.messageHistory.push(message);
    
    // Notify specific receiver subscribers
    const receiverSubscribers = this.subscriptions.get(message.receiver) || [];
    for (const callback of receiverSubscribers) {
      try {
        await callback(message);
      } catch (error) {
        console.error(`Error in subscriber callback for ${message.receiver}:`, error);
      }
    }
    
    // Notify wildcard subscribers
    const wildcardSubscribers = this.subscriptions.get('*') || [];
    for (const callback of wildcardSubscribers) {
      try {
        await callback(message);
      } catch (error) {
        console.error('Error in wildcard subscriber callback:', error);
      }
    }

    // Check if this is a response to a pending request
    if (message.message_type === 'result' && message.correlation_id) {
      const future = this.responseFutures.get(message.correlation_id);
      if (future) {
        clearTimeout(future.timeout);
        future.resolve(message.content);
        this.responseFutures.delete(message.correlation_id);
      }
    }
  }

  /**
   * Subscribe to messages for an agent
   */
  subscribe(agentId: string, callback: MessageCallback): () => void {
    if (!this.subscriptions.has(agentId)) {
      this.subscriptions.set(agentId, []);
    }
    
    this.subscriptions.get(agentId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(agentId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Send a task and wait for response
   */
  async sendTask(
    fromAgent: string,
    toAgent: string,
    task: Record<string, unknown>,
    timeout: number = 30000
  ): Promise<unknown> {
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    
    const message: AgentMessage = {
      id: messageId,
      sender: fromAgent,
      receiver: toAgent,
      message_type: 'task',
      content: { task, message_id: messageId },
      correlation_id: messageId,
      timestamp: Date.now(),
      priority: 1,
      requires_response: true,
    };

    // Create response future
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.responseFutures.delete(messageId);
        reject(new Error(`Timeout waiting for response from ${toAgent}`));
      }, timeout);

      this.responseFutures.set(messageId, {
        resolve: (value: unknown) => {
          clearTimeout(timeoutHandle);
          resolve(value);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        },
        timeout: timeoutHandle,
      });

      // Publish message
      this.publish(message).catch(reject);
    });
  }

  /**
   * Get message history
   */
  getMessageHistory(limit?: number): AgentMessage[] {
    if (limit) {
      return this.messageHistory.slice(-limit);
    }
    return [...this.messageHistory];
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }
}

// Global message bus instance
export const messageBus = new MessageBus();


