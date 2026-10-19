import { setupYearControl } from './shared.js';
import { initChart as chart0 } from './charts/national-trend.js';
import { initChart as chart1 } from './charts/state-comparison.js';
import { initChart as chart2 } from './charts/age-sex-comparison.js';
setupYearControl('overview-year');
chart0(); chart1(); chart2();
// TODO: Charts 2 and 4 listen for roadimpact:year. Chart 1 shows all years.
