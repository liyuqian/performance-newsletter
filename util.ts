export {
  kFormIdKey,
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
const kColShortDescription = 1;
const kColLandDate = 2;
const kColPerfArea = 3;
const kColCommits = 4;
const kColContributors = 5;
const kColIssues = 6;
const kColDocLink = 7;
const kColIsQuantified = 8;
const kColOldMetric = 9;
const kColNewMetric = 10;
const kColUnit = 11;
const kColMetricDescription = 12;
const kColMetricLink = 13;
const kColCount = 14;
