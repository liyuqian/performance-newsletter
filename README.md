# Performance Newsletter Generator

This is a set of Google App Scripts (in TypeScript) that facilitate a more
distributed and automated way of generating performance newsletters. It's
inspired by the manually written [Flutter Performance Updates in 2019][1].

## Setup

1. Install `clasp` by following https://github.com/google/clasp#install
   - `sudo` if needed.
   - `nodejs` may need to be [upgraded][3] to run `clasp`.
2. Run `npm i -S @types/google-apps-script` to enable [type definitions for apps
   script][4].
2. Clone/fork this repo, and `cd` into that checked out directory.
3. Run `clasp login` for authorizations.
4. Run `clasp create --type standalone` to create a Google App Script project.
5. Follow [clasp run setup instructions][5] to set credentials needed for `clasp
   run`.
6. Run `clasp push && clasp run runAllUnitTests` to verify that the environment
   is properly set.

## Usage

1. [Set up the environment](#setup).
2. Create a Google driver folder to store auto-generated newsletter docs.
3. Modify `config.ts` file to override `kNewsletterFolderId` using the folder in
   the step above. Change other configurations as needed.
4. Run `clasp push` again to update `config.ts` in the cloud.
   (You need `clasp push` whenever `*.ts` file is changed.)
5. Run `clasp run generateNewsletterItemForm`.
   - You can view logs in https://cloud.google.com/logging while it's running.
6. Share the generated form to collect responses.
7. Once all responses are collected, run `clasp run generateNewsletter` to
   generate the newsletter.
   - You can view logs in https://cloud.google.com/logging while it's running.
8. Polish the newsletter manually and publish.


[1]: https://medium.com/flutter/flutter-performance-updates-in-2019-4c170934f914
[2]: https://github.com/google/clasp#install
[3]: https://askubuntu.com/questions/426750/how-can-i-update-my-nodejs-to-the-latest-version
[4]: https://developers.google.com/apps-script/guides/typescript
[5]: https://github.com/google/clasp/blob/master/docs/run.md#setup-instructions