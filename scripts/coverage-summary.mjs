// Prints the Vitest json-summary as a Markdown table; in GitHub Actions it is
// appended to the job summary so coverage shows on the run page.
import { appendFileSync, readFileSync } from 'node:fs'

const { total } = JSON.parse(
  readFileSync('coverage/coverage-summary.json', 'utf8')
)
const rows = ['lines', 'statements', 'branches', 'functions'].map(
  (k) => `| ${k} | ${total[k].pct}% | ${total[k].covered}/${total[k].total} |`
)
const md = [
  '### Unit test coverage',
  '',
  '| metric | % | covered |',
  '| --- | --- | --- |',
  ...rows,
  '',
].join('\n')

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md)
}
console.log(md)
