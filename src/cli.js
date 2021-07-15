#!/usr/bin/env node

import { map } from '@dword-design/functions'
import makeCli from 'make-cli'

import { baseVersion, clone, push, remove, updateGithubWorkflows } from '.'

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
        handler: (glob, options) => remove(glob, { quiet: false, ...options }),
        name: 'remove',
        options: [{ name: '-m, --message <message>' }],
      },
      {
        handler: options => push({ quiet: false, ...options }),
        name: 'push',
      },
      {
        handler: options => updateGithubWorkflows({ quiet: false, ...options }),
        name: 'update-github-workflows',
      },
    ] |> map(wrapErrorHandling),
})
