import getUnneededBranches from './get-unneeded-branches'
import { flatten, mapValues, values } from '@dword-design/functions'

export default async octokit => {
  console.log(
    getUnneededBranches(octokit)
      |> await
      |> mapValues((repo, branches) => branches.map(branch => ({ repo, branch })))
      |> values
      |> flatten
  )

  /*const branches = getUnneededBranches(octokit)
    |> await
    |> mapValues((repo, branches) => branches.map(branch => ({ repo, branch })))
    |> values
    |> flatten
  await Promise.all(branches.map(branch => 
    octokit.rest.git.deleteRef({
      owner: 'dword-design',
      ref: `heads/${branch.branch}`,
      repo: branch.repo,
    })
  ))*/
}