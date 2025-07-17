import {
  EnrichCompanyParams,
  EnrichPersonParams,
  GenerateEmailsParams,
} from '@/types/chat';

// Tool function implementations
// TODO: move these to a separate file for the Octave API
// TODO: define response schemas for the api responses
export async function enrichCompany(
  params: EnrichCompanyParams
): Promise<object> {
  const { companyDomain } = params;

  try {
    console.log('Enriching company:', companyDomain);
    const response = await fetch(
      'https://dev.octavehq.com/api/v2/agents/enrich-company/run',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_key: process.env.OCTAVE_API_KEY || '',
        },
        body: JSON.stringify({
          companyDomain,
          agentOId: process.env.OCTAVE_ENRICH_COMPANY_OID || '',
        }),
      }
    );

    if (!response.ok) {
      console.error('Error enriching company:', response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.found) {
      console.log(
        'No enrichment data found for company domain:',
        companyDomain
      );
      return {
        found: false,
        error: `No enrichment data found for company domain: ${companyDomain}`,
        companyDomain,
      };
    }

    // Return the structured data directly
    console.log('Enrichment data found for company domain:', companyDomain);
    // console.debug('Enrichment data:', data.data);
    return {
      found: true,
      companyDomain,
      data: data.data,
    };
  } catch (error) {
    console.error('Error enriching company:', error);
    return {
      found: false,
      error: `Error enriching company ${companyDomain}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      companyDomain,
    };
  }
}

export async function enrichPerson(
  params: EnrichPersonParams
): Promise<object> {
  const { linkedInProfile } = params;

  try {
    console.log('Enriching person:', linkedInProfile);
    const response = await fetch(
      'https://dev.octavehq.com/api/v2/agents/enrich-person/run',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_key: process.env.OCTAVE_API_KEY || '',
        },
        body: JSON.stringify({
          linkedInProfile,
          agentOId: process.env.OCTAVE_ENRICH_PERSON_OID || '',
        }),
      }
    );

    if (!response.ok) {
      console.error('Error enriching person:', response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.found) {
      console.log(
        'No enrichment data found for LinkedIn profile:',
        linkedInProfile
      );
      return {
        found: false,
        error: `No enrichment data found for LinkedIn profile: ${linkedInProfile}`,
        linkedInProfile,
      };
    }

    // Return the structured data directly
    console.log('Enrichment data found for LinkedIn profile:', linkedInProfile);
    // console.debug('Enrichment data:', data.data);
    return {
      found: true,
      linkedInProfile,
      data: data.data,
    };
  } catch (error) {
    console.error('Error enriching person:', error);
    return {
      found: false,
      error: `Error enriching person ${linkedInProfile}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      linkedInProfile,
    };
  }
}

export async function generateEmails(
  params: GenerateEmailsParams
): Promise<object> {
  const { linkedInProfile } = params;

  try {
    console.log('Generating emails for:', linkedInProfile);
    const response = await fetch(
      'https://dev.octavehq.com/api/v2/agents/sequence/run',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_key: process.env.OCTAVE_API_KEY || '',
        },
        body: JSON.stringify({
          linkedInProfile,
          agentOId: process.env.OCTAVE_SEQUENCE_OID || '',
        }),
      }
    );

    if (!response.ok) {
      console.error('Error generating emails:', response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.found) {
      console.log('No emails generated for LinkedIn profile:', linkedInProfile);
      return {
        found: false,
        error: `No emails generated for LinkedIn profile: ${linkedInProfile}`,
        linkedInProfile,
      };
    }

    // Return the structured data directly
    console.log('Emails generated for LinkedIn profile:', linkedInProfile);
    // console.debug('Generated emails:', data.data);
    return {
      found: true,
      linkedInProfile,
      data: data.data,
    };
  } catch (error) {
    console.error('Error generating emails:', error);
    return {
      success: false,
      error: `Error generating emails for ${linkedInProfile}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      linkedInProfile,
    };
  }
}

// Tool definitions for OpenAI
export const tools = [
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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
  },
];

// Tool function registry
export const toolFunctions = {
  enrichCompany,
  enrichPerson,
  generateEmails,
};
