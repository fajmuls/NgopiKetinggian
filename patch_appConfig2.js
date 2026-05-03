import fs from 'fs';

let configStr = fs.readFileSync('src/useAppConfig.ts', 'utf8');

configStr = configStr.replace(/export interface AppConfig \{/, `export interface AppConfig {
  openTrips: any[];
  visibilities: { map: boolean, quota: boolean, beans: boolean, routes: boolean };`);

configStr = configStr.replace(/facilities: \{/, `openTrips: [], visibilities: { map: true, quota: true, beans: true, routes: true }, facilities: {`);

fs.writeFileSync('src/useAppConfig.ts', configStr);
