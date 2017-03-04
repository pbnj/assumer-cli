#!/usr/bin/env node
/* eslint-disable no-console */

const assume = require('assumer');
const chalk = require('chalk');
const inquirer = require('inquirer');
const meow = require('meow');
const open = require('open');
const os = require('os');
const util = require('./util');

// setup CLI flags
const cli = meow(`
    Usage
      $ assumer
      $ assumer <flags>

    Required Flags
      -a, --target-account    Target Account Number
      -r, --target-role       Target Account Role
      -A, --control-account   Control Account Number
      -R, --control-role      Control Account Role

    Optional Flags
      -u, --username          An AWS IAM username (defaults to system user name)
      -g, --gui               Open a web browser to the AWS console with these credentials
      -t, --token             MFA Token (you will be interactively prompted)

    Example
      $ assumer -a 111111111111 -r target/role -A 123456789012 -R control/role
`, {
  alias: {
    a: 'target-account',
    r: 'target-role',
    A: 'control-account',
    R: 'control-role',
    u: 'username',
    g: 'gui',
    t: 'mfaToken',
  },
  string: ['a', 'r', 'A', 'R', 'u', 't'], // always treat these flags as String type, not Number type
  boolean: ['g'], // always treat these flags as Boolean type
  default: {
    u: os.userInfo().username,
  },
});

const { username } = cli.flags;

// load config file
const config = util.loadConfig();

// questions to prompt user interactively
const questions = [
  {
    type: 'list',
    name: 'controlAccount',
    message: 'Control Account',
    choices: config.control.accounts.map(acct => acct),
  },
  {
    type: 'list',
    name: 'controlRole',
    message: 'Control Role',
    choices: config.control.roles.map(role => role),
  },
  {
    type: 'list',
    name: 'targetAccount',
    message: 'Target Account',
    choices: config.target.accounts.map(acct => acct),
    filter: val => val.toLowerCase(),
  },
  {
    type: 'list',
    name: 'targetRole',
    message: 'Target Role',
    choices: config.target.roles.map(role => role),
  },
  {
    type: 'input',
    message: 'MFA Token',
    name: 'mfaToken',
    validate: (value) => {
      const pass = value.match(/^\d{6}$/i);
      if (pass) {
        return true;
      }

      return 'Invalid MFA Token. Must be 6-digit token';
    },
  },
];

// If no flags or input are passed, prompt user interactively
if ((!cli.flags.controlAccount || !cli.flags.targetAccount ||
  !cli.flags.controlRole || !cli.flags.targetRole) && cli.input.length === 0) {
  inquirer.prompt(questions).then((response) => {
    let { controlRole, targetRole } = response;
    const { controlAccount, targetAccount, mfaToken } = response;

    // Replace wildcards in role names
    const requestedTarget = config.target.accounts.find(acct => acct.value === targetAccount);
    if (controlRole.indexOf('$$$') > -1) controlRole = controlRole.replace(/\$\$\$/g, requestedTarget.name);
    if (targetRole.indexOf('$$$') > -1) targetRole = targetRole.replace(/\$\$\$/g, requestedTarget.name);

    console.log(`${chalk.yellow(username)} is assuming ${chalk.yellow(targetRole)} role into ${chalk.yellow(targetAccount)} account`);
    return assume({ controlAccount, controlRole, targetAccount, targetRole, username, mfaToken });
  })
    .then((creds) => {
      if (cli.flags.gui) {
        util.generateURL(creds).then((url) => {
          console.log(chalk.green(url));
          open(url);
        });
      }
      util.sourceCredentials(creds).then(file => console.log(chalk.green(file)));
    })
    .catch(err => util.error(err));
}

// if required flags are passed
if ((cli.flags.controlAccount && cli.flags.targetAccount &&
  cli.flags.controlRole && cli.flags.targetRole) && cli.input.length === 0) {
  const { controlAccount, targetAccount } = cli.flags;
  let { controlRole, targetRole, mfaToken } = cli.flags;

  // Replace wildcards in role names
  const configTargetAccount = config.target.accounts.find(acct => acct.value === targetAccount);
  if (controlRole.indexOf('$$$') > -1) controlRole = controlRole.replace(/\$\$\$/g, configTargetAccount.name);
  if (targetRole.indexOf('$$$') > -1) targetRole = targetRole.replace(/\$\$\$/g, configTargetAccount.name);

  // if no token is passed, prompt user
  if (mfaToken === undefined) {
    inquirer.prompt([questions.find(field => field.name === 'mfaToken')])
      .then((answer) => {
        mfaToken = answer.mfaToken;
        console.log(`${chalk.yellow(username)} is assuming ${chalk.yellow(targetRole)} role into ${chalk.yellow(targetAccount)} account`);
        return assume({
          controlAccount,
          controlRole,
          targetAccount,
          targetRole,
          username,
          mfaToken });
      })
      .then(results => console.log(results))
      .catch(err => util.error(err));

    // if all flags are passed, then assume
  } else {
    assume({ controlAccount, controlRole, targetAccount, targetRole, username, mfaToken })
      .then(results => console.log(results))
      .catch(err => util.error(err));
  }
}
