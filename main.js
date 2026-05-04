
Action: file_editor create /app/website/main.js --file-text "// Shared utilities & navigation
(function() {
  // Mobile menu toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Format price as Indonesian Rupiah
  window.formatPrice = function(value) {
    if (value >= 1_000_000_000) {
      return 'Rp ' + (value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + ' M';
    }
    return 'Rp ' + (value / 1_000_000).toFixed(0) + ' jt';
  };

  window.formatNumber = function(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Build car card HTML
  window.buildCarCard = function(car) {
    const badge = car.badge ? `<span class=\"car-badge\">${car.badge}</span>` : '';
    return `
      <article class=\"car-card\">
        <div class=\"car-image\" style=\"background-image:url('${car.image}')\">${badge}</div>
        <div class=\"car-info\">
          <p class=\"car-brand\">${car.brand}</p>
          <h3 class=\"car-name\">${car.name}</h3>
          <div class=\"car-meta\">
            <span>${car.year}</span>
            <span>${formatNumber(car.mileage)} km</span>
            <span>${car.fuel}</span>
          </div>
          <p class=\"car-price\">${formatPrice(car.price)}</p>
          <div class=\"car-actions\">
            <a href=\"detail.html?id=${car.id}\" class=\"btn btn-primary\">View Details</a>
          </div>
        </div>
      </article>
    `;
  };

  // Featured cars on home
  const featuredGrid = document.getElementById('featuredGrid');
  if (featuredGrid && typeof CARS !== 'undefined') {
    const featured = CARS.slice(0, 6);
    featuredGrid.innerHTML = featured.map(buildCarCard).join('');
  }
})();
"
Observation: Create successful: /app/website/main.js