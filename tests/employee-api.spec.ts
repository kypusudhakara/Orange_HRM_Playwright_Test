import { test, expect } from '@playwright/test';
import { parseJobDetails } from '../src/api/employee.api';

test('normalizes OrangeHRM job details returned with empStatus', () => {
  expect(parseJobDetails({
    jobTitle: { id: 1, title: 'Software Engineer' },
    empStatus: { id: 2, name: 'Full-Time Permanent' },
  })).toEqual({ jobTitle: 'Software Engineer', employmentStatus: 'Full-Time Permanent' });
});

test('rejects missing employment status rather than claiming an API/UI match', () => {
  expect(() => parseJobDetails({ jobTitle: { title: 'Software Engineer' } }))
    .toThrow('Employment status is missing from Job API data. Available keys: jobTitle');
});
