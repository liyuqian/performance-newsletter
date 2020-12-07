const kHttpRegexString = '(http[s]?://)?';
const kIssueCorpRegexString = `${kHttpRegexString}b.corp.google.com\/(issues\/)?([0-9]+)`;
const kIssueCorpShortRegexString = `${kHttpRegexString}b\/([0-9]+)`;
const kIssueGeneralRegexString = '.*\/issues\/([0-9]+)';
const kIssueChromiumRegexString = `${kHttpRegexString}bugs\.chromium\.org\/.*id=([0-9]+)(&.*)*`;

const kIssuesRegex = RegExp(
  '^((' +
  `(${kIssueCorpRegexString})|` +
  `(${kIssueCorpShortRegexString})|` +
  `(${kIssueGeneralRegexString})|` +
  `(${kIssueChromiumRegexString})` +
  ')\n?)*$',
);

const kCommitRegexString = '.*\/([0-9a-f]{40})';
const kClRegexString = '.*cl\/([0-9]+)';

const kCommitsRegex = RegExp(
  '^((' +
  `(${kCommitRegexString})|` +
  `(${kClRegexString})` +
  ')\n?)*$'
);

export {
  kHttpRegexString,
  kIssueCorpRegexString,
  kIssueCorpShortRegexString,
  kIssueGeneralRegexString,
  kIssueChromiumRegexString,
  kIssuesRegex,
  kCommitRegexString,
  kClRegexString,
  kCommitsRegex,
};
