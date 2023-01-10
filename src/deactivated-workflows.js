import { filter, map, property } from '@dword-design/functions'

export default async octokit => {
  const repos =
    octokit.paginate(octokit.rest.repos.listForUser, {
      per_page: 100,
      username: 'dword-design',
    })
    |> await
    |> filter(repo => !repo.fork && !repo.archived)

  const result = {}
  for (const repo of repos) {
    const deactivatedWorkflows =
      octokit.rest.actions.listRepoWorkflows({
        owner: 'dword-design',
        repo: repo.name,
      })
      |> await
      |> property('data.workflows')
      |> filter(workflow => workflow.state !== 'active')
      |> map(workflow => workflow.name)
    if (deactivatedWorkflows.length > 0) {
      result[repo.name] = deactivatedWorkflows
    }
  }

  return result
}
