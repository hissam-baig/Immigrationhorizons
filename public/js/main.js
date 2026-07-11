// Close the mobile nav after a link is clicked
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  document.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      if (toggle) toggle.checked = false;
    });
  });
});
