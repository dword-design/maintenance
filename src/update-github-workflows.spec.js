import chdir from '@dword-design/chdir'
import { endent, map, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import { ensureDir } from 'fs-extra'
import globby from 'globby'
import mockStdio from 'mock-stdio'
import outputFiles from 'output-files'
import P from 'path'
import sequential from 'promise-sequential'

import self from './update-github-workflows'

export default tester(
  {
    file: async () => {
      const createRepo = async number => {
        await ensureDir(P.join('repos', `repo${number}`))
        await chdir(P.join('repos', `repo${number}`), async () => {
          await execa.command('git init')
          await execa.command('git config user.email "foo@bar.de"')
          await execa.command('git config user.name "foo"')
          await outputFiles({
            '.github/workflows': {
              'build.yml': '',
              'update.yml': '',
            },
          })
        })
      }
      await ([1, 2] |> map(number => () => createRepo(number)) |> sequential)
      mockStdio.start()
      await self({ quiet: false })

      const output = mockStdio.end()
      expect(output.stdout).toEqual(endent`
        Updating GitHub workflows for repo1 …
        Updating GitHub workflows for repo2 …

      `)
      expect(
        await globby('*/**', {
          cwd: 'repos',
          dot: true,
          ignore: '*/.git',
          onlyFiles: false,
        })
      ).toEqual(
        expect.arrayContaining([
          'repo1/.github/workflows/build.yml',
          'repo1/.github/workflows/update.yml',
          'repo2/.github/workflows/build.yml',
          'repo2/.github/workflows/update.yml',
        ])
      )
      await execa.command('git diff --exit-code', {
        cwd: P.join('repos', 'repo1'),
      })
      await execa.command('git diff --exit-code', {
        cwd: P.join('repos', 'repo2'),
      })
      expect(
        execa.command('git log --oneline -n 1', {
          cwd: P.join('repos', 'repo1'),
        })
          |> await
          |> property('stdout')
      ).toMatch('chore: update github workflows')
    },
  },
  [testerPluginTmpDir()]
)
