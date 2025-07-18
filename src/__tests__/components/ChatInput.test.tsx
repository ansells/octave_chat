import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ChatInput from '@/components/ChatInput';

describe('ChatInput', () => {
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  it('renders input field and send button', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type your message here...')
    ).toBeInTheDocument();
  });

  it('handles text input changes', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello world');

    expect(input).toHaveValue('Hello world');
  });

  it('submits message on Enter key', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    expect(input).toHaveValue('');
  });

  it('submits message on button click', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(button);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    expect(input).toHaveValue('');
  });

  it('disables input and button when loading', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={true} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });
});
