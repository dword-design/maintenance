import chdir from '@dword-design/chdir'
import { map } from '@dword-design/functions'
import globby from 'globby'
import sequential from 'promise-sequential'

export default async handler => {
  const paths = await globby('*', {
    absolute: true,
    cwd: 'repos',
    onlyDirectories: true,
  })
  await sequential(paths |> map(path => () => chdir(path, handler)))
}
