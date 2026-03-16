/**
 * RestaurantOS — Service / Mesero Panel JS
 * Gestión en memoria: login, mesas, menú, pedidos, POS.
 * Sin backend real. Sin frameworks.
 */

'use strict';

/* ══════════════════════════════════════════════
   ESTADO GLOBAL
══════════════════════════════════════════════ */
const SVC = {
    /* Meseros disponibles para login demo */
    meseros: [
        { nombre: 'Carlos López',   usuario: 'carlos', password: '1234', rol: 'Mesero' },
        { nombre: 'Sofía Martínez', usuario: 'sofia',  password: '1234', rol: 'Mesero' },
        { nombre: 'Luis Hernández', usuario: 'luis',   password: '1234', rol: 'Caja'   },
    ],

    sesion: null,  // mesero logueado

    /* Mesas del restaurante */
    mesas: [
        { id: 1, numero: 1, estado: 'libre',    atendidaPor: null, ordenesCliente: [] },
        { id: 2, numero: 2, estado: 'presente', atendidaPor: null, ordenesCliente: [
            { id: 'O-100', titulo: 'Orden #1', estado: 'pendiente', total: 240.00, productos: [{nombre: 'Hamburguesa clásica', precio: 120.00, cantidad: 2}] }
        ] },
        { id: 3, numero: 3, estado: 'atencion', atendidaPor: null, ordenesCliente: [
            { id: 'O-101', titulo: 'Orden #1', estado: 'pendiente', total: 210.00, productos: [{nombre: 'Pizza margarita', precio: 150.00, cantidad: 1}, {nombre: 'Refresco 500ml', precio: 30.00, cantidad: 2}] }
        ] },
        { id: 4, numero: 4, estado: 'pedido',   atendidaPor: null, ordenesCliente: [
            { id: 'O-102', titulo: 'Orden #1', estado: 'enviado', total: 95.00, productos: [{nombre: 'Arroz con pollo', precio: 95.00, cantidad: 1}] }
        ] },
        { id: 5, numero: 5, estado: 'pagar',    atendidaPor: null, ordenesCliente: [
            { id: 'O-103', titulo: 'Orden #1', estado: 'servido', total: 110.00, productos: [{nombre: 'Pollo a la plancha', precio: 110.00, cantidad: 1}] }
        ] },
        { id: 6, numero: 6, estado: 'libre',    atendidaPor: null, ordenesCliente: [] },
        { id: 7, numero: 7, estado: 'libre',    atendidaPor: null, ordenesCliente: [] },
        { id: 8, numero: 8, estado: 'presente', atendidaPor: null, ordenesCliente: [] },
    ],

    /* Menú de productos */
    catalogo: [
        { id: 101, nombre: 'Hamburguesa clásica', categoria: 'Comida', precio: 120.00, icono: 'bi-fire' },
        { id: 102, nombre: 'Pizza margarita',     categoria: 'Comida', precio: 150.00, icono: 'bi-basket2-fill' },
        { id: 103, nombre: 'Pollo a la plancha',  categoria: 'Comida', precio: 110.00, icono: 'bi-egg-fried' },
        { id: 104, nombre: 'Arroz con pollo',     categoria: 'Comida', precio: 95.00,  icono: 'bi-basket2-fill' },
        { id: 105, nombre: 'Refresco 500ml',      categoria: 'Bebida', precio: 30.00,  icono: 'bi-cup-straw' },
        { id: 106, nombre: 'Cerveza nacional',    categoria: 'Bebida', precio: 50.00,  icono: 'bi-cup-straw' },
        { id: 107, nombre: 'Jugo natural',        categoria: 'Bebida', precio: 40.00,  icono: 'bi-droplet-fill' },
        { id: 108, nombre: 'Agua purificada',     categoria: 'Bebida', precio: 20.00,  icono: 'bi-droplet-fill' },
        { id: 109, nombre: 'Flan de vainilla',    categoria: 'Postre', precio: 55.00,  icono: 'bi-cake2-fill' },
        { id: 110, nombre: 'Helado de vainilla',  categoria: 'Postre', precio: 45.00,  icono: 'bi-star-fill' },
        { id: 111, nombre: 'Panera del día',      categoria: 'Extra',  precio: 25.00,  icono: 'bi-star-fill' },
        { id: 112, nombre: 'Aderezo extra',       categoria: 'Extra',  precio: 15.00,  icono: 'bi-plus-circle-fill' },
    ],

    /* Mesa y orden actualmente abierta en el POS */
    mesaActual: null,
    ordenActual: null,
};


/* ══════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════ */

function showToast(msg, tipo = 'success') {
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
    toast._t = setTimeout(function () { toast.classList.remove('show'); }, 3200);
}

function inicial(nombre) {
    return (nombre || '?').charAt(0).toUpperCase();
}

function iniciarReloj() {
    const el = document.getElementById('topbarTime');
    function tick() {
        el.textContent = new Date().toLocaleTimeString('es-NI', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    }
    tick();
    setInterval(tick, 1000);
}

function togglePassword(inputId, btnId) {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(btnId).querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}


/* ══════════════════════════════════════════════
   AUTH — LOGIN MESERO
══════════════════════════════════════════════ */

function loginMesero(e) {
    e.preventDefault();

    const usuario  = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const msg      = document.getElementById('loginMsg');

    if (!usuario || !password) {
        setMsg(msg, 'Completa todos los campos.', 'error');
        return;
    }

    const mesero = SVC.meseros.find(function (m) {
        return m.usuario === usuario && m.password === password;
    });

    if (!mesero) {
        setMsg(msg, 'Usuario o contraseña incorrectos.', 'error');
        return;
    }

    SVC.sesion = mesero;
    iniciarPanel();
}

function setMsg(el, texto, tipo) {
    el.className = 'auth-msg ' + tipo;
    el.textContent = texto;
}

function logout() {
    SVC.sesion = null;
    document.getElementById('panelMesero').style.display = 'none';
    document.getElementById('authScreen').style.display  = 'flex';
    document.getElementById('formLogin').reset();
    document.getElementById('loginMsg').className = 'auth-msg';
    document.getElementById('loginMsg').textContent = '';
}

function iniciarPanel() {
    document.getElementById('authScreen').style.display  = 'none';
    document.getElementById('panelMesero').style.display = 'flex';

    const nombre = SVC.sesion.nombre;
    document.getElementById('mbAvatar').textContent = inicial(nombre);
    document.getElementById('mbName').textContent   = nombre;

    iniciarReloj();
    renderMesas();
}


/* ══════════════════════════════════════════════
   RENDER MESAS
══════════════════════════════════════════════ */

const ESTADO_LABELS  = {
    libre:    'Libre',
    presente: 'Cliente presente',
    atencion: 'Solicita atención',
    pedido:   'Pedido en proceso',
    pagar:    'Por pagar',
};

const ESTADO_ICONOS = {
    libre:    'bi-circle',
    presente: 'bi-person-fill',
    atencion: 'bi-bell-fill',
    pedido:   'bi-fire',
    pagar:    'bi-credit-card-fill',
};

function renderMesas() {
    const grid = document.getElementById('mesasGrid');
    grid.innerHTML = '';

    /* Estadísticas */
    const libres  = SVC.mesas.filter(function (m) { return m.estado === 'libre'; }).length;
    const ocup    = SVC.mesas.filter(function (m) { return m.estado !== 'libre'; }).length;
    const pagar   = SVC.mesas.filter(function (m) { return m.estado === 'pagar'; }).length;

    document.getElementById('statLibre').textContent  = libres;
    document.getElementById('statOcupada').textContent = ocup;
    document.getElementById('statPagar').textContent  = pagar;

    SVC.mesas.forEach(function (mesa, idx) {
        const card = document.createElement('div');
        card.className = 'mesa-card mesa-card--' + mesa.estado;
        card.onclick = function() { abrirMesa(mesa.id); };
        
        card.innerHTML = 
            '<div class="mesa-icon-wrap">' +
                '<i class="bi ' + ESTADO_ICONOS[mesa.estado] + '"></i>' +
            '</div>' +
            '<span class="mesa-num">Mesa ' + mesa.numero + '</span>' +
            '<span class="mesa-estado-badge badge--' + mesa.estado + '">' + ESTADO_LABELS[mesa.estado] + '</span>';

        grid.appendChild(card);
    });
}


/* ══════════════════════════════════════════════
   SELECCIÓN Y APERTURA DE MESA (POS)
══════════════════════════════════════════════ */

function seleccionarMesa(mesaId) {
    const mesa = SVC.mesas.find(function (m) { return m.id === mesaId; });
    if (!mesa) return;

    /* Asignar al mesero si estaba sin atender */
    if (!mesa.atendidaPor) {
        mesa.atendidaPor = SVC.sesion.usuario;
        showToast('Mesa ' + mesa.numero + ' asignada a ti.', 'info');
    }
    renderMesas();
}

function abrirMesa(mesaId) {
    const mesa = SVC.mesas.find(function (m) { return m.id === mesaId; });
    if (!mesa) return;

    /* Asignar si no tiene mesero */
    seleccionarMesa(mesaId);

    SVC.mesaActual = mesa;
    SVC.ordenActual = null;

    /* Actualizar UI del POS */
    document.getElementById('posTitle').textContent = 'Mesa ' + mesa.numero;

    const tag = document.getElementById('posEstadoTag');
    tag.textContent = ESTADO_LABELS[mesa.estado];
    tag.className   = 'pos-estado-tag badge--' + mesa.estado;

    renderListaOrdenes();
    renderDetalleOrden();

    document.getElementById('posBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function cerrarPOS() {
    document.getElementById('posBackdrop').classList.remove('open');
    document.body.style.overflow = '';
    SVC.mesaActual = null;
}

/* Cerrar POS al clic en el backdrop */
document.getElementById('posBackdrop').addEventListener('click', function (e) {
    if (e.target === this) cerrarPOS();
});

/* Cerrar POS con Escape */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrarPOS();
});


/* ══════════════════════════════════════════════
   ÓRDENES DEL CLIENTE EN EL POS
══════════════════════════════════════════════ */

function renderListaOrdenes() {
    const lista = document.getElementById('posOrderListCol');
    if(!lista) return;
    lista.innerHTML = '';

    if (!SVC.mesaActual || !SVC.mesaActual.ordenesCliente || SVC.mesaActual.ordenesCliente.length === 0) {
        lista.innerHTML = '<div class="pos-order-empty"><p>No hay órdenes del cliente</p></div>';
        return;
    }

    SVC.mesaActual.ordenesCliente.forEach(function (orden) {
        const item = document.createElement('div');
        const isActivo = SVC.ordenActual && SVC.ordenActual.id === orden.id;
        item.className = 'menu-item ' + (isActivo ? 'active' : '');
        item.style.cursor = 'pointer';
        if(isActivo) {
            item.style.borderColor = '#ffffff';
            item.style.background = 'var(--bg-card-hover)';
        }
        item.onclick = function() { seleccionarOrden(orden.id); };
        item.innerHTML = `
            <div class="mi-icon"><i class="bi bi-receipt-cutoff"></i></div>
            <div class="mi-info">
                <div class="mi-name">${orden.titulo}</div>
                <div class="mi-price" style="color:var(--text-secondary);font-weight:normal;">Estado: <strong>${orden.estado.toUpperCase()}</strong></div>
            </div>
        `;
        lista.appendChild(item);
    });

    // Seleccionar automáticamente la primera si no hay ninguna
    if (!SVC.ordenActual && SVC.mesaActual.ordenesCliente.length > 0) {
        seleccionarOrden(SVC.mesaActual.ordenesCliente[0].id);
    }
}

function seleccionarOrden(ordenId) {
    if (!SVC.mesaActual) return;
    SVC.ordenActual = SVC.mesaActual.ordenesCliente.find(function(o) { return o.id === ordenId; });
    renderListaOrdenes();
    renderDetalleOrden();
}


/* ══════════════════════════════════════════════
   DETALLE DE ORDEN ESTATICA
══════════════════════════════════════════════ */

function renderDetalleOrden() {
    const tbody  = document.getElementById('posDetalleBody');
    const table  = document.getElementById('posDetalleTable');
    const empty  = document.getElementById('posDetalleEmpty');
    const totalEl = document.getElementById('posTotal');

    if (!SVC.ordenActual) {
        totalEl.textContent = 'C$ 0.00';
        table.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    totalEl.textContent = 'C$ ' + SVC.ordenActual.total.toFixed(2);
    
    const prods = SVC.ordenActual.productos || [];
    if (prods.length === 0) {
        table.style.display = 'none';
        empty.style.display = 'flex';
        empty.innerHTML = '<p>Orden sin productos</p>';
        return;
    }

    empty.style.display = 'none';
    table.style.display = 'table';

    tbody.innerHTML = prods.map(function (o) {
        const sub = (o.precio * o.cantidad).toFixed(2);
        return '<tr>'
            + '<td>' + o.nombre + '</td>'
            + '<td style="font-weight: bold; text-align: center;">x' + o.cantidad + '</td>'
            + '<td style="color: #10b981; font-weight: 700;">C$' + o.precio.toFixed(2) + '</td>'
            + '<td style="color: #10b981; font-weight: 700;">C$' + sub + '</td>'
            + '</tr>';
    }).join('');
}


/* ══════════════════════════════════════════════
   ACCIONES DEL MESERO
══════════════════════════════════════════════ */

function enviarPedido() {
    if (!SVC.mesaActual) return;
    
    if (!SVC.ordenActual) {
        showToast('Selecciona una orden primero.', 'warn');
        return;
    }

    if (SVC.ordenActual.estado === 'enviado' || SVC.ordenActual.estado === 'servido') {
        showToast('Esta orden ya fue enviada a cocina.', 'info');
        return;
    }

    SVC.ordenActual.estado = 'enviado';
    SVC.mesaActual.estado = 'pedido';
    actualizarEstadoPOS();
    renderMesas();
    renderListaOrdenes();
    showToast('¡Pedido enviado a cocina! 🔥', 'success');
}

function marcarServido() {
    if (!SVC.mesaActual) return;

    if (SVC.mesaActual.estado !== 'pedido') {
        showToast('El pedido aún no fue enviado a cocina.', 'warn');
        return;
    }

    SVC.mesaActual.estado = 'presente';
    actualizarEstadoPOS();
    renderMesas();
    showToast('Pedido marcado como servido ✅', 'success');
}

function solicitarPago() {
    if (!SVC.mesaActual) return;

    SVC.mesaActual.estado = 'pagar';
    actualizarEstadoPOS();
    renderMesas();
    showToast('Cuenta lista para pagar 💳', 'info');
}

function cerrarMesa() {
    if (!SVC.mesaActual) return;

    const num = SVC.mesaActual.numero;
    SVC.mesaActual.estado      = 'libre';
    SVC.mesaActual.atendidaPor = null;
    SVC.mesaActual.ordenesCliente = [];

    cerrarPOS();
    renderMesas();
    showToast('Mesa ' + num + ' cerrada y libre.', 'info');
}

function actualizarEstadoPOS() {
    if (!SVC.mesaActual) return;

    const tag = document.getElementById('posEstadoTag');
    tag.textContent = ESTADO_LABELS[SVC.mesaActual.estado];
    tag.className   = 'pos-estado-tag badge--' + SVC.mesaActual.estado;
}
