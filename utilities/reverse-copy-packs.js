// Script to copy packs from the build folder to the source folder
// We do this because the packs are usually edited in Foundry, and so the changes occur in the dist folder
// We want to save them to the source so they're still up to date when we build the module
import * as fs from 'fs';
import * as path from 'path';
import module from '../src/module.json' assert { type: 'json' };
import localconfig from '../localconfig.json' assert { type: 'json' };
const MODULE_ID = module.id;
const FOUNDRY_PATH = localconfig.foundryModulesPath;
const DIST_PATH = path.resolve('dist');
const MODULE_PATH = path.join(FOUNDRY_PATH, MODULE_ID);
const PACKS_PATH = path.join(MODULE_PATH, 'packs');
const SRC_PACKS_PATH = path.resolve('src/packs');

// Validate the config and paths
validate();
// Delete the contents of the source packs directory
fs.rmSync(SRC_PACKS_PATH, { recursive: true });
// Copy the packs directory to the source directory
copyFolderSync(PACKS_PATH, SRC_PACKS_PATH);
// Log the success message
console.log(`Copied contents of packs directory to ${SRC_PACKS_PATH}`);

// Function to validate config and paths
function validate() {
  // Ensure the foundry module path is defined
  if (!FOUNDRY_PATH) {
    console.error('Foundry module path not defined in localconfig.json');
    process.exit(1);
  }

  // Ensure the foundry module path exists
  if (!fs.existsSync(FOUNDRY_PATH)) {
    console.error(`Foundry module path does not exist: ${FOUNDRY_PATH}`);
    process.exit(1);
  }

  // Ensure the dist directory exists
  if (!fs.existsSync(DIST_PATH)) {
    console.error(`dist directory does not exist: ${DIST_PATH}`);
    process.exit(1);
  }

  // Ensure the module directory exists
  if (!fs.existsSync(MODULE_PATH)) {
    console.error(`Module directory does not exist: ${MODULE_PATH}`);
    process.exit(1);
  }

  // Ensure the packs directory exists
  if (!fs.existsSync(PACKS_PATH)) {
    console.error(`Packs directory does not exist: ${PACKS_PATH}`);
    process.exit(1);
  }

  // Ensure the source packs directory exists
  if (!fs.existsSync(SRC_PACKS_PATH)) {
    console.error(`Source packs directory does not exist: ${SRC_PACKS_PATH}`);
    process.exit(1);
  }
}

// Function to copy a folder and its contents recursively
function copyFolderSync(from, to) {
  fs.mkdirSync(to);
  fs.readdirSync(from).forEach((element) => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}
