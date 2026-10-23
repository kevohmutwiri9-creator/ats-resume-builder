const browserGlobals = Object.fromEntries([
  'Analytics',
  'Blob',
  'console',
  'Event',
  'FileReader',
  'FormData',
  'ResumeData',
  'Utils',
  'URL',
  'clearInterval',
  'clearTimeout',
  'confirm',
  'document',
  'fetch',
  'localStorage',
  'module',
  'navigator',
  'pdfjsLib',
  'prompt',
  'setInterval',
  'setTimeout',
  'window'
].map(name => [name, 'readonly']));

const nodeGlobals = Object.fromEntries([
  '__dirname',
  'console',
  'module',
  'process',
  'require',
  'URL'
].map(name => [name, 'readonly']));

module.exports = [
  {
    files: ['builder.js', 'resume-data.js', 'resume-import.js'],
    languageOptions: {
      globals: browserGlobals
    },
    rules: {
      'no-undef': 'error'
    }
  },
  {
    files: ['test/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: nodeGlobals
    },
    rules: {
      'no-undef': 'error'
    }
  }
];
