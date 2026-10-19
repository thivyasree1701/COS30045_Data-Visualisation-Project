# KNIME exports

Copy the actual CSV exports here. Do not create fabricated data.

- `national_trend.csv` — expected headers: `year,injuries` (Person 1).
- `state_by_year.csv` — expected headers: `year,state,injuries` (Person 1).
- `road_user_by_year.csv` — expected headers: `Year,Road_user,Injuries` (Person 2).
- `age_sex_by_year.csv` — expected headers: `year,age_group,sex,injuries` (Person 3).
- `road_user_shares_by_year.csv` — expected headers: `Year,Road_user,Injuries,Year_total,Percentage` (Person 2).

Preserve exact capitalisation. Confirm shared column names before implementing chart loaders. Road-user exports retain full precision; format percentages to two decimals when displaying.
