/* eslint-disable no-console */
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const open = require('opn');
const chalk = require('chalk');

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
 * Check if user passed required CLI Flags Exist
 * @param {object} cli - Meow CLI object
 */
exports.requiredCliFlagsExist = (cli) => {
  if (cli.flags.controlAccount &&
      cli.flags.targetAccount &&
      cli.flags.controlRole &&
      cli.flags.targetRole) {
    return true;
  }
  return false;
};

/**
 * Write credentials to temp file
 * @param {object} creds - Object representing target account credentials obtained from AWS
 */
exports.sourceCredentials = ({ AccessKeyId, SecretAccessKey, SessionToken, Region }) => {
  const data = `export AWS_REGION=${Region || 'us-west-2'}
export AWS_ACCESS_KEY_ID=${AccessKeyId}
export AWS_SECRET_ACCESS_KEY=${SecretAccessKey}
export AWS_SESSION_TOKEN=${SessionToken}
unassumer(){
    unset AWS_REGION
    unset AWS_ACCESS_KEY_ID
    unset AWS_SECRET_ACCESS_KEY
    unset AWS_SESSION_TOKEN
}`;
  fs.writeFile(path.resolve(os.tmpdir(), 'tmp-assumer-credentials'), data, (err) => {
    if (err) console.log(chalk.red(err));
    const tmpFile = path.resolve(os.tmpdir(), 'tmp-assumer-credentials');
    console.log(chalk.green('COMMAND:'), `source '${tmpFile}'`);
  });
};

/**
 * Generate Sign-in URL
 * @param {object} creds - Object representing target account credentials obtained from AWS
 */
exports.generateURL = ({ AccessKeyId, SecretAccessKey, SessionToken }) => {
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
      console.log(chalk.green('URL:'), loginURL);
      open(loginURL, { wait: false });
    });
  });
  req.on('error', err => console.log(chalk.red(err)));
  req.end();
};
