import {
  kCommitsRegex,
  kFormDescription,
  kIssuesRegex,
  kNewsletterFolderId,
  kPerfAreas,
} from "./config";

import { kColCount, kFormIdKey, kSpreadsheetIdKey, moveFile } from "./util";

// Helper class so we can send in count by reference instead of by value.
class ItemCounter {
  count: number;

  constructor() { this.count = 0; }
}

export function generateNewsletterItemForm(): void {
  let form = createForm();
  form.setDescription(kFormDescription);
  let counter = new ItemCounter();
  addGeneralSection(form, counter);
  addQuantifiedSection(form, counter);
  if (counter.count != expectedItemCount()) {
    throw `${expectedItemCount()} form items expected, ` +
      `but ${counter.count} are added`;
  }
}

// Minus 1 column: timestamp
function expectedItemCount(): number { return kColCount - 1; }

function addGeneralSection(
  form: GoogleAppsScript.Forms.Form,
  counter: ItemCounter,
): void {
  logItem('one line text', counter);
  let oneLineText = form.addTextItem();
  oneLineText.setTitle(
    'Please give a one-line description of the improvement.',
  );
  oneLineText.setRequired(true);

  logItem('date landed', counter);
  let dateLanded = form.addDateItem();
  dateLanded.setTitle('What\'s the date when this improvement landed?');
  dateLanded.setRequired(true);

  logItem('perf areas', counter);
  let perfAreas = form.addCheckboxItem();
  perfAreas.setTitle('What performance areas does this improvement affect?');
  perfAreas.setChoices(kPerfAreas.map((a) => perfAreas.createChoice(a)));
  perfAreas.showOtherOption(true);
  perfAreas.setRequired(true);

  logItem('commits', counter);
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

  logItem('first author', counter);
  let firstAuthor = form.addTextItem();
  firstAuthor.setTitle(
    'Who is the main author of this improvement? Please enter an email or a ' +
    'Github id.',
  );
  firstAuthor.setRequired(true);

  logItem('other authors', counter);
  let otherAuthors = form.addParagraphTextItem();
  otherAuthors.setTitle(
    'Who are other contributors (code authors, code reviewers, issue ' +
    'reporters, etc.) to this improvement? Please enter one email or Github '+
    'id per line.',
  );

  logItem('issues', counter);
  let issuesText = form.addParagraphTextItem();
  issuesText.setTitle(
    'What issues are related with this improvement? ' +
    'Please enter one issue URL per line.',
  );
  let issuesTextValidation = FormApp.createParagraphTextValidation();
  issuesTextValidation.requireTextMatchesPattern(kIssuesRegex.source);
  issuesTextValidation.setHelpText(`Must match regex ${kIssuesRegex}`);
  issuesText.setValidation(issuesTextValidation.build());

  logItem('doc', counter);
  let docText = form.addTextItem();
  docText.setTitle(
    'If there\'s a design doc, a webpage, or a wiki article ' +
    'related with this improvement, please enter its URL here. For example, ' +
    'http://go/analyticaa and http://flutter.dev/go/clip-behavior.',
  );
  docText.setValidation(
    FormApp.createTextValidation().requireTextIsUrl().build());

  logItem('quantified choice', counter);
  let quantifiedChoice = form.addMultipleChoiceItem();
  quantifiedChoice.setTitle('Is this performance improvement quantified?');
  let yesChoice = quantifiedChoice.createChoice(
    'Yes', FormApp.PageNavigationType.CONTINUE);
  let noChoice = quantifiedChoice.createChoice(
    'No', FormApp.PageNavigationType.SUBMIT);
  quantifiedChoice.setChoices([yesChoice, noChoice]);
  quantifiedChoice.setRequired(true);
}

function addQuantifiedSection(
  form: GoogleAppsScript.Forms.Form,
  counter: ItemCounter,
): void {
  let pageBreak = form.addPageBreakItem();
  pageBreak.setTitle('Quantified improvement');

  logItem('old metric', counter);
  let oldMetric = form.addTextItem();
  oldMetric.setTitle(
    'What\'s the old performance metric number before improvements?');
  let numberValidation = FormApp.createTextValidation().requireNumber().build();
  oldMetric.setValidation(numberValidation);
  oldMetric.setRequired(true);

  logItem('new metric', counter);
  let newMetric = form.addTextItem();
  newMetric.setTitle(
    'What\'s the new performance metric number after improvements?');
  newMetric.setValidation(numberValidation);
  newMetric.setRequired(true);

  logItem('unit', counter);
  let unit = form.addTextItem();
  unit.setTitle('What\'s the unit of that quantified number (e.g., times, ' +
    'percent, frames, fps, KB, ms) ?');
  unit.setValidation(
    FormApp
      .createTextValidation().requireTextLengthLessThanOrEqualTo(10).build(),
  );
  unit.setRequired(true);

  logItem('metric description', counter);
  let metricDescription = form.addTextItem();
  metricDescription.setTitle('What\'s the number about? For example, ' +
    '"Gallery app size", "iOS average frame raster time".');

  logItem('metric url', counter);
  let metricUrl = form.addTextItem();
  metricUrl.setTitle(
    'Please enter a link that shows the quantified improvement number (e.g., ' +
    'commit description, comment, perf dashboard).',
  );
  metricUrl.setValidation(
    FormApp.createTextValidation().requireTextIsUrl().build());
  metricUrl.setRequired(true);
}

function createForm(): GoogleAppsScript.Forms.Form {
  let date = Date();
  let folder = DriveApp.getFolderById(kNewsletterFolderId);
  let filename = `Performance Newsletter Item Form ${date}`;
  let spreadsheetName = `Item Responses ${date}`;

  Logger.log('Creating %s', filename);
  let form = FormApp.create(filename);
  moveFile(form.getId(), folder);

  Logger.log('Creating %s', spreadsheetName);
  let spreadsheet = SpreadsheetApp.create(spreadsheetName);
  moveFile(spreadsheet.getId(), folder);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  let propertyMap = {};
  propertyMap[kFormIdKey] = form.getId();
  propertyMap[kSpreadsheetIdKey] = spreadsheet.getId();
  PropertiesService.getUserProperties().setProperties(propertyMap);
  Logger.log(
    `Form ${form.getId()} created with responses in ${spreadsheet.getId()}.`);
  return form;
}

function logItem(name: string, counter: ItemCounter) {
  // We can log more info such as x/y progress in the future.
  Logger.log(`Adding ${name} (${++counter.count}/${expectedItemCount()})`);
}
