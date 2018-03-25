'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const simpleLics = require('spdx-license-list/simple');
const fulLics = require('spdx-license-list/full');
const autocomplete = require('inquirer-autocomplete-prompt');
const Fuse = require('fuse.js');

module.exports = class extends Generator {
  constructor(...args) {
    super(...args);
    this.env.adapter.promptModule.registerPrompt('autocomplete', autocomplete);
  }

  prompting() {
    // Have Yeoman greet the user.
    if (!this.options.silent) {
      let name = chalk.red('generator-license-full');
      this.log(yosay(`Welcome to the funkadelic ${name} generator!`));
    }

    let choices = [];
    simpleLics.forEach(id => {
      let obj = fulLics[id];
      obj.id = id;
      choices.push({ name: id, value: obj });
    });
    let fuseOptions = {
      shouldSort: true,
      threshold: 0.5,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 2,
      keys: ['name']
    };
    let fuse = new Fuse(choices, fuseOptions); // "list" is the item array
    const prompts = [
      {
        type: 'autocomplete',
        name: 'license',
        message: 'Choose a license template',
        default: 'MIT',
        source: (answersSoFar, input) => {
          if (!input) {
            return Promise.resolve(choices);
          }
          return Promise.resolve(fuse.search(input));
        }
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  writing() {
    const caption = /^(#+)\s*license$/i;
    let readme = this.fs.read('README.md', { defaults: '' });
    let level = '';
    let next = null;
    let remove = false;
    let newlines = [];
    let l = this.props.license;
    let inserted = false;
    let insert = function() {
      if (inserted) {
        return;
      }
      if (level === '') {
        level = '#';
      }
      newlines.push(level + ' LICENSE');
      newlines.push('');
      newlines.push(
        '[![' +
          l.name +
          '](http://img.shields.io/badge/license-' +
          encodeURIComponent(l.id).replace('-', '--') +
          '-blue.svg)](' +
          l.url +
          ')'
      );
      newlines.push('This is distributed under the [' + l.name + '](' + l.url + ').');
      inserted = true;
    };
    readme.split(/\r?\n/).forEach(line => {
      if (remove) {
        if (!next.test(line)) {
          return;
        }
        insert();
        remove = false;
      }
      let match = caption.exec(line);
      if (match) {
        remove = true;
        level = match[1];
        next = new RegExp('^' + level + '(?!#)');
        return;
      }
      newlines.push(line);
    });
    insert();
    this.fs.write('README.md', newlines.join('\n'));

    this.fs.write('LICENSE', this.props.license.licenseText);
  }
};
