'use client';

import { useState } from 'react';
import { ChatMessage } from '@/app/types/chat';
import ChatInstructions from './ChatInstructions';
import ChatOutput from './ChatOutput';
import ChatInput from './ChatInput';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const botResponse: ChatMessage = {
        id: data.id,
        content: data.content,
        timestamp: new Date(data.timestamp),
        isUser: false,
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Octave Chat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Octave-powered chat interface for customer research and outreach
        </p>
      </div>

      <ChatInstructions />
      <ChatOutput messages={messages} isLoading={isLoading} />
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
