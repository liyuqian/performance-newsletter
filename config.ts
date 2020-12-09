// Modify the following config constants appropriately for specific newsletters.
export {
  kNewsletterFolderId,
  kFormSpreadsheetId,
  kIssueShorteners,
  kCommitShorteners,
  kIssuesRegex,
  kCommitsRegex,
  kCanonicalAt,
};

// The Google drive folder id to host all performance newsletter related docs,
// forms, sheets, and so on.
const kNewsletterFolderId = '1AlHARId6KQs4npX5SA-9KDuKBtRfiJqm';

// The response spreadsheet id of the performance newsletter item form.
//
// TODO: maybe this can be generated and persisted automatically as the form
// is generated automatically.
const kFormSpreadsheetId = '1Stmjwk1ptjq60_d-lvCkQ4WaKHY_yYGLQixhtDBs8UM';

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
