import { test as base, expect } from '@playwright/test';
import { EmployeeApi } from '../api/employee.api';
import { DashboardPage } from '../pages/dashboard.page';
import { EmployeeDetailsPage } from '../pages/employee-details.page';
import { LoginPage } from '../pages/login.page';
import { PimPage } from '../pages/pim.page';

type AppFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  pimPage: PimPage;
  employeeDetailsPage: EmployeeDetailsPage;
  employeeApi: EmployeeApi;
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new DashboardPage(page)); },
  pimPage: async ({ page }, use) => { await use(new PimPage(page)); },
  employeeDetailsPage: async ({ page }, use) => { await use(new EmployeeDetailsPage(page)); },
  // context.request shares the live browser's cookies, including the login session.
  employeeApi: async ({ context }, use) => { await use(new EmployeeApi(context.request)); },
});

export { expect };
