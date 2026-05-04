
Action: file_editor create /app/website/js/contact.js --file-text "// Contact form validation
(function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const successMsg = document.getElementById('successMsg');

  function showError(field, message) {
    const input = form.querySelector(`#${field}`);
    const err = form.querySelector(`.error-msg[data-for=\"${field}\"]`);
    if (input) input.classList.add('invalid');
    if (err) err.textContent = message;
  }
  function clearError(field) {
    const input = form.querySelector(`#${field}`);
    const err = form.querySelector(`.error-msg[data-for=\"${field}\"]`);
    if (input) input.classList.remove('invalid');
    if (err) err.textContent = '';
  }
  function clearAll() {
    ['name','email','phone','message'].forEach(clearError);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearAll();
    let valid = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    if (name.length < 2) {
      showError('name', 'Please enter your full name.');
      valid = false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      showError('email', 'Please enter a valid email address.');
      valid = false;
    }
    if (phone && !/^[+\d\s\-()]{6,20}$/.test(phone)) {
      showError('phone', 'Please enter a valid phone number.');
      valid = false;
    }
    if (message.length < 10) {
      showError('message', 'Message must be at least 10 characters.');
      valid = false;
    }

    if (!valid) return;

    // Simulate submit
    successMsg.style.display = 'block';
    form.reset();
    setTimeout(() => { successMsg.style.display = 'none'; }, 6000);
  });

  // Live clearing on input
  ['name','email','phone','message'].forEach(field => {
    const el = form.querySelector(`#${field}`);
    if (el) el.addEventListener('input', () => clearError(field));
  });
})();
"
Observation: Create successful: /app/website/contact.js