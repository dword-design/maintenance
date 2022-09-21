#!/usr/bin/env node

import dotenv from '@dword-design/dotenv-json-extended'
import { map } from '@dword-design/functions'
import makeCli from 'make-cli'
import { Octokit } from 'octokit'

import { clone, push, remove, updateGithubWorkflows } from '.'
import activateAllWorkflows from './activate-all-workflows'
import deactivatedWorkflows from './deactivated-workflows'
import deleteUnneededBranches from './delete-unneeded-branches'
import getUnneededBranches from './get-unneeded-branches'
import merge from './merge'
import rateLimit from './rate-limit'

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
        {
          handler: () => {
            if (!process.env.GITHUB_API_TOKEN) {
              throw new Error(
                'GitHub API token is missing in environment variables.'
              )
            }

            return merge(octokit)
          },
          name: 'merge',
        },
        {
          handler: async () => {
            if (!process.env.GITHUB_API_TOKEN) {
              throw new Error(
                'GitHub API token is missing in environment variables.'
              )
            }
            console.log(await getUnneededBranches(octokit))
          },
          name: 'unneeded-branches',
        },
        {
          handler: async () => {
            if (!process.env.GITHUB_API_TOKEN) {
              throw new Error(
                'GitHub API token is missing in environment variables.'
              )
            }
            await deleteUnneededBranches(octokit)
          },
          name: 'delete-unneeded-branches',
        },
        {
          handler: async () => {
            if (!process.env.GITHUB_API_TOKEN) {
              throw new Error(
                'GitHub API token is missing in environment variables.'
              )
            }

            const result = await rateLimit(octokit)
            console.log(`Limit: ${result.limit}`)
            console.log(`Used: ${result.used}`)
            console.log(`Remaining: ${result.remaining}`)
            console.log(
              `Reset: ${new Date(result.reset * 1000).toLocaleString(
                undefined,
                { timeZone: 'Europe/Berlin' }
              )}`
            )
          },
          name: 'rate-limit',
        },
      ] |> map(wrapErrorHandling),
  })
}
run()
