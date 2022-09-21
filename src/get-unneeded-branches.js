import { pickBy } from '@dword-design/functions'
import pFilter from 'p-filter'

export default async octokit => {
  const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
    username: 'dword-design',
  })

  return repos.map(async repo => [
    repo.name,
    await pFilter(
      (
        await octokit.paginate(octokit.rest.repos.listBranches, {
          owner: 'dword-design',
          repo: repo.name,
        })
      )
        .map(branch => branch.name)
        .filter(branch => branch !== repo.default_branch),
      async branch =>
        !!(
          await octokit.rest.pulls.list({
            head: `dword-design:${branch}`,
            owner: 'dword-design',
            per_page: 1,
            repo: repo.name,
            state: 'all',
          })
        ).data[0]?.merged_at
    ),
  ])
  |> Promise.all
  |> await
  |> Object.fromEntries
  |> pickBy(repoBranches => repoBranches.length > 0)
}
