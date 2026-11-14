# Road Injury Hospitalisations in Australia

A COS30045 team dashboard exploring Australian hospitalised road injuries from 2011 to 2021. Data is prepared in KNIME and visualised using D3.js.

## Team repository

[Team GitHub repository](https://github.com/thivyasree1701/COS30045_Data-Visualisation-Project)

## Mercury website

[Road Injury Explorer on COS30045 Mercury](https://mercury.swin.edu.au/cos30045/s105685114/roadinjury-g4)

## Dashboard pages

| Page | Visualisations |
| --- | --- |
| `index.html` — Overview | National trend, road-user donut, road-user shares over time and state hospital burden bubbles. |
| `age-sex.html` — People | Age-and-sex grouped bars, road-user change since 2011 dumbbell chart and road-user by age heatmap. |
| `states.html` — Location | State map with ranking and First Nations trends by remoteness with brushing. |
| `about.html` — About | Project overview, glossary, data and methods, and team contributions. |

The dashboard uses the four pages listed above. `road-users.html` is an earlier page retained in the project.

## Run locally

1. Pull the latest changes in GitHub Desktop.
2. Open the repository folder in VS Code.
3. Open `index.html` with Live Server.
4. Navigate using Overview, People, Location and About.

Use an HTTP server instead of opening HTML files directly so CSVs and geographic boundaries can load. No npm installation or build is required. The D3 CDN requires internet access.

## Data sources and preparation

The project uses three BITRE workbooks, with data sourced from AIHW:

- `hospitalisation_injury_publication_sep2023.xlsx` — national trends, road users, age and sex.
- `state-and-territory-hospitalisation-injury-publication-2023.xlsx` — state counts and hospital bed days.
- `First-Nations-hospitalised-injuries-2023.xlsx` — First Nations hospitalisations by remoteness.

[BITRE Hospitalised Injury source and data dictionary](https://www.bitre.gov.au/resource/road-safety/hospitalised-injury)

KNIME workflows select the relevant records, check exact duplicates, standardise fields and prepare chart summaries. The website loads `data/processed/australian_road_injury_dashboard.csv`, containing 638 records from the prepared tables.

| `Data_type` | Records | Used for |
| --- | ---: | --- |
| `national_trend` | 11 | National line chart and headline totals |
| `road_user_shares` | 132 | Donut, stacked bars and dumbbell comparison |
| `age_sex` | 154 | Age-and-sex comparison |
| `road_user_age` | 132 | Heatmap |
| `state_map` | 88 | State map and names |
| `state_bubble` | 88 | State hospital burden and ranking measures |
| `first_nations_trends` | 33 | First Nations trends and brushing |

Always filter by `Data_type` before calculating totals. These tables describe overlapping populations and must not be summed together. Blank fields may mean a field does not apply to that table; do not replace all blanks with zero. “Other or unknown” is a recorded road-user category and remains included.

The loader supports the current heatmap export's `75++` column as the `75+` display label. Keep column names consistent when replacing the CSV. Earlier separate exports remain in the folder for reference.

## Interactions

- Year selection and Play Years controls.
- Hover details and chart highlighting.
- Road-user selection on Overview and sex selection for the age-and-sex bars.
- View Data tables and enlarged View Chart displays.
- State selection through the map and ranking.
- First Nations year hover counts, legend highlighting, range brushing and Clear Selection.

First Nations trends remain national when a state is selected. The dumbbell compares 2011 with the selected year. Desktop layouts are designed to fit the viewport; mobile layouts allow vertical scrolling. The About glossary cards and controls were checked at 1920×1080, 1366×768 and mobile widths. Broader dashboard screen-size and interaction testing remains part of final validation.

## Team responsibilities

- **Cheong En Ying:** KNIME workflows and charts for the national trend and state map; created and shared the Design Book; helped divide team tasks.
- **Thivyasree:** road-user donut, stacked bars and dumbbell work; data cleaning and CSV integration; website updates, GitHub management and presentation assembly.
- **Janani:** age-and-sex bars, road-user by age heatmap and First Nations visualisation work; Design Book and presentation contributions.
- **Everyone:** ideas, design review, testing, documentation and understanding the submitted work.

The team communicates through WhatsApp, shared documents, presentation slides and GitHub.

## Interpretation and validation

- Counts show hospital burden, not population-adjusted injury risk.
- State average stay is calculated as bed days divided by hospitalisations from the state export.
- First Nations trends cover the three exported groups: Major Cities, Regional and Remote.
- Age-and-sex bars use known age and sex; the heatmap includes both sexes and known ages.
- Check source definitions and recording changes before interpreting trends.

Checks performed include combined record counts, annual road-user percentage totals and consistency between state map and bubble counts. Complete browser, keyboard, interaction and screen-size testing, and document findings in the Design Book before final submission.

## Next steps

- Review chart calculations against KNIME and source tables.
- Record feedback, validation results and design iterations.
- Complete the Design Book, source attribution and APA 7 references.
- Verify the Mercury deployment, relative paths, filename case and data loading.

## AI acknowledgement

Codex assisted with parts of the initial website structure, HTML, CSS, D3.js chart code, CSV integration, interactions, debugging and README updates. Claude provided ideas for the website. Team members reviewed, edited and verified the AI-assisted work. AI assistance does not replace source-data validation, attribution or personal understanding.


