import { property } from '@dword-design/functions'

export default async octokit => {
  console.log('Fetching pull requests …')

  const pullRequests = (
    await Promise.all(
      (
        await octokit.paginate(octokit.rest.search.issuesAndPullRequests, {
          q: 'is:open user:dword-design head:renovate/lock-file-maintenance',
        })
      ).map(async pullRequest => {
        const match = pullRequest.pull_request.url.match(
          /^https:\/\/api\.github\.com\/repos\/.*?\/(.*?)\/pulls\/.*?$/
        )

        const repo = match[1]

        return (
          octokit.rest.pulls.get({
            owner: 'dword-design',
            pull_number: pullRequest.number,
            repo,
          })
          |> await
          |> property('data')
        )
      })
    )
  ).filter(pr => pr.mergeable_state === 'clean')
  await Promise.all(
    pullRequests.map(async pullRequest => {
      console.log(pullRequest.head.repo.name)
      try {
        await octokit.rest.pulls.merge({
          merge_method: 'rebase',
          owner: pullRequest.head.repo.owner.login,
          pull_number: pullRequest.number,
          repo: pullRequest.head.repo.name,
        })
        await octokit.rest.git.deleteRef({
          owner: pullRequest.head.repo.owner.login,
          ref: `heads/${pullRequest.head.ref}`,
          repo: pullRequest.head.repo.name,
        })
      } catch (error) {
        console.error(`Error in ${pullRequest.head.repo.name}:`)
        console.error(error.message)
        console.error(pullRequest.head)
      }
    })
  )

  // [ 'clean', 'unstable', 'dirty', 'blocked' ]

  // const conflictPr = await octokit.rest.pulls.get({ owner: 'dword-design', repo: 'ts-ast-to-literal', pull_number: 48 }) // conflict
  /* merged: false,
    mergeable: false,
    rebaseable: false,
    mergeable_state: 'dirty', */

  // const successPr = await octokit.rest.pulls.get({ owner: 'dword-design', repo: 'buefy-svg-icon', pull_number: 5 }) // success
  /* merged: false,
    mergeable: true,
    rebaseable: true,
    mergeable_state: 'clean', */

  // const failingPr = await octokit.rest.pulls.get({ owner: 'dword-design', repo: 'docker-testing', pull_number: 50 }) // failure
  /* merged: false,
    mergeable: true,
    rebaseable: true,
    mergeable_state: 'unstable', */

  // archived
  /* merged: false,
    mergeable: true,
    rebaseable: true,
    mergeable_state: 'blocked', */
  /* console.log(conflictPr)
  console.log(successPr)
  console.log(failingPr) */
}
