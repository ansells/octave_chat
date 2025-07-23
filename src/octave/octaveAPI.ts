import axios, { AxiosInstance } from 'axios';

// Function input types
export interface EnrichCompanyParams {
  companyDomain: string;
}

export interface EnrichPersonParams {
  linkedInProfile: string;
}

export interface GenerateEmailsParams {
  linkedInProfile: string;
}

export interface BaseResponse {
  found: boolean;
  error?: string;
}

export interface EnrichCompanyResponse extends BaseResponse {
  companyDomain: string;
  data?: unknown; // TODO: define this
}

export interface EnrichPersonResponse extends BaseResponse {
  linkedInProfile: string;
  data?: unknown; // TODO: define this
}

export interface GenerateEmailsResponse extends BaseResponse {
  linkedInProfile: string;
  data?: unknown; // TODO: define this
}

export class OctiveAPI {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(isDev: boolean = false, version: string = 'v2') {
    this.baseUrl = isDev
      ? `https://dev.octavehq.com/api/${version}`
      : `https://app.octavehq.com/api/${version}`;
    this.apiKey = process.env.OCTAVE_API_KEY || '';
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        api_key: this.apiKey,
      },
    });
  }

  async enrichCompany(
    params: EnrichCompanyParams,
    agentOId: string = process.env.OCTAVE_ENRICH_COMPANY_OID || ''
  ): Promise<EnrichCompanyResponse> {
    const { companyDomain } = params;
    if (!agentOId) {
      console.error('Agent OID is required');
      throw new Error('Agent OID is required');
    }

    console.log('Enriching company for:', companyDomain);

    const requestPayload = {
      agentOId,
      companyDomain,
    };

    try {
      const response = await this.axiosInstance.post(
        `/agents/enrich-company/run`,
        requestPayload
      );

      if (response.status !== 200) {
        console.error(
          `Failed to enrich company status = ${response.status} data = ${response.data}`
        );
        return {
          found: false,
          error: `Failed to enrich company status = ${response.status} data = ${response.data}`,
          companyDomain,
        };
      }

      const result = response.data;
      if (!result.found) {
        console.warn(
          'No enrichment data found for company domain:',
          companyDomain
        );
        return {
          found: false,
          error: `No enrichment data found for company domain: ${companyDomain}`,
          companyDomain,
        };
      }

      return {
        found: true,
        companyDomain,
        data: result,
      } as EnrichCompanyResponse;
    } catch (error) {
      console.error('Error enriching company:', error);

      // Enhanced error logging for axios errors
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
          },
        });
      }

      return {
        found: false,
        error: `Error enriching company ${companyDomain}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        companyDomain,
      };
    }
  }

  async enrichPerson(
    params: EnrichPersonParams,
    agentOId: string = process.env.OCTAVE_ENRICH_PERSON_OID || ''
  ): Promise<EnrichPersonResponse> {
    const { linkedInProfile } = params;
    if (!agentOId) {
      console.error('Agent OID is required');
      throw new Error('Agent OID is required');
    }

    console.log('Enriching person for:', linkedInProfile);

    try {
      const response = await this.axiosInstance.post(
        `/agents/enrich-person/run`,
        {
          agentOId,
          linkedInProfile,
        }
      );

      if (response.status !== 200) {
        console.error(
          `Failed to enrich person status = ${response.status} data = ${response.data}`
        );
        return {
          found: false,
          error: `Failed to enrich person status = ${response.status} data = ${response.data}`,
          linkedInProfile,
        };
      }

      const result = response.data;
      if (!result.found) {
        console.warn(
          'No enrichment data found for LinkedIn profile:',
          linkedInProfile
        );
        return {
          found: false,
          error: `No enrichment data found for LinkedIn profile: ${linkedInProfile}`,
          linkedInProfile,
        };
      }

      return {
        found: true,
        linkedInProfile,
        data: result,
      } as EnrichPersonResponse;
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

  async generateEmails(
    params: GenerateEmailsParams,
    agentOId: string = process.env.OCTAVE_SEQUENCE_OID || ''
  ): Promise<GenerateEmailsResponse> {
    const { linkedInProfile } = params;
    if (!agentOId) {
      console.error('Agent OID is required');
      throw new Error('Agent OID is required');
    }

    console.log('Generating emails for:', linkedInProfile);

    try {
      const response = await this.axiosInstance.post(`/agents/sequence/run`, {
        agentOId,
        linkedInProfile,
      });

      if (response.status !== 200) {
        console.error(
          `Failed to generate emails status = ${response.status} data = ${response.data}`
        );
        return {
          found: false,
          error: `Failed to generate emails status = ${response.status} data = ${response.data}`,
          linkedInProfile,
        };
      }

      const result = response.data;
      if (!result.found) {
        console.warn(
          'No emails generated for LinkedIn profile:',
          linkedInProfile
        );
        return {
          found: false,
          error: `No emails generated for LinkedIn profile: ${linkedInProfile}`,
          linkedInProfile,
        };
      }

      return {
        found: true,
        linkedInProfile,
        data: result,
      } as GenerateEmailsResponse;
    } catch (error) {
      console.error('Error generating emails:', error);
      return {
        found: false,
        error: `Error generating emails for LinkedIn profile: ${linkedInProfile}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        linkedInProfile,
      };
    }
  }
}
