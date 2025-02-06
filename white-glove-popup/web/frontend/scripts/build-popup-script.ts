import * as esbuild from 'esbuild';
import { resolve } from 'path';

async function buildPopupScript() {
  try {
    await esbuild.build({
      entryPoints: [resolve(__dirname, 'popup-script.ts')],
      bundle: true,
      minify: true,
      outfile: resolve(__dirname, '../../extensions/popup-script/assets/popup.js'),
      format: 'iife',
      target: ['es2015'],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });
    console.log('Popup script built successfully');
  } catch (error) {
    console.error('Error building popup script:', error);
    process.exit(1);
  }
}

buildPopupScript(); 