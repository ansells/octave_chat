import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from 'vitest';
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import { server } from '../__mocks__/server';

// Mock OpenAI
vi.mock('openai', () => {
  const mockCreateCompletion = vi.fn();

  const mockCompletion = {
    choices: [
      {
        message: {
          role: 'assistant',
          content: 'Test response from OpenAI',
          tool_calls: [],
        },
      },
    ],
  };

  mockCreateCompletion.mockResolvedValue(mockCompletion);

  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateCompletion,
        },
      },
    })),
  };
});

// Import OpenAI to get access to the mocked version
import OpenAI from 'openai';

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers and mocks after each test
afterEach(() => {
  server.resetHandlers();
  // Reset the OpenAI mock
  const MockedOpenAI = vi.mocked(OpenAI);
  const mockInstance = new MockedOpenAI();
  vi.mocked(mockInstance.chat.completions.create).mockClear();
});

// Close server after all tests
afterAll(() => server.close());

describe('/api/chat', () => {
  const createRequest = (body: { message?: string }) => {
    return new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  it('returns successful response for valid request', async () => {
    const request = createRequest({ message: 'Hello' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('timestamp');
    expect(data.content).toBe('Test response from OpenAI');
  });

  it('returns 400 for missing message', async () => {
    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Message is required');
  });

  it('handles OpenAI API errors', async () => {
    // Mock the OpenAI API to throw an error for this test
    const MockedOpenAI = vi.mocked(OpenAI);
    const mockInstance = new MockedOpenAI();
    vi.mocked(mockInstance.chat.completions.create).mockRejectedValueOnce(
      new Error('OpenAI API error')
    );

    const request = createRequest({ message: 'Hello' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
