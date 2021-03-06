import {
  kCanonicalAt,
  kCommitShorteners,
  kIssueShorteners,
  kNewsletterFolderId,
  UrlRegexShortener,
} from "./config";

import {
  kSpreadsheetIdKey,
  kSheetName,
  kTimeUnits,
  kColTimestamp,
  kColShortDescription,
  kColLandDate,
  kColPerfArea,
  kColCommits,
  kColContributors,
  kColIssues,
  kColDocLink,
  kColIsQuantified,
  kColOldMetric,
  kColNewMetric,
  kColUnit,
  kColMetricDescription,
  kColMetricLink,
  kColCount,
  moveFile,
 } from "./util";

export function generateNewsletter(): GoogleAppsScript.Document.Document {
  let formResponses = readResponses();

  let doc = createDoc();
  let body = doc.getBody();
  let title = body.insertParagraph(0, 'Auto-generated Performance Newsletter');
  title.setHeading(DocumentApp.ParagraphHeading.TITLE);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  appendQuantifiedImprovements(body, formResponses);
  appendOtherImprovements(body, formResponses);
  doc.saveAndClose();

  return doc;
}

function appendOtherImprovements(
  body: GoogleAppsScript.Document.Body,
  formResponses: FormResponse[],
): void {
  let header = body.appendParagraph('Other improvements');
  header.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  for (var i = 0; i < formResponses.length; i += 1) {
    let formResponse = formResponses[i];
    if (formResponse.isQuantified) {
      continue;
    }

    let listItem = body.appendListItem(
      `[${formResponse.perfArea.toLowerCase()}] ` +
      `${formResponse.shortDescription}`,
    );
    appendAuthors(listItem, formResponse, false);
    appendCommitsSubItem(body, formResponse);
    appendIssuesSubItem(body, formResponse);
    appendDocLink(body, formResponse);

    // List item glyph types must be set in the end. Otherwise they might be
    // overwritten.
    listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
  }
}

function appendQuantifiedImprovements(
  body: GoogleAppsScript.Document.Body,
  formResponses: FormResponse[],
): void {
  let quantifiedHeader = body.appendParagraph('Quantified improvements');
  quantifiedHeader.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  for (var i = 0; i < formResponses.length; i += 1) {
    let formResopnse = formResponses[i];
    if (!formResopnse.isQuantified) {
      continue;
    }

    // Perf area and change percentage.
    let listItem = body.appendListItem(
      `[${formResopnse.perfArea.toLowerCase()}, `,
    );
    let changePercentage = computeChangePercentage(formResopnse);
    let formattedPercentage = `${abs(changePercentage).toFixed(1)}%`;
    let percentageText = listItem.appendText(` ${formattedPercentage} `);
    percentageText.setBackgroundColor('#0000ff'); // blue
    percentageText.setForegroundColor('#ffff00'); // yellow
    let closeBracketText = listItem.appendText(' ] ');
    closeBracketText.setBackgroundColor('#ffffff'); // sets back to white
    closeBracketText.setForegroundColor('#000000'); // sets back to black

    listItem.appendText(formResopnse.shortDescription);
    appendAuthors(listItem, formResopnse);
    appendCommitsSubItem(body, formResopnse);
    appendMetricSubItem(
      body, formResopnse, changePercentage, formattedPercentage,
    );
    appendIssuesSubItem(body, formResopnse);
    appendDocLink(body, formResopnse);

    // List item glyph types must be set in the end. Otherwise they might be
    // overwritten.
    listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
  }
}

class FormResponse {
  timestamp: string;
  email: string;
  shortDescription: string;
  landDate: string;
  perfArea: string;
  commits: string[];
  contributors: string[];
  issues: string[];
  docLink: string;
  isQuantified: boolean;
  oldMetric: number;
  newMetric: number;
  unit: string;
  metricDescription: string;
  metricLink: string;

  constructor(row: any[]) {
    if (row.length != kColCount) {
      throw `Row length ${row.length} does not match ` +
      `kColCount = ${kColCount} for row = ${row}`;
    }
    this.timestamp = row[kColTimestamp];
    this.shortDescription = row[kColShortDescription];
    this.landDate = row[kColLandDate];
    this.perfArea = row[kColPerfArea];
    this.commits = splitLines(row[kColCommits]);
    this.contributors = splitLines(row[kColContributors]);
    this.issues = splitLines(row[kColIssues]);
    this.docLink = row[kColDocLink];
    this.isQuantified = (row[kColIsQuantified] == 'Yes');
    this.oldMetric = parseFloat(row[kColOldMetric]);
    this.newMetric = parseFloat(row[kColNewMetric]);
    this.unit = row[kColUnit];
    this.metricDescription = row[kColMetricDescription];
    this.metricLink = row[kColMetricLink];
  }
}

function s(list: any[]): string { return list.length > 1 ? 's' : ''; }
function abs(x: number): number { return x < 0 ? -x : x; }

function splitLines(lines: string): string[] {
  return lines.split(/\r?\n/).filter((line: string) => line.trim() != '');
}

export function trimAt(s: string): string {
  return s.replace(kCanonicalAt, '@');
}

function shorten(url: string, shorteners: UrlRegexShortener[]) {
  for (var i in shorteners) {
    let short = shorteners[i].short(url);
    if (short != null) {
      return short;
    }
  }
  return null;
}

export function shortenCommit(commitUrl: string): string {
  let short = shorten(commitUrl, kCommitShorteners);
  if (short == null) {
    throw `Unrecognized commit url ${commitUrl}`;
  }
  return short;
}

export function shortenIssue(issueUrl: string): string {
  let short = shorten(issueUrl, kIssueShorteners);
  if (short == null) {
    throw `Unrecognized issue url ${issueUrl}`;
  }
  return short;
}

// May return positive or negative numbers for increasing or decreasing changes.
function computeChangePercentage(formResponse: FormResponse): number {
  var oldNum = formResponse.oldMetric;
  var newNum = formResponse.newMetric;
  if (kTimeUnits.includes(formResponse.unit)) {
    // For time metrics, return speedup instead of time reduction
    return (oldNum / newNum - 1) * 100;
  }
  return (newNum / oldNum - 1) * 100;
}

function createDoc(): GoogleAppsScript.Document.Document {
  let folder = DriveApp.getFolderById(kNewsletterFolderId);
  let filename = `Newsletter ${Date()}`;

  Logger.log("Creating %s", filename);
  let doc = DocumentApp.create(filename);
  moveFile(doc.getId(), folder);
  return doc;
}

function readResponses(): FormResponse[] {
  let spreadsheetId = PropertiesService.getUserProperties().getProperty(kSpreadsheetIdKey);
  if (spreadsheetId == null) {
    throw `No ${kSpreadsheetIdKey} property found. Please generate the form ` +
      `and its response spreadsheet first using generateNewsletterItemForm ` +
      `function.\n\nCurrent properties: ${JSON.stringify(PropertiesService.getUserProperties().getProperties())}`;
  }
  let ss = SpreadsheetApp.openById(spreadsheetId);
  let responseSheet = ss.getSheetByName(kSheetName);
  let range = responseSheet.getRange(
    2, 1, responseSheet.getMaxRows(), kColCount,
  );
  let responseValues = range.getValues();
  let formResponses = [];

  for (var r = 0; r < responseSheet.getMaxRows(); r += 1) {
    let row = responseValues[r];
    if (row.length == 0 || row[0] == "") {
      continue;
    }
    formResponses.push(new FormResponse(row));
    // Logger.log("row %d has %d columns", r, row.length);
    // Logger.log("  columns: %s", responseValues[r].join(', '));
  }
  return formResponses;
}

function appendAuthors(
  listItem: GoogleAppsScript.Document.ListItem,
  formResponse: FormResponse,
  highlighted = true,
): void {
  listItem.appendText('\n');
  let shortenedContributors = formResponse.contributors.map(trimAt);
  let authorsText = listItem.appendText(shortenedContributors.join(', '));
  authorsText.setItalic(true);
  if (highlighted) {
    authorsText.setBackgroundColor('#e2edff');
  }
}

function appendCommitsSubItem(
  body: GoogleAppsScript.Document.Body,
  formResponse: FormResponse,
): void {
  let commitsSubItem = body.appendListItem(`Commit${s(formResponse.commits)}:`);
  commitsSubItem.setNestingLevel(1);
  for (let i = 0; i < formResponse.commits.length; i += 1) {
    let separator = commitsSubItem.appendText(' ');
    let commitUrl = formResponse.commits[i];
    let commitText = commitsSubItem.appendText(`${shortenCommit(commitUrl)}`);
    commitText.setLinkUrl(commitUrl);
    separator.setLinkUrl(null);
  }
  commitsSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}

function appendMetricSubItem(
  body: GoogleAppsScript.Document.Body,
  formResponse: FormResponse,
  changePercentage: number,
  formattedPercentage: string,
): void {
  let isTime = kTimeUnits.includes(formResponse.unit);
  let increaseOrReduction = changePercentage > 0 ? 'increase' : 'reduction';
  let direction = isTime ? 'speedup' : increaseOrReduction;

  let metricSubItem =
    body.appendListItem(`${formattedPercentage} ${direction} (`);
  metricSubItem.setNestingLevel(1);
  let detailedMetrics = metricSubItem.appendText(
    `${formResponse.oldMetric} ${formResponse.unit} ` +
    `to ${formResponse.newMetric} ${formResponse.unit}`,
  );
  detailedMetrics.setLinkUrl(formResponse.metricLink);
  let descriptionText =
    metricSubItem.appendText(`) in ${formResponse.metricDescription}.`);
  descriptionText.setLinkUrl(null);

  metricSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}

function appendIssuesSubItem(
  body: GoogleAppsScript.Document.Body,
  formResponse: FormResponse,
): void {
  if (formResponse.issues.length == 0) {
    return;
  }
  let issuesSubItem = body.appendListItem('Related issues: ');
  issuesSubItem.setNestingLevel(1);
  for (var i in formResponse.issues) {
    let issue = formResponse.issues[i];
    let issueText = issuesSubItem.appendText(shortenIssue(issue));
    issueText.setLinkUrl(issue);
    let space = issuesSubItem.appendText(' ');
    space.setLinkUrl(null);
  }
  issuesSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}

function appendDocLink(
  body: GoogleAppsScript.Document.Body,
  formResponse: FormResponse,
): void {
  if (formResponse.docLink == null || formResponse.docLink.trim() == '') {
    return;
  }
  let docLinkSubItem = body.appendListItem(formResponse.docLink);
  docLinkSubItem.setLinkUrl(formResponse.docLink);
  docLinkSubItem.setNestingLevel(1);
  docLinkSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}
