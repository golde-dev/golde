import { Command } from 'commander';
import { createReadStream, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tarArtifacts } from '../tar.js';
import { putObject } from '../s3.js';

const cwd = process.cwd()

const {default: config} = existsSync("./deployer.config.ts") 
  ? await import(`${join(cwd, './deployer.config.ts')}`)
  : await import(`${join(cwd, './deployer.config.js')}`)

const program = new Command();

const { 
  artifactsPaths 
} = config

program
  .name('deployer')
  .description('CLI to manager deployer')
  .version('0.8.0');

program
  .command('push')
  .description('push artifacts and config')
  .action(async () => {
    const tarFile = tarArtifacts(artifactsPaths);
    const readStream = createReadStream(tarFile);
    
    await putObject(tarFile, readStream)
  });

program.parse();