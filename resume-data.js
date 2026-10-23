(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.ResumeData = api;
  }
})(globalThis, function() {
  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function resumeToPlainText(state) {
    const parts = [];
    const contact = [state.email, state.phone, state.location, state.links].filter(Boolean).join(' | ');
    parts.push(normalizeText(state.fullName));
    parts.push(normalizeText(state.headline));
    parts.push(contact);
    parts.push('');
    if (state.summary) {
      parts.push('SUMMARY');
      parts.push(normalizeText(state.summary));
      parts.push('');
    }
    if (state.experience?.length) {
      parts.push('EXPERIENCE');
      for (const experience of state.experience) {
        parts.push([experience.role, experience.company].filter(Boolean).join(' - '));
        parts.push([experience.location, experience.start, experience.end].filter(Boolean).join(' | '));
        for (const bullet of (experience.bullets || [])) parts.push('- ' + normalizeText(bullet));
        parts.push('');
      }
    }
    if (state.education?.length) {
      parts.push('EDUCATION');
      for (const education of state.education) {
        parts.push([education.degree, education.school].filter(Boolean).join(' - '));
        parts.push([education.location, education.start, education.end].filter(Boolean).join(' | '));
        if (education.details) parts.push(normalizeText(education.details));
        parts.push('');
      }
    }
    if (state.skills?.length) {
      parts.push('SKILLS');
      parts.push(state.skills.map(normalizeText).filter(Boolean).join(', '));
    }
    return parts.join('\n');
  }

  function defaultState(createId) {
    const newId = createId || (() => Math.random().toString(16).slice(2) + Date.now().toString(16));
    return {
      template: 'clean',
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      links: '',
      summary: '',
      experience: [
        {
          id: newId(),
          role: 'Software Engineer',
          company: 'Company Name',
          location: 'City',
          start: '2023',
          end: 'Present',
          bullets: [
            'Describe a feature you built and the problem it solved.',
            'Add a result you can verify, such as a measured performance or quality improvement.',
            'Describe how you worked with others to deliver a project.'
          ]
        }
      ],
      education: [
        {
          id: newId(),
          degree: 'BSc Computer Science',
          school: 'University Name',
          location: 'City',
          start: '2019',
          end: '2023',
          details: ''
        }
      ],
      skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'PostgreSQL']
    };
  }

  function mergeState(defaults, stored) {
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return defaults;
    const merged = { ...defaults, ...stored };
    for (const key of ['fullName', 'headline', 'email', 'phone', 'location', 'links', 'summary', 'template']) {
      if (typeof merged[key] !== 'string') merged[key] = defaults[key];
    }
    merged.experience = normalizeEntries(merged.experience, defaults.experience, {
      role: '',
      company: '',
      location: '',
      start: '',
      end: '',
      bullets: []
    });
    merged.education = normalizeEntries(merged.education, defaults.education, {
      degree: '',
      school: '',
      location: '',
      start: '',
      end: '',
      details: ''
    });
    merged.skills = Array.isArray(merged.skills)
      ? merged.skills.filter(skill => typeof skill === 'string')
      : defaults.skills;
    return merged;
  }

  function normalizeEntries(value, fallback, fields) {
    if (!Array.isArray(value)) return fallback;
    return value.filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry))
      .map(entry => {
        const normalized = {
          ...fields,
          ...entry,
          id: typeof entry.id === 'string' && entry.id ? entry.id : `resume-${Date.now()}-${Math.random().toString(16).slice(2)}`
        };
        for (const [key, defaultValue] of Object.entries(fields)) {
          if (key === 'bullets') {
            normalized[key] = Array.isArray(entry[key])
              ? entry[key].filter(bullet => typeof bullet === 'string')
              : defaultValue;
          } else if (typeof normalized[key] !== 'string') {
            normalized[key] = defaultValue;
          }
        }
        return normalized;
      });
  }

  function readSavedResumes(storage, key) {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(entry =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        entry.state &&
        typeof entry.state === 'object' &&
        !Array.isArray(entry.state)
      )
      : [];
  }

  function prependSavedResume(storage, key, entry) {
    const savedResumes = readSavedResumes(storage, key);
    savedResumes.unshift(entry);
    storage.setItem(key, JSON.stringify(savedResumes));
    return savedResumes;
  }

  function removeSavedResume(storage, key, id) {
    const savedResumes = readSavedResumes(storage, key);
    const remaining = savedResumes.filter(entry => entry.id !== id);
    if (remaining.length !== savedResumes.length) {
      storage.setItem(key, JSON.stringify(remaining));
    }
    return {
      savedResumes: remaining,
      removed: remaining.length !== savedResumes.length
    };
  }

  function applySavedResume(target, entry, createDefaultState) {
    if (!entry || !entry.state || typeof entry.state !== 'object' || Array.isArray(entry.state)) {
      return false;
    }
    const restored = mergeState(createDefaultState(), entry.state);
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, restored);
    return true;
  }

  return {
    normalizeText,
    resumeToPlainText,
    defaultState,
    mergeState,
    readSavedResumes,
    prependSavedResume,
    removeSavedResume,
    applySavedResume
  };
});
