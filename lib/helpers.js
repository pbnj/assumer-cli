const setEnvVars = ({ AccessKeyId, SecretAccessKey, SessionToken, Region }) => `#!/bin/bash
export AWS_REGION=${Region || 'us-west-2'}
export AWS_ACCESS_KEY_ID=${AccessKeyId}
export AWS_SECRET_ACCESS_KEY=${SecretAccessKey}
export AWS_SESSION_TOKEN=${SessionToken}

function unassumer() {
  unset AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
}
`;

module.exports = {
  setEnvVars,
};
