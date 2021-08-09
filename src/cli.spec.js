import basePackageConfig from '@dword-design/base/package.json'
import chdir from '@dword-design/chdir'
import { endent, fromPairs, keys, map, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import { ensureDir, outputFile } from 'fs-extra'
import globby from 'globby'
import outputFiles from 'output-files'
import P from 'path'
import sequential from 'promise-sequential'

const self = require.resolve('./cli')

export default tester(
  {
    'base-version': async () =>
      expect(
        execa(self, ['base-version']) |> await |> property('stdout')
      ).toEqual(basePackageConfig.version),
    push: async () => {
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

      const output = execa(self, ['push']) |> await |> property('stdout')
      expect(output).toEqual(endent`
      Pushing repo1 …
      Pushing repo2 …
    `)
      expect(await globby('*/**', { cwd: 'repos', onlyFiles: false })).toEqual([
        'repo1/a.txt',
        'repo2/a.txt',
      ])
    },
    'remove: error': () =>
      expect(execa(self, ['remove'])).rejects.toThrow(
        "error: missing required argument 'glob'"
      ),
    'remove: valid': async () => {
      const createRepo = async number => {
        await ensureDir(P.join('repos', `repo${number}`))
        await chdir(P.join('repos', `repo${number}`), async () => {
          await execa.command('git init')
          await execa.command('git config user.email "foo@bar.de"')
          await execa.command('git config user.name "foo"')
          await outputFiles({
            'a.txt': '',
            'b.txt': '',
          })
          await execa.command('git add .')
          await execa.command('git commit -m foo')
        })
      }
      await ([1, 2] |> map(number => () => createRepo(number)) |> sequential)

      const output =
        execa(self, ['remove', 'b.txt', '-m', 'chore: remove file'])
        |> await
        |> property('stdout')
      expect(output).toEqual(endent`
      Removing files in repo1 …
      Removing files in repo2 …
    `)
      expect(
        globby('*/**', {
          cwd: 'repos',
          dot: true,
          ignore: '*/.git',
          onlyFiles: false,
        })
          |> await
          |> map(path => [path, true])
          |> fromPairs
      ).toEqual({ 'repo1/a.txt': true, 'repo2/a.txt': true })
    },
    'update-github-workflows': async () => {
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
          await execa.command('git add .')
          await execa.command('git commit -m foo')
        })
      }
      await ([1, 2] |> map(number => () => createRepo(number)) |> sequential)

      const output =
        execa(self, ['update-github-workflows']) |> await |> property('stdout')
      expect(output).toEqual(endent`
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
        expect.arrayContaining(
          {
            'repo1/.github/workflows/build.yml': true,
            'repo1/.github/workflows/update.yml': true,
            'repo2/.github/workflows/build.yml': true,
            'repo2/.github/workflows/update.yml': true,
          } |> keys
        )
      )
    },
  },
  [testerPluginTmpDir()]
)
