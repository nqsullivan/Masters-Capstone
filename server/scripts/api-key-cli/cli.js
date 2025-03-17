#!/usr/bin/env node

import { Command } from 'commander';
import crypto from 'crypto';
import chalk from 'chalk';
import { runQuery } from './database/db.js';

const program = new Command();

program
  .name('api-key-cli')
  .version('1.0.0')
  .description('CLI for managing API keys in DuckDB')
  .usage('<command> [options]');

program
  .command('generate <name>')
  .description('Generate a new API key')
  .action(async (name) => {
    try {
      const apiKey = crypto.randomBytes(32).toString('hex');
      const createdAt = new Date().toISOString();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await runQuery(
        'INSERT INTO api_keys (name, key, created_at, expires_at, is_revoked) VALUES ($1, $2, $3, $4, FALSE)',
        [name, apiKey, createdAt, expiresAt.toISOString()]
      );

      console.log();
      console.log(chalk.green('API Key Generated:'));
      console.log(`Name: ${chalk.yellow(name)}`);
      console.log(`Key: ${chalk.blue(apiKey)}`);
      console.log(`Created At: ${chalk.magenta(createdAt)}`);
      console.log(`Expires At: ${chalk.magenta(expiresAt.toISOString())}`);
      console.log();
    } catch (error) {
      console.error(
        chalk.red(
          error.message.includes('UNIQUE constraint')
            ? 'Error: Key name already exists'
            : `Error: ${error}`
        )
      );
    }
  });

program
  .command('list')
  .description('List all API keys')
  .action(async () => {
    const keys = await runQuery(
      'SELECT id, name, key, created_at, expires_at, is_revoked FROM api_keys'
    );

    if (!keys.length) return console.log(chalk.yellow('No API keys found.'));

    console.log();
    keys.forEach(({ id, name, key, created_at, expires_at, is_revoked }) =>
      console.log(
        `${chalk.bold(id)} | ${chalk.yellow(name)} | ${chalk.blue(key.slice(0, 6))}... | Created: ${created_at} | Expires: ${expires_at} | ${is_revoked ? chalk.red('Revoked') : chalk.green('Active')}`
      )
    );
    console.log();
  });

program
  .command('revoke <apiKey>')
  .description('Revoke an API key')
  .action(async (apiKey) => {
    const result = await runQuery(
      'UPDATE api_keys SET is_revoked = TRUE WHERE key = $1',
      [apiKey]
    );
    console.log();
    console.log(
      result.changes === 0
        ? chalk.red('API Key not found or already revoked.')
        : chalk.green(`API Key revoked: ${apiKey}`)
    );
    console.log();
  });

program
  .command('status <apiKey>')
  .description('Check API key status')
  .action(async (apiKey) => {
    const keyData = await runQuery(
      'SELECT * FROM api_keys WHERE key = $1 OR name = $1',
      [apiKey]
    );
    if (!keyData.length) return console.log(chalk.red('API Key not found.'));

    const { name, is_revoked, created_at, expires_at } = keyData[0];
    console.log();
    console.log(
      `API Key Status: ${is_revoked ? chalk.red('Revoked') : chalk.green('Active')}\nName: ${chalk.yellow(name)}\nCreated: ${created_at}\nExpires: ${expires_at}`
    );
    console.log();
  });

program
  .command('delete <apiKey>')
  .description('Delete an API key')
  .action(async (apiKey) => {
    const result = await runQuery('DELETE FROM api_keys WHERE key = $1', [
      apiKey,
    ]);
    console.log();
    console.log(
      result.changes === 0
        ? chalk.red('API Key not found.')
        : chalk.green(`API Key deleted: ${apiKey}`)
    );
    console.log();
  });

program
  .command('get <name>')
  .description('Get an API key by name')
  .action(async (name) => {
    const keyData = await runQuery('SELECT * FROM api_keys WHERE name = $1', [
      name,
    ]);
    if (!keyData.length) return console.log(chalk.red('API Key not found.'));

    const { key, is_revoked, created_at, expires_at } = keyData[0];
    console.log();
    console.log(
      `API Key: ${key}\nStatus: ${is_revoked ? chalk.red('Revoked') : chalk.green('Active')}\nCreated: ${created_at}\nExpires: ${expires_at}`
    );
    console.log();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) program.outputHelp();
