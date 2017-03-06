/* eslint-disable no-console */
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Load configuration file
 * @returns {object} Configuration object
 */
exports.loadConfig = () => {
  const homeDir = os.homedir();
  const configPath = path.resolve(homeDir, '.assumer.json');
  return fs.statSync(configPath) && JSON.parse(fs.readFileSync(configPath));
};

/**
 * Write credentials to temp file
 * @param {object} creds - Object representing target account credentials obtained from AWS
 */
exports.sourceCredentials = ({ AccessKeyId, SecretAccessKey, SessionToken, Region }) => new Promise((resolve, reject) => {
  const data = `export AWS_REGION=${Region || 'us-west-2'}
export AWS_ACCESS_KEY_ID=${AccessKeyId}
export AWS_SECRET_ACCESS_KEY=${SecretAccessKey}
export AWS_SESSION_TOKEN=${SessionToken}`;
  fs.writeFile(path.resolve(os.tmpdir(), 'tmp-assumer-credentials'), data, (err) => {
    if (err) reject(err);
    const tmpFile = path.resolve(os.tmpdir(), 'tmp-assumer-credentials');
    resolve(`source '${tmpFile}'`);
  });
});

/**
 * Generate Sign-in URL
 * @param {object} creds - Object representing target account credentials obtained from AWS
 */
exports.generateURL = ({ AccessKeyId, SecretAccessKey, SessionToken }) => new Promise((resolve, reject) => {
  const issuer = 'assumer';
  const consoleURL = 'https://console.aws.amazon.com/';
  const signinURL = 'https://signin.aws.amazon.com/federation';
  const sessionJSON = JSON.stringify({
    sessionId: AccessKeyId,
    sessionKey: SecretAccessKey,
    sessionToken: SessionToken,
  });

  const options = {
    hostname: 'signin.aws.amazon.com',
    path: `/federation?Action=getSigninToken&SessionType=json&Session=${encodeURIComponent(sessionJSON)}`,
  };

  const req = https.request(options, (res) => {
    res.on('data', (data) => {
      const signinToken = JSON.parse(data).SigninToken;
      const signinTokenParam = `&SigninToken=${signinToken}`;
      const issuerParam = `&Issuer=${issuer}`;
      const destParam = `&Destination=${consoleURL}`;
      const loginURL = `${signinURL}?Action=login${signinTokenParam}${issuerParam}${destParam}`;
      resolve(loginURL);
    });
  });
  req.on('error', err => reject(err));
  req.end();
});
