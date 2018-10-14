const moment = require('moment');
const { checkHealth } = require('../index');

test('health check fails when last crawl failed', () => {
  const now = moment();
  const nowIso = now.toISOString();
  const job = { 'attrs': { 'lastFinishedAt': nowIso, 'failedAt': nowIso }};
  const article = { };
  const report = checkHealth(job, article);
  expect(report.error).toEqual('last crawl failed');
});

test('health check fails when last crawl was too long ago', () => {
  const old = moment().subtract(7, 'hours');
  const oldIso = old.toISOString();
  const job = { 'attrs': { 'lastFinishedAt': oldIso }};
  const article = { };
  const report = checkHealth(job, article);
  expect(report.error).toEqual('last crawl was too long ago');
});

test('health check fails when last article is too old', () => {
  const now = moment();
  const old = moment().subtract(49, 'hours');
  const nowIso = now.toISOString();
  const oldIso = old.toISOString();
  const job = { 'attrs': { 'lastFinishedAt': nowIso }};
  const article = { 'updatedAt': oldIso };
  const report = checkHealth(job, article);
  expect(report.error).toEqual('last article is too old');
});

test('health check passes with old crawl failure', () => {
  const now = moment();
  const old = moment().subtract(1, 'hours');
  const nowIso = now.toISOString();
  const oldIso = old.toISOString();
  const job = { 'attrs': { 'lastFinishedAt': nowIso, 'failedAt': oldIso }};
  const article = { 'updatedAt': nowIso };
  const report = checkHealth(job, article);
  expect(report.error).toBeFalsy();
});

test('health check passes', () => {
  const now = moment();
  const nowIso = now.toISOString();
  const job = { 'attrs': { 'lastFinishedAt': nowIso }};
  const article = { 'updatedAt': nowIso };
  const report = checkHealth(job, article);
  expect(report.error).toBeFalsy();
});
