import globby from 'globby'
import sequential from 'promise-sequential'
import { map } from '@dword-design/functions'
import execa from 'execa'
import { remove } from 'fs-extra'

const perFile = path => async () => {
  await execa.command('yarn upgrade', { stdio: 'inherit', cwd: path })
  await execa.command('yarn prepare', { stdio: 'inherit', cwd: path })
  await execa.command('git add .', { stdio: 'inherit', cwd: path })
  await execa('git', ['commit', '-m', 'fix: update changed files'], { stdio: 'inherit', cwd: path })
  await execa.command('git push', { stdio: 'inherit', cwd: path })
}

export default async () => {
  const paths = await globby('*', { onlyDirectories: true, cwd: 'dword_design_ghorg', absolute: true })
  await sequential(paths |> map(perFile))
}
