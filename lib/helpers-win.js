const setWinEnvVars = ({ AccessKeyId, SecretAccessKey, SessionToken, Region }) => `
set AWS_REGION=${Region || 'us-west-2'}
set AWS_ACCESS_KEY_ID=${AccessKeyId}
set AWS_SECRET_ACCESS_KEY=${SecretAccessKey}
set AWS_SESSION_TOKEN=${SessionToken}
`;

module.exports = {
  setWinEnvVars,
};
