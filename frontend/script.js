const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const overlay = document.getElementById("menu-overlay");

// abrir/cerrar menú
menuBtn.addEventListener("click", () => {
  menuBtn.classList.toggle("active");
  mobileMenu.classList.toggle("show");
  overlay.classList.toggle("show");
});

// cerrar tocando afuera
overlay.addEventListener("click", () => {
  menuBtn.classList.remove("active");
  mobileMenu.classList.remove("show");
  overlay.classList.remove("show");
});
