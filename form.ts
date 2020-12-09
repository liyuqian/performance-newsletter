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
  form.setCollectEmail(true);
  addGeneralSection(form);
  addQuantifiedSection(form);
}

function addGeneralSection(form: GoogleAppsScript.Forms.Form): void {
  logProgress('one line text');
  let oneLineText = form.addTextItem();
  oneLineText.setTitle(
    'Please give a one-line description of the improvement.',
  );
  oneLineText.setRequired(true);

  logProgress('date landed');
  let dateLanded = form.addDateItem();
  dateLanded.setTitle('What\'s the date when this improvement landed?');
  dateLanded.setRequired(true);

  logProgress('perf areas');
  let perfAreas = form.addCheckboxItem();
  perfAreas.setTitle('What performance areas does this improvement affect?');
  perfAreas.setChoices(kPerfAreas.map((a) => perfAreas.createChoice(a)));
  perfAreas.showOtherOption(true);
  perfAreas.setRequired(true);

  logProgress('commits');
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

  logProgress('first author');
  let firstAuthor = form.addTextItem();
  firstAuthor.setTitle(
    'Who is the main author of this improvement? Please enter an email or a ' +
    'Github id.',
  );
  firstAuthor.setRequired(true);

  logProgress('other authors');
  let otherAuthors = form.addParagraphTextItem();
  otherAuthors.setTitle(
    'Who are other contributors (code authors, code reviewers, issue ' +
    'reporters, etc.) to this improvement? Please enter one email or Github '+
    'id per line.',
  );

  logProgress('issues');
  let issuesText = form.addParagraphTextItem();
  issuesText.setTitle(
    'What issues are related with this improvement? ' +
    'Please enter one issue URL per line.',
  );
  let issuesTextValidation = FormApp.createParagraphTextValidation();
  issuesTextValidation.requireTextMatchesPattern(kIssuesRegex.source);
  issuesTextValidation.setHelpText(`Must match regex ${kIssuesRegex}`);
  issuesText.setValidation(issuesTextValidation.build());

  logProgress('doc');
  let docText = form.addTextItem();
  docText.setTitle(
    'If there\'s a design doc, a webpage, or a wiki article ' +
    'related with this improvement, please enter its URL here. For example, ' +
    'http://go/analyticaa and http://flutter.dev/go/clip-behavior.',
  );
  docText.setValidation(
    FormApp.createTextValidation().requireTextIsUrl().build());

  logProgress('quantified choice');
  let quantifiedChoice = form.addMultipleChoiceItem();
  quantifiedChoice.setTitle('Is this performance improvement quantified?');
  let yesChoice = quantifiedChoice.createChoice(
    'Yes', FormApp.PageNavigationType.CONTINUE);
  let noChoice = quantifiedChoice.createChoice(
    'No', FormApp.PageNavigationType.SUBMIT);
  quantifiedChoice.setChoices([yesChoice, noChoice]);
  quantifiedChoice.setRequired(true);
}

function addQuantifiedSection(form: GoogleAppsScript.Forms.Form): void {
  logProgress('quantified section')
  let pageBreak = form.addPageBreakItem();
  pageBreak.setTitle('Quantified improvement');

  logProgress('old metric');
  let oldMetric = form.addTextItem();
  oldMetric.setTitle(
    'What\'s the old performance metric number before improvements?');
  let numberValidation = FormApp.createTextValidation().requireNumber().build();
  oldMetric.setValidation(numberValidation);
  oldMetric.setRequired(true);

  logProgress('new metric');
  let newMetric = form.addTextItem();
  newMetric.setTitle(
    'What\'s the new performance metric number after improvements?');
  newMetric.setValidation(numberValidation);
  newMetric.setRequired(true);

  logProgress('unit');
  let unit = form.addTextItem();
  unit.setTitle('What\'s the unit of that quantified number (e.g., times, ' +
    'percent, frames, fps, KB, ms) ?');
  unit.setValidation(
    FormApp
      .createTextValidation().requireTextLengthLessThanOrEqualTo(10).build(),
  );
  unit.setRequired(true);

  logProgress('metric description');
  let metricDescription = form.addTextItem();
  metricDescription.setTitle('What\'s the number about? For example, ' +
    '"Gallery app size", "iOS average frame raster time".');

  logProgress('metric url');
  let metricUrl = form.addTextItem();
  metricUrl.setTitle(
    'Please enter a link that shows the quantified improvement number (e.g., ' +
    'commit description, comment, perf dashboard).',
  );
  metricUrl.setValidation(
    FormApp.createTextValidation().requireTextIsUrl().build());
  metricUrl.setRequired(true);
}

function createFrom(): GoogleAppsScript.Forms.Form {
  let folder = DriveApp.getFolderById(kNewsletterFolderId);
  let filename = `Performance Newsletter Item Form ${Date()}`;

  Logger.log("Creating %s", filename);
  let form = FormApp.create(filename);
  moveFile(form.getId(), folder);

  return form;
}

function logProgress(name: string) {
  // We can log more info such as x/y progress in the future.
  Logger.log(`Adding ${name}`);
}
