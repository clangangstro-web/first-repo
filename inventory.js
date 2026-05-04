
Action: file_editor create /app/website/inventory.js --file-text "// Inventory filter, search & sort
(function() {
  const grid = document.getElementById('inventoryGrid');
  const empty = document.getElementById('emptyState');
  const resultCount = document.getElementById('resultCount');
  const searchInput = document.getElementById('searchInput');
  const brandFilter = document.getElementById('brandFilter');
  const bodyFilter = document.getElementById('bodyFilter');
  const priceFilter = document.getElementById('priceFilter');
  const sortBy = document.getElementById('sortBy');
  const resetBtn = document.getElementById('resetFilters');

  function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const brand = brandFilter.value;
    const body = bodyFilter.value;
    const price = priceFilter.value;
    const sort = sortBy.value;

    let result = CARS.filter(car => {
      if (search) {
        const haystack = `${car.brand} ${car.name} ${car.body} ${car.color}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (brand && car.brand !== brand) return false;
      if (body && car.body !== body) return false;
      if (price) {
        const [min, max] = price.split('-').map(Number);
        if (car.price < min || car.price > max) return false;
      }
      return true;
    });

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'year-desc') result.sort((a, b) => b.year - a.year);
    else if (sort === 'year-asc') result.sort((a, b) => a.year - b.year);

    render(result);
  }

  function render(cars) {
    if (cars.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      resultCount.textContent = '0 vehicles found';
    } else {
      empty.style.display = 'none';
      grid.innerHTML = cars.map(buildCarCard).join('');
      resultCount.textContent = `${cars.length} vehicle${cars.length > 1 ? 's' : ''} found`;
    }
  }

  [searchInput, brandFilter, bodyFilter, priceFilter, sortBy].forEach(el => {
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
  });

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    brandFilter.value = '';
    bodyFilter.value = '';
    priceFilter.value = '';
    sortBy.value = 'default';
    applyFilters();
  });

  // Initial render
  applyFilters();
})();
"
Observation: Create successful: /app/website/inventory.js