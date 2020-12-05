import {shortenIssue, shortenCommit, kIssuesRegex} from './doc';

function testAll(): void {
  testShortenIssue();
  testShortenCommit();
  testRegex();
}

function testShortenIssue(): void {
  let urlToExpectedAnswer = {
    'https://github.com/dart-lang/sdk/issues/41704': '#41704',
    'https://github.com/flutter/flutter/issues/54507': '#54507',
    'https://b.corp.google.com/issues/143774406': 'b/143774406',
    'https://b.corp.google.com/143774406': 'b/143774406',
    'http://b/143774406': 'b/143774406',
    'https://bugs.chromium.org/p/skia/issues/detail?id=10951&q=flutter&can=2&sort=-id': '10951'
  };

  for (var issueUrl in urlToExpectedAnswer) {
    let answer = shortenIssue(issueUrl);
    if (answer != urlToExpectedAnswer[issueUrl]) {
      throw `${answer} != ${urlToExpectedAnswer[issueUrl]}`;
    }
  }
}

function testShortenCommit(): void {
  let urlToExpectedAnswer = {
    'https://github.com/flutter/flutter/commit/a9ea825abf50b60bed5ec9b218d9f4cb1a2f839e': 'a9ea825',
    'https://dart.googlesource.com/sdk/+/5b8c4e8024220c31d4c814f3a74e4c54325bdc33': '5b8c4e8'
  };
  for (var commitUrl in urlToExpectedAnswer) {
    let answer = shortenCommit(commitUrl);
    if (answer != urlToExpectedAnswer[commitUrl]) {
      throw `${answer} != ${urlToExpectedAnswer[commitUrl]}`;
    }
  }
}

function testRegex(): void {
  let testIssues =
    'https://github.com/dart-lang/sdk/issues/41704\n' +
    'https://github.com/flutter/flutter/issues/54507\n' +
    'https://b.corp.google.com/issues/143774406\n' +
    'https://b.corp.google.com/143774406\n' +
    'http://b/143774406\n' +
    'b/143774406\n' +
    'https://bugs.chromium.org/p/skia/issues/detail?id=10951&q=flutter&can=2&sort=-id';
  if (!testIssues.match(kIssuesRegex)) {
    throw `Failed to match issues:\n${testIssues}`;
  }
}
