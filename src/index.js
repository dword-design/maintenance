import { map } from '@dword-design/functions'
import execa from 'execa'
import globby from 'globby'
import sequential from 'promise-sequential'

const perFile = path => async () => {
  await execa.command('yarn upgrade', { cwd: path, stdio: 'inherit' })
  await execa.command('yarn prepare', { cwd: path, stdio: 'inherit' })
  await execa.command('git add .', { cwd: path, stdio: 'inherit' })
  await execa('git', ['commit', '-m', 'fix: update changed files'], {
    cwd: path,
    stdio: 'inherit',
  })
  await execa.command('git push', { cwd: path, stdio: 'inherit' })
}

export default async () => {
  const paths = await globby('*', {
    absolute: true,
    cwd: 'dword_design_ghorg',
    onlyDirectories: true,
  })
  await sequential(paths |> map(perFile))
}
