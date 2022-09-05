#!/usr/bin/env node

import dotenv from '@dword-design/dotenv-json-extended'
import { map } from '@dword-design/functions'
import makeCli from 'make-cli'
import { Octokit } from 'octokit'

import { baseVersion, clone, push, remove, updateGithubWorkflows } from '.'
import activateAllWorkflows from './activate-all-workflows'
import checkBaseVersion from './check-base-version'
import deactivatedWorkflows from './deactivated-workflows'

dotenv.config()

const octokit = new Octokit({ auth: process.env.GITHUB_API_TOKEN })

const run = async () => {
  try {
    await checkBaseVersion()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }

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
  makeCli({
    commands:
      [
        {
          handler: () => console.log(baseVersion),
          name: 'base-version',
        },
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
          handler: () => activateAllWorkflows(octokit),
          name: 'activate-all',
        },
        {
          handler: async () => console.log(await deactivatedWorkflows(octokit)),
          name: 'deactivated',
        },
      ] |> map(wrapErrorHandling),
  })
}
run()
