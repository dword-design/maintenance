import { map } from '@dword-design/functions'
import execa from 'execa'
import { remove } from 'fs-extra'
import globby from 'globby'
import P from 'path'
import stdEnv from 'std-env'

import forEachRepo from './for-each-repo'

export default async (glob, options) => {
  options = { quiet: stdEnv.test, ...options }
  if (!glob) {
    throw new Error('You need to provide a glob.')
  }
  if (!options.message) {
    throw new Error('You need to provide a commit message.')
  }
  await forEachRepo(async () => {
    await (globby(glob, {
      dot: true,
      expandDirectories: false,
      onlyFiles: false,
    })
      |> await
      |> map(path => {
        if (!options.quiet) {
          console.log(`Removing files in ${P.basename(process.cwd())} …`)
        }

        return remove(path)
      })
      |> Promise.all)
    await execa.command(`git add ${glob}`)
    await execa('git', ['commit', '-m', options.message])
  })
}
