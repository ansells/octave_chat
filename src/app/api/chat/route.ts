import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { tools, toolFunctions } from '@/utils/tools';
import { ChatMessageRequest, ChatResponse } from '@/types/chat';
import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const startTime = Date.now();
    let finalContent = '';
    let toolCalls: ChatCompletionMessageToolCall[] = [];
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an AI assistant for Octave, a company that helps with customer research and outreach. You have access to three specialized tools to help users:

1. enrichCompany - Use this to get detailed information about a company when provided with their domain. 
- If the domain is not provided, you should attempt to determine it.
- If you cannot determine the domain, you should ask the user to provide it.
2. enrichPerson - Use this to get detailed information about a person when provided with their LinkedIn profile URL. 
- If the LinkedIn profile URL is not provided, you should attempt to determine it.
- If you cannot determine the LinkedIn profile URL, you should ask the user to provide it.
- If the user has asked to generate emails, you should not use this tool.
3. generateEmails - Use this to create personalized emails for outreach when provided with a person's LinkedIn profile URL. 
- If the LinkedIn profile URL is not provided, you should attempt to determine it.
- If you cannot determine the LinkedIn profile URL, you should ask the user to provide it.
- If the user has not asked to generate emails, you should not use this tool.

When users ask about companies, people, or email generation, use the appropriate tools. Always be helpful and provide clear, actionable information based on the tool results.`,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    try {
      // Create chat completion with tools
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview', // TODO: Make this configurable
        messages,
        tools: tools,
        tool_choice: 'auto',
      });

      const responseMessage = completion.choices[0]?.message;

      if (!responseMessage) {
        throw new Error('No response from OpenAI');
      }

      finalContent = responseMessage.content || '';
      toolCalls = responseMessage.tool_calls || [];
    } catch (error) {
      console.error('Error processing chat message:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    const sources: string[] = [];
    const toolResults: Map<string, string> = new Map();
    // Execute any tool calls
    if (toolCalls.length > 0) {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are an AI assistant for Octave. You just executed some tools and got results. 
          Present the information in a clear, helpful way to the user.
          Present the information using markdown formatting.
          Present the information just as it was returned by the tool. Do not summarize or add any additional information.
          If the tool call failed or was unable to determine information then let the user know the information is not enriched.
          If the tool call failed and the user explcitly asked to enrich a company/person or asked to generate emails do not attempt to generate the information yourself.`,
        },
        {
          role: 'user',
          content: message,
        },
        {
          role: 'assistant',
          content: finalContent,
          tool_calls: toolCalls,
        },
      ];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        if (functionName in toolFunctions) {
          try {
            const result = await toolFunctions[
              functionName as keyof typeof toolFunctions
            ](functionArgs);
            // console.debug('result', JSON.stringify(result));
            sources.push(functionName);
            messages.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            });
            toolResults.set(toolCall.id, result.toString());
          } catch (error) {
            console.error(`Error executing ${functionName}:`, error);
          }
        }
      }

      // Get a follow-up response from OpenAI with the tool results
      try {
        const followUpCompletion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: messages,
        });

        finalContent =
          followUpCompletion.choices[0]?.message?.content || finalContent;
      } catch (error) {
        console.error('Error processing chat message:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    }

    const processingTime = Date.now() - startTime;

    const response: ChatResponse = {
      id: Date.now().toString(),
      content: finalContent,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime,
        sources,
        toolCalls: toolCalls.map((tc) => ({
          id: tc.id,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
          result: toolResults.get(tc.id) || '',
          type: 'function' as const,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
