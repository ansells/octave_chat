import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from 'vitest';
import { enrichCompany, enrichPerson, generateEmails } from '@/utils/tools';
import { server } from '../__mocks__/server';

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

describe('Tool Functions', () => {
  describe('enrichCompany', () => {
    it('successfully enriches company information', async () => {
      const result = await enrichCompany({ companyDomain: 'example.com' });

      expect(result).toEqual({
        found: true,
        companyDomain: 'example.com',
        data: {
          companyName: 'Test Company',
          domain: 'example.com',
          industry: 'Technology',
          size: '100-500',
          revenue: '$10M-$50M',
          location: 'San Francisco, CA',
        },
      });
    });

    it('handles company not found', async () => {
      const result = await enrichCompany({ companyDomain: 'notfound.com' });

      expect(result).toEqual({
        found: false,
        error: 'No enrichment data found for company domain: notfound.com',
        companyDomain: 'notfound.com',
      });
    });

    it('handles API errors', async () => {
      const result = await enrichCompany({ companyDomain: 'error.com' });

      expect(result).toEqual({
        found: false,
        error: 'Error enriching company error.com: HTTP error! status: 500',
        companyDomain: 'error.com',
      });
    });

    it('handles network errors', async () => {
      // Mock fetch to throw a network error
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await enrichCompany({ companyDomain: 'test.com' });

      expect(result).toEqual({
        found: false,
        error: 'Error enriching company test.com: Network error',
        companyDomain: 'test.com',
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('enrichPerson', () => {
    it('successfully enriches person information', async () => {
      const linkedInProfile = 'https://linkedin.com/in/johndoe';
      const result = await enrichPerson({ linkedInProfile });

      expect(result).toEqual({
        found: true,
        linkedInProfile,
        data: {
          name: 'John Doe',
          title: 'Software Engineer',
          company: 'Test Company',
          experience: '5 years',
          skills: ['JavaScript', 'React', 'Node.js'],
        },
      });
    });

    it('handles person not found', async () => {
      const linkedInProfile = 'https://linkedin.com/in/notfound';
      const result = await enrichPerson({ linkedInProfile });

      expect(result).toEqual({
        found: false,
        error: `No enrichment data found for LinkedIn profile: ${linkedInProfile}`,
        linkedInProfile,
      });
    });

    it('handles API errors', async () => {
      const linkedInProfile = 'https://linkedin.com/in/error';
      const result = await enrichPerson({ linkedInProfile });

      expect(result).toEqual({
        found: false,
        error: `Error enriching person ${linkedInProfile}: HTTP error! status: 500`,
        linkedInProfile,
      });
    });

    it('handles network errors', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const linkedInProfile = 'https://linkedin.com/in/timeout';
      const result = await enrichPerson({ linkedInProfile });

      expect(result).toEqual({
        found: false,
        error: `Error enriching person ${linkedInProfile}: Network timeout`,
        linkedInProfile,
      });

      global.fetch = originalFetch;
    });
  });

  describe('generateEmails', () => {
    it('successfully generates emails', async () => {
      const linkedInProfile = 'https://linkedin.com/in/johndoe';
      const result = await generateEmails({ linkedInProfile });

      expect(result).toEqual({
        found: true,
        linkedInProfile,
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
    });

    it('handles no emails generated', async () => {
      const linkedInProfile = 'https://linkedin.com/in/notfound';
      const result = await generateEmails({ linkedInProfile });

      expect(result).toEqual({
        found: false,
        error: `No emails generated for LinkedIn profile: ${linkedInProfile}`,
        linkedInProfile,
      });
    });

    it('handles API errors', async () => {
      const linkedInProfile = 'https://linkedin.com/in/error';
      const result = await generateEmails({ linkedInProfile });

      expect(result).toEqual({
        success: false,
        error: `Error generating emails for ${linkedInProfile}: HTTP error! status: 500`,
        linkedInProfile,
      });
    });

    it('handles network errors', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const linkedInProfile = 'https://linkedin.com/in/connection';
      const result = await generateEmails({ linkedInProfile });

      expect(result).toEqual({
        success: false,
        error: `Error generating emails for ${linkedInProfile}: Connection refused`,
        linkedInProfile,
      });

      global.fetch = originalFetch;
    });
  });

  describe('Environment Variables', () => {
    it('uses correct environment variables for API calls', async () => {
      const spy = vi.spyOn(global, 'fetch');

      await enrichCompany({ companyDomain: 'test.com' });

      expect(spy).toHaveBeenCalledWith(
        'https://dev.octavehq.com/api/v2/agents/enrich-company/run',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            api_key: 'test-octave-key',
          }),
          body: JSON.stringify({
            companyDomain: 'test.com',
            agentOId: 'test-company-oid',
          }),
        })
      );

      spy.mockRestore();
    });
  });
});
