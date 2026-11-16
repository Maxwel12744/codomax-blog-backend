// A very small "database" that stores data in JSON files.
// This is only for Module 02. In Module 03 we replace it with a real database.

const fs = require("fs");
const path = require("path");

const dataFolder = path.join(__dirname, "..", "data");

// Read a list from data/<name>.json. Returns an empty list if the file does not exist yet.
function readData(name) {
  const filePath = path.join(dataFolder, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Save a list to data/<name>.json
function writeData(name, items) {
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
  }
  const filePath = path.join(dataFolder, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
}

module.exports = { readData, writeData };
