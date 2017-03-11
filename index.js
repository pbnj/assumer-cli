#!/usr/bin/env node

const meow = require('meow');
const os = require('os');
const updateNotifier = require('update-notifier');
const util = require('./lib/util');
const prompt = require('./lib/prompt');

// setup CLI flags
const cli = meow(`
    Usage
      $ assumer

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
      $ assumer # interactive mode
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

// check for updates and notify user
updateNotifier({ pkg: cli.pkg }).notify();

const requiredFlagsExist = util.requiredCliFlagsExist(cli);

// If no flags or input are passed, prompt user interactively
if (!requiredFlagsExist) {
  prompt.interactive(cli);
}

// if required flags are passed
if (requiredFlagsExist) {
  prompt.nonInteractive(cli);
}
