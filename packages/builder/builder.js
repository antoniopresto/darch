#!/usr/bin/env node
const esbuild = require('esbuild');
const glob = require('fast-glob');
const nodePath = require('path');

const CWD = process.cwd();
const SRC = nodePath.join(CWD, 'src');

esbuild.buildSync({
  entryPoints: getEntryPoints(),
  target: 'node14',
  write: true,
  platform: 'node',
  outdir: nodePath.resolve(CWD, 'lib'),
  format: 'cjs',
  bundle: false,
  sourcemap: 'external',
  metafile: false,
});

function getEntryPoints() {
  const globPath = `${SRC}/**/*.(ts|js)`;
  const files = glob.sync(globPath);
  const SPEC_REGEX = /\.spec|test\.(ts|js)/;
  return files.filter((el) => !SPEC_REGEX.test(el));
}
