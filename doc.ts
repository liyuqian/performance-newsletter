// TODO script to validate form input and preview result?

import {
  kCommitShorteners,
  kFormSpreadsheetId,
  kIssueShorteners,
  kNewsletterFolderId,
  UrlRegexShortener,
} from "./config";

function generateNewsletter() {
  let responseItems = readResponses();

  let doc = createDoc();
  let body = doc.getBody();
  let title = body.insertParagraph(0, 'Auto-generated Performance Newsletter');
  title.setHeading(DocumentApp.ParagraphHeading.TITLE);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  appendQuantifiedItems(body, responseItems);
  appendOtherItems(body, responseItems);
}

function appendOtherItems(
  body: GoogleAppsScript.Document.Body,
  responseItems: ResponseItem[],
): void {
  let header = body.appendParagraph('Other improvements');
  header.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  for (var i = 0; i < responseItems.length; i += 1) {
    let responseItem = responseItems[i];
    if (responseItem.isQuantified) {
      continue;
    }

    let listItem = body.appendListItem(
      `[${responseItem.perfArea.toLowerCase()}] ` +
      `${responseItem.shortDescription}`,
    );
    appendAuthors(listItem, responseItem, false);
    appendCommitsSubItem(body, responseItem);
    appendIssuesSubItem(body, responseItem);
    appendDocLink(body, responseItem);

    // List item glyph types must be set in the end. Otherwise they might be
    // overwritten.
    listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
  }
}

function appendQuantifiedItems(
  body: GoogleAppsScript.Document.Body,
  responseItems: ResponseItem[],
): void {
  let quantifiedHeader = body.appendParagraph('Quantified improvements');
  quantifiedHeader.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  for (var i = 0; i < responseItems.length; i += 1) {
    let responseItem = responseItems[i];
    if (!responseItem.isQuantified) {
      continue;
    }

    // Perf area and change percentage.
    let listItem = body.appendListItem(
      `[${responseItem.perfArea.toLowerCase()}, `,
    );
    let changePercentage = computeChangePercentage(responseItem);
    let formattedPercentage = `${abs(changePercentage).toFixed(1)}%`;
    let percentageText = listItem.appendText(` ${formattedPercentage} `);
    percentageText.setBackgroundColor('#0000ff'); // blue
    percentageText.setForegroundColor('#ffff00'); // yellow
    let closeBracketText = listItem.appendText(' ] ');
    closeBracketText.setBackgroundColor('#ffffff'); // sets back to white
    closeBracketText.setForegroundColor('#000000'); // sets back to black

    listItem.appendText(responseItem.shortDescription);
    appendAuthors(listItem, responseItem);
    appendCommitsSubItem(body, responseItem);
    appendMetricSubItem(
      body, responseItem, changePercentage, formattedPercentage,
    );
    appendIssuesSubItem(body, responseItem);
    appendDocLink(body, responseItem);

    // List item glyph types must be set in the end. Otherwise they might be
    // overwritten.
    listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
  }
}

class ResponseItem {
  timestamp: string;
  email: string;
  shortDescription: string;
  landDate: string;
  perfArea: string;
  commits: string[];
  firstAuthor: string;
  otherAuthors: string[];
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
    this.email = row[kColEmail];
    this.shortDescription = row[kColShortDescription];
    this.landDate = row[kColLandDate];
    this.perfArea = row[kColPerfArea];
    this.commits = splitLines(row[kColCommits]);
    this.firstAuthor = row[kColFirstAuthor];
    this.otherAuthors = splitLines(row[kColOtherAuthors]);
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

function splitLines(lines): string[] {
  return lines.split(/\r?\n/).filter((line: string) => line.trim() != '');
}

function trimAtGoogle(s: string): string {
  return s.replace('@google.com', '@').replace('@google', '@');
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
function computeChangePercentage(responseItem: ResponseItem): number {
  var oldNum = responseItem.oldMetric;
  var newNum = responseItem.newMetric;
  if (kTimeUnits.includes(responseItem.unit)) {
    // For time metrics, return speedup instead of time reduction
    return (oldNum / newNum - 1) * 100;
  }
  return (newNum / oldNum - 1) * 100;
}

function createDoc(): GoogleAppsScript.Document.Document {
  let folder = DriveApp.getFolderById(kNewsletterFolderId);
  let filename = `Generated Newsletter ${Date()}`;

  Logger.log("Creating %s", filename);
  let doc = DocumentApp.create(filename);
  let docFile = DriveApp.getFileById(doc.getId());
  Logger.log(`Adding ${filename} to folder ${folder.getName()}`)
  folder.addFile(docFile);
  let parentIterator = docFile.getParents();
  while (parentIterator.hasNext()) {
    let parent = parentIterator.next();
    if (parent.getId() != folder.getId()) {
      Logger.log(`Removing ${filename} from folder ${parent.getName()}`)
      parent.removeFile(docFile);
    }
  }
  return doc;
}

function readResponses(): ResponseItem[] {
  let ss = SpreadsheetApp.openById(kFormSpreadsheetId);
  let responseSheet = ss.getSheetByName(kSheetName);
  let range = responseSheet.getRange(
    2, 1, responseSheet.getMaxRows(), kColCount,
  );
  let responseValues = range.getValues();
  let responseItems = [];

  for (var r = 0; r < responseSheet.getMaxRows(); r += 1) {
    let row = responseValues[r];
    if (row.length == 0 || row[0] == "") {
      continue;
    }
    responseItems.push(new ResponseItem(row));
    // Logger.log("row %d has %d columns", r, row.length);
    // Logger.log("  columns: %s", responseValues[r].join(', '));
  }
  return responseItems;
}

function appendAuthors(
  listItem: GoogleAppsScript.Document.ListItem,
  responseItem: ResponseItem,
  highlighted = true,
): void {
  listItem.appendText('\n');
  let allAuthors = [responseItem.firstAuthor].concat(responseItem.otherAuthors);
  let shortenedAuthors = allAuthors.map(trimAtGoogle);
  let authorsText = listItem.appendText(shortenedAuthors.join(', '));
  authorsText.setItalic(true);
  if (highlighted) {
    authorsText.setBackgroundColor('#e2edff');
  }
}

function appendCommitsSubItem(
  body: GoogleAppsScript.Document.Body,
  responseItem: ResponseItem,
): void {
  let commitsSubItem = body.appendListItem(`Commit${s(responseItem.commits)}:`);
  commitsSubItem.setNestingLevel(1);
  for (let i = 0; i < responseItem.commits.length; i += 1) {
    let separator = commitsSubItem.appendText(' ');
    let commitUrl = responseItem.commits[i];
    let commitText = commitsSubItem.appendText(`${shortenCommit(commitUrl)}`);
    commitText.setLinkUrl(commitUrl);
    separator.setLinkUrl(null);
  }
  commitsSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}

function appendMetricSubItem(
  body: GoogleAppsScript.Document.Body,
  responseItem: ResponseItem,
  changePercentage: number,
  formattedPercentage: string,
): void {
  let isTime = kTimeUnits.includes(responseItem.unit);
  let increaseOrReduction = changePercentage > 0 ? 'increase' : 'reduction';
  let direction = isTime ? 'speedup' : increaseOrReduction;

  let metricSubItem =
    body.appendListItem(`${formattedPercentage} ${direction} (`);
  metricSubItem.setNestingLevel(1);
  let detailedMetrics = metricSubItem.appendText(
    `${responseItem.oldMetric} ${responseItem.unit} ` +
    `to ${responseItem.newMetric} ${responseItem.unit}`,
  );
  detailedMetrics.setLinkUrl(responseItem.metricLink);
  let descriptionText =
    metricSubItem.appendText(`) in ${responseItem.metricDescription}.`);
  descriptionText.setLinkUrl(null);

  metricSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}

function appendIssuesSubItem(
  body: GoogleAppsScript.Document.Body,
  responseItem: ResponseItem,
): void {
  if (responseItem.issues.length == 0) {
    return;
  }
  let issuesSubItem = body.appendListItem('Related issues: ');
  issuesSubItem.setNestingLevel(1);
  for (var i in responseItem.issues) {
    let issue = responseItem.issues[i];
    let issueText = issuesSubItem.appendText(shortenIssue(issue));
    issueText.setLinkUrl(issue);
    let space = issuesSubItem.appendText(' ');
    space.setLinkUrl(null);
  }
  issuesSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}

function appendDocLink(
  body: GoogleAppsScript.Document.Body,
  responseItem: ResponseItem,
): void {
  if (responseItem.docLink == null || responseItem.docLink.trim() == '') {
    return;
  }
  let docLinkSubItem = body.appendListItem(responseItem.docLink);
  docLinkSubItem.setLinkUrl(responseItem.docLink);
  docLinkSubItem.setNestingLevel(1);
  docLinkSubItem.setGlyphType(DocumentApp.GlyphType.HOLLOW_BULLET);
}

const kSheetName = 'responses';
const kTimeUnits = ['second', 'seconds', 's', 'ms', 'us', 'ns'];

const kColTimestamp = 0;
const kColEmail = 1;
const kColShortDescription = 2;
const kColLandDate = 3;
const kColPerfArea = 4;
const kColCommits = 5;
const kColFirstAuthor = 6;
const kColOtherAuthors = 7;
const kColIssues = 8;
const kColDocLink = 9;
const kColIsQuantified = 10;
const kColOldMetric = 11;
const kColNewMetric = 12;
const kColUnit = 13;
const kColMetricDescription = 14;
const kColMetricLink = 15;
const kColCount = 16;
