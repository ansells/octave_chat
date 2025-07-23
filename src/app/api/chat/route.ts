import { NextRequest, NextResponse } from 'next/server';
import { ChatMessageRequest } from '@/app/types/chat';
import { LLMPrompt } from '@/app/utils/llmPrompt';

// TODO: Move the OpenAI requests and prompt management to a separate file
export async function POST(request: NextRequest) {
  try {
    const { message } = (await request.json()) as ChatMessageRequest;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // console.log('Making request to OpenAI:', input);
    try {
      const prompt = new LLMPrompt(message);
      console.log('Setting up tools');

      if (!(await prompt.setupTools())) {
        return NextResponse.json(
          { error: 'Failed to setup tools' },
          { status: 500 }
        );
      }

      if (!(await prompt.followUp())) {
        return NextResponse.json(
          { error: 'Failed to follow up' },
          { status: 500 }
        );
      }

      if (prompt.response) {
        return NextResponse.json(prompt.response);
      } else {
        return NextResponse.json(
          { error: 'Failed to get response' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error processing chat message:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
