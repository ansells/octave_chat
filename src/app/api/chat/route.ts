import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { localTools, toolFunctions } from '@/app/utils/tools';
import { ChatMessageRequest, ChatResponse } from '@/app/types/chat';

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

    const input: OpenAI.Responses.ResponseInput = [
      {
        role: 'user',
        content: message,
      },
    ];

    // System instructions for the Responses API
    const systemInstructions = `You are an AI assistant for Octave, a company that helps with customer research and outreach. You have access to three specialized tools to help users:

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

When users ask about companies, people, or email generation, use the appropriate tools. Always be helpful and provide clear, actionable information based on the tool results.`;

    // console.log('Making request to OpenAI:', input);
    try {
      // Create response with the Responses API
      const response: OpenAI.Responses.Response = await openai.responses.create(
        {
          model: 'gpt-4o', // Updated to a model that supports Responses API
          instructions: systemInstructions,
          input,
          tools: localTools,
          tool_choice: 'auto',
          store: false, // Don't store conversation state for now
        }
      );

      // Handle tool execution and build response
      const toolCalls: Array<{
        id: string;
        function: {
          name: string;
          arguments: string;
        };
        result: string;
        type: 'function';
      }> = [];
      const sources: string[] = [];

      // Process the response output
      // Note: Using type assertions as the Responses API types may not be fully available in current SDK
      if (response.output) {
        // console.log('Response output:', response.output);
        for (const output of response.output) {
          // Handle function calls
          if (output.type === 'function_call') {
            const functionCall =
              output as OpenAI.Responses.ResponseFunctionToolCall;
            const functionName = functionCall.name;
            const functionArgs = functionCall.arguments;

            if (functionName in toolFunctions) {
              try {
                const result = await toolFunctions[
                  functionName as keyof typeof toolFunctions
                ](
                  typeof functionArgs === 'string'
                    ? JSON.parse(functionArgs)
                    : functionArgs
                );
                input.push(functionCall);
                input.push({
                  type: 'function_call_output',
                  call_id: functionCall.call_id,
                  output: JSON.stringify(result),
                });
                sources.push(functionName);

                // Store tool call info for metadata
                toolCalls.push({
                  id: functionCall.id || Date.now().toString(),
                  function: {
                    name: functionName,
                    arguments:
                      typeof functionArgs === 'string'
                        ? functionArgs
                        : JSON.stringify(functionArgs),
                  },
                  result: JSON.stringify(result),
                  type: 'function' as const,
                });
              } catch (error) {
                console.error(`Error executing ${functionName}:`, error);
              }
            }
          }
        }
      }

      if (response.output_text) {
        input.push({
          role: 'assistant',
          content: response.output_text,
        });
      }

      const followUpInstructions = `You are an AI assistant for Octave. You just executed some tools and got results. 
          Present the information in a clear, helpful way to the user.
          Present the information using markdown formatting.
          Present the information just as it was returned by the tool. Do not summarize or add any additional information.
          If the tool call failed or was unable to determine information then let the user know the information is not enriched.
          If the tool call failed and the user explcitly asked to enrich a company/person or asked to generate emails do not attempt to generate the information yourself.`;

      const processingTime = Date.now() - startTime;

      // console.log('Follow up input:', input);
      const followUpResponse = await openai.responses.create({
        model: 'gpt-4o',
        instructions: followUpInstructions,
        input,
        store: false,
      });

      const chatResponse: ChatResponse = {
        id: response.id,
        content: followUpResponse.output_text || '',
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime,
          sources,
          toolCalls,
        },
      };

      return NextResponse.json(chatResponse);
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
