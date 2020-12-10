// For your specific performance newsletters, please modify the following
// configurations in the export appropriately.
export {
  kNewsletterFolderId,
  kIssueShorteners,
  kCommitShorteners,
  kIssuesRegex,
  kCommitsRegex,
  kCanonicalAt,
  kFormDescription,
  kPerfAreas,
};

// The Google drive folder id to host all performance newsletter related docs,
// forms, spreadsheets, and so on.
const kNewsletterFolderId = '1AlHARId6KQs4npX5SA-9KDuKBtRfiJqm';

// We'll trim `xyz${kCanonicalAt}` to `xyz@`.
//
// For example, 'liyuqian@google.com' to 'liyuqian@', and 'liyuqian@google'
// to 'liyuqian@'.
const kCanonicalAt = /@google(.com)?/;

// A class that shortens a full URL that matches a pattern.
export class UrlRegexShortener {
  pattern: RegExp;
  shorten: (m: RegExpMatchArray) => string;

  constructor(pattern: string, shorten: (m: RegExpMatchArray) => string) {
    this.pattern = RegExp(pattern);
    this.shorten = shorten;
  }

  // Return null if url does not match pattern.
  short(url: string): string {
    let match = url.match(this.pattern);
    if (match == null) {
      return null;
    }
    return this.shorten(match);
  }
}

const kHttpProtocol = '(http[s]?://)?';

// Issue url regex patterns and their shortened forms (e.g., issue number).
const kIssueShorteners: UrlRegexShortener[] = [
  new UrlRegexShortener(
    `${kHttpProtocol}b.corp.google.com\/(issues\/)?([0-9]+)`,
    (m: RegExpMatchArray) => `b/${m[3]}`,
  ),
  new UrlRegexShortener(
    `${kHttpProtocol}b\/([0-9]+)`,
    (m: RegExpMatchArray) => `b/${m[2]}`,
  ),
  new UrlRegexShortener(
    '.*\/issues\/([0-9]+)',
    (m: RegExpMatchArray) => `#${m[1]}`,
  ),
  new UrlRegexShortener(
    `${kHttpProtocol}bugs\.chromium\.org\/.*id=([0-9]+)(&.*)*`,
    (m: RegExpMatchArray) => m[2],
  ),
];

// Commit url regex patterns and their shortened forms (e.g., CL number).
const kCommitShorteners: UrlRegexShortener[] = [
  new UrlRegexShortener(
    '.*\/([0-9a-f]{40})',
    (m: RegExpMatchArray) => m[1].substring(0, 7),
  ),
  new UrlRegexShortener(
    '.*cl\/([0-9]+)',
    (m: RegExpMatchArray) => `cl/${m[1]}`,
  ),
];

// Regex pattern that matches multiple lines of some url patterns.
function jointPattern(shorteners: UrlRegexShortener[]): string {
  return '^((' +
    shorteners.map((s) => `(${s.pattern.source})`).join('|') +
    ')\n?)*$';
}

const kIssuesRegex = new RegExp(jointPattern(kIssueShorteners));
const kCommitsRegex = new RegExp(jointPattern(kCommitShorteners));

const kFormDescription =
  'A more distributed and automated way of generating ' +
  'go/flutter-performance-newsletter.\n\n' +
  '' +
  'Please fill out the details about the performance improvement you\'ve ' +
  'made and we\'ll generate the newsletter accordingly. If there are ' +
  'multiple improvements, please fill out this form multiple times. We\'ll ' +
  'record your identity so we can ask for help if we need more information.';

const kPerfAreas = ['Speed', 'Memory', 'App size', 'Energy'];
