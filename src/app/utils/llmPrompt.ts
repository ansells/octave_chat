import OpenAI from 'openai';
import { localTools, toolFunctions } from '@/app/utils/tools';
import { ChatResponse, ToolCall } from '@/app/types/chat';

export class LLMPrompt {
  static toolInstructions = `You are an AI assistant for Octave, a company that helps with customer research and outreach. You have access to three specialized tools to help users:
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

  static followUpInstructions = `You are an AI assistant for Octave. You just executed some tools and got results. 
Present the information in a clear, helpful way to the user.
Present the information using markdown formatting.
Present the information just as it was returned by the tool. Do not summarize or add any additional information.
If the tool call failed or was unable to determine information then let the user know the information is not enriched.
If the tool call failed and the user explcitly asked to enrich a company/person or asked to generate emails do not attempt to generate the information yourself.`;

  private client: OpenAI;
  private model: string;
  private input: OpenAI.Responses.ResponseInput;
  private chatResponse?: ChatResponse;
  private toolCalls?: Array<ToolCall>;
  private sources: string[] = [];
  private processingTime: number = 0;

  constructor(message: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = model;
    this.input = [
      {
        role: 'user',
        content: message,
      },
    ];
    this.chatResponse = undefined;
  }

  async setupTools(): Promise<boolean> {
    // console.log('Making request to OpenAI:', input);
    try {
      this.toolCalls = [];
      const startTime = Date.now();
      // Create response with the Responses API
      const response: OpenAI.Responses.Response =
        await this.client.responses.create({
          model: this.model,
          instructions: LLMPrompt.toolInstructions,
          input: this.input,
          tools: localTools,
          tool_choice: 'auto',
          store: false, // Don't store conversation state for now
        });

      // Handle tool execution and build response
      // Process the response output
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
                this.input.push(functionCall);
                this.input.push({
                  type: 'function_call_output',
                  call_id: functionCall.call_id,
                  output: JSON.stringify(result),
                });
                this.sources.push(functionName);

                // Store tool call info for metadata
                this.toolCalls.push({
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
                return false;
              }
            }
          }
        }
      }
      this.processingTime = Date.now() - startTime;
      if (response.output_text) {
        this.input.push({
          role: 'assistant',
          content: response.output_text,
        });
      }
    } catch (error) {
      console.error('Error setting up tools for message:', error);
      return false;
    }
    return true;
  }

  async followUp(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await this.client.responses.create({
        model: this.model,
        instructions: LLMPrompt.followUpInstructions,
        input: this.input,
        store: false,
      });

      this.processingTime += Date.now() - startTime;

      this.chatResponse = {
        id: response.id,
        content: response.output_text || '',
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime: this.processingTime,
          sources: this.sources,
          toolCalls: this.toolCalls,
        },
      };
    } catch (error) {
      console.error('Error following up:', error);
      return false;
    }
    return true;
  }

  get toolsSetup(): boolean {
    return this.toolCalls !== undefined;
  }

  wasToolCalled(toolName: string): boolean {
    return this.sources.includes(toolName);
  }

  get response(): ChatResponse | undefined {
    return this.chatResponse;
  }
}
