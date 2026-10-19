// AI assistance: Codex created the starter controls and file structure.
// Prompt summary: create a local starter for the group's five-chart D3 dashboard.
// These controls update labels only until team members connect the real charts.
export function setupYearControl(id) {
  const select = document.getElementById(id);
  if (!select) return;
  for (let year = 2011; year <= 2021; year++) {
    select.add(new Option(String(year), String(year), false, year === 2021));
  }
  const update = () => {
    document.querySelectorAll('[data-selected-year]').forEach(el => {el.textContent = select.value;});
    document.dispatchEvent(new CustomEvent('roadimpact:year', {detail: {year: Number(select.value), control: id}}));
  };
  select.addEventListener('change', update);
  document.querySelector('[data-reset-year]')?.addEventListener('click', () => { select.value = '2021'; update(); });
  update();
}
