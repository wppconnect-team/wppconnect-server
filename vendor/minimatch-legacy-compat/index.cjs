// Copyright 2026 WPPConnect Team. Licensed under Apache-2.0.
const engine = require('minimatch-engine');

// Only the contracts used by eslint-plugin-import and glob 7 are adapted.
// Pattern compilation and matching always use the patched upstream engine.
function createFacade(defaults = {}) {
  class LegacyMinimatch extends engine.Minimatch {
    constructor(pattern, options = {}) {
      // Version 3 did not have this optimization. Keep glob's traversal rows
      // and original globSet indices aligned instead of expanding/merging them.
      super(pattern, { ...defaults, ...options, optimizationLevel: 0 });
      for (const row of this.set) {
        for (const segment of row) {
          if (typeof segment !== 'object') continue;
          segment._glob = segment.pattern;
          // glob 7 uses String.match(segment), whereas engine 11 exposes test.
          segment[Symbol.match] = (value) =>
            segment.test(value) ? [String(value)] : null;
        }
      }
    }
    mergeRows() {
      // A merged brace row would invalidate glob 7's globSet[index] lookup.
    }
    makeRe() {
      // eslint-plugin-import uses only .test(). This is deliberately not a
      // RegExp conversion or a general replacement for the removed regex API.
      return { test: (value) => this.match(value) };
    }
    static defaults(options) {
      return createFacade({ ...defaults, ...options }).Minimatch;
    }
  }

  const match = (value, pattern, options) =>
    new LegacyMinimatch(pattern, options).match(value);
  return Object.assign(match, {
    Minimatch: LegacyMinimatch,
    GLOBSTAR: engine.GLOBSTAR,
    sep: engine.sep,
    filter: (pattern, options) => (value) => match(value, pattern, options),
    makeRe: (pattern, options) =>
      new LegacyMinimatch(pattern, options).makeRe(),
    braceExpand: (pattern, options) =>
      engine.braceExpand(pattern, { ...defaults, ...options }),
    match: (list, pattern, options) => {
      const model = new LegacyMinimatch(pattern, options);
      const matched = list.filter((value) => model.match(value));
      if (!matched.length && model.options.nonull) matched.push(pattern);
      return matched;
    },
    defaults: (options) => createFacade({ ...defaults, ...options }),
  });
}

module.exports = createFacade();
