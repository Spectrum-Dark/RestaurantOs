/**
 * RestaurantOS — Home JS
 * Solo maneja redirecciones y micro-interacciones de la Home.
 * No modifica lógica de Client, Admin ni Service.
 */

/* ── Rutas de cada área ── */
const RUTAS = {
    cliente:  './Views/Client/index.html',
    mesero:   './Views/Service/index.html',
    admin:    './Views/Admin/index.html',
};

/* ── Redirecciones ── */
function irACliente() {
    window.location.href = RUTAS.cliente;
}

function irAMesero() {
    window.location.href = RUTAS.mesero;
}

function irAAdmin() {
    window.location.href = RUTAS.admin;
}

/* ── Navbar: añadir clase al hacer scroll ── */
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const SCROLL_THRESHOLD = 60;

    window.addEventListener('scroll', function () {
        if (window.scrollY > SCROLL_THRESHOLD) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });
})();

/* ── Teclado: cards accesibles con Enter / Space ── */
(function initCardKeyboard() {
    const cardMap = {
        'card-cliente': irACliente,
        'card-mesero':  irAMesero,
        'card-admin':   irAAdmin,
    };

    Object.entries(cardMap).forEach(function ([id, fn]) {
        const card = document.getElementById(id);
        if (!card) return;

        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fn();
            }
        });
    });
})();

/* ── Intersection Observer: animación de entrada para cards ── */
(function initScrollReveal() {
    const cards = document.querySelectorAll('.bento-card');
    if (!cards.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(function (card) {
        card.style.animationPlayState = 'paused';
        observer.observe(card);
    });
})();
