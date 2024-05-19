import * as fsPromises from 'fs/promises';
import copy from 'rollup-plugin-copy';
import { defineConfig, Plugin } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: 'src/js/module.js',
      output: {
        entryFileNames: 'scripts/module.js',
        format: 'es',
      },
    },
  },
  plugins: [
    copy({
      targets: [
        { src: 'src/packs', dest: 'dist' },
        { src: 'src/icons', dest: 'dist' },
        { src: 'src/art', dest: 'dist' },
        // { src: 'src/templates', dest: 'dist' },
      ],
      hook: 'writeBundle',
    }),
    updateModuleManifestPlugin(),
  ],
});

function updateModuleManifestPlugin(): Plugin {
  return {
    // Name of the vite plugin
    name: 'update-module-manifest',
    // Hook into the writeBundle event during the build process
    async writeBundle(): Promise<void> {
      // Get environment variables for building the module
      const version = process.env.MODULE_VERSION;
      const project = process.env.GH_PROJECT;
      const tag = process.env.GH_TAG;
      // Read the module.json file into a record object
      const manifestJson: Record<string, unknown> = await jsonFileToRecord('src/module.json');
      // Make edits to the module.json record
      // If the environment contains a version number, update it in the record
      if (version) {
        manifestJson.version = version;
      }
      // If the environment contains a project name, set the module manifest url
      if (project) {
        const baseUrl = `https://github.com/${project}/releases`;
        manifestJson.manifest = `${baseUrl}/latest/download/module.json`;
        // If the environment contains a tag, set the module download url
        if (tag) {
          manifestJson.download = `${baseUrl}/download/${tag}/module.zip`;
        }
      }
      // Save the record to the dist/module.json file
      await recordToJsonFile(manifestJson, 'dist/module.json');
    },
  };
}

async function jsonFileToRecord(jsonFile: string): Promise<Record<string, unknown>> {
  const contents: string = await fsPromises.readFile(jsonFile, 'utf-8');
  return JSON.parse(contents) as Record<string, unknown>;
}

async function recordToJsonFile(record: Record<string, unknown>, jsonFile: string): Promise<void> {
  await fsPromises.writeFile(jsonFile, JSON.stringify(record, null, 4));
}
