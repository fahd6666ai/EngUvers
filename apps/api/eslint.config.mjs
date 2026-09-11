import { baseConfig } from '@enguvers/config/eslint';

export default [...baseConfig, { ignores: ['dist/**'] }];
