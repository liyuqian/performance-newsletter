import { kGoldNewsletterPdfId, kNewsletterFolderId } from './config';
import { generateNewsletter } from './doc';
import { generateNewsletterItemForm } from './form';
import { kFormIdKey, moveFile } from './util';

enum TestStep {
  GenerateForm,
  FillItems,
  GenerateDoc,
};

// TODO Create a CI to run this on Github continuously.

function runAllIntegrationTests(
  startFrom: TestStep = TestStep.GenerateForm,
): string {
  if (startFrom <= TestStep.GenerateForm) {
    generateNewsletterItemForm();
  }

  if (startFrom <= TestStep.FillItems) {
    let formId = PropertiesService.getUserProperties().getProperty(kFormIdKey);
    let form = FormApp.openById(formId);
    let items = form.getItems();
    for (var i = 0; i < kTestInputs.length; i += 1) {
      Logger.log(`Filling response ${i}`);
      let response = form.createResponse();
      let inputList = kTestInputs[i];
      for (var j = 0; j < inputList.length; j += 1) {
        if (kItemTypes[j] != 'break') {
          Logger.log(`  Filling item ${j}`);
          let itemResponse = createItemResponse(items[j], j, inputList[j]);
          response.withItemResponse(itemResponse);
        }
      }
      response.submit();
    }
  }

  let newsletter = generateNewsletter();
  let folder = DriveApp.getFolderById(kNewsletterFolderId);
  let pdfFile = exportPdf(newsletter);
  moveFile(pdfFile.getId(), folder);

  let goldFile = DriveApp.getFileById(kGoldNewsletterPdfId);
  let goldBytes = goldFile.getBlob().getBytes();
  let pdfBytes = pdfFile.getBlob().getBytes();

  if (goldBytes.length != pdfBytes.length) {
    throw `Gold file and pdf file have different sizes: ` +
      `${goldBytes.length} != ${pdfBytes.length}`;
  }

  var diffCount: number = 0;
  for (var i = 0; i < goldBytes.length; i += 1) {
    if (goldBytes[i] != pdfBytes[i]) {
      diffCount += 1;
    }
  }

  // Allow at most 1024 bytes to differ as they may include time information or
  // other variable headers when the PDF is printed.
  if (diffCount > 1024) {
    throw `Gold file and pdf file differ by ${diffCount} bytes!`;
  }

  Logger.log(
    `Successfully matched the exported PDF with ${goldFile.getName()}`);

  return  'All integration tests ran successfully.';
}

function exportPdf(doc: GoogleAppsScript.Document.Document) {
  let exportUrl =
    `https://docs.google.com/document/d/${doc.getId()}/export?exportFormat=pdf`;
  Logger.log(`Exporting pdf through ${exportUrl}`)
  let response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      Authorization: 'Bearer ' +  ScriptApp.getOAuthToken(),
    },
  });
  return DriveApp.createFile(response.getBlob());
}

const kTestInputs = [
  [
    '75% memory reduction for grid view of memory intensive widgets',
    '7/8/2020',
    'Memory',
    [
      'https://github.com/flutter/flutter/commit/a9ea825abf50b60bed5ec9b218d9f4cb1a2f839e',
      'https://github.com/flutter/flutter/commit/5969eb60ec267186c2f19d1301741d6d3c1dabc1',
    ].join('\n'),
    'xyz123@google.com',
    [
      'abc123@google.com',
      'abc456@google.com',
    ].join('\n'),
    'https://github.com/flutter/flutter/issues/61006',
    '',
    'Yes',
    '', // page break
    '1177721',
    '195432',
    'Bytes',
    'memory usage in the grid view of memory intensive widgets',
    'https://flutter-flutter-perf.skia.org/e/?begin=1594191600&end=1594364400&queries=sub_result%3Ddiff-max%26sub_result%3Ddiff-median%26sub_result%3Ddiff-min%26test%3Dfast_scroll_heavy_gridview__memory&requestType=0',
  ],
  [
    'Add A/B test mode to local devicelab runner',
    '5/8/2020',
    'Speed, Memory, App size, Energy',
    [
      'https://github.com/flutter/flutter/commit/d119e5f1e427893209afa1fc6390d589fbdfe2c1',
      'https://github.com/flutter/flutter/commit/3519bec6c4c0ef0025a31fe103ef4d5f4951ab8a',
      'https://github.com/flutter/flutter/commit/20803507fdb1df577bae22d460c39369511d676d',
    ].join('\n'),
    'y123@google.com',
    [
      'j123@google.com',
      'f123@google.com',
      'f456@google.com',
      'l123@google.com',
    ].join('\n'),
    '',
    '',
    'No',
  ],
  [
    'Fixed “iOS App Size in FAQ incorrect”',
    '5/11/2020',
    'App size',
    'https://github.com/flutter/website/commit/1f62b1f3a4ece28fff92c1513194ad77ab7c1df7',
    'm123@google.com',
    [
      'x123@google.com',
      'd123@google.com',
      's123@google.com',
    ].join('\n'),
    'https://github.com/flutter/flutter/issues/38016',
    '',
    'No',
  ],
  [
    'Timeline summary now includes CPU/GPU/memory for iOS',
    '6/15/2020',
    'Memory, Energy',
    [
      'https://github.com/flutter/engine/commit/ca2a370578c2685a6f5fab1e4f17b4331c461e1c',
      'https://github.com/flutter/engine/commit/21875230932ffeb87a9098ff97bf129fd804e3ac',
      'https://github.com/flutter/engine/commit/ede658e2d1e976152370f404b6cff874f42a6611',
    ].join('\n'),
    'k123@google.com',
    [
      'a123@google.com',
      'a456@google.com',
      'l123@google.com',
      'c123@google.com',
      'w123@google.com',
    ].join('\n'),
    'https://github.com/flutter/flutter/issues/58803',
    'http://flutter.dev/go/engine-cpu-profiling',
    'No',
  ],
];

const kItemTypes = [
  'text',
  'date',
  'checkbox',
  'paragraph',
  'text',
  'paragraph',
  'paragraph',
  'text',
  'choice',
  'break',
  'text',
  'text',
  'text',
  'text',
  'text',
];

function createItemResponse(
  item: GoogleAppsScript.Forms.Item,
  itemIndex: number,
  value: string,
): GoogleAppsScript.Forms.ItemResponse {
  switch (kItemTypes[itemIndex]) {
    case 'text':
      return item.asTextItem().createResponse(value);
    case 'date':
      return item.asDateItem().createResponse(new Date(value));
    case 'checkbox':
      return item.asCheckboxItem().createResponse(value.split(', '));
    case 'paragraph':
      return item.asParagraphTextItem().createResponse(value);
    case 'choice':
      return item.asMultipleChoiceItem().createResponse(value);
  }
  throw `Unhandled item type ${kItemTypes[itemIndex]}`;
}
