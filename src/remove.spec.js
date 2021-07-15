import chdir from '@dword-design/chdir'
import { endent, fromPairs, map, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import { ensureDir } from 'fs-extra'
import globby from 'globby'
import mockStdio from 'mock-stdio'
import outputFiles from 'output-files'
import P from 'path'
import sequential from 'promise-sequential'

import self from './remove'

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
            'a.txt': '',
            'b.txt': '',
          })
          await execa.command('git add .')
          await execa.command('git commit -m foo')
        })
      }
      await ([1, 2] |> map(number => () => createRepo(number)) |> sequential)
      mockStdio.start()
      await self('b.txt', { message: 'chore: remove file', quiet: false })

      const output = mockStdio.end()
      expect(output.stdout).toEqual(endent`
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
      ).toMatch('chore: remove file')
    },
    folder: async () => {
      await ensureDir(P.join('repos', 'repo'))
      await chdir(P.join('repos', 'repo'), async () => {
        await execa.command('git init')
        await execa.command('git config user.email "foo@bar.de"')
        await execa.command('git config user.name "foo"')
        await outputFiles({
          'a.txt': '',
          foo: {
            'bar.txt': '',
          },
        })
        await execa.command('git add .')
        await execa.command('git commit -m foo')
      })
      await self('foo', { message: 'chore: remove folder' })
      expect(
        await globby('*/**', {
          cwd: 'repos',
          dot: true,
          ignore: '*/.git',
          onlyFiles: false,
        })
      ).toEqual(['repo/a.txt'])
    },
    'no commit message': () =>
      expect(self('*')).rejects.toThrow(
        'You need to provide a commit message.'
      ),
    'no glob': () =>
      expect(self()).rejects.toThrow('You need to provide a glob.'),
    wildcard: async () => {
      await ensureDir(P.join('repos', 'repo'))
      await chdir(P.join('repos', 'repo'), async () => {
        await execa.command('git init')
        await execa.command('git config user.email "foo@bar.de"')
        await execa.command('git config user.name "foo"')
        await outputFiles({
          'a.txt': '',
          'b.txt': '',
          'foo.js': '',
        })
        await execa.command('git add .')
        await execa.command('git commit -m foo')
      })
      await self('*.txt', { message: 'chore: remove txt files' })
      expect(
        await globby('*/**', {
          cwd: 'repos',
          dot: true,
          ignore: '*/.git',
          onlyFiles: false,
        })
      ).toEqual(['repo/foo.js'])
    },
  },
  [testerPluginTmpDir()]
)
