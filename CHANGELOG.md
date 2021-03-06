# Change Log (ego-cli)

## 0.88.0

* added `clock` command
* [Node 12 or later](https://nodejs.org/en/blog/release/v12.0.0/) is required to run application now
* npm update

## 0.87.0

* npm update

## 0.86.2

* added `create` command
* added `rawArgs` property to [CommandExecuteContext](https://egodigital.github.io/ego-cli/interfaces/_contracts_.commandexecutecontext.html) interface
* fixed help screens
* updated to `@slack/web-api^5.10.0`
* updated to `cli-progress^3.8.2`
* updated to `csv-parser^2.3.3`
* updated to `ejs^3.1.3`
* updated to `open^7.0.4`
* updated to `p-queue^6.4.0`

## 0.85.0

* CLI requires at least Node 10 and NPM 6 now
* updated to `@slack/web-api^5.8.0`
* updated to `chokidar^3.4.0`
* updated to `cli-progress^3.8.1`
* updated to `ejs^3.1.2`
* updated to `got^10.7.0`
* updated to `html-entities^1.3.1`
* updated to `inquirer^7.1.0`
* updated to `isbinaryfile^4.0.6`
* updated to `mime-types^2.1.27`
* updated to `minimist^1.2.5`
* updated to `open^7.0.3`
* updated to `ora^4.0.4`
* updated to `public-ip^4.0.1`

## 0.84.2

* added `rn-run` command
* replaced [opn](https://www.npmjs.com/package/opn) with [open](https://www.npmjs.com/package/open)
* updated to `inquirer^7.0.5`

## 0.83.0

* added optional `default_target_branch` config setting for `pull-request` command
* updated to `filesize^6.1.0`

## 0.82.0

* fixed handling errors in requests of `api` command
* updated to `got^10.6.0`
* updated to `p-queue^6.3.0`

## 0.81.0

* can define output format in `qr` command now

## 0.80.2

* added `git-delete` command
* bug fixes
* updated to `cli-progress^3.6.0`
* updated to `cron^1.8.2`
* updated to `got^10.3.0`
* updated to `inquirer^7.0.4`

## 0.79.2

* bug fixes
* updated to `@slack/web-api^5.7.0`
* updated to `chalk^3.0.0`
* updated to `chokidar^3.3.1`
* updated to `cli-progress^3.5.0`
* updated to `cron^1.8.1`
* updated to `deepmerge^4.2.2`
* updated to `ejs^3.0.1`
* updated to `filesize^6.0.1`
* updated to `global-dirs^2.0.1`
* updated to `inquirer^7.0.3`
* updated to `isbinaryfile^4.0.4`
* updated to `mime-types^2.1.26`
* updated to `ora^4.0.3`
* updated to `public-ip^4.0.0`

## 0.78.0

* updated to `@slack/web-api@^5.6.0`
* updated to `chokidar@^3.3.0`
* updated to `cli-highlight@^2.1.4`
* updated to `csv-parser@^2.3.2`
* updated to `ejs@^2.7.4`
* updated to `mime-types@^2.1.25`
* updated to `minimist@^1.2.0`
* updated to `p-queue@^6.2.1`
* updated to `qrcode@^1.4.4`

## 0.77.0

* updated to `@slack/web-api@^5.2.1`
* updated to `chokidar@^3.2.2`
* updated to `cron@^1.7.2`
* updated to `csv-parser@^2.3.1`
* updated to `ejs@^2.7.1`
* updated to `filesize@^4.2.1`
* updated to `qrcode@^1.4.2`

## 0.76.2

* added `devops-items-update` command
* updated to `inquirer@^6.5.2`
* updated to `sanitize-filename@^1.6.3`

## 0.75.2

* added `slack-post` command
* fixes

## 0.74.1

* suggestion, if an unknown command name is submitted

## 0.73.0

* added `qr` command

## 0.72.0

* improved output of `public-ip` command

## 0.71.1

* improved output of `chuck` command
* updated to `sanitize-filename@^1.6.2`

## 0.70.4

* added `public-ip` command.

## 0.70.2

* added `chuck` command.

## 0.69.0

* added `pull-request` command

## 0.68.2

* added `aptdate` command

## 0.67.0

* updated to `chokidar@3.0.2`
* updated to `isbinaryfile@4.0.2`
* updated to `lodash@4.17.14`

## 0.66.1

* added `-bu` and `--base-url` options for `api` command

## 0.65.4

* can define `/_bootstrap.js` and/or `/_shutdown_.js` files for `api` command now
* (bug)fixes

## 0.64.1

* can define bearer and/or username/password authorization for `api` command now

## 0.63.0

* added `api` command

## 0.62.1

* added `csv-split` command

## 0.61.1

* updated to `fs-extra@8.1.0`
* updated to `isbinaryfile@4.0.1`
* fixes

## 0.60.0

* updated to `deepmerge@3.3.0`
* updated to `ejs@2.6.2`
* updated to `inquirer@6.4.1`

## 0.59.0

* `new` command now supports [yarn](https://yarnpkg.com/)

## 0.58.1

* `build` command now supports [yarn](https://yarnpkg.com/)

## 0.57.2

* improved `serve` command
* code cleanups and improvements
* bugs fixed

## 0.55.0

* `node-install` command is now able to run with [yarn](https://yarnpkg.com/)

## 0.54.2

* added `watch` command

## 0.53.0

* `job` command is now also able to execute shell scripts

## 0.52.0

* added `job` command
* code cleanups and improvements

## 0.51.1

* added `ssl-new` command
* added automatic support for HTTP server
* fixed help screen of `git-checkout` command
* bugfixes

## 0.50.0

* improved file download via `serve` command

## 0.49.0

* `backup` command does not handle files / folders with leading `.` by default anymore ... use `-d` / `--dot` flags and/or `backup_dots` config setting

## 0.48.1

* added `serve` command
* bugfixes

## 0.47.1

* added `backup` command

## 0.45.0

* initial release
