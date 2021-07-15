import basePackageConfig from '@dword-design/base/package.json'

import self from './base-version'

export default {
  works: () => expect(self).toEqual(basePackageConfig.version),
}
