# assumer-cli
> CLI for [assumer](https://github.com/devsecops/assumer-js) library

[![NPM](https://nodei.co/npm/assumer-cli.png?downloads=true)](https://nodei.co/npm/assumer-cli/)

[![Known Vulnerabilities](https://snyk.io/test/npm/assumer-cli/badge.svg?style=flat-square)](https://snyk.io/test/npm/assumer-cli)


## Install

```
npm i -g assumer-cli
```

## Usage

```
❯ assumer --help

  Assume IAM roles between AWS accounts

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
    $ assumer # interactive mode
    $ assumer -a 111111111111 -r target/role -A 123456789012 -R control/role
```

## Configuration

If you want to use the CLI in interactive mode, `assumer` expects a config file called `.assumer.json` in your home directory.
Sample configuration:
```
{
  "control": {
    "accounts": [
      {
        "name": "Control Account",
        "value": "123456789012"
      }
    ],
    "roles": [
      {
        "name": "Deploy Admin",
        "value": "deployment/admin"
      },
      {
        "name": "Super Admin",
        "value": "security/admin"
      },
      {
        "name": "Read Only",
        "value": "read/only"
      }
    ]
  },
  "target": {
    "roles": [
      {
        "name": "Deploy Admin",
        "value": "deployment/admin"
      },
      {
        "name": "Super Admin",
        "value": "security/admin"
      },
      {
        "name": "Read Only",
        "value": "read/only"
      }
    ],
    "accounts": [
      {
        "name": "target-account-1",
        "value": "111111111111"
      },
      {
        "name": "target-account-2",
        "value": "222222222222"
      }
    ]
  }
}
```
See [sample config file](.assumer.sample.json) for reference.

## License

MIT © [Peter Benjamin](https://pmbenjamin.github.io/)