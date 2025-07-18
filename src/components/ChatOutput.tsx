'use client';

import { useEffect, useRef } from 'react';
import { User, Bot, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '@/types/chat';

interface ChatOutputProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export default function ChatOutput({
  messages,
  isLoading = false,
}: ChatOutputProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-96 overflow-y-auto mb-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-sm leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: (props) => (
                        <h1 className="text-lg font-bold mb-2" {...props} />
                      ),
                      h2: (props) => (
                        <h2 className="text-md font-semibold mb-2" {...props} />
                      ),
                      h3: (props) => (
                        <h3 className="text-sm font-semibold mb-1" {...props} />
                      ),
                      p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                      code: (props) => (
                        <code
                          className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs font-mono whitespace-pre-wrap"
                          {...props}
                        />
                      ),
                      pre: (props) => (
                        <pre
                          className="bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 text-xs overflow-x-auto"
                          {...props}
                        />
                      ),
                      ul: (props) => (
                        <ul className="list-disc list-inside mb-2" {...props} />
                      ),
                      ol: (props) => (
                        <ol
                          className="list-decimal list-inside mb-2"
                          {...props}
                        />
                      ),
                      li: (props) => <li className="mb-1" {...props} />,
                      a: (props) => (
                        <a
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      strong: (props) => (
                        <strong className="font-semibold" {...props} />
                      ),
                      em: (props) => <em className="italic" {...props} />,
                      blockquote: (props) => (
                        <blockquote
                          className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 my-2 italic"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div className="flex items-center gap-1 mt-2 opacity-70">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
              {message.isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
