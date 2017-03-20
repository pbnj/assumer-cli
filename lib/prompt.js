/* eslint-disable no-console */
const assume = require('assumer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const util = require('./util');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

// load config file
const config = util.loadConfig();
const controlAccts = config.control.accounts;
const controlRoles = config.control.roles.map(role => role);
const targetAccts = config.target.accounts;
const targetRoles = config.target.roles.map(role => role);

const filterAccounts = (input, accounts) => accounts
  .filter(acct => (input ? acct.name.toLowerCase().includes(input.toLowerCase()) : true))
  .map(acct => ({ name: acct.name, value: acct.value }));

// questions to prompt user interactively
const questions = [
  {
    type: 'autocomplete',
    name: 'controlAccount',
    message: 'Control Account:',
    source: (answers, input) => Promise.resolve().then(() => filterAccounts(input, controlAccts)),
  },
  {
    type: 'list',
    name: 'controlRole',
    message: 'Control Role:',
    choices: controlRoles,
  },
  {
    type: 'autocomplete',
    name: 'targetAccount',
    message: 'Target Account:',
    source: (answers, input) => Promise.resolve().then(() => filterAccounts(input, targetAccts)),
  },
  {
    type: 'list',
    name: 'targetRole',
    message: 'Target Role:',
    choices: targetRoles,
  },
  {
    type: 'input',
    message: 'MFA Token:',
    name: 'mfaToken',
    validate: (value) => {
      const pass = value.match(/^\d{6}$/i);
      if (pass) {
        return true;
      }

      return 'Invalid MFA Token. Must be 6-digit token';
    },
  },
  {
    type: 'confirm',
    message: 'Launch AWS Console in browser?',
    name: 'gui',
    default: true,
  },
];

/**
 * An interactive prompt
 * @param {object} cli - meow cli object
 */
const interactive = (cli) => {
  const { username } = cli.flags;
  inquirer.prompt(questions)
    // handle response
    .then((response) => {
      let { controlRole, targetRole } = response;
      const { controlAccount, targetAccount, mfaToken } = response;
      const requestedTarget = config.target.accounts.find(acct => acct.value === targetAccount);

      // Replace wildcards in role names
      if (controlRole.indexOf('$$$') > -1) controlRole = controlRole.replace(/\$\$\$/g, requestedTarget.name);
      if (targetRole.indexOf('$$$') > -1) targetRole = targetRole.replace(/\$\$\$/g, requestedTarget.name);

      console.log(`${chalk.yellow(username)} is assuming ${chalk.yellow(targetRole)} role into ${chalk.yellow(targetAccount)} account`);
      return Promise.all([
        response,
        assume({ controlAccount, controlRole, targetAccount, targetRole, username, mfaToken }),
      ]);
    })
    // determine whether to open console in browser
    .then((results) => {
      const [response, creds] = results;
      util.sourceCredentials(creds);
      if (response.gui) util.generateURL(creds);
    })
    .then(() => util.checkUpgrade({ pkg: cli.pkg }))
    .catch(err => console.log(chalk.red(err)));
};

/**
 * A non-interactive prompt
 * @param {object} cli - meow cli object
 */
const nonInteractive = (cli) => {
  const { controlAccount, targetAccount, username } = cli.flags;
  let { controlRole, targetRole, mfaToken } = cli.flags;

  // Replace wildcards in role names
  const configTargetAccount = config.target.accounts.find(acct => acct.value === targetAccount);
  if (controlRole.indexOf('$$$') > -1) controlRole = controlRole.replace(/\$\$\$/g, configTargetAccount.name);
  if (targetRole.indexOf('$$$') > -1) targetRole = targetRole.replace(/\$\$\$/g, configTargetAccount.name);

  // if no token is passed, prompt user
  if (mfaToken === undefined) {
    inquirer.prompt([questions.find(field => field.name === 'mfaToken')])
      .then((response) => {
        mfaToken = response.mfaToken;

        console.log(`${chalk.yellow(username)} is assuming ${chalk.yellow(targetRole)} role into ${chalk.yellow(targetAccount)} account`);
        return assume({
          controlAccount,
          controlRole,
          targetAccount,
          targetRole,
          username,
          mfaToken,
        });
      })
      .then((creds) => {
        if (cli.flags.gui) util.generateURL(creds);
        util.sourceCredentials(creds);
      })
      .then(() => util.checkUpgrade({ pkg: cli.pkg }))
      .catch(err => console.log(chalk.red(err)));
  } else {
    assume({ controlAccount, controlRole, targetAccount, targetRole, username, mfaToken })
    .then(results => console.log(results))
    .then(() => util.checkUpgrade({ pkg: cli.pkg }))
    .catch(err => console.log(chalk.red(err)));
  }
};

module.exports = {
  interactive,
  nonInteractive,
};
