#!/usr/bin/env node

import dotenv from '@dword-design/dotenv-json-extended'
import { map } from '@dword-design/functions'
import makeCli from 'make-cli'
import { Octokit } from 'octokit'

import { clone, push, remove, updateGithubWorkflows } from '.'
import activateAllWorkflows from './activate-all-workflows'
import deactivatedWorkflows from './deactivated-workflows'

dotenv.config()

const octokit = new Octokit({ auth: process.env.GITHUB_API_TOKEN })

const run = () => {
  const wrapErrorHandling = command => ({
    ...command,
    handler: async (...args) => {
      try {
        await command.handler(...args)
      } catch (error) {
        console.error(error.message)
        process.exit(1)
      }
    },
  })

  return makeCli({
    commands:
      [
        {
          handler: clone,
          name: 'clone',
        },
        {
          arguments: '<glob>',
          handler: (glob, options) =>
            remove(glob, { quiet: false, ...options }),
          name: 'remove',
          options: [{ name: '-m, --message <message>' }],
        },
        {
          handler: options => push({ quiet: false, ...options }),
          name: 'push',
        },
        {
          handler: options =>
            updateGithubWorkflows({ quiet: false, ...options }),
          name: 'update-github-workflows',
        },
        {
          handler: () => {
            if (!process.env.GITHUB_API_TOKEN) {
              throw new Error(
                'GitHub API token is missing in environment variables.'
              )
            }

            return activateAllWorkflows(octokit)
          },
          name: 'activate-all-workflows',
        },
        {
          handler: async () => {
            if (!process.env.GITHUB_API_TOKEN) {
              throw new Error(
                'GitHub API token is missing in environment variables.'
              )
            }
            console.log(await deactivatedWorkflows(octokit))
          },
          name: 'deactivated-workflows',
        },
      ] |> map(wrapErrorHandling),
  })
}
run()
