import { expect, type Page } from '@playwright/test';
import type { EmployeeInput } from '../data/employee-data';

export class EmployeeDetailsPage {
  constructor(private readonly page: Page) {}

  private inputFor(label: string) {
    return this.page.locator('.oxd-input-group')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator('input');
  }

  private selectFor(label: string) {
    return this.page.locator('.oxd-input-group')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator('.oxd-select-text');
  }

  private async selectOption(label: string, value: string) {
    await this.selectFor(label).click();
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const choice = this.page.locator('.oxd-select-option')
      .filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) });
    await expect(choice, `${label} option "${value}" must exist in this demo instance`).toHaveCount(1);
    await choice.click();
  }

  async create(employee: EmployeeInput): Promise<number> {
    await this.page.getByPlaceholder('First Name').fill(employee.firstName);
    await this.page.getByPlaceholder('Last Name').fill(employee.lastName);
    await this.inputFor('Employee Id').fill(employee.employeeId);
    await this.page.locator('input[type="file"]').setInputFiles(employee.profilePicture);
    await this.page.getByRole('button', { name: 'Save' }).click();

    await expect(this.page, 'Creating an employee should open Personal Details')
      .toHaveURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/);
    const employeeNumber = Number(this.page.url().match(/empNumber\/(\d+)/)?.[1]);
    if (!Number.isInteger(employeeNumber) || employeeNumber <= 0) {
      throw new Error(`Cannot extract employee number from ${this.page.url()}`);
    }
    await expect(this.inputFor('Employee Id'), 'Created employee ID must persist').toHaveValue(employee.employeeId);
    return employeeNumber;
  }

  async openJob() {
    await this.page.getByRole('link', { name: 'Job', exact: true }).click();
    await expect(this.page, 'Job tab should open for the current employee')
      .toHaveURL(/\/pim\/viewJobDetails\/empNumber\/\d+/);
  }

  async updateJob(jobTitle: string, employmentStatus: string) {
    await this.selectOption('Job Title', jobTitle);
    await this.selectOption('Employment Status', employmentStatus);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.jobTitle, 'Updated job title should persist').toHaveText(jobTitle);
    await expect(this.employmentStatus, 'Updated employment status should persist')
      .toHaveText(employmentStatus);
  }

  get jobTitle() { return this.selectFor('Job Title').locator('.oxd-select-text-input'); }
  get employmentStatus() { return this.selectFor('Employment Status').locator('.oxd-select-text-input'); }
}
