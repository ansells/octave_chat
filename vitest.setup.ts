import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OCTAVE_API_KEY = 'test-octave-key';
process.env.OCTAVE_ENRICH_COMPANY_OID = 'test-company-oid';
process.env.OCTAVE_ENRICH_PERSON_OID = 'test-person-oid';
process.env.OCTAVE_SEQUENCE_OID = 'test-sequence-oid';
