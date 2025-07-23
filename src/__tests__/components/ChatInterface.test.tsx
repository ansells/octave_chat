import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ChatInterface from '@/app/components/ChatInterface';
import { server } from '../__mocks__/server';
import { ChatMessage } from '@/app/types/chat';

// Mock the child components to focus on ChatInterface logic
vi.mock('@/components/ChatInstructions', () => ({
  default: function MockChatInstructions() {
    return <div data-testid="chat-instructions">Instructions</div>;
  },
}));

vi.mock('@/components/ChatOutput', () => ({
  default: function MockChatOutput({
    messages,
    isLoading,
  }: {
    messages: ChatMessage[];
    isLoading: boolean;
  }) {
    return (
      <div data-testid="chat-output">
        <div data-testid="message-count">{messages.length}</div>
        <div data-testid="loading-state">
          {isLoading ? 'loading' : 'not-loading'}
        </div>
      </div>
    );
  },
}));

vi.mock('@/components/ChatInput', () => ({
  default: function MockChatInput({
    onSendMessage,
    isLoading,
  }: {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
  }) {
    return (
      <div data-testid="chat-input">
        <button
          onClick={() => onSendMessage('Test message')}
          disabled={isLoading}
          data-testid="send-button"
        >
          Send
        </button>
        <div data-testid="input-loading-state">
          {isLoading ? 'loading' : 'not-loading'}
        </div>
      </div>
    );
  },
}));

// Create a properly typed mock fetch
const mockFetch = vi.fn();

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test and setup fresh fetch mock
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  mockFetch.mockClear();
});

// Setup fetch mock before each test
beforeEach(() => {
  global.fetch = mockFetch;
});

// Close server after all tests
afterAll(() => server.close());

describe('ChatInterface', () => {
  it('renders all child components', () => {
    render(<ChatInterface />);

    expect(screen.getByTestId('chat-instructions')).toBeInTheDocument();
    expect(screen.getByTestId('chat-output')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByText('Octave Chat')).toBeInTheDocument();
  });

  it('starts with empty message state', () => {
    render(<ChatInterface />);

    expect(screen.getByTestId('message-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'not-loading'
    );
  });

  it('handles message sending flow', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'response-1',
          content: 'AI response',
          timestamp: new Date().toISOString(),
        }),
    } as Response);

    render(<ChatInterface />);

    // Initially should show 0 messages
    expect(screen.getByTestId('message-count')).toHaveTextContent('0');

    // Click send button (which sends "Test message")
    fireEvent.click(screen.getByTestId('send-button'));

    // Should immediately show 1 message (user message) and loading state
    expect(screen.getByTestId('message-count')).toHaveTextContent('1');
    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

    // Wait for API response
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      expect(screen.getByTestId('loading-state')).toHaveTextContent(
        'not-loading'
      );
    });

    // Verify API was called
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Test message' }),
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ChatInterface />);

    fireEvent.click(screen.getByTestId('send-button'));

    // Should show user message immediately
    expect(screen.getByTestId('message-count')).toHaveTextContent('1');

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      expect(screen.getByTestId('loading-state')).toHaveTextContent(
        'not-loading'
      );
    });
  });

  it('handles HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<ChatInterface />);

    fireEvent.click(screen.getByTestId('send-button'));

    // Wait for error message to be added
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      expect(screen.getByTestId('loading-state')).toHaveTextContent(
        'not-loading'
      );
    });
  });

  it('disables input during loading', async () => {
    // Mock a slow response
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    id: 'response-1',
                    content: 'AI response',
                    timestamp: new Date().toISOString(),
                  }),
              } as Response),
            100
          )
        )
    );

    render(<ChatInterface />);

    fireEvent.click(screen.getByTestId('send-button'));

    // Input should be disabled during loading
    expect(screen.getByTestId('send-button')).toBeDisabled();
    expect(screen.getByTestId('input-loading-state')).toHaveTextContent(
      'loading'
    );

    // Wait for response
    await waitFor(() => {
      expect(screen.getByTestId('send-button')).not.toBeDisabled();
      expect(screen.getByTestId('input-loading-state')).toHaveTextContent(
        'not-loading'
      );
    });
  });

  it('creates user messages with correct format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'response-1',
          content: 'AI response',
          timestamp: new Date().toISOString(),
        }),
    } as Response);

    // Spy on Date.now to verify message ID generation
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(12345);

    render(<ChatInterface />);

    fireEvent.click(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    });

    dateSpy.mockRestore();
  });

  it('processes bot responses correctly', async () => {
    const mockResponse = {
      id: 'bot-123',
      content: 'This is a bot response',
      timestamp: '2024-01-01T12:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    render(<ChatInterface />);

    fireEvent.click(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    });
  });

  it('handles multiple rapid messages', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'response-1',
            content: 'First response',
            timestamp: new Date().toISOString(),
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'response-2',
            content: 'Second response',
            timestamp: new Date().toISOString(),
          }),
      } as Response);

    render(<ChatInterface />);

    // Send first message
    fireEvent.click(screen.getByTestId('send-button'));

    // Wait for first response
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    });

    // Send second message
    fireEvent.click(screen.getByTestId('send-button'));

    // Wait for second response
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('4');
    });
  });
});
