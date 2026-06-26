import { defineConfig, mergeConfig } from "tsdown";
import * as process from "node:process";
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as url from 'node:url';

/** index.ts content start **/
export const base = defineConfig({
  entry: ["src/index.ts"],
  clean: false,
  dts: true,
  exports: true,
  fixedExtension: false,
  deps: {
    onlyBundle: false,
  },
});
/** index.ts content end **/

const build = defineConfig({
  deps: {
    skipNodeModulesBundle: true,
  },
  hooks: {
    'build:prepare': () => {
      try {
        const currentFilePath = url.fileURLToPath(import.meta.url);
        const fileContent = fs.readFileSync(currentFilePath, 'utf-8');

        // Capture everything between the start and end comment blocks
        const startMarker = '/** index.ts content start **/';
        const endMarker = '/** index.ts content end **/';

        const startIndex = fileContent.indexOf(startMarker);
        const endIndex = fileContent.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
          // Extract the core code block
          const coreContent = fileContent.substring(startIndex + startMarker.length, endIndex).trim();

          // Prepend the required import statement
          const finalIndexContent = `import { defineConfig } from "tsdown";\n\n${coreContent}`;

          // Write to src/index.ts
          const targetDir = path.join(process.cwd(), 'src');
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          fs.writeFileSync(path.join(targetDir, 'index.ts'), finalIndexContent, 'utf-8');
          console.log('Successfully generated src/index.ts');
        } else {
          console.error('Could not find the start or end comment markers.');
        }
      } catch (error) {
        console.error('Error during build:prepare:', error);
      }
    },
  },
});

export default mergeConfig(
  base,
  build
);
