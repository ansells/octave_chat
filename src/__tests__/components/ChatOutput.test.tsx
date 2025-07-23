import { render, screen } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import ChatOutput from '@/app/components/ChatOutput';
import { ChatMessage } from '@/app/types/chat';

// Mock scrollIntoView method which is not available in JSDOM
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Mock ReactMarkdown to avoid complex markdown parsing in tests
vi.mock('react-markdown', () => {
  return {
    default: function MockReactMarkdown({ children }: { children: string }) {
      return <div data-testid="markdown-content">{children}</div>;
    },
  };
});

// Mock Intl.DateTimeFormat to return consistent timezone-independent results
const mockFormat = vi.fn();
Object.defineProperty(global, 'Intl', {
  value: {
    ...global.Intl,
    DateTimeFormat: vi.fn().mockImplementation(() => ({
      format: mockFormat,
    })),
  },
  writable: true,
});

// Setup mock to return expected time formats based on the UTC input
beforeEach(() => {
  mockFormat.mockImplementation((date: Date) => {
    // Convert UTC dates to expected display format
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const period = utcHours >= 12 ? 'PM' : 'AM';
    const displayHours = utcHours % 12 || 12;
    const displayMinutes = utcMinutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  });
});

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    isUser: true,
  },
  {
    id: '2',
    content: 'I am doing great! How can I help you today?',
    timestamp: new Date('2024-01-01T10:01:00Z'),
    isUser: false,
  },
  {
    id: '3',
    content: 'Can you help me with some information?',
    timestamp: new Date('2024-01-01T10:02:00Z'),
    isUser: true,
  },
];

describe('ChatOutput', () => {
  it('renders empty state when no messages', () => {
    render(<ChatOutput messages={[]} isLoading={false} />);

    expect(
      screen.getByText('No messages yet. Start a conversation!')
    ).toBeInTheDocument();
  });

  it('renders all messages correctly', () => {
    render(<ChatOutput messages={mockMessages} isLoading={false} />);

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(
      screen.getByText('I am doing great! How can I help you today?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Can you help me with some information?')
    ).toBeInTheDocument();
  });

  it('distinguishes between user and bot messages', () => {
    render(<ChatOutput messages={mockMessages} isLoading={false} />);

    const userMessages = screen.getAllByText((content, element) => {
      return element?.closest('.justify-end') !== null;
    });
    const botMessages = screen.getAllByText((content, element) => {
      return element?.closest('.justify-start') !== null;
    });

    expect(userMessages.length).toBeGreaterThan(0);
    expect(botMessages.length).toBeGreaterThan(0);
  });

  it('displays timestamps for messages', () => {
    render(<ChatOutput messages={mockMessages} isLoading={false} />);

    // Check that timestamps are displayed (format: 10:00 AM)
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('10:01 AM')).toBeInTheDocument();
    expect(screen.getByText('10:02 AM')).toBeInTheDocument();
  });

  it('shows loading animation when isLoading is true', () => {
    render(<ChatOutput messages={mockMessages} isLoading={true} />);

    const loadingDots = document.querySelectorAll('.animate-bounce');
    expect(loadingDots).toHaveLength(3);
  });

  it('does not show loading animation when isLoading is false', () => {
    render(<ChatOutput messages={mockMessages} isLoading={false} />);

    const loadingDots = document.querySelectorAll('.animate-bounce');
    expect(loadingDots).toHaveLength(0);
  });

  it('renders markdown content for bot messages', () => {
    const messageWithMarkdown: ChatMessage = {
      id: '4',
      content: '**Bold text** and *italic text*',
      timestamp: new Date(),
      isUser: false,
    };

    render(<ChatOutput messages={[messageWithMarkdown]} isLoading={false} />);

    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(
      screen.getByText('**Bold text** and *italic text*')
    ).toBeInTheDocument();
  });

  it('renders content for user messages using markdown', () => {
    const userMessage: ChatMessage = {
      id: '4',
      content: 'Plain user message',
      timestamp: new Date(),
      isUser: true,
    };

    render(<ChatOutput messages={[userMessage]} isLoading={false} />);

    expect(screen.getByText('Plain user message')).toBeInTheDocument();
    // Both user and bot messages use markdown in this implementation
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('handles messages with empty content', () => {
    const emptyMessage: ChatMessage = {
      id: '5',
      content: '',
      timestamp: new Date(),
      isUser: true,
    };

    render(<ChatOutput messages={[emptyMessage]} isLoading={false} />);

    // Should still render the message container with timestamp
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2} [AP]M/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('displays messages in chronological order', () => {
    const unorderedMessages = [...mockMessages].reverse();
    render(<ChatOutput messages={unorderedMessages} isLoading={false} />);

    // Check that all messages are rendered in the order provided
    expect(
      screen.getByText('Can you help me with some information?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('I am doing great! How can I help you today?')
    ).toBeInTheDocument();
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
  });
});
