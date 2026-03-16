/**
 * RestaurantOS — Client Panel JS
 * App de pedidos móvil simulada para el cliente.
 * Sin backend real. Sin frameworks.
 */

'use strict';

/* ══════════════════════════════════════════════
   CATÁLOGO DE PRODUCTOS (simulado)
══════════════════════════════════════════════ */
const CATALOGO = [
    // Comidas
    { id: 1,  nombre: 'Hamburguesa clásica',  categoria: 'Comida', precio: 120.00, icono: '🍔', desc: 'Carne de res, lechuga, tomate, queso cheddar y aderezo especial de la casa.' },
    { id: 2,  nombre: 'Pizza margarita',      categoria: 'Comida', precio: 150.00, icono: '🍕', desc: 'Salsa de tomate artesanal, mozzarella fresca y albahaca. Masa delgada y crujiente.' },
    { id: 3,  nombre: 'Pollo a la plancha',   categoria: 'Comida', precio: 110.00, icono: '🍗', desc: 'Pechuga de pollo marinada a la plancha con verduras salteadas y arroz blanco.' },
    { id: 4,  nombre: 'Arroz con pollo',      categoria: 'Comida', precio: 95.00,  icono: '🍚', desc: 'Arroz cremoso con trozos de pollo tierno, especias y pimientos coloridos.' },
    { id: 5,  nombre: 'Nachos con queso',     categoria: 'Comida', precio: 75.00,  icono: '🧀', desc: 'Totopos crujientes bañados en salsa de queso caliente con jalapeños y crema.' },
    // Bebidas
    { id: 6,  nombre: 'Refresco 500ml',       categoria: 'Bebida', precio: 30.00,  icono: '🥤', desc: 'Bebida gaseosa fría. Disponible en cola, naranja o limón.' },
    { id: 7,  nombre: 'Cerveza nacional',     categoria: 'Bebida', precio: 50.00,  icono: '🍺', desc: 'Cerveza bien fría, nacional o importada. Presentación en botella o lata.' },
    { id: 8,  nombre: 'Jugo natural',         categoria: 'Bebida', precio: 40.00,  icono: '🍹', desc: 'Jugos de frutas frescas: melón, piña, naranja o maracuyá. Sin azúcar añadida.' },
    { id: 9,  nombre: 'Agua purificada',      categoria: 'Bebida', precio: 20.00,  icono: '💧', desc: 'Agua purificada fría en botella personal de 600ml o 1.5L.' },
    // Postres
    { id: 10, nombre: 'Flan de vainilla',     categoria: 'Postre', precio: 55.00,  icono: '🍮', desc: 'Clásico flan horneado al baño maría con caramelo artesanal de vainilla.' },
    { id: 11, nombre: 'Helado de vainilla',   categoria: 'Postre', precio: 45.00,  icono: '🍦', desc: 'Helado cremoso de vainilla con 2 sabores adicionales a elección. Con toppings.' },
    { id: 12, nombre: 'Brownie con helado',   categoria: 'Postre', precio: 70.00,  icono: '🍫', desc: 'Brownie de chocolate caliente servido con una bola de helado de vainilla.' },
    // Extras
    { id: 13, nombre: 'Panera del día',       categoria: 'Extra',  precio: 25.00,  icono: '🥖', desc: 'Selección de panes artesanales frescos con mantequilla y aceite de oliva.' },
    { id: 14, nombre: 'Aderezo extra',        categoria: 'Extra',  precio: 15.00,  icono: '🫙', desc: 'Aderezo a elegir: ranch, BBQ, miel mostaza, chipotle o vinagreta.' },
    { id: 15, nombre: 'Porción de papas',     categoria: 'Extra',  precio: 40.00,  icono: '🍟', desc: 'Papas fritas crujientes en porción mediana. Acompañan cualquier plato.' },
];

/* ══════════════════════════════════════════════
   ESTADO DE LA APP
══════════════════════════════════════════════ */
const APP = {
    mesa:     null,     // número de mesa leído de la URL
    carrito:  [],       // [ { id, nombre, precio, cantidad } ]
    filtroCat: 'Todos', // categoría activa
    pedidoEnviado: false,
    llanadoMesero: false,
};


/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    APP.mesa = obtenerMesaURL();
    actualizarInfoMesa();
    renderCatalogo();

    /* FAB visible al hacer scroll */
    window.addEventListener('scroll', function () {
        const fab = document.getElementById('fabCuenta');
        if (window.scrollY > 180 && APP.carrito.length > 0) {
            fab.style.display = 'flex';
        } else if (window.scrollY <= 180) {
            fab.style.display = 'none';
        }
    }, { passive: true });
});


/* ══════════════════════════════════════════════
   MESA DESDE URL
══════════════════════════════════════════════ */

function obtenerMesaURL() {
    const params = new URLSearchParams(window.location.search);
    let mesa = parseInt(params.get('mesa'), 10);
    
    /* Decodificando el nuevo parametro en base64 "m=" */
    if (!mesa && params.get('m')) {
        try {
            mesa = parseInt(atob(params.get('m')), 10);
        } catch (e) {
            console.error('QR inválido');
        }
    }
    
    return (!mesa || isNaN(mesa) || mesa < 1) ? 1 : mesa; // fallback mesa 1
}

function actualizarInfoMesa() {
    const num = APP.mesa;

    /* Header */
    document.getElementById('headerMesa').textContent    = 'Mesa #' + num;
    /* Hero */
    document.getElementById('heroSub').innerHTML          =
        'Estás en la <strong>Mesa #' + num + '</strong>. Explora nuestro menú y añade lo que desees.';
    /* Cuenta panel */
    document.getElementById('cuentaMesaTag').textContent = 'Mesa #' + num;
    /* Total de productos en hero */
    document.getElementById('hsTotalProds').textContent  = CATALOGO.length;
}


/* ══════════════════════════════════════════════
   RENDER CATÁLOGO
══════════════════════════════════════════════ */

const CAT_ICON = {
    Comida: 'bi-egg-fried',
    Bebida: 'bi-cup-straw',
    Postre: 'bi-cake2-fill',
    Extra:  'bi-star-fill',
};

/* Emojis para los botones de categoría (decorativo en seccion label) */
const CAT_EMOJI = {
    Todos:  '🍽️',
    Comida: '🍔',
    Bebida: '🍹',
    Postre: '🍮',
    Extra:  '🍟',
};

const CAT_LABEL = {
    Todos:  'Todos los productos',
    Comida: 'Comidas',
    Bebida: 'Bebidas',
    Postre: 'Postres',
    Extra:  'Extras',
};

function filtrarCategoria(cat) {
    APP.filtroCat = cat;

    /* Actualizar botones */
    ['Todos','Comida','Bebida','Postre','Extra'].forEach(function (c) {
        const btn = document.getElementById('cat-' + c);
        if (btn) btn.classList.toggle('active', c === cat);
    });

    renderCatalogo();
}

function renderCatalogo() {
    const cat   = APP.filtroCat;
    const lista = (cat === 'Todos')
        ? CATALOGO
        : CATALOGO.filter(function (p) { return p.categoria === cat; });

    const grid   = document.getElementById('productsGrid');
    const empty  = document.getElementById('menuEmpty');
    const label  = document.getElementById('sectionLabelText');
    const count  = document.getElementById('sectionCount');
    const secIco = document.querySelector('.section-label i');

    label.textContent   = CAT_LABEL[cat] || cat;
    count.textContent   = lista.length + ' producto' + (lista.length !== 1 ? 's' : '');
    secIco.className    = 'bi ' + (cat === 'Todos' ? 'bi-grid-fill' : CAT_ICON[cat] || 'bi-grid-fill');

    /* Limpiar cards */
    grid.querySelectorAll('.prod-card').forEach(function (el) { el.remove(); });

    if (lista.length === 0) {
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    lista.forEach(function (prod, idx) {
        const enCarrito = APP.carrito.some(function (c) { return c.id === prod.id; });
        const card = document.createElement('div');
        card.className = 'prod-card';
        card.onclick = function (e) {
            // Abrir detalle si no se hizo clic explícitamente en el botón de "Más/Agregado"
            if (!e.target.closest('.btn-card-add')) {
                abrirDetalleProducto(prod.id);
            }
        };

        card.innerHTML =
            '<div class="prod-icon-wrap cat-ico--' + prod.categoria + '">' +
                prod.icono +
            '</div>' +
            '<div class="prod-body">' +
                '<span class="prod-name">' + prod.nombre + '</span>' +
                '<span class="prod-price">C$ ' + prod.precio.toFixed(2) + '</span>' +
            '</div>' +
            '<button class="btn-card-add' + (enCarrito ? ' in-cart' : '') + '" ' +
                'id="btnAdd-' + prod.id + '" ' +
                'onclick="toggleAgregar(' + prod.id + ')" ' +
                'aria-label="Agregar ' + prod.nombre + '">' +
                '<i class="bi ' + (enCarrito ? 'bi-check-lg' : 'bi-plus-lg') + '"></i>' +
            '</button>';


        grid.appendChild(card);
    });
}


/* ══════════════════════════════════════════════
   DETALLE DEL PRODUCTO (MODAL)
══════════════════════════════════════════════ */
let prodDetalleActivo = null;
let qtyDetalleActivo  = 1;

function abrirDetalleProducto(prodId) {
    const prod = CATALOGO.find(function (p) { return p.id === prodId; });
    if (!prod) return;

    prodDetalleActivo = prod;
    qtyDetalleActivo = 1;

    document.getElementById('detailIconWrap').className = 'detail-icon-wrap cat-ico--' + prod.categoria;
    document.getElementById('detailIcon').className = '';
    document.getElementById('detailIcon').textContent = prod.icono;
    document.getElementById('detailCat').textContent = prod.categoria;
    document.getElementById('detailCat').className = 'detail-cat ' + 'cat-text--' + prod.categoria; // Si hubiera clases de texto
    document.getElementById('detailName').textContent = prod.nombre;
    document.getElementById('detailDesc').textContent = prod.desc;
    
    actualizarPrecioDetalle();
    
    document.getElementById('detailBackdrop').classList.add('open');
    if (!document.getElementById('cuentaBackdrop').classList.contains('open') &&
        !document.getElementById('modalBackdrop').classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    }
}

function cerrarDetalleProducto() {
    document.getElementById('detailBackdrop').classList.remove('open');
    prodDetalleActivo = null;

    if (!document.getElementById('cuentaBackdrop').classList.contains('open') &&
        !document.getElementById('modalBackdrop').classList.contains('open')) {
        document.body.style.overflow = '';
    }
}

function cambiarCantidadDetalle(delta) {
    if (qtyDetalleActivo + delta < 1) return;
    qtyDetalleActivo += delta;
    actualizarPrecioDetalle();
}

function actualizarPrecioDetalle() {
    document.getElementById('detailQty').textContent = qtyDetalleActivo;
    const subtotal = prodDetalleActivo.precio * qtyDetalleActivo;
    document.getElementById('detailPrice').textContent = 'C$ ' + subtotal.toFixed(2);
    document.getElementById('btnDetailAdd').innerHTML = 'Agregar • C$ ' + subtotal.toFixed(2);
}

function agregarDesdeDetalle() {
    if (!prodDetalleActivo) return;
    
    agregarProductoCantidad(prodDetalleActivo.id, qtyDetalleActivo);
    cerrarDetalleProducto();
}

function toggleAgregar(prodId) {
    const enCarrito = APP.carrito.some(function (c) { return c.id === prodId; });
    if (enCarrito) {
        // En vez de eliminar o hacer más, tal vez sumamos 1, o si quisiéramos toggle real
        // Como POS o app pedir, mejor sumar 1 si ya está.
        agregarProductoCantidad(prodId, 1);
    } else {
        agregarProductoCantidad(prodId, 1);
    }
}

function agregarProductoCantidad(prodId, qty) {
    const prod = CATALOGO.find(function (p) { return p.id === prodId; });
    if (!prod) return;

    const exist = APP.carrito.find(function (c) { return c.id === prodId; });
    if (exist) {
        exist.cantidad += qty;
    } else {
        APP.carrito.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: qty });
    }

    actualizarBadges();
    actualizarBtnAdd(prodId, true);
    showToast('"' + prod.nombre + '" agregado ' + (qty>1 ? '(x'+qty+') ' : '') + '🛒', 'success');

    
    // Auto-update cuenta if open
    if (document.getElementById('cuentaBackdrop').classList.contains('open')) {
        renderCuenta();
    }
}


/* ══════════════════════════════════════════════
   CARRITO
══════════════════════════════════════════════ */

function agregarProducto(prodId) {
    agregarProductoCantidad(prodId, 1);
}

function eliminarProducto(prodId) {
    const idx = APP.carrito.findIndex(function (c) { return c.id === prodId; });
    if (idx === -1) return;

    const nombre = APP.carrito[idx].nombre;
    APP.carrito.splice(idx, 1);

    actualizarBadges();
    actualizarBtnAdd(prodId, false);
    renderCuenta();
    showToast('"' + nombre + '" eliminado.', 'info');
}

function cambiarCantidad(prodId, delta) {
    const item = APP.carrito.find(function (c) { return c.id === prodId; });
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) {
        eliminarProducto(prodId);
        return;
    }
    renderCuenta();
}

function calcularTotal() {
    return APP.carrito.reduce(function (sum, c) {
        return sum + c.precio * c.cantidad;
    }, 0);
}

function actualizarBadges() {
    const total   = APP.carrito.reduce(function (s, c) { return s + c.cantidad; }, 0);
    const badge   = document.getElementById('carritoBadge');

    if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function actualizarBtnAdd(prodId, enCarrito) {
    const btn = document.getElementById('btnAdd-' + prodId);
    if (!btn) return;

    if (enCarrito) {
        btn.classList.add('in-cart');
        btn.innerHTML = '<i class="bi bi-check-lg"></i>';
    } else {
        btn.classList.remove('in-cart');
        btn.innerHTML = '<i class="bi bi-plus-lg"></i>';
    }
}


/* ══════════════════════════════════════════════
   PANEL CUENTA (bottom sheet)
══════════════════════════════════════════════ */

function abrirCuenta() {
    renderCuenta();
    actualizarBtnPagar();
    document.getElementById('cuentaBackdrop').classList.add('open');
    document.getElementById('cuentaPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function cerrarCuenta() {
    document.getElementById('cuentaBackdrop').classList.remove('open');
    document.getElementById('cuentaPanel').classList.remove('open');
    document.body.style.overflow = '';
}

function renderCuenta() {
    const empty  = document.getElementById('cuentaEmpty');
    const table  = document.getElementById('cuentaTable');
    const tbody  = document.getElementById('cuentaBody');
    const total  = calcularTotal();

    document.getElementById('cuentaTotal').textContent = 'C$ ' + total.toFixed(2);

    if (APP.carrito.length === 0) {
        table.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    empty.style.display  = 'none';
    table.style.display  = 'table';

    tbody.innerHTML = APP.carrito.map(function (item) {
        const sub = (item.precio * item.cantidad).toFixed(2);
        return '<tr>' +
            '<td class="td-name">' + item.nombre + '</td>' +
            '<td>' +
                '<div class="qty-ctrl">' +
                    '<button class="qty-btn-c" onclick="cambiarCantidad(' + item.id + ',-1)"><i class="bi bi-dash"></i></button>' +
                    '<span class="qty-num">' + item.cantidad + '</span>' +
                    '<button class="qty-btn-c" onclick="cambiarCantidad(' + item.id + ',1)"><i class="bi bi-plus"></i></button>' +
                '</div>' +
            '</td>' +
            '<td>C$' + sub + '</td>' +
            '<td><button class="btn-del-c" onclick="eliminarProducto(' + item.id + ')" title="Eliminar"><i class="bi bi-trash-fill"></i></button></td>' +
            '</tr>';
    }).join('');
}


/* ══════════════════════════════════════════════
   ACCIONES DEL CLIENTE
══════════════════════════════════════════════ */

function llamarMesero() {
    if (APP.llanadoMesero) {
        showToast('Ya llamaste al mesero. Espera un momento.', 'warn');
        return;
    }

    APP.llanadoMesero = true;
    cerrarCuenta();

    abrirModal(
        'bi-bell-fill',
        'rgba(245,158,11,.1)',
        '#f59e0b',
        '¡Mesero llamado! 🔔',
        'Un mesero llegará a la Mesa #' + APP.mesa + ' en breve. Por favor, espera.',
        [
            { label: 'Entendido', clase: 'bma--primary', fn: cerrarModal }
        ]
    );

    showToast('¡Mesero notificado para Mesa #' + APP.mesa + '!', 'info');

    /* Resetear en 30 seg para poder llamar de nuevo */
    setTimeout(function () { APP.llanadoMesero = false; }, 30000);
}

function confirmarPedido() {
    if (APP.carrito.length === 0) {
        showToast('Agrega productos antes de confirmar.', 'warn');
        return;
    }

    const total = calcularTotal();

    abrirModal(
        'bi-send-fill',
        'rgba(16,185,129,.1)',
        '#10b981',
        '¿Confirmar pedido?',
        'Enviarás ' + APP.carrito.reduce(function (s, c) { return s + c.cantidad; }, 0) +
            ' producto(s) por un total de C$ ' + total.toFixed(2) + ' a cocina.',
        [
            { label: 'Sí, confirmar', clase: 'bma--primary', fn: _doConfirmarPedido },
            { label: 'Cancelar',      clase: 'bma--ghost',   fn: cerrarModal },
        ]
    );
}

function _doConfirmarPedido() {
    cerrarModal();
    APP.pedidoEnviado = true;
    actualizarBtnPagar();   // habilita btn Pagar
    showToast('¡Pedido enviado a cocina! 🔥', 'success');

    setTimeout(function () {
        abrirModal(
            'bi-check-circle-fill',
            'rgba(16,185,129,.1)',
            '#10b981',
            '¡Pedido recibido!',
            'Tu pedido está siendo preparado. Puedes seguir pidiendo más platillos. El mesero te atenderá pronto.',
            [
                { label: 'Seguir pidiendo', clase: 'bma--primary', fn: function () { cerrarModal(); cerrarCuenta(); } }
            ]
        );
    }, 300);
}

function cerrarCuentaFisica() {
    if (APP.carrito.length === 0) {
        showToast('No tienes productos en tu cuenta.', 'warn');
        return;
    }

    const total = calcularTotal();

    abrirModal(
        'bi-credit-card-fill',
        'rgba(59,130,246,.1)',
        '#3b82f6',
        'Solicitar pago',
        'El total de tu cuenta en Mesa #' + APP.mesa + ' es de C$ ' + total.toFixed(2) +
            '. El mesero llegará para cobrar. ¡Gracias por preferirnos!',
        [
            { label: 'Solicitar pago', clase: 'bma--primary', fn: _doCerrarCuenta },
            { label: 'Cancelar',       clase: 'bma--ghost',   fn: cerrarModal },
        ]
    );
}

function _doCerrarCuenta() {
    cerrarModal();
    cerrarCuenta();

    setTimeout(function () {
        APP.carrito       = [];
        APP.pedidoEnviado = false;
        APP.llanadoMesero = false;

        actualizarBadges();
        renderCatalogo();
        actualizarBtnPagar();   // vuelve a bloquear el btn Pagar
        showToast('Pago solicitado. El mesero llegará pronto. ✅', 'success');
    }, 300);
}

/**
 * Habilita/deshabilita el botón "Pagar" según el estado del pedido.
 * Se habilita cuando APP.pedidoEnviado = true (mesero lo confirma en simulación).
 */
function actualizarBtnPagar() {
    var btn  = document.getElementById('btnCerrarCuenta');
    var icon = btn ? btn.querySelector('i') : null;
    if (!btn) return;

    if (APP.pedidoEnviado) {
        btn.disabled = false;
        if (icon) {
            icon.className = 'bi bi-credit-card-fill';
        }
        btn.title = 'Solicitar el cobro de tu cuenta';
    } else {
        btn.disabled = true;
        if (icon) {
            icon.className = 'bi bi-lock-fill';
        }
        btn.title = 'Disponible cuando el mesero entregue tu pedido';
    }
}

/* ══════════════════════════════════════════════
   MODAL GENÉRICO
══════════════════════════════════════════════ */

function abrirModal(iconoCls, bgIcon, colorIcon, titulo, msg, botones) {
    const iconWrap = document.getElementById('modalIconWrap');
    const icon     = document.getElementById('modalIcon');
    const tit      = document.getElementById('modalTitle');
    const msgEl    = document.getElementById('modalMsg');
    const btnsEl   = document.getElementById('modalBtns');

    iconWrap.style.background = bgIcon;
    icon.className = 'bi ' + iconoCls;
    icon.style.color = colorIcon;
    tit.textContent  = titulo;
    msgEl.textContent = msg;

    btnsEl.innerHTML = '';
    botones.forEach(function (btn) {
        const el = document.createElement('button');
        el.className = 'btn-modal-action ' + btn.clase;
        el.textContent = btn.label;
        el.onclick = btn.fn;
        btnsEl.appendChild(el);
    });

    document.getElementById('modalBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('modalBackdrop').classList.remove('open');
    if (!document.getElementById('cuentaPanel').classList.contains('open')) {
        document.body.style.overflow = '';
    }
}

/* Cerrar modal al clic en backdrop */
document.getElementById('modalBackdrop').addEventListener('click', function (e) {
    if (e.target === this) cerrarModal();
});

/* Cerrar con Escape */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        cerrarDetalleProducto();
        cerrarModal();
        cerrarCuenta();
    }
});


/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */

function showToast(msg, tipo) {
    tipo = tipo || 'info';

    const toast     = document.getElementById('toast');
    const toastMsg  = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    const iconos = {
        success: 'bi-check-circle-fill',
        error:   'bi-x-circle-fill',
        info:    'bi-info-circle-fill',
        warn:    'bi-exclamation-triangle-fill',
    };

    toast.className = 'toast show toast--' + tipo;
    toastIcon.className = 'bi toast-icon ' + (iconos[tipo] || iconos.info);
    toastMsg.textContent = msg;

    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('show'); }, 3000);
}
