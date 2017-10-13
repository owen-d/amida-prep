'use strict';
const _ = require('lodash');

const SECTION_SEPARATOR = '--------------------------------';
const DESIRED_SECTION = {title: "Demographic", parser: parseDemographic};

/*
  ingest file.
  stream it through, detecting sections
  pass of each section to parse-section subroutine.
  subroutine parses section, with an optional 'skip' param (i.e. not in a list of wanted sections).
    If skip, read until end of section
    else, parse with desired subsection parser (can have a default), & format into json obj
*/


function main(text) {
  const defaultBuilder = () => ({lines: [], title: null});
  let lines = text.split('\n');
  let {sections} = _.reduce(lines, (acc, item, col) => {
    // ignore blank lines
    if (item === '') {
      return acc;
    }

    if (item === SECTION_SEPARATOR) {
      // two cases: beginning of a new section, or end
      if (!acc.inTitle) {
        acc.sections.push(acc.building);
        acc.building = defaultBuilder();
        acc.inTitle = true;
      } else {
        acc.inTitle = false;
      }
    }
    // if not blank & not a separator, is either a title, or an element within a section
    else if (acc.inTitle) {
      acc.building.title = item;
    } else {
      acc.building.lines.push(item);
    }

    return acc;

  }, {sections: [], building: defaultBuilder(), inTitle: false});



  let found = _.filter(sections, s => s.title === DESIRED_SECTION.title);

  if (found.length === 0) {
    return null;
  } else {
    return DESIRED_SECTION.parser(found[0].lines);
  }


}

function parseDemographic(lines) {
  // we don't want to use the String.split method because it would remove ':' from the values of a line (we can't be sure that char won't be used as part of a record in addition to as a separator).
  const splitLine = str => {
    const splitIdx = str.search(/:/);
    if (splitIdx === -1) {
      return null;
    }

    const key = str.substr(0, splitIdx);
    const vals = str.substr(splitIdx + 1);
    return [key.trim(), vals.trim()];
  };

  const defaultParser = (base, key, str) => _.set(base, key, str);

  const initialize = (base, key, def) => {
    if (!base.hasOwnProperty(key)) {
      base[key] = def;
    }
  };

  const createCoverage = (subKey, base, key, str) => {
    initialize(base, key, []);
    const res = {
      type: subKey,
      effective_date: str
    };
    base[key].push(res);
    return base;
  };
  // utils^

    const routines = [
      {
        matcher: /Name/,
        key: "name",
        fn: (base, key, str) => {
          let res = {};
          const vals = str.split(" ");
          _.take(vals, 2).map((str, i) => {
            if (i === 0) {
              res.first_name = str;
            }
            else if (i === 1) {
              res.last_name = str;
            }
          });
          return _.set(base, key, res);
        },
      },
      {
        matcher: /Date of Birth/,
        key: "dob",
        fn: defaultParser,
      },
      {
        matcher: /Address Line/,
        key: "address",
        fn: (base, key, str) => {
          initialize(base, key, []);
          // dont push empty records
          if (str !== '') {
            base[key].push(str);
          }
          return base;
        },
      },
      {
        matcher: /City/,
        key: "city",
        fn: defaultParser,
      },
      {
        matcher: /State/,
        key: "state",
        fn: defaultParser,
      },
      {
        matcher: /Zip/,
        key: "zip",
        fn: defaultParser,
      },
      {
        matcher: /Phone Number/,
        key: "phone",
        fn: defaultParser,
      },
      {
        matcher: /Email/,
        key: "email",
        fn: (base, key, str) => _.set(base, key, str.toLowerCase()),
      },
      {
        matcher: /Part A Effective Date/,
        key: "coverage",
        fn: _.partial(createCoverage, "Part A"),
      },
      {
        matcher: /Part B Effective Date/,
        key: "coverage",
        fn: _.partial(createCoverage, "Part B"),
      }
  ];

  return _.reduce(lines, (acc, line, rest) => {
    let [key, val] = splitLine(line);
    let [matched] = _.filter(routines, routine => routine.matcher.test(key));
    // only return first match
    if (matched !== undefined) {
      acc = matched.fn(acc, matched.key, val);
    }
    // find a potential matcher & apply it

    return acc;
  }, {});
}

module.exports = main;
