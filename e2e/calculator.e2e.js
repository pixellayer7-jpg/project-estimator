import { test, expect } from '@playwright/test'

let pageErrors

test.beforeEach(async ({ page }) => {
  pageErrors = []
  page.on('pageerror', (err) => pageErrors.push(err.message))
})

test.afterEach(() => {
  expect(pageErrors, 'uncaught errors in the page').toEqual([])
})

test('marketing ?type= / ?addons= prefill the form, then leave the URL', async ({
  page,
}) => {
  await page.goto('/?type=website&addons=i18n&section=calc')
  await expect(
    page.getByRole('radio', { name: 'Company / Agency Website' })
  ).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: /Multilingual/ })
  ).toBeChecked()
  await expect(page).toHaveURL(/\?section=calc$/)
})

test('selections persist across a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: 'Dashboard / Web App UI' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('pixellayer-estimator-form'))
    )
    .toContain('"projectType":"dashboard"')
  await page.reload()
  await expect(
    page.getByRole('radio', { name: 'Dashboard / Web App UI' })
  ).toBeChecked()
})

test('quote → proposal → typed acceptance → CRM shows the signer', async ({
  page,
}) => {
  await page.goto('/?type=website')
  await page.getByLabel('Client name (optional)').fill('Acme Studio')

  const proposalHref = await page
    .getByRole('link', { name: /shareable in-app proposal/ })
    .getAttribute('href')
  await page.goto(proposalHref)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Statement of Work' })
  ).toBeVisible()
  await expect(page.getByText('Acme Studio').first()).toBeVisible()

  await page.getByLabel('Type your name').fill('Jamie Chen')
  await page.getByRole('button', { name: /Accept this scope/ }).click()
  await expect(page).toHaveURL(/[?&]portal=quote/)

  await page.goto('/?admin=1')
  await expect(
    page.getByRole('heading', { name: /This browser/ })
  ).toBeVisible()
  await expect(page.getByText('Jamie Chen')).toBeVisible()
})

test('CRM admin works offline with demo data', async ({ page }) => {
  await page.goto('/?admin=1')
  await expect(page.getByText('Demo data')).toBeVisible()
  await page.getByRole('tab', { name: /Leads/ }).click()
  await expect(page.getByText('Alex Chen')).toBeVisible()
})

test('?section=changelog scrolls to the release timeline', async ({ page }) => {
  await page.goto('/?section=changelog')
  await expect(
    page.getByRole('heading', { level: 2, name: 'Changelog' })
  ).toBeInViewport()
})
