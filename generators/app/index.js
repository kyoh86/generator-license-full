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
    this.log(
      yosay(`Welcome to the funkadelic ${chalk.red('generator-go-cli')} generator!`)
    );

    let choices = [];
    simpleLics.forEach(id => {
      choices.push({ name: id, value: fulLics[id] });
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
    // TODO: write 'README'
    this.fs.write('LICENSE', this.props.license.licenseText);
  }
};
