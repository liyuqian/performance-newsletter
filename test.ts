import {shortenIssue, shortenCommit} from './doc';
import { kCommitsRegex, kIssuesRegex } from './regex';

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
    'https://dart.googlesource.com/sdk/+/5b8c4e8024220c31d4c814f3a74e4c54325bdc33': '5b8c4e8',
    'https://critique-ng.corp.google.com/cl/333841120': 'cl/333841120',
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
    'https://bugs.chromium.org/p/skia/issues/detail?id=10951&q=flutter&can=2&sort=-id';  // TODO $
  if (!testIssues.match(kIssuesRegex)) {
    throw `Failed to match issues:\n${testIssues}`;
  }

  let badIssues = testIssues + '\n' + 'SomethingBad';
  if (badIssues.match(kIssuesRegex)) {
    throw `Failed to catch bad issues:\n${badIssues}`;
  }

  let testCommits =
    'https://github.com/flutter/flutter/commit/a9ea825abf50b60bed5ec9b218d9f4cb1a2f839e\n' +
    'https://dart.googlesource.com/sdk/+/88ec09f653a6fccbddc62aa17d3bc84b5f4a859f\n' +
    'https://fuchsia.googlesource.com/topaz/+/e28c8beaca82998396aacbd37a03942892654e2b\n' +
    'cl/293363020\n' +
    'http://cl/293363020\n' +
    'https://critique-ng.corp.google.com/cl/333841120';
  if (!testCommits.match(kCommitsRegex)) {
    throw `Failed to match commits:\n${testCommits}`;
  }

  let badCommits = testCommits + '\n' + 'SomethingBad';
  if (badCommits.match(kCommitsRegex)) {
    throw `Failed to catch bad commits:\n${badCommits}`;
  }
}
