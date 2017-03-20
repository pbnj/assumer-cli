/* eslint-disable no-console */
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const open = require('opn');
const chalk = require('chalk');
const { setWinEnvVars } = require('./helpers-win');
const { setEnvVars } = require('./helpers');

/**
 * Load configuration file
 * @returns {object} Configuration object
 */
const loadConfig = () => {
  const homeDir = os.homedir();
  const configPath = path.resolve(homeDir, '.assumer.json');
  return fs.statSync(configPath) && JSON.parse(fs.readFileSync(configPath));
};

/**
 * Check if user passed required CLI Flags Exist
 * @param {object} cli - Meow CLI object
 */
const requiredCliFlagsExist = (cli) => {
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
const sourceCredentials = ({ AccessKeyId, SecretAccessKey, SessionToken, Region }) => {
  const creds = { AccessKeyId, SecretAccessKey, SessionToken, Region };

  let data;
  if (process.platform === 'win32') data = setWinEnvVars(creds);
  else data = setEnvVars(creds);

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
const generateURL = ({ AccessKeyId, SecretAccessKey, SessionToken }) => {
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

module.exports = {
  loadConfig,
  requiredCliFlagsExist,
  sourceCredentials,
  generateURL,
};
