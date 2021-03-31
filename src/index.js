import { map } from '@dword-design/functions'
import execa from 'execa'
import globby from 'globby'
import sequential from 'promise-sequential'
import P from 'path'
import { copy } from 'fs-extra'

const perFile = path => async () => {
  await copy('.github/workflows', P.resolve(path, '.github/workflows'))
  await execa.command('git add .', { cwd: path, stdio: 'inherit' })
  await execa('git', ['commit', '-m', 'chore: update workflows'], {
    cwd: path,
    stdio: 'inherit',
  })
  await execa.command('git push', { cwd: path, stdio: 'inherit' })
}

export default async () => {
  // gh-repo-clone-all repos --limit 9999 --source --branch renovate/lock-file-maintenance
  const paths = await globby('*', {
    absolute: true,
    cwd: 'repos',
    onlyDirectories: true,
  })
  await sequential(paths |> map(perFile))
}
