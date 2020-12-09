import {
  kCommitsRegex,
  kFormDescription,
  kIssuesRegex,
  kNewsletterFolderId,
  kPerfAreas,
} from "./config";

import { moveFile } from "./util";

function generateNewsletterItemForm(): void {
  let form = createFrom();
  form.setDescription(kFormDescription);

  let oneLineText = form.addTextItem();
  oneLineText.setTitle(
    'Please give a one-line description of the improvement.',
  );
  oneLineText.setRequired(true);

  let dateLanded = form.addDateItem();
  dateLanded.setTitle('What\'s the date when this improvement landed?');
  dateLanded.setRequired(true);

  let perfAreas = form.addCheckboxItem();
  perfAreas.setChoices(kPerfAreas.map((a) => perfAreas.createChoice(a)));
  perfAreas.showOtherOption(true);
  perfAreas.setRequired(true);

  let commitsText = form.addParagraphTextItem();
  commitsText.setTitle(
    'What are the commits that contribute to this improvement? ' +
    'Please enter one Github/Gerrit/Critique URL per line.',
  );
  let commitsTextValidation = FormApp.createParagraphTextValidation();
  commitsTextValidation.requireTextMatchesPattern(kCommitsRegex.source);
  commitsTextValidation.setHelpText(`Must match regex ${kCommitsRegex}`);
  commitsText.setValidation(commitsTextValidation.build());
  commitsText.setRequired(true);
}

function createFrom(): GoogleAppsScript.Forms.Form {
  let folder = DriveApp.getFolderById(kNewsletterFolderId);
  let filename = `Performance Newsletter Item Form ${Date()}`;

  Logger.log("Creating %s", filename);
  let form = FormApp.create(filename);
  moveFile(form.getId(), folder);

  return form;
}
