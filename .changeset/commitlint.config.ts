import { RuleConfigSeverity, UserConfig } from '@commitlint/types'

const Configuration: UserConfig = {
  rules: {
    "body-max-line-length": [RuleConfigSeverity.Error, "always", 10],
  }
};

export default Configuration;