import { expect, type Locator, type Page } from '@playwright/test';

export class PimPage {
  constructor(private readonly page: Page) {}

  async open() { await this.page.goto('/web/index.php/pim/viewEmployeeList'); }

  async openAddEmployee() {
    await this.page.getByRole('link', { name: 'Add Employee' }).click();
  }

  private get employeeIdInput(): Locator {
    return this.page.locator('.oxd-input-group')
      .filter({ has: this.page.getByText('Employee Id', { exact: true }) })
      .locator('input');
  }

  employeeRow(employeeId: string): Locator {
    // Filter by the exact ID cell, so similar names or IDs cannot select another user.
    return this.page.locator('.oxd-table-body .oxd-table-row').filter({
      has: this.page.locator('.oxd-table-cell').filter({
        hasText: new RegExp(`^\\s*${employeeId}\\s*$`),
      }),
    });
  }

  async searchByEmployeeId(employeeId: string) {
    await this.employeeIdInput.fill(employeeId);
    await Promise.all([
      this.page.waitForResponse(response =>
        response.request().method() === 'GET'
        && /\/api\/v2\/pim\/employees\?/.test(response.url())
        && response.status() === 200,
      ),
      this.page.getByRole('button', { name: 'Search' }).click(),
    ]);
  }

  async openEmployee(employeeId: string) {
    await this.employeeRow(employeeId).locator('button:has(i.bi-pencil-fill)').click();
  }

  async deleteEmployee(employeeId: string) {
    const row = this.employeeRow(employeeId);
    await expect(row, `Exactly one row should match employee ID ${employeeId}`).toHaveCount(1);
    await row.locator('button:has(i.bi-trash)').click();
    await this.page.getByRole('button', { name: /yes, delete/i }).click();
    await expect(row, `Employee ${employeeId} should disappear after deletion`).toHaveCount(0);
  }
}
