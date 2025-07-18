import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  EnrichCompanyParams,
  EnrichPersonParams,
  GenerateEmailsParams,
} from '@/types/chat';

const handlers = [
  // Mock Octave Company Enrichment API
  http.post(
    'https://dev.octavehq.com/api/v2/agents/enrich-company/run',
    async ({ request }) => {
      const body = (await request.json()) as EnrichCompanyParams;
      const { companyDomain } = body;

      if (companyDomain === 'error.com') {
        return new HttpResponse(null, { status: 500 });
      }

      if (companyDomain === 'notfound.com') {
        return HttpResponse.json({
          found: false,
          error: 'No enrichment data found',
        });
      }

      return HttpResponse.json({
        found: true,
        data: {
          companyName: 'Test Company',
          domain: companyDomain,
          industry: 'Technology',
          size: '100-500',
          revenue: '$10M-$50M',
          location: 'San Francisco, CA',
        },
      });
    }
  ),

  // Mock Octave Person Enrichment API
  http.post(
    'https://dev.octavehq.com/api/v2/agents/enrich-person/run',
    async ({ request }) => {
      const body = (await request.json()) as EnrichPersonParams;
      const { linkedInProfile } = body;

      if (linkedInProfile.includes('error')) {
        return new HttpResponse(null, { status: 500 });
      }

      if (linkedInProfile.includes('notfound')) {
        return HttpResponse.json({
          found: false,
          error: 'No enrichment data found',
        });
      }

      return HttpResponse.json({
        found: true,
        data: {
          name: 'John Doe',
          title: 'Software Engineer',
          company: 'Test Company',
          experience: '5 years',
          skills: ['JavaScript', 'React', 'Node.js'],
        },
      });
    }
  ),

  // Mock Octave Email Generation API
  http.post(
    'https://dev.octavehq.com/api/v2/agents/sequence/run',
    async ({ request }) => {
      const body = (await request.json()) as GenerateEmailsParams;
      const { linkedInProfile } = body;

      if (linkedInProfile.includes('error')) {
        return new HttpResponse(null, { status: 500 });
      }

      if (linkedInProfile.includes('notfound')) {
        return HttpResponse.json({
          found: false,
          error: 'No emails generated',
        });
      }

      return HttpResponse.json({
        found: true,
        data: {
          emails: [
            {
              subject: 'Test Subject',
              body: 'Test email body content',
              type: 'introduction',
            },
          ],
        },
      });
    }
  ),
];

export const server = setupServer(...handlers);
