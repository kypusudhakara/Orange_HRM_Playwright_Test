import type { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  get heading() { return this.page.getByRole('heading', { name: 'Dashboard' }); }

  async openPim() {
    await this.page.getByRole('link', { name: 'PIM', exact: true }).click();
  }

  async logout() {
    await this.page.locator('.oxd-userdropdown-tab').click();
    await this.page.locator('a:has-text("Logout")').click();
  }
}
