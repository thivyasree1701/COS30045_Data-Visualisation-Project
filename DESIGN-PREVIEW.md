# Dashboard design preview

Open `index.html` with VS Code Live Server. No build or package installation is required. D3 7.9.0 loads from the existing CDN and requires internet access.

This implementation is a design prototype, not the final data dashboard. It uses the selected palette (#3368A0, #66A3BF, #C8DFDB, #F2EFE7), with dark neutral text and outlines for readability. Four charts fit a standard desktop viewport of at least 1100 × 720. Smaller screens and browser zoom intentionally allow scrolling for access to all content.

The year dropdown, slider, line points and reset button share selection state. Sex buttons retain the requested filter design. Year and sex selections do not filter example chart geometry; the interface states this explicitly. Road-user selection highlights an example category across three charts. Details buttons explain the intended data calculation. Controls support keyboard use and dialogs support Escape.

All chart shapes are illustrative; KPI counts are blank. Example proportions and bubble sizes must not be reported as statistics. No fake CSV files were created. The final road-user categories must come from the real data; four example categories do not establish an exhaustive grouping. A valid bubble-size metric remains undecided.

Existing team modules, `road-users.html`, `js/overview.js`, `js/shared.js` and `css/styles.css` remain available. New design files are `css/dashboard.css` and `js/dashboard.js`. Integrate verified KNIME CSVs next, including accurate data tables, error/empty states, filter availability, source notes and validation. The new index does not yet call the original placeholder chart modules.

AI acknowledgement: Codex implemented the HTML/CSS/D3 design preview at the user's request. Team members should review and understand the code and record assistance in the Design Book.
