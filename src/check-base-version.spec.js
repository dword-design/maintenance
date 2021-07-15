import proxyquire from '@dword-design/proxyquire'
import NpmApi from 'npm-api'

export default {
  'out of date': async () => {
    const self = proxyquire('./check-base-version', {
      './base-version': '1.0.0',
    })
    await expect(self()).rejects.toThrow(
      /^The currently installed base version \(1\.0\.0\) differs from the live version \(\d.\d.\d\)\. Please upgrade @dword-design\/maintenance\.$/
    )
  },
  'up to date': async () => {
    const npm = new NpmApi()

    const repo = npm.repo('@dword-design/base')

    const liveBasePackageConfig = await repo.package()

    const self = proxyquire('./check-base-version', {
      './base-version': liveBasePackageConfig.version,
    })
    await self()
  },
}
