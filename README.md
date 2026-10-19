# Road Injury Hospitalisations in Australia

Local starter for the COS30045 team dashboard. This is a scaffold: chart placeholders are intentionally empty. There is no fake data and no completed D3 chart yet.

## Team repository

https://github.com/thivyasree1701/COS30045_Data-Visualisation-Project

## Pages
- `index.html`: Charts 1 (national trend), 2 (states), 4 (age and sex).
- `road-users.html`: Charts 3 (road-user counts) and 5 (percentage shares over time).

## Preview
Open this folder in VS Code and use Live Server on `index.html`. Use an HTTP server rather than opening the file directly, because JavaScript modules and CSV loading require it. No npm install/build is needed. The pinned D3 CDN requires internet; for Mercury, an appropriately attributed local D3 copy can replace it later.

## Team responsibilities
- Cheong En Ying : `national-trend.js`, `state-comparison.js`, and corresponding KNIME exports.
- Thivyasree : `road-user-comparison.js`, `road-user-shares.js`, and corresponding exports.
- Janani : `age-sex-comparison.js` and integration, supported by all members.
- Everyone: design, accessible interactions, validation, usability testing and Design Book.

## Data
Copy CSV exports into `data/processed/`. Read that folder's README for filenames and exact column names. No actual CSVs were copied automatically. Preserve unrounded percentages for data; display two decimals in tooltips. All road-user categories must remain accounted for in percentage totals.

## GitHub later
This folder has not been initialized as a new Git repository or pushed. Create/use the required team GitHub Classroom repository. Copy the CONTENTS of this folder into the repository root, preserving its `.git` folder. Invite/check team access and commit the starter. Avoid creating a nested repository inside the existing coursework repository.

## Before completion
- Replace chart placeholders using D3 directly; load real CSVs and handle errors.
- Year control updates only labels at present. Wire Charts 2/4 and Chart 3 to the `roadimpact:year` event; Charts 1/5 retain all years.
- Add data tables, keyboard-accessible detail, verified findings and consistent colours.
- Check all values against KNIME, evaluate usability, and document improvements.
- Add methodological notes, recording breaks, source attribution and APA 7 references.
- Upload the same static structure to Mercury and test relative paths/case sensitivity.

## AI acknowledgement
Codex generated the initial HTML/CSS/JavaScript scaffold, placeholder modules and README from the request to create a starter website folder for the five-chart team dashboard. Team members must review, understand and develop it. Preserve/update the relevant code comments and record later assistance.

Source: https://www.bitre.gov.au/resource/road-safety/hospitalised-injury
