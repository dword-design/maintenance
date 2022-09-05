import { filter, property } from '@dword-design/functions'

export default async octokit => {
  const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
    per_page: 100,
    username: 'dword-design',
  })
  await Promise.all(
    repos.map(async repo => {
      const deactivatedWorkflows =
        (await octokit.rest.actions.listRepoWorkflows({
          owner: 'dword-design',
          repo: repo.name,
        }))
        |> await
        |> property('data.workflows')
        |> filter(workflow => workflow.state !== 'active')
      await Promise.all(
        deactivatedWorkflows.map(async workflow => {
          console.log(`Activating ${workflow.name} in ${repo.name} …`)
          try {
            await octokit.rest.actions.enableWorkflow({
              owner: 'dword-design',
              repo: repo.name,
              workflow_id: workflow.id,
            })
          } catch (error) {
            console.log(error)
          }
        })
      )
    })
  )
}
