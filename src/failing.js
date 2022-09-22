import pFilter from 'p-filter'

export default async octokit => {
  const repos = (
    await octokit.paginate(octokit.rest.repos.listForUser, {
      username: 'dword-design',
    })
  ).filter(repo => !repo.fork && !repo.archived)

  return (
    await pFilter(repos, async repo => {
      try {
        const checks = (
          await octokit.rest.checks.listForRef({
            owner: repo.owner.login,
            ref: `heads/${repo.default_branch}`,
            repo: repo.name,
          })
        ).data.check_runs

        return checks.some(check => check.conclusion === 'failure')
      } catch (error) {
        // Empty repository
        if (
          error.message !==
          `No commit found for SHA: heads/${repo.default_branch}`
        ) {
          throw error
        }
      }

      return false
    })
  ).map(repo => repo.name)
}
