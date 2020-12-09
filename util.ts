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
