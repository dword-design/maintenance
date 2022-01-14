import chdir from '@dword-design/chdir'
import { endent, map } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import { ensureDir, outputFile } from 'fs-extra'
import globby from 'globby'
import mockStdio from 'mock-stdio'
import P from 'path'
import sequential from 'promise-sequential'

import self from './push'

export default tester(
  {
    error: async () => {
      await ensureDir(P.join('repos', 'repo'))
      await execa.command('git init', { cwd: P.join('repos', 'repo') })
      mockStdio.start()
      await self({ quiet: false })

      const output = mockStdio.end()
      expect(output.stderr).toMatch('fatal: No configured push destination.')
    },
    'nothing to push': async () => {
      await ensureDir(P.join('remotes', 'repo'))
      await execa.command('git init --bare', {
        cwd: P.join('remotes', 'repo'),
      })
      await execa.command(
        `git clone ${P.join('remotes', 'repo')} ${P.join('repos', 'repo')}`
      )
      await chdir(P.join('repos', 'repo'), async () => {
        await execa.command('git config user.email "foo@bar.de"')
        await execa.command('git config user.name "foo"')
        await outputFile('a.txt', '')
        await execa.command('git add .')
        await execa.command('git commit -m foo')
      })
      await self()
    },
    works: async () => {
      const createRepo = async number => {
        await ensureDir(P.join('remotes', `repo${number}`))
        await execa.command('git init --bare', {
          cwd: P.join('remotes', `repo${number}`),
        })
        await execa.command(
          `git clone ${P.join('remotes', `repo${number}`)} ${P.join(
            'repos',
            `repo${number}`
          )}`
        )
        await chdir(P.join('repos', `repo${number}`), async () => {
          await execa.command('git config user.email "foo@bar.de"')
          await execa.command('git config user.name "foo"')
          await outputFile('a.txt', '')
          await execa.command('git add .')
          await execa.command('git commit -m foo')
        })
      }
      await ([1, 2] |> map(number => () => createRepo(number)) |> sequential)
      mockStdio.start()
      await self({ quiet: false })

      const output = mockStdio.end()
      expect(output.stdout).toEqual(endent`
        Pushing repo1 …
        Pushing repo2 …
        
      `)
      expect(await globby('*/**', { cwd: 'repos' })).toEqual([
        'repo1/a.txt',
        'repo2/a.txt',
      ])
    },
  },
  [testerPluginTmpDir()]
)
