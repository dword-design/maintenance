import { property } from '@dword-design/functions'

export default async (octokit, pullRequest) => {
  const checks =
    octokit.rest.checks.listForRef(pullRequest)
    |> await
    |> property('data.check_runs')

  return checks.every(check => check.conclusion === 'success')
}
