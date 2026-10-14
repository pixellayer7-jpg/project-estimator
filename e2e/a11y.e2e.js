import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function seriousViolations(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      rule: v.id,
      impact: v.impact,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    }))
}

const PAGES = [
  ['calculator', '/', 'Get an estimated quote'],
  ['calculator (中文)', '/?lang=zh', '获取项目报价估算'],
  ['proposal', '/?proposal=sow&type=website', 'Statement of Work'],
  ['client portal', '/?portal=demo', null],
  ['CRM admin', '/?admin=1', 'CRM admin'],
]

for (const [name, path, heading] of PAGES) {
  test(`no serious or critical WCAG 2.1 AA violations: ${name}`, async ({
    page,
  }) => {
    await page.goto(path)
    if (heading) {
      await expect(
        page.getByRole('heading', { name: heading }).first()
      ).toBeVisible()
    }
    await page.waitForLoadState('networkidle')
    expect(await seriousViolations(page)).toEqual([])
  })
}
