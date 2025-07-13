const fs = require('fs');
const path = require('path');

const artifactsContractsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
const frontendAbiDir = path.join(__dirname, '..', 'src', 'abis');

if (!fs.existsSync(frontendAbiDir)) {
  fs.mkdirSync(frontendAbiDir, { recursive: true });
}

// Get all folders inside artifacts/contracts
const solFolders = fs.readdirSync(artifactsContractsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

solFolders.forEach(solFolder => {
  // Remove ".sol" extension to get contract base name
  const contractName = solFolder.endsWith('.sol')
    ? solFolder.slice(0, -4)
    : solFolder;

  const solFolderPath = path.join(artifactsContractsDir, solFolder);
  const contractJsonPath = path.join(solFolderPath, `${contractName}.json`);

  if (fs.existsSync(contractJsonPath)) {
    const artifact = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
    const abi = artifact.abi;

    fs.writeFileSync(
      path.join(frontendAbiDir, `${contractName}.json`),
      JSON.stringify(abi, null, 2)
    );

    console.log(`✅ Copied ABI for ${contractName}`);
  } else {
    console.warn(`⚠️ ABI file ${contractName}.json not found in ${solFolderPath}`);
  }
});

console.log('All specified ABIs copied successfully!');
