import NpmApi from 'npm-api'

import packageConfig from '@/package.json'

import baseVersion from './base-version'

const npm = new NpmApi()

const repo = npm.repo('@dword-design/base')

export default async () => {
  const liveBasePackageConfig = await repo.package()
  if (baseVersion !== liveBasePackageConfig.version) {
    throw new Error(
      `The currently installed base version (${baseVersion}) differs from the live version (${liveBasePackageConfig.version}). Please upgrade ${packageConfig.name}.`
    )
  }
}
