// Catalogue des brouillons de vols (aéroports, compagnies, trajets) pour la version PHP : node php/tools/build-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AIRLINE_HOME, AIRPORT_NAME, ROUTES } from '../../api/draft-catalog.js';
const here = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(here, '..', 'src', 'data'), { recursive: true });
fs.writeFileSync(path.join(here, '..', 'src', 'data', 'draft-catalog.json'), JSON.stringify({ airlineHome: AIRLINE_HOME, airportName: AIRPORT_NAME, routes: ROUTES }));
console.log('routes', ROUTES.length);
