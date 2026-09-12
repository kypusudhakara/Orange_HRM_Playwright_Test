import { createEmployeeInput } from '../src/data/employee-data';
import { test, expect } from '../src/fixtures/app.fixture';

test('employee lifecycle: create, update, verify via API, delete and logout', async ({
  page, loginPage, dashboardPage, pimPage, employeeDetailsPage, employeeApi,
}) => {
  const employee = createEmployeeInput();
  let employeeNumber: number | undefined;
  let creationAttempted = false;
  let deleted = false;

  await test.step('Login and confirm dashboard', async () => {
    await loginPage.open();
    await loginPage.login(
      process.env.ORANGEHRM_USERNAME ?? 'Admin',
      process.env.ORANGEHRM_PASSWORD ?? 'admin123',
    );
    await expect(dashboardPage.heading, 'Dashboard must be visible after valid login').toBeVisible();
  });

  try {
    await test.step('Create a data-driven employee with a profile picture', async () => {
      await dashboardPage.openPim();
      await pimPage.openAddEmployee();
      creationAttempted = true;
      employeeNumber = await employeeDetailsPage.create(employee);
      expect(employeeNumber, 'Created employee must have a server-assigned number').toBeGreaterThan(0);
    });

    await test.step('Search by ID, then update Job Title and Employment Status', async () => {
      await pimPage.open();
      await pimPage.searchByEmployeeId(employee.employeeId);
      await expect(pimPage.employeeRow(employee.employeeId), 'New employee should be present in PIM')
        .toHaveCount(1);
      await pimPage.openEmployee(employee.employeeId);
      await employeeDetailsPage.openJob();
      await employeeDetailsPage.updateJob(employee.jobTitle, employee.employmentStatus);
      await page.reload();
      await expect(employeeDetailsPage.jobTitle, 'Job title must survive a page reload')
        .toHaveText(employee.jobTitle);
      await expect(employeeDetailsPage.employmentStatus, 'Employment status must survive a page reload')
        .toHaveText(employee.employmentStatus);
    });

    await test.step('Cross-check employee and job fields through the authenticated API', async () => {
      const savedEmployee = await employeeApi.readEmployee(employeeNumber!);
      expect(savedEmployee, 'API personal data should match the new employee').toEqual({
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
      });
      const apiJob = await employeeApi.readJob(employeeNumber!);
      expect(apiJob.jobTitle, 'API job title must match the rendered UI field')
        .toBe(await employeeDetailsPage.jobTitle.innerText());
      expect(apiJob.employmentStatus, 'API employment status must match the rendered UI field')
        .toBe(await employeeDetailsPage.employmentStatus.innerText());
    });

    await test.step('Delete the same employee in the UI and confirm API removal', async () => {
      await pimPage.open();
      await pimPage.searchByEmployeeId(employee.employeeId);
      await pimPage.deleteEmployee(employee.employeeId);
      deleted = true;
      await pimPage.searchByEmployeeId(employee.employeeId);
      await expect(pimPage.employeeRow(employee.employeeId), 'Deleted employee must not appear in search')
        .toHaveCount(0);
      // Some demo deployments respond with 422 instead of the documented 404
      // for a deleted employee. A fresh, filtered 200 API response containing
      // no records verifies removal without treating a generic 422 as success.
      await expect.poll(() => employeeApi.searchByEmployeeId(employee.employeeId), {
        message: `API search should return no records for deleted ID ${employee.employeeId}`,
      }).toEqual([]);
    });

    await test.step('Logout and confirm that a protected route redirects to login', async () => {
      await dashboardPage.logout();
      await expect(loginPage.loginButton, 'Logout should show the login form').toBeVisible();
      await page.goto('/web/index.php/dashboard/index');
      await expect(loginPage.loginButton, 'The old session must not access the dashboard')
        .toBeVisible();
    });
  } finally {
    // Best-effort cleanup if an assertion failed after creation. A cleanup error
    // must not hide the original failure; successful deletion is asserted above.
    if (creationAttempted && !deleted) {
      try {
        await pimPage.open();
        await pimPage.searchByEmployeeId(employee.employeeId);
        if (await pimPage.employeeRow(employee.employeeId).count()) {
          await pimPage.deleteEmployee(employee.employeeId);
        }
      } catch (error) {
        console.warn(`Cleanup failed for test employee ${employee.employeeId}:`, error);
      }
    }
  }
});
