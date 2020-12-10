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

export {kFormIdKey, kSpreadsheetIdKey as kSpreadsheetIdKey};
