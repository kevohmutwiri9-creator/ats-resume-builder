const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const fixture = require('./fixtures/synthetic-resume.json');
const source = fs.readFileSync(path.join(root, 'resume-import.js'), 'utf8');
const ResumeData = require(path.join(root, 'resume-data.js'));
const context = vm.createContext({});
vm.runInContext(source, context, { filename: 'resume-import.js' });
const importer = Object.create(context.ResumeImporter.prototype);

test('parses synthetic contact details and resume sections', () => {
  const result = importer.parseResumeText(fixture.text);

  for (const key of ['fullName', 'headline', 'email', 'phone', 'location', 'summary']) {
    assert.equal(result[key], fixture.expected[key], `${key} should be parsed`);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(result.experience)), fixture.expected.experience);
  assert.deepEqual(JSON.parse(JSON.stringify(result.education)), fixture.expected.education);
  assert.deepEqual(JSON.parse(JSON.stringify(result.skills)), fixture.expected.skills);
});

test('normalizes line whitespace and removes duplicate skills', () => {
  const result = importer.parseResumeText('Avery Example\n\nSKILLS\n  JavaScript   ,  Testing\nJavaScript');

  assert.deepEqual(JSON.parse(JSON.stringify(result.skills)), ['JavaScript', 'Testing']);
  assert.equal(result.fullName, 'Avery Example');
});

test('does not treat ordinary summary text containing work as a section heading', () => {
  const result = importer.parseResumeText('Avery Example\nSUMMARY\nEnjoys meaningful work with clear outcomes.');

  assert.equal(result.summary, 'Enjoys meaningful work with clear outcomes.');
});

test('returns empty sections for empty resume text', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(importer.parseResumeText(' \r\n '))), {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: [],
    education: [],
    skills: []
  });
});

test('rejects non-string resume input with a clear error', () => {
  assert.throws(() => importer.parseResumeText(null), {
    name: 'TypeError',
    message: 'Resume text must be a string.'
  });
});

test('does not fabricate resume content when PDF.js is unavailable', async () => {
  await assert.rejects(
    importer.extractPDFText({}),
    /PDF text extraction is unavailable/
  );
});

test('escapes imported content before rendering an HTML preview', () => {
  let previewHtml = '';
  const results = { style: {} };
  context.document = {
    getElementById(id) {
      return id === 'importResults' ? results : { set innerHTML(value) { previewHtml = value; } };
    }
  };

  importer.displayImportResults({
    fullName: '<img src=x onerror=alert(1)>',
    headline: '',
    email: '',
    phone: '',
    location: '',
    summary: '<script>alert(1)</script>',
    experience: [],
    education: [],
    skills: ['<b>skill</b>']
  });

  assert.match(previewHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(previewHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(previewHtml, /&lt;b&gt;skill&lt;\/b&gt;/);
  assert.doesNotMatch(previewHtml, /<script>|<img src=x/);
});

test('creates default resume state with fresh IDs and useful starter sections', () => {
  let nextId = 0;
  const first = ResumeData.defaultState(() => `id-${++nextId}`);
  const second = ResumeData.defaultState(() => `id-${++nextId}`);

  assert.equal(first.template, 'clean');
  assert.equal(first.experience.length, 1);
  assert.equal(first.education.length, 1);
  assert.deepEqual(first.skills, ['JavaScript', 'TypeScript', 'Node.js', 'React', 'PostgreSQL']);
  assert.doesNotMatch(first.experience[0].bullets.join(' '), /\b(?:18%|35%)\b/);
  assert.notEqual(first.experience[0].id, second.experience[0].id);
  assert.notEqual(first.education[0].id, second.education[0].id);
});

test('merges stored resume data while recovering missing or invalid section arrays', () => {
  const defaults = ResumeData.defaultState(() => 'default-id');
  const merged = ResumeData.mergeState(defaults, {
    fullName: 'Jordan Example',
    experience: [null, { role: 4, bullets: 'invalid' }],
    education: [],
    skills: 'not-an-array'
  });

  assert.equal(merged.fullName, 'Jordan Example');
  assert.equal(merged.experience.length, 1);
  assert.equal(merged.experience[0].role, '');
  assert.deepEqual(merged.experience[0].bullets, []);
  assert.equal(typeof merged.experience[0].id, 'string');
  assert.deepEqual(merged.education, []);
  assert.equal(merged.skills, defaults.skills);
  assert.equal(ResumeData.mergeState(defaults, ['invalid']), defaults);
});

test('converts a resume state to normalized, readable plain text', () => {
  const text = ResumeData.resumeToPlainText({
    fullName: '  Jordan   Example ',
    headline: 'Product Engineer',
    email: 'jordan@example.test',
    summary: 'Builds   reliable tools.',
    experience: [{
      role: 'Engineer',
      company: 'Example Labs',
      location: 'Nairobi',
      start: '2022',
      end: 'Present',
      bullets: ['  Improved   test coverage. ']
    }],
    education: [],
    skills: ['JavaScript', ' Testing ']
  });

  assert.match(text, /^Jordan Example\nProduct Engineer\njordan@example\.test/);
  assert.match(text, /SUMMARY\nBuilds reliable tools\./);
  assert.match(text, /Engineer - Example Labs\nNairobi \| 2022 \| Present\n- Improved test coverage\./);
  assert.match(text, /SKILLS\nJavaScript, Testing$/);
});

test('saves, reads, restores, and removes named resumes through storage', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, value); }
  };
  const defaultFactory = () => ResumeData.defaultState(() => 'new-default-id');
  const entry = {
    id: 'saved-1',
    name: 'Product resume',
    savedAt: 123,
    state: { fullName: 'Jordan Example', skills: ['Testing'] }
  };

  const saved = ResumeData.prependSavedResume(storage, 'saved', entry);
  assert.equal(saved[0], entry);
  assert.deepEqual(ResumeData.readSavedResumes(storage, 'saved'), [entry]);

  const current = { fullName: 'Stale Name', staleField: true };
  assert.equal(ResumeData.applySavedResume(current, entry, defaultFactory), true);
  assert.equal(current.fullName, 'Jordan Example');
  assert.deepEqual(current.skills, ['Testing']);
  assert.equal('staleField' in current, false);
  assert.equal(ResumeData.applySavedResume(current, { state: [] }, defaultFactory), false);

  const removal = ResumeData.removeSavedResume(storage, 'saved', 'saved-1');
  assert.equal(removal.removed, true);
  assert.deepEqual(removal.savedResumes, []);
  assert.deepEqual(ResumeData.readSavedResumes(storage, 'saved'), []);
});

test('ignores malformed saved-resume entries and rejects corrupted JSON', () => {
  const storage = {
    value: JSON.stringify([{ id: 'broken', name: 'Bad entry', state: [] }, null]),
    getItem() { return this.value; },
    setItem(key, value) { this.value = value; }
  };

  assert.deepEqual(ResumeData.readSavedResumes(storage, 'saved'), []);
  storage.value = '{broken';
  assert.throws(() => ResumeData.readSavedResumes(storage, 'saved'), SyntaxError);
});
