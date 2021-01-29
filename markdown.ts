import { kAuthorMapId, kMarkdownInputDocId, kNewsletterFolderId } from "./config";
import { moveFile } from "./util";

/*

Convert a auto-generated performance newsletter Google doc into a markdown file.

The converted file is especially tailored to Medium.com so one can copy/paste
the rendered markdown directly into Medium.com without headaches. For example,
the markdown would only have a single level of bullet points as Medium doesn't
support multi-level bullets. (Directly copying from Google doc, docx, or pdf to
Medium is problematic even if the bullets only have one level.)

Modify the kMarkdownInputDocId and kAuthorMapId in config.ts for your own run.
(Google App Script doesn't seem provide a good mechanism to pass arguments to a
function run.)

The output markdown file is put under the folder of kNewsletterFolderId
(specified in config.ts).

*/
function convertToMarkdown(): void {
  let nameMap = readUserNameMap(kAuthorMapId);
  let doc = DocumentApp.openById(kMarkdownInputDocId);
  let body = doc.getBody();
  let paragraphs = body.getParagraphs();

  var result: string = '';
  var level1ListItemBefore: boolean = false;

  for (var i = 0; i < paragraphs.length; i += 1) {
    let p = paragraphs[i];
    let numChildren = p.getNumChildren();

    Logger.log(`p-${i} (${p.getType()}) with ${numChildren} children.`);

    switch (numChildren) {
      case 0: {
        // Only start a new paragraph if the previous isn't a level 1 list item.
        result += level1ListItemBefore ? '' : '\n';
        break;
      }
      case 1: {
        let child = p.getChild(0);
        if (child.getType() != DocumentApp.ElementType.TEXT) {
          throw `Unexpected child type ${child.getType()}`;
        }
        // The first line after each level 0 item (performance improvement) is
        // always a list of authors.
        let childMarkdown = textToMarkdown(child);
        let prefix = convertParagraphHeading(p);
        if (prefix == '####') {
          childMarkdown = linkAuthors(childMarkdown, nameMap);
        }
        result += `${prefix} ${childMarkdown}\n`;
        level1ListItemBefore = (prefix == '-');
        break;
      }
      default: {
        throw `Unexpected children number for p-${i} (${p.getType()}) with `
            + `${p.getNumChildren()} children.`;
      }
    }
  }

  let file = DriveApp.createFile(`${doc.getName()}.md`, result);
  let folder = DriveApp.getFolderById(kNewsletterFolderId);
  moveFile(file.getId(), folder);
  Logger.log(`${file.getName()} created.`);
}

function linkAuthors(
  markdown: string,
  nameMap: {[key: string]: string},
): string {
  const kGithubSuffix = '@github';
  let lines = markdown.split(/\r|\n/);
  if (lines.length != 2) {
    throw `Unexpected ${lines.length} lines for ${JSON.stringify(markdown)}`;
  }
  let list = lines[1].split(',').map((s: string) => s.trim());
  let linkedAuthors: string[] = [];
  for (var i = 0; i < list.length; i += 1) {
    let author = list[i];
    var githubHandle: string = null;
    if (author.endsWith(kGithubSuffix)) {
      githubHandle = author.replace(kGithubSuffix, '');
    } else {
      let handle = author.endsWith('@') ? author.replace('@', '') : author;
      if (nameMap[handle] !== undefined && nameMap[handle] != 'not found') {
        githubHandle = nameMap[handle];
      }
    }
    if (githubHandle) {
      linkedAuthors.push(`[${githubHandle}](https://github.com/${githubHandle})`);
    } else {
      linkedAuthors.push(author);
    }
  }
  return lines[0] + '\ncontributors: ' + linkedAuthors.join(', ');
}

function readUserNameMap(
  spreadsheetId: string,
): {[key: string]: string} {
  let result = {};
  let spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getActiveSheet();
  let range = sheet.getDataRange();
  for (var r = 1; r <= range.getNumRows(); r += 1) {
    result[range.getCell(r, 1).getValue()] = range.getCell(r, 2).getValue();
  }
  return result;
}

function convertParagraphHeading(
  p: GoogleAppsScript.Document.Paragraph,
): string {
  switch (p.getType()) {
    case DocumentApp.ElementType.PARAGRAPH: {
      switch (p.getHeading()) {
        case DocumentApp.ParagraphHeading.TITLE: return '#';
        case DocumentApp.ParagraphHeading.HEADING1: return '##';
        case DocumentApp.ParagraphHeading.HEADING2: return '###';
        case DocumentApp.ParagraphHeading.NORMAL: return '';
        default: throw `Unexpected ParagraphHeading ${p.getHeading()}`;
      }
      break;
    }
    case DocumentApp.ElementType.LIST_ITEM: {
      let listItem = p.asListItem();
      let level = listItem.getNestingLevel();
      if (level > 1) {
        throw `Unexpected list item level ${level}: ${p.getText()}`;
      }
      return level == 0 ? '####' : '-';
    }
    default: throw `Unexpected paragraph type ${p.getType()}`;
  }
}

function textToMarkdown(element: GoogleAppsScript.Document.Element): string {
  let text = element.asText();
  let textString = text.getText();
  var lastUrl: string = null;
  var urlStart: number = -1;
  var result: string = '';
  for (var i = 0; i < textString.length; i += 1) {
    let thisUrl = text.getLinkUrl(i);
    if (thisUrl == lastUrl) {
      continue;
    }
    if (lastUrl != null) {
      result += `[${textString.substring(urlStart, i)}](${lastUrl})`;
    } else {
      result += textString.substring(urlStart, i);
    }
    lastUrl = thisUrl;
    urlStart = i;
  }
  if (lastUrl != null) {
    result += `[${textString.substring(urlStart, i)}](${lastUrl})`;
  } else {
    result += textString.substring(urlStart);
  }
  return result;
}
