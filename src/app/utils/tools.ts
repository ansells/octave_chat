import {
  OctiveAPI,
  EnrichCompanyParams,
  EnrichPersonParams,
  GenerateEmailsParams,
  EnrichCompanyResponse,
  EnrichPersonResponse,
  GenerateEmailsResponse,
} from '@/octave/octaveAPI';

// Tool function implementations
const octaveAPI = new OctiveAPI(true);

export async function enrichCompany(
  params: EnrichCompanyParams
): Promise<EnrichCompanyResponse> {
  return await octaveAPI.enrichCompany(params);
}

export async function enrichPerson(
  params: EnrichPersonParams
): Promise<EnrichPersonResponse> {
  return await octaveAPI.enrichPerson(params);
}

export async function generateEmails(
  params: GenerateEmailsParams
): Promise<GenerateEmailsResponse> {
  return await octaveAPI.generateEmails(params);
}

// Tool definitions for OpenAI
export const localTools = [
  {
    type: 'function' as const,
    name: 'enrichCompany',
    description:
      'Enrich company information using the company domain. Provides detailed company data including size, industry, revenue, and other business intelligence.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        companyDomain: {
          type: 'string',
          description:
            'The company domain (e.g., example.com) to enrich information for',
        },
      },
      required: ['companyDomain'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'enrichPerson',
    description:
      'Enrich person information using their LinkedIn profile URL. Provides detailed information about the person including their role, experience, and company.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        linkedInProfile: {
          type: 'string',
          description:
            'The LinkedIn profile URL of the person to enrich information for',
        },
      },
      required: ['linkedInProfile'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'generateEmails',
    description:
      'Generate personalized emails to send to a person. Requires their LinkedIn profile URL to create targeted, relevant email content.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        linkedInProfile: {
          type: 'string',
          description:
            'The LinkedIn profile URL of the person to generate emails for',
        },
      },
      required: ['linkedInProfile'],
      additionalProperties: false,
    },
  },
];

export const mcpTools = [
  {
    type: 'mcp' as const,
    server_label: 'octave-mcp',
    server_url: 'http://localhost:3001/mcp',
    require_approval: 'never',
    allowed_tools: ['enrichCompany', 'enrichPerson', 'generateEmails'],
  },
];

// Tool function registry
export const toolFunctions = {
  enrichCompany,
  enrichPerson,
  generateEmails,
};
