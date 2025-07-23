export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
  result: string;
  type: 'function';
}

export interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  metadata?: {
    processingTime?: number;
    sources?: string[];
    toolCalls?: ToolCall[];
  };
}
