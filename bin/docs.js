#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { generateDocs } from '../src/index.js';

yargs(hideBin(process.argv))
  .command(
    'generate <directory>',
    'Generate a deepwiki-style documentation site',
    (yargs) => {
      return yargs.option('output', {
        alias: 'o',
        type: 'string',
        description: 'The output folder for the documentation site',
        default: 'doxxyDocs',
      });
    },
    async (argv) => {
        const targetDir = path.resolve(argv.directory);
        const outputDir = path.resolve(argv.output);
        
        try {
            await generateDocs(targetDir, outputDir);
        } catch (error) {
            console.error('❌ An error occurred during the generation process:', error);
            process.exit(1);
        }
    }
  )
  .demandCommand(1, 'Please provide a directory to analyze.')
  .help()
  .argv;