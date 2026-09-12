import type { APIRequestContext, APIResponse } from '@playwright/test';

type ApiEnvelope = { data?: Record<string, unknown> };

function record(value: unknown, description: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${description} must be an object; received ${JSON.stringify(value)}`);
  }
  return value as Record<string, unknown>;
}

function readLabel(value: unknown, key: string): string {
  if (typeof value === 'string') return value;
  const object = record(value, key);
  const label = object.title ?? object.name;
  if (typeof label !== 'string') throw new Error(`${key} has no title/name: ${JSON.stringify(value)}`);
  return label;
}

/** Normalize the field names returned by OrangeHRM job-details API variants. */
export function parseJobDetails(value: unknown): { jobTitle: string; employmentStatus: string } {
  const data = record(value, 'Job API data');
  // The employee Job form calls this Employment Status, but API payloads can
  // expose the same relationship under the shorter key `empStatus`.
  const status = data.empStatus ?? data.employmentStatus;
  if (status == null) {
    throw new Error(
      `Employment status is missing from Job API data. Available keys: ${Object.keys(data).join(', ')}`,
    );
  }
  return {
    jobTitle: readLabel(data.jobTitle, 'jobTitle'),
    employmentStatus: readLabel(status, 'empStatus/employmentStatus'),
  };
}

export class EmployeeApi {
  constructor(private readonly request: APIRequestContext) {}

  private employeeUrl(employeeNumber: number) {
    return `/web/index.php/api/v2/pim/employees/${employeeNumber}`;
  }

  private async getOk(url: string): Promise<ApiEnvelope> {
    const response = await this.request.get(url);
    if (response.status() !== 200) {
      throw new Error(
        `GET ${response.url()} returned HTTP ${response.status()} ${response.statusText()}; `
        + `response body: ${await response.text()}`,
      );
    }
    return response.json() as Promise<ApiEnvelope>;
  }

  async readEmployee(employeeNumber: number) {
    const body = await this.getOk(this.employeeUrl(employeeNumber));
    const data = record(body.data, 'Employee API data');
    return {
      firstName: String(data.firstName ?? ''),
      lastName: String(data.lastName ?? ''),
      employeeId: String(data.employeeId ?? ''),
    };
  }

  async readJob(employeeNumber: number) {
    const body = await this.getOk(`${this.employeeUrl(employeeNumber)}/job-details`);
    return parseJobDetails(body.data);
  }

  async searchByEmployeeId(employeeId: string): Promise<Array<Record<string, unknown>>> {
    const response: APIResponse = await this.request.get(
      '/web/index.php/api/v2/pim/employees',
      { params: { employeeId, limit: 50, offset: 0 } },
    );
    if (response.status() !== 200) {
      throw new Error(
        `GET ${response.url()} returned HTTP ${response.status()} ${response.statusText()}; `
        + `response body: ${await response.text()}`,
      );
    }
    const body: unknown = await response.json();
    const envelope = record(body, 'Employee search API response');
    if (!Array.isArray(envelope.data)) {
      throw new Error(`Employee search API data must be an array: ${JSON.stringify(envelope)}`);
    }
    return envelope.data.map((item, index) => record(item, `Employee search result ${index}`));
  }
}
