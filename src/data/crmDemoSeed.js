/** Deterministic demo CRM fixtures for zero-config `?admin=1` walkthroughs. */

const DAY = 24 * 60 * 60 * 1000

function daysAgo(n) {
  return new Date(Date.now() - n * DAY).toISOString()
}

/** @type {{ quotes: object[], leads: object[] }} */
export const CRM_DEMO_SEED = {
  quotes: [
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      projectType: 'landing',
      addOnIds: ['i18n', 'analytics'],
      extraSections: 1,
      min: 920,
      max: 1380,
      lang: 'en',
      status: 'sent',
      createdAt: daysAgo(12),
      quoteRef: 'a1111111-1111-4111-8111-111111111111',
    },
    {
      id: 'b2222222-2222-4222-8222-222222222222',
      projectType: 'website',
      addOnIds: ['i18n'],
      extraSections: 3,
      min: 2100,
      max: 3400,
      lang: 'en',
      status: 'accepted',
      createdAt: daysAgo(28),
      quoteRef: 'b2222222-2222-4222-8222-222222222222',
    },
    {
      id: 'c3333333-3333-4333-8333-333333333333',
      projectType: 'dashboard',
      addOnIds: ['auth', 'api'],
      extraSections: 0,
      min: 4200,
      max: 6800,
      lang: 'zh',
      status: 'draft',
      createdAt: daysAgo(3),
      quoteRef: 'c3333333-3333-4333-8333-333333333333',
    },
    {
      id: 'd4444444-4444-4444-8444-444444444444',
      projectType: 'landing',
      addOnIds: [],
      extraSections: 0,
      min: 680,
      max: 980,
      lang: 'en',
      status: 'declined',
      createdAt: daysAgo(45),
      quoteRef: 'd4444444-4444-4444-8444-444444444444',
    },
  ],
  leads: [
    {
      id: 'lead-aaaa-1111-4111-8111-aaaaaaaaaaaa',
      name: 'Alex Chen',
      email: 'alex@example-startup.com',
      source: 'landing',
      status: 'qualified',
      quoteRef: 'a1111111-1111-4111-8111-111111111111',
      createdAt: daysAgo(11),
      message: 'Need bilingual landing before product launch.',
    },
    {
      id: 'lead-bbbb-2222-4222-8222-bbbbbbbbbbbb',
      name: 'Jordan Lee',
      email: 'jordan@example-agency.co',
      source: 'calculator',
      status: 'contacted',
      quoteRef: 'b2222222-2222-4222-8222-222222222222',
      createdAt: daysAgo(27),
      message: 'White-label site for client — deposit OK.',
    },
    {
      id: 'lead-cccc-3333-4333-8333-cccccccccccc',
      name: 'Sam Rivera',
      email: 'sam@example.io',
      source: 'landing',
      status: 'new',
      quoteRef: 'c3333333-3333-4333-8333-333333333333',
      createdAt: daysAgo(2),
      message: 'Dashboard UI quote — comparing vendors.',
    },
    {
      id: 'lead-dddd-4444-4444-8444-dddddddddddd',
      name: 'Taylor Ng',
      email: 'taylor@example.com',
      source: 'calculator',
      status: 'closed',
      quoteRef: 'd4444444-4444-4444-8444-444444444444',
      createdAt: daysAgo(40),
      message: 'Went with in-house team.',
    },
  ],
}

export function cloneDemoSeed() {
  return {
    quotes: CRM_DEMO_SEED.quotes.map((q) => ({ ...q })),
    leads: CRM_DEMO_SEED.leads.map((l) => ({ ...l })),
  }
}

/** Build stats payload matching estimator-api shape. */
export function computeCrmStats(quotes, leads) {
  const quotesByStatus = {}
  for (const q of quotes) {
    const s = q.status || 'draft'
    quotesByStatus[s] = (quotesByStatus[s] || 0) + 1
  }
  const leadsByStatus = {}
  for (const l of leads) {
    const s = l.status || 'new'
    leadsByStatus[s] = (leadsByStatus[s] || 0) + 1
  }
  return {
    totalQuotes: quotes.length,
    totalLeads: leads.length,
    quotesByStatus,
    leadsByStatus,
  }
}
