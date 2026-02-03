// server/seedDataWriter.js
const fs = require('fs');
const path = require('path');
const factory = require('./SampleDataFactory.cjs');

const OUT_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// create valorant dataset
console.log('Generating Valorant dataset...');
const valData = factory.buildValorantDataset({ matches: 8, rounds: 24, frames: 400 });
fs.writeFileSync(path.join(OUT_DIR, 'valorant.json'), JSON.stringify(valData, null, 2));
console.log('valorant.json written.');

// create lol dataset
console.log('Generating League dataset...');
const lolData = factory.buildLolDataset({ matches: 8, framesPerMatch: 300 });
fs.writeFileSync(path.join(OUT_DIR, 'lol.json'), JSON.stringify(lolData, null, 2));
console.log('lol.json written.');

console.log('Seeding complete.');

