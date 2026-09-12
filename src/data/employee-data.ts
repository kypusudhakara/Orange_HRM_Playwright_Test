import { randomInt } from 'node:crypto';
import path from 'node:path';
import template from './employee.json';

export type EmployeeInput = {
  firstName: string;
  lastName: string;
  employeeId: string;
  jobTitle: string;
  employmentStatus: string;
  profilePicture: string;
};

export function createEmployeeInput(): EmployeeInput {
  // The demo is shared; randomize both fields so parallel users rarely collide.
  const suffix = randomInt(1_000_000, 9_999_999).toString();
  return {
    firstName: template.firstName,
    lastName: `${template.lastName}${suffix}`,
    employeeId: `${template.employeeIdPrefix}${suffix}`,
    jobTitle: template.jobTitle,
    employmentStatus: template.employmentStatus,
    profilePicture: path.resolve(__dirname, '..', '..', template.profilePicture),
  };
}
