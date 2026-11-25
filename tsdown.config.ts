import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts', 'charts/index': 'src/charts/index.ts' },
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  unbundle: true,
  dts: true,
  clean: true,
  copy: [
    { from: 'src/tokens.css', to: 'dist' },
    { from: 'src/ui.css', to: 'dist' },
  ],
});
