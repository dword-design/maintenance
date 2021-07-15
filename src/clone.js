import execa from 'execa'

export default () =>
  execa.command(
    'gh-repo-clone-all repos --limit 9999 --source --branch renovate/lock-file-maintenance'
  )
