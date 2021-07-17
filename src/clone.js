import execa from 'execa'

export default () =>
  execa.command(
    'gh-repo-clone-all repos --limit 9999 --source --no-archived --branch renovate/lock-file-maintenance',
    { stdio: 'inherit' }
  )
