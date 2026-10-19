import { setupYearControl } from './shared.js';
import { initChart as comparison } from './charts/road-user-comparison.js';
import { initChart as shares } from './charts/road-user-shares.js';
setupYearControl('road-year');
comparison(); shares();
// TODO: Chart 3 listens for roadimpact:year. Chart 5 shows all years.
