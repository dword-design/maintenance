import execa from 'execa'
import P from 'path'
import stdEnv from 'std-env'

import forEachRepo from './for-each-repo'

export default options => {
  options = { quiet: stdEnv.test, ...options }

  return forEachRepo(() => {
    if (!options.quiet) {
      console.log(`Pushing ${P.basename(process.cwd())} …`)
    }

    return execa.command('git push')
  })
}
