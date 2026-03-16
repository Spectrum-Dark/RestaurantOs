/**
 * RestaurantOS — Admin Panel JS
 * Gestión en memoria: auth, navegación, mesas, trabajadores, bolsa.
 * Sin backend real. Sin frameworks.
 */

'use strict';

/* ══════════════════════════════════════════════
   ESTADO GLOBAL
══════════════════════════════════════════════ */
const DB = {
    admins:       [],   // { nombre, usuario, password }
    sesion:       null, // admin actualmente logueado
    mesas:        [],   // { id, numero, estado, qr }
    trabajadores: [],   // { id, nombre, usuario, rol }
    bolsa:        [],   // { mesa, consumo, total, hora, mesero }
    menu:         [],   // { id, nombre, categoria, precio, descripcion, imagen }
    mesaIdCounter: 1,
    trabIdCounter:  1,
    menuIdCounter:  1,
};

/* Vista activa */
let vistaActual = 'dashboard';

/* Mesa actual seleccionada para QR */
let mesaQRActual = null;


/* ══════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════ */

/** Muestra un toast de notificación */
function showToast(msg, tipo = 'success') {
    const toast   = document.getElementById('toast');
    const toastMsg  = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    const iconos = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };

    toast.className = 'toast show toast--' + tipo;
    toastIcon.className = 'bi toast-icon ' + (iconos[tipo] || iconos.info);
    toastMsg.textContent = msg;

    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
        toast.classList.remove('show');
    }, 3000);
}

/** Muestra u oculta mensaje de error/éxito en auth */
function setAuthMsg(id, msg, tipo) {
    const el = document.getElementById(id);
    el.className = 'auth-msg ' + (tipo || '');
    el.textContent = msg;
}

/** Genera inicial para avatar */
function inicial(nombre) {
    return (nombre || '?').charAt(0).toUpperCase();
}

/** Formatea hora actual HH:MM */
function horaActual() {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
}

/** Actualiza el reloj del topbar */
function iniciarReloj() {
    const el = document.getElementById('topbarTime');
    function tick() {
        const d = new Date();
        el.textContent = d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    tick();
    setInterval(tick, 1000);
}

/** Fecha formateada para el dashboard */
function fechaLarga() {
    return new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}


/* ══════════════════════════════════════════════
   TOGGLE CONTRASEÑA
══════════════════════════════════════════════ */
function togglePassword(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn   = document.getElementById(btnId);
    const icon  = btn.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}


/* ══════════════════════════════════════════════
   AUTH — LOGIN / REGISTRO
══════════════════════════════════════════════ */

function showRegister() {
    document.getElementById('panelLogin').classList.add('auth-panel--hidden');
    document.getElementById('panelRegister').classList.remove('auth-panel--hidden');
    setAuthMsg('registerMsg', '', '');
    document.getElementById('formRegister').reset();
}

function showLogin() {
    document.getElementById('panelRegister').classList.add('auth-panel--hidden');
    document.getElementById('panelLogin').classList.remove('auth-panel--hidden');
    setAuthMsg('loginMsg', '', '');
}

function login(e) {
    e.preventDefault();
    const usuario  = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    if (!usuario || !password) {
        setAuthMsg('loginMsg', 'Completa todos los campos.', 'error');
        return;
    }

    const admin = DB.admins.find(function (a) {
        return a.usuario === usuario && a.password === password;
    });

    if (!admin) {
        setAuthMsg('loginMsg', 'Usuario o contraseña incorrectos.', 'error');
        return;
    }

    DB.sesion = admin;
    iniciarPanel();
}

function register(e) {
    e.preventDefault();
    const nombre   = document.getElementById('regName').value.trim();
    const usuario  = document.getElementById('regUser').value.trim();
    const pass     = document.getElementById('regPass').value;
    const passConf = document.getElementById('regPassConf').value;

    if (!nombre || !usuario || !pass || !passConf) {
        setAuthMsg('registerMsg', 'Completa todos los campos.', 'error');
        return;
    }

    if (pass.length < 6) {
        setAuthMsg('registerMsg', 'La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    if (pass !== passConf) {
        setAuthMsg('registerMsg', 'Las contraseñas no coinciden.', 'error');
        return;
    }

    const existe = DB.admins.find(function (a) { return a.usuario === usuario; });
    if (existe) {
        setAuthMsg('registerMsg', 'Ese nombre de usuario ya está en uso.', 'error');
        return;
    }

    DB.admins.push({ nombre: nombre, usuario: usuario, password: pass });
    setAuthMsg('registerMsg', '¡Cuenta creada! Ahora puedes iniciar sesión.', 'success');

    setTimeout(function () {
        showLogin();
        document.getElementById('loginUser').value = usuario;
    }, 1500);
}

function logout() {
    DB.sesion = null;
    document.getElementById('panelAdmin').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    showLogin();
    document.getElementById('formLogin').reset();
}


/* ══════════════════════════════════════════════
   INICIAR PANEL
══════════════════════════════════════════════ */
function iniciarPanel() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('panelAdmin').style.display = 'flex';

    /* Actualizar usuario en sidebar y topbar */
    const nombre = DB.sesion.nombre;
    const ini    = inicial(nombre);

    document.getElementById('suName').textContent    = nombre;
    document.getElementById('suAvatar').textContent  = ini;
    document.getElementById('topbarAvatar').textContent = ini;

    /* Reloj + fecha */
    iniciarReloj();
    document.getElementById('viewDate').textContent = fechaLarga();

    /* Cargar vista inicial */
    navigate('dashboard');
}


/* ══════════════════════════════════════════════
   NAVEGACIÓN SPA
══════════════════════════════════════════════ */
function navigate(vista) {
    /* Ocultar vista anterior */
    document.getElementById('view-' + vistaActual).classList.add('view--hidden');
    document.getElementById('nav-' + vistaActual).classList.remove('active');

    /* Mostrar nueva vista */
    vistaActual = vista;
    document.getElementById('view-' + vista).classList.remove('view--hidden');
    document.getElementById('nav-' + vista).classList.add('active');

    /* Título topbar */
    const titulos = {
        dashboard:    'Dashboard',
        mesas:        'Gestión de Mesas',
        menu:         'Restaurante',
        trabajadores: 'Trabajadores',
        bolsa:        'Bolsa del Día',
    };
    document.getElementById('topbarTitle').textContent = titulos[vista] || vista;

    /* Renderizar contenido */
    if (vista === 'dashboard')    renderDashboard();
    if (vista === 'mesas')        renderMesas();
    if (vista === 'menu')         renderMenu();
    if (vista === 'trabajadores') renderTrabajadores();
    if (vista === 'bolsa')        renderBolsa();

    /* Cerrar sidebar en mobile */
    closeSidebarMobile();
}


/* ══════════════════════════════════════════════
   SIDEBAR RESPONSIVE
══════════════════════════════════════════════ */
function toggleSidebar() {
    const sb      = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sb.classList.toggle('open');
    overlay.classList.toggle('open');
}

function closeSidebarMobile() {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('open');
    }
}


/* ══════════════════════════════════════════════
   DASHBOARD RENDER
══════════════════════════════════════════════ */
function renderDashboard() {
    /* KPIs */
    const activas = DB.mesas.filter(function (m) { return m.estado !== 'libre'; }).length;
    const libres  = DB.mesas.filter(function (m) { return m.estado === 'libre'; }).length;
    const meseros = DB.trabajadores.filter(function (t) { return t.rol === 'Mesero'; }).length;
    const ventas  = DB.bolsa.reduce(function (s, b) { return s + b.total; }, 0);

    document.getElementById('kpi-activas').textContent = activas;
    document.getElementById('kpi-libres').textContent  = libres;
    document.getElementById('kpi-meseros').textContent = meseros;
    document.getElementById('kpi-ventas').textContent  = 'C$' + ventas.toFixed(2);

    /* Preview mesas */
    const dmEl = document.getElementById('dashMesasPreview');
    if (DB.mesas.length === 0) {
        dmEl.innerHTML = '<p class="dp-empty"><i class="bi bi-inbox"></i> Sin mesas registradas</p>';
    } else {
        dmEl.innerHTML = DB.mesas.slice(0, 4).map(function (m) {
            const dotColor = { libre: '#71717a', ocupada: '#22c55e', espera: '#f59e0b' }[m.estado];
            return '<div class="dp-row">'
                 + '<span><i class="bi bi-circle-fill" style="color:' + dotColor + ';font-size:.6rem;margin-right:.35rem;"></i>Mesa ' + m.numero + '</span>'
                 + '<span style="font-size:.72rem;text-transform:capitalize;color:var(--text-muted)">' + m.estado + '</span>'
                 + '</div>';
        }).join('');
    }

    /* Preview trabajadores */
    const dtEl = document.getElementById('dashTrabajadoresPreview');
    if (DB.trabajadores.length === 0) {
        dtEl.innerHTML = '<p class="dp-empty"><i class="bi bi-inbox"></i> Sin trabajadores registrados</p>';
    } else {
        dtEl.innerHTML = DB.trabajadores.slice(0, 4).map(function (t) {
            const rolClass = t.rol === 'Mesero' ? 'rol--mesero' : 'rol--caja';
            return '<div class="dp-row">'
                 + '<span>' + t.nombre + '</span>'
                 + '<span class="trab-rol-badge ' + rolClass + '">' + t.rol + '</span>'
                 + '</div>';
        }).join('');
    }
}


/* ══════════════════════════════════════════════
   GESTIÓN DE MESAS
══════════════════════════════════════════════ */
function abrirModalMesa() {
    document.getElementById('mesaNumero').value = '';
    document.getElementById('mesaEstado').value = 'libre';
    updateEstadoIcon();
    abrirModal('modalMesa');
}

function updateEstadoIcon() {
    const val   = document.getElementById('mesaEstado').value;
    const icon  = document.getElementById('mesaEstadoIcon');
    const colores = { libre: '#71717a', ocupada: '#22c55e', espera: '#f59e0b' };
    icon.style.color = colores[val] || '#71717a';
}

function crearMesa() {
    const numInput = document.getElementById('mesaNumero');
    const estado   = document.getElementById('mesaEstado').value;
    const numero   = parseInt(numInput.value, 10);

    if (!numero || numero < 1) {
        showToast('Ingresa un número de mesa válido.', 'error');
        return;
    }

    const duplicada = DB.mesas.find(function (m) { return m.numero === numero; });
    if (duplicada) {
        showToast('Ya existe una mesa con ese número.', 'error');
        return;
    }

    DB.mesas.push({
        id:     DB.mesaIdCounter++,
        numero: numero,
        estado: estado,
        qr:     null,
    });

    cerrarModal('modalMesa');
    renderMesas();
    showToast('Mesa ' + numero + ' creada correctamente.', 'success');
}

function eliminarMesa(id) {
    const idx = DB.mesas.findIndex(function (m) { return m.id === id; });
    if (idx === -1) return;
    const num = DB.mesas[idx].numero;
    DB.mesas.splice(idx, 1);
    renderMesas();
    showToast('Mesa ' + num + ' eliminada.', 'info');
}

function cambiarEstadoMesa(id, nuevoEstado) {
    const mesa = DB.mesas.find(function (m) { return m.id === id; });
    if (!mesa) return;
    mesa.estado = nuevoEstado;
    renderMesas();
}

function renderMesas() {
    const grid  = document.getElementById('mesasGrid');
    const empty = document.getElementById('mesasEmpty');

    /* Limpiar cards anteriores (no el empty) */
    const viejas = grid.querySelectorAll('.mesa-card');
    viejas.forEach(function (el) { el.remove(); });

    if (DB.mesas.length === 0) {
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    DB.mesas.forEach(function (mesa) {
        const card = document.createElement('div');
        card.className = 'mesa-card mesa-card--' + mesa.estado;

        const etiquetas = { libre: 'Libre', ocupada: 'Ocupada', espera: 'En espera' };
        const dotIcons  = {
            libre:   '<i class="bi bi-circle"></i>',
            ocupada: '<i class="bi bi-record-circle-fill"></i>',
            espera:  '<i class="bi bi-clock-fill"></i>',
        };

        const qrTag = mesa.qr
            ? '<span class="qr-tag"><i class="bi bi-qr-code"></i> QR generado</span>'
            : '<span class="qr-tag qr-tag--none"><i class="bi bi-qr-code"></i> Sin QR</span>';

        const estadoOpts = ['libre', 'ocupada', 'espera'].map(function (e) {
            return '<option value="' + e + '"' + (mesa.estado === e ? ' selected' : '') + '>'
                 + etiquetas[e] + '</option>';
        }).join('');

        card.innerHTML = `
            <div class="mesa-card-head">
                <span class="mesa-num">Mesa ${mesa.numero}</span>
                <span class="mesa-estado-badge estado--${mesa.estado}">
                    ${dotIcons[mesa.estado]} ${etiquetas[mesa.estado]}
                </span>
            </div>
            <div class="mesa-card-body">
                <span class="mesa-id">ID: #${mesa.id}</span>
                <div class="mesa-qr-row">${qrTag}</div>
                <div class="field-wrap field-wrap--select" style="margin-top:.25rem">
                    <i class="bi bi-circle-fill field-icon" style="color:${estadoColor(mesa.estado)};font-size:.6rem;left:.75rem"></i>
                    <select class="field-input field-select" style="font-size:.78rem;padding:.45rem .875rem .45rem 2rem"
                        onchange="cambiarEstadoMesa(${mesa.id}, this.value)">
                        ${estadoOpts}
                    </select>
                </div>
            </div>
            <div class="mesa-actions">
                <button class="btn-mesa btn-mesa--qr" onclick="abrirQR(${mesa.id})">
                    <i class="bi bi-qr-code"></i> QR
                </button>
                <button class="btn-mesa btn-mesa--del" onclick="eliminarMesa(${mesa.id})">
                    <i class="bi bi-trash-fill"></i> Eliminar
                </button>
            </div>`;

        grid.appendChild(card);
    });
}

function estadoColor(estado) {
    return { libre: '#71717a', ocupada: '#22c55e', espera: '#f59e0b' }[estado] || '#71717a';
}


/* ══════════════════════════════════════════════
   QR DE MESA
══════════════════════════════════════════════ */
function generarQR(mesaId) {
    const mesa = DB.mesas.find(function (m) { return m.id === mesaId; });
    if (!mesa) return;
    const origen = window.location.origin;
    /* Cifrando en Base64 el parámetro para que no quede expuesto tan fácilmente */
    const parametroCifrado = btoa(mesa.id.toString());
    mesa.qr = origen + '/Views/Client/index.html?m=' + parametroCifrado;
    return mesa.qr;
}

let qrInstancia = null;

function abrirQR(mesaId) {
    const mesa = DB.mesas.find(function (m) { return m.id === mesaId; });
    if (!mesa) return;

    mesaQRActual = mesa;

    /* Generar QR si no existe */
    if (!mesa.qr) generarQR(mesaId);

    document.getElementById('qrLinkText').textContent = mesa.qr;
    document.getElementById('qrMesaInfo').textContent = 'Mesa ' + mesa.numero + ' — Estado: ' + mesa.estado;
    document.getElementById('modalQRTitle').innerHTML = '<i class="bi bi-qr-code"></i> QR — Mesa ' + mesa.numero;

    const canvas = document.getElementById('qrCanvas');
    canvas.innerHTML = ''; /* Limpiar el QR viejo */
    
    if(typeof QRCode !== 'undefined') {
        qrInstancia = new QRCode(canvas, {
            text: mesa.qr,
            width: 512,  /* Alta resolución para descarga (512x512) */
            height: 512,
            colorDark : "#222222",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    abrirModal('modalQR');
    renderMesas();
}

function copiarLink() {
    if (!mesaQRActual || !mesaQRActual.qr) return;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(mesaQRActual.qr).then(function () {
            showToast('Enlace copiado al portapapeles.', 'success');
            const btn = document.getElementById('btnCopiarQR');
            btn.innerHTML = '<i class="bi bi-check2"></i> ¡Copiado!';
            setTimeout(function () {
                btn.innerHTML = '<i class="bi bi-clipboard-fill"></i> Copiar enlace';
            }, 2000);
        });
    } else {
        /* Fallback para navegadores sin clipboard API */
        const input = document.createElement('input');
        input.value = mesaQRActual.qr;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Enlace copiado.', 'success');
    }
}

function descargarQR() {
    if (!mesaQRActual) return;
    const qrcanvas = document.querySelector('#qrCanvas canvas');
    if (!qrcanvas) {
        showToast('No se pudo generar la imagen del QR.', 'error');
        return;
    }

    /* Añadimos un margen/padding blanco generoso (ej: 40px en cada lado) */
    const padding = 40;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = qrcanvas.width + (padding * 2);
    tempCanvas.height = qrcanvas.height + (padding * 2);
    
    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; /* Fondo blanco puro */
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    /* Dibujamos el QR original por encima centrado con el padding */
    ctx.drawImage(qrcanvas, padding, padding);

    const a = document.createElement('a');
    a.href = tempCanvas.toDataURL('image/jpeg', 1.0);
    a.download = 'QR_Mesa_' + mesaQRActual.numero + '.jpg';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Código QR descargado.', 'success');
}


/* ══════════════════════════════════════════════
   TRABAJADORES
══════════════════════════════════════════════ */
function generarNuevoCodigo() {
    /* Generar un código aleatorio de 6 dígitos (100000 - 999999) */
    const min = 100000;
    const max = 999999;
    const codigo = Math.floor(Math.random() * (max - min + 1)) + min;
    
    document.getElementById('trabCodigoDisplay').textContent = codigo.toString();
    document.getElementById('trabCodigo').value = codigo.toString();
}

function abrirModalTrabajador() {
    document.getElementById('formRegister') && document.getElementById('formRegister').reset();
    document.getElementById('trabNombre').value  = '';
    document.getElementById('trabUsuario').value = '';
    document.getElementById('trabRol').value     = 'Mesero';
    
    generarNuevoCodigo(); /* Se autogenera al abrir el modal */
    
    abrirModal('modalTrabajador');
}

function crearTrabajador() {
    const nombre  = document.getElementById('trabNombre').value.trim();
    const usuario = document.getElementById('trabUsuario').value.trim();
    const rol     = document.getElementById('trabRol').value;
    const codigo  = document.getElementById('trabCodigo').value;

    if (!nombre || !usuario) {
        showToast('Completa todos los campos del trabajador.', 'error');
        return;
    }

    const existe = DB.trabajadores.find(function (t) { return t.usuario === usuario; });
    if (existe) {
        showToast('Ese usuario ya está registrado.', 'error');
        return;
    }

    /* Validar que el código no esté repetido por si acaso */
    const codigoExiste = DB.trabajadores.find(function(t) { return t.codigo === codigo; });
    if(codigoExiste) {
        showToast('Este código numérico lo tiene otro usuario, por favor genera uno nuevo.', 'error');
        return;
    }

    DB.trabajadores.push({
        id:      DB.trabIdCounter++,
        nombre:  nombre,
        usuario: usuario,
        rol:     rol,
        codigo:  codigo,
    });

    cerrarModal('modalTrabajador');
    renderTrabajadores();
    showToast(nombre + ' registrado como ' + rol + '.', 'success');
}

function eliminarTrabajador(id) {
    const idx = DB.trabajadores.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return;
    const nombre = DB.trabajadores[idx].nombre;
    DB.trabajadores.splice(idx, 1);
    renderTrabajadores();
    showToast(nombre + ' eliminado del equipo.', 'info');
}

function renderTrabajadores() {
    const list  = document.getElementById('trabajadoresList');
    const empty = document.getElementById('trabajadoresEmpty');

    const rows = list.querySelectorAll('.trab-row');
    rows.forEach(function (el) { el.remove(); });

    if (DB.trabajadores.length === 0) {
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    DB.trabajadores.forEach(function (t) {
        const row = document.createElement('div');
        row.className = 'trab-row';

        const rolClass = t.rol === 'Mesero' ? 'rol--mesero' : 'rol--caja';
        const pinText = t.codigo || '000000';

        row.innerHTML = `
            <div class="trab-avatar">${inicial(t.nombre)}</div>
            <div class="trab-info">
                <span class="trab-name">${t.nombre}</span>
                <span class="trab-user">@${t.usuario} <span style="margin-left:.75rem; padding: .15rem .45rem; background:rgba(249,115,22,.1); color:var(--accent); border-radius:100px; font-family:monospace; font-weight:700;">PIN: ${pinText}</span></span>
            </div>
            <span class="trab-rol-badge ${rolClass}">${t.rol}</span>
            <button class="trab-del" onclick="eliminarTrabajador(${t.id})" title="Eliminar trabajador">
                <i class="bi bi-trash-fill"></i>
            </button>`;

        list.appendChild(row);
    });

    /* Actualizar KPI si dashboard está visible */
    if (vistaActual === 'dashboard') renderDashboard();
}


/* ══════════════════════════════════════════════
   GESTIÓN DEL MENÚ
══════════════════════════════════════════════ */

/* Filtro activo */
let menuFiltroActual = 'Todos';

function updateCatIcon() { /* solo UI, no hay cambio visual extra necesario */ }

function agregarProducto() {
    const nombre    = document.getElementById('prodNombre').value.trim();
    const categoria = document.getElementById('prodCategoria').value;
    const precio    = parseFloat(document.getElementById('prodPrecio').value);
    const desc      = document.getElementById('prodDesc').value.trim();

    if (!nombre) {
        showToast('Escribe el nombre del producto.', 'error');
        return;
    }
    if (!precio || precio <= 0) {
        showToast('Ingresa un precio válido.', 'error');
        return;
    }

    DB.menu.push({
        id:          DB.menuIdCounter++,
        nombre:      nombre,
        categoria:   categoria,
        precio:      precio,
        descripcion: desc || 'Sin descripción.',
    });

    /* Limpiar formulario */
    document.getElementById('prodNombre').value = '';
    document.getElementById('prodPrecio').value = '';
    document.getElementById('prodDesc').value   = '';
    document.getElementById('prodCategoria').value = 'Comida';

    renderMenu();
    showToast('"' + nombre + '" agregado al menú.', 'success');
}

function eliminarProducto(id) {
    const idx = DB.menu.findIndex(function (p) { return p.id === id; });
    if (idx === -1) return;
    const nombre = DB.menu[idx].nombre;
    DB.menu.splice(idx, 1);
    renderMenu();
    showToast('"' + nombre + '" eliminado del menú.', 'info');
}

function editarProducto(id) {
    const prod = DB.menu.find(function (p) { return p.id === id; });
    if (!prod) return;

    document.getElementById('editProdId').value         = prod.id;
    document.getElementById('editProdNombre').value     = prod.nombre;
    document.getElementById('editProdCategoria').value  = prod.categoria;
    document.getElementById('editProdPrecio').value     = prod.precio;
    document.getElementById('editProdDesc').value       = prod.descripcion;

    abrirModal('modalEditarProd');
}

function guardarEdicionProducto() {
    const id     = parseInt(document.getElementById('editProdId').value, 10);
    const prod   = DB.menu.find(function (p) { return p.id === id; });
    if (!prod) return;

    const nombre = document.getElementById('editProdNombre').value.trim();
    const precio = parseFloat(document.getElementById('editProdPrecio').value);

    if (!nombre) {
        showToast('El nombre no puede estar vacío.', 'error');
        return;
    }
    if (!precio || precio <= 0) {
        showToast('Precio inválido.', 'error');
        return;
    }

    prod.nombre      = nombre;
    prod.categoria   = document.getElementById('editProdCategoria').value;
    prod.precio      = precio;
    prod.descripcion = document.getElementById('editProdDesc').value.trim() || 'Sin descripción.';

    cerrarModal('modalEditarProd');
    renderMenu();
    showToast('"' + prod.nombre + '" actualizado.', 'success');
}

function filtrarCategoria(cat) {
    menuFiltroActual = cat;

    /* Actualizar botones */
    ['Todos','Comida','Bebida','Postre','Extra'].forEach(function (c) {
        const btn = document.getElementById('filter-' + c);
        if (btn) btn.classList.toggle('active', c === cat);
    });

    renderMenu();
}

function renderMenu() {
    const grid  = document.getElementById('menuGrid');
    const empty = document.getElementById('menuEmpty');
    const kpi   = document.getElementById('mkpiTotal');

    /* Actualizar KPI */
    kpi.innerHTML = '<i class="bi bi-basket-fill"></i> ' + DB.menu.length + ' producto' + (DB.menu.length !== 1 ? 's' : '');

    /* Filtrar */
    const lista = menuFiltroActual === 'Todos'
        ? DB.menu
        : DB.menu.filter(function (p) { return p.categoria === menuFiltroActual; });

    /* Limpiar cards previas */
    grid.querySelectorAll('.prod-card').forEach(function (el) { el.remove(); });

    if (lista.length === 0) {
        empty.style.display = 'flex';
        if (menuFiltroActual !== 'Todos') {
            empty.querySelector('p').textContent = 'Sin productos en esta categoría.';
        } else {
            empty.querySelector('p').textContent = 'No hay productos en el menú.';
        }
        return;
    }

    empty.style.display = 'none';

    lista.forEach(function (prod) {
        const card = document.createElement('div');
        card.className = 'prod-card';

        const catEmojis = { Comida: '🍽️', Bebida: '🥤', Postre: '🍮', Extra: '✨' };
        
        card.innerHTML = `
            <div class="prod-header">
                <div class="prod-icon-wrap cat-ico--${prod.categoria}" style="font-size:1.5rem">
                    ${catEmojis[prod.categoria] || '📌'}
                </div>
                <div class="prod-actions">
                    <button class="btn-card-action btn-card-action--edit" onclick="editarProducto(${prod.id})" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-card-action btn-card-action--del" onclick="eliminarProducto(${prod.id})" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
                </div>
            </div>
            <div class="prod-body">
                <span class="prod-name" title="${prod.nombre}">${prod.nombre}</span>
                <span class="prod-price">C$ ${prod.precio.toFixed(2)}</span>
            </div>`;

        grid.appendChild(card);
    });
}


/* ══════════════════════════════════════════════
   BOLSA DEL DÍA
══════════════════════════════════════════════ */
function formato12h(horaStr) {
    if (!horaStr || horaStr.indexOf(':') === -1) return horaStr;
    const partes = horaStr.split(':');
    let h = parseInt(partes[0], 10);
    const m = partes[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return typeof h === 'number' && !isNaN(h) ? h + ':' + m + ' ' + ampm : horaStr;
}

function toggleBolsaDetalle(idx) {
    const row = document.getElementById('boldet-' + idx);
    const icon = document.getElementById('boldet-icon-' + idx);
    if (!row) return;
    if (row.style.display === 'none') {
        row.style.display = 'table-row';
        if(icon) icon.className = 'bi bi-chevron-up bolsa-chevron';
    } else {
        row.style.display = 'none';
        if(icon) icon.className = 'bi bi-chevron-down bolsa-chevron';
    }
}

function renderBolsa() {
    const tbody = document.getElementById('bolsaBody');
    const total = DB.bolsa.reduce(function (s, b) { return s + b.total; }, 0);

    document.getElementById('bolsaTotal').textContent = 'C$' + total.toFixed(2);

    if (DB.bolsa.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="table-empty"><i class="bi bi-inbox"></i> Sin registros por el momento</td></tr>';
        return;
    }

    tbody.innerHTML = DB.bolsa.map(function (b, idx) {
        return '<tr class="bolsa-main-row" onclick="toggleBolsaDetalle(' + idx + ')">'
             + '<td data-label="Mesa" style="font-weight:700;color:var(--text-primary)">Mesa ' + b.mesa + '</td>'
             + '<td data-label="Total" style="font-weight:800;color:var(--accent-green)">C$' + b.total.toFixed(2) + '</td>'
             + '<td data-label="Hora">' + formato12h(b.hora) + '</td>'
             + '<td data-label="Mesero">' + b.mesero + ' <i id="boldet-icon-' + idx + '" class="bi bi-chevron-down bolsa-chevron"></i></td>'
             + '</tr>'
             + '<tr id="boldet-' + idx + '" class="bolsa-det-row" style="display:none;">'
             + '<td colspan="4">'
             + '<div class="bolsa-det-content">'
             + '<span class="bdc-label"><i class="bi bi-receipt"></i> Detalle de consumo</span><br>'
             + b.consumo
             + '</div></td>'
             + '</tr>';
    }).join('');
}


/* ══════════════════════════════════════════════
   MODALES
══════════════════════════════════════════════ */
function abrirModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
}

/* Cerrar modal al hacer clic en el backdrop */
document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
    bd.addEventListener('click', function (e) {
        if (e.target === bd) cerrarModal(bd.id);
    });
});

/* Cerrar modal con Escape */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(function (bd) {
            cerrarModal(bd.id);
        });
    }
});


/* ══════════════════════════════════════════════
   INIT (datos demo para ver el panel de inmediato)
══════════════════════════════════════════════ */
(function seedDemo() {
    /* Auto-fill de credenciales para tu demo rápido */
    setTimeout(function() {
        const u = document.getElementById('loginUser');
        const p = document.getElementById('loginPass');
        if (u && p && !u.value) {
            u.value = 'Bryan MQ';
            p.value = '241299';
        }
    }, 100);
    /* Admin demo */
    DB.admins.push({ nombre: 'Bryan Antonio Muñoz Quezada', usuario: 'Bryan MQ', password: '241299' });

    /* Mesas demo */
    DB.mesas.push({ id: DB.mesaIdCounter++, numero: 1, estado: 'ocupada', qr: null });
    DB.mesas.push({ id: DB.mesaIdCounter++, numero: 2, estado: 'libre',   qr: null });
    DB.mesas.push({ id: DB.mesaIdCounter++, numero: 3, estado: 'espera',  qr: null });

    /* Trabajadores demo */
    DB.trabajadores.push({ id: DB.trabIdCounter++, nombre: 'Carlos López',    usuario: 'carlos',  rol: 'Mesero', codigo: '123456' });
    DB.trabajadores.push({ id: DB.trabIdCounter++, nombre: 'Sofía Martínez',  usuario: 'sofia',   rol: 'Mesero', codigo: '654321' });
    DB.trabajadores.push({ id: DB.trabIdCounter++, nombre: 'Luis Hernández',  usuario: 'luis',    rol: 'Caja', codigo: '889900'   });

    /* Bolsa demo */
    DB.bolsa.push({ mesa: 1, consumo: 'Almuerzo x2', total: 280.00, hora: '12:35', mesero: 'Carlos' });
    DB.bolsa.push({ mesa: 3, consumo: 'Bebidas',     total: 95.50,  hora: '13:10', mesero: 'Sofía'  });

    /* Menú demo */
    DB.menu.push({ id: DB.menuIdCounter++, nombre: 'Pollo a la plancha',  categoria: 'Comida', precio: 120.00, descripcion: 'Pechuga de pollo asada con verduras salteadas y arroz.', imagen: 'bi-fire' });
    DB.menu.push({ id: DB.menuIdCounter++, nombre: 'Jugo natural',        categoria: 'Bebida', precio: 45.00,  descripcion: 'Jugo de frutas frescas de temporada.', imagen: 'bi-droplet-fill' });
    DB.menu.push({ id: DB.menuIdCounter++, nombre: 'Flan de vainilla',    categoria: 'Postre', precio: 55.00,  descripcion: 'Clásico flan horneado con caramelo casero.', imagen: 'bi-cake2-fill' });
    DB.menu.push({ id: DB.menuIdCounter++, nombre: 'Gaseosa 600ml',       categoria: 'Bebida', precio: 35.00,  descripcion: 'Bebida gaseosa fría en botella.', imagen: 'bi-cup-straw' });
    DB.menu.push({ id: DB.menuIdCounter++, nombre: 'Arroz con pollo',     categoria: 'Comida', precio: 110.00, descripcion: 'Arroz cremoso con trozos de pollo y especias.', imagen: 'bi-basket2-fill' });
    DB.menu.push({ id: DB.menuIdCounter++, nombre: 'Panera del día',      categoria: 'Extra',  precio: 25.00,  descripcion: 'Selección de panes artesanales con mantequilla.', imagen: 'bi-star-fill' });
})();
