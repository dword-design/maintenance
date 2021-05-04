import { map } from '@dword-design/functions'
import execa from 'execa'
import globby from 'globby'
import sequential from 'promise-sequential'

const perPath = path => async () => {
  await execa.command('../../node_modules/.bin/base prepare', {
    cwd: path,
    stdio: 'inherit',
  })
  await execa.command('git add .github/workflows', {
    cwd: path,
    stdio: 'inherit',
  })
  await execa('git', ['commit', '-m', 'chore: update workflows'], {
    cwd: path,
    stdio: 'inherit',
  })
  await execa.command('git push', { cwd: path, stdio: 'inherit' })
}

export default async () => {
  await execa.command(
    'gh-repo-clone-all repos --limit 9999 --source --branch renovate/lock-file-maintenance'
  )

  const paths = await globby('*', {
    absolute: true,
    cwd: 'repos',
    onlyDirectories: true,
  })
  await sequential(paths |> map(perPath))
}
