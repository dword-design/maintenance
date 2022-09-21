import { property } from '@dword-design/functions'

export default async octokit =>
  octokit.rest.rateLimit.get() |> await |> property('data.rate')
