import { flatten, mapValues, values } from '@dword-design/functions'

import getUnneededBranches from './get-unneeded-branches'

export default async octokit => {
  const branches =
    getUnneededBranches(octokit)
    |> await
    |> mapValues((repoBranches, repo) =>
      repoBranches.map(branch => ({ branch, repo }))
    )
    |> values
    |> flatten
  await Promise.all(
    branches.map(branch =>
      octokit.rest.git.deleteRef({
        owner: 'dword-design',
        ref: `heads/${branch.branch}`,
        repo: branch.repo,
      })
    )
  )
}
