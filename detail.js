
Action: file_editor create /app/website/detail.js --file-text "// Car detail page
(function() {
  const container = document.getElementById('detailContent');
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  const car = CARS.find(c => c.id === id);

  if (!car) {
    container.innerHTML = `
      <div class=\"empty-state\">
        <h3>Car Not Found</h3>
        <p>The vehicle you're looking for is not in our inventory.</p>
        <br/>
        <a href=\"inventory.html\" class=\"btn btn-primary\">Back to Inventory</a>
      </div>
    `;
    document.title = 'Not Found - AutoPrime Motors';
    return;
  }

  document.title = `${car.brand} ${car.name} - AutoPrime Motors`;

  const featuresHTML = car.features.map(f => `<span class=\"feature-tag\">${f}</span>`).join('');

  container.innerHTML = `
    <div class=\"detail-grid\">
      <div class=\"detail-image\" style=\"background-image:url('${car.image}')\"></div>
      <div class=\"detail-info\">
        <p class=\"car-brand\">${car.brand}</p>
        <h1>${car.name}</h1>
        <p class=\"muted\">${car.year} • ${car.body} • ${car.color}</p>
        <p class=\"detail-price\">${formatPrice(car.price)}</p>

        <div class=\"spec-grid\">
          <div class=\"spec-item\"><h5>Year</h5><p>${car.year}</p></div>
          <div class=\"spec-item\"><h5>Mileage</h5><p>${formatNumber(car.mileage)} km</p></div>
          <div class=\"spec-item\"><h5>Engine</h5><p>${car.engine}</p></div>
          <div class=\"spec-item\"><h5>Power</h5><p>${car.power}</p></div>
          <div class=\"spec-item\"><h5>Transmission</h5><p>${car.transmission}</p></div>
          <div class=\"spec-item\"><h5>Fuel</h5><p>${car.fuel}</p></div>
        </div>

        <div style=\"display:flex; gap:12px; flex-wrap:wrap;\">
          <a href=\"contact.html\" class=\"btn btn-primary\">Book Test Drive</a>
          <a href=\"contact.html\" class=\"btn btn-ghost\">Inquire Now</a>
        </div>
      </div>
    </div>

    <div class=\"detail-description\">
      <h3>Overview</h3>
      <p>${car.description}</p>
      <h3 style=\"margin-top:24px;\">Key Features</h3>
      <div class=\"feature-tags\">${featuresHTML}</div>
    </div>
  `;
})();
"
Observation: Create successful: /app/website/detail.js