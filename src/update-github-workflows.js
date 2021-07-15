import execa from 'execa'
import P from 'path'
import stdEnv from 'std-env'

import forEachRepo from './for-each-repo'

export default options => {
  options = { quiet: stdEnv.test, ...options }

  return forEachRepo(async () => {
    if (!options.quiet) {
      console.log(
        `Updating GitHub workflows for ${P.basename(process.cwd())} …`
      )
    }
    await execa.command('base prepare')
    await execa.command('git add .github/workflows')
    await execa('git', ['commit', '-m', 'chore: update github workflows'])
  })
}
