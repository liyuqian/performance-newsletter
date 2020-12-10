export {
  kFormIdKey,
  kSpreadsheetIdKey,
  kSheetName,
  kTimeUnits,
  kColTimestamp,
  kColEmail,
  kColShortDescription,
  kColLandDate,
  kColPerfArea,
  kColCommits,
  kColFirstAuthor,
  kColOtherAuthors,
  kColIssues,
  kColDocLink,
  kColIsQuantified,
  kColOldMetric,
  kColNewMetric,
  kColUnit,
  kColMetricDescription,
  kColMetricLink,
  kColCount,
};

export function moveFile(
  fileId: string, folder: GoogleAppsScript.Drive.Folder,
): void {
  let file = DriveApp.getFileById(fileId);
  Logger.log(`Adding ${file.getName()} to folder ${folder.getName()}`)
  folder.addFile(file);
  let parentIterator = file.getParents();
  while (parentIterator.hasNext()) {
    let parent = parentIterator.next();
    if (parent.getId() != folder.getId()) {
      Logger.log(`Removing ${file.getName()} from folder ${parent.getName()}`)
      parent.removeFile(file);
    }
  }
}

// Property key for the current performance item form id.
const kFormIdKey = 'FORM_ID';

// Property key for spreadsheet id that saves the current form's responses.
const kSpreadsheetIdKey = 'SPREADSHEET_ID';

const kSheetName = 'Form Responses 1';
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
