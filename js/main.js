// ============================================================
// MAIN.JS
// Portafolio personal
// ============================================================


// ============================================================
// 1. REFERENCIAS GENERALES
// ============================================================

const app = document.getElementById('app');
const navLinks = document.querySelectorAll('.nav-links a');
const themeButton = document.getElementById('themeToggle');
const body = document.body;
const navEl = document.querySelector('nav');
let currentPage = null;
const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const themeButtonMobile = document.getElementById('themeToggleMobile');
const footerEl = document.querySelector('footer');

// links inside sidebar
let sidebarNavLinks = sidebar ? sidebar.querySelectorAll('.sidebar-nav a') : [];


// ============================================================
// 2. NAVEGACIÓN SPA
// ============================================================

async function loadPage(pageName) {


    currentPage = pageName;

    try {

        // --------------------------------------------------------
        // Actualizar menú
        // --------------------------------------------------------

        navLinks.forEach(link => {
            link.classList.toggle(
                'active',
                link.dataset.page === pageName
            );
        });
        // Sincronizar estado activo con los links clonados
        const mobileLinksNow = document.querySelectorAll('.mobile-nav a');
            const sidebarLinksNow = document.querySelectorAll('.sidebar-nav a');
        mobileLinksNow.forEach(link => link.classList.toggle('active', link.dataset.page === pageName));
        sidebarLinksNow.forEach(link => link.classList.toggle('active', link.dataset.page === pageName));


        // --------------------------------------------------------
        // Cargar HTML
        // --------------------------------------------------------

        const response = await fetch(
            `pages/${pageName}.html`
        );

        if (!response.ok) {
            throw new Error(
                `No se pudo cargar la página: ${pageName}`
            );
        }

        const html = await response.text();

        app.innerHTML = html;

        // Asegurar que el contenido inyectado sea visible:
        // si la página trae elementos con la clase `.page`, marcarlos como activos;
        // si no, marcar el primer hijo como activo para evitar que reglas `.page {display:none}` oculten todo.
        try {
            const pages = app.querySelectorAll('.page');
            if (pages.length) {
                pages.forEach(p => p.classList.add('active'));
            } else if (app.firstElementChild) {
                app.firstElementChild.classList.add('active');
            }
        } catch (e) { /* silent */ }

        // Ajustar padding superior para que el título 'fotografia' empiece justo debajo del nav
        requestAnimationFrame(() => {
            setAppPaddingForPage(pageName);
            // adicional: forzar cero padding/margin en la cabecera de fotografia
            if (pageName === 'fotografia') {
                try {
                    app.style.paddingTop = '0px';
                    document.documentElement.style.scrollPaddingTop = '0px';
                    const header = app.querySelector('.fotografia-header');
                    if (header) { header.style.marginTop = '0px'; header.style.paddingTop = '0px'; }
                    const title = app.querySelector('.section-title');
                    if (title) title.style.marginTop = '0px';
                } catch (e) { /* silent */ }
            }
        });

        // No marcar páginas aquí — mantener estructura existente


        // --------------------------------------------------------
        // Ir al inicio
        // --------------------------------------------------------

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });


        // --------------------------------------------------------
        // Inicializar componentes
        // --------------------------------------------------------

        if (pageName === 'fotografia') {
            initPhotoGallery();
        }

        if (pageName === 'inicio') {
            initProfileCoin();
        }

        // Asegurar offset correcto tras renderizar la página
        try { updateMainOffset(); } catch (e) { /* silent */ }

    } catch (error) {

        console.error(error);

        app.innerHTML = `
            <div class="page-error">
                <i class="fas fa-exclamation-triangle"></i>

                <p>
                    No se pudo cargar la página.
                </p>
            </div>
        `;

    }

}

// Giro manual de la foto de portada en escritorio.
function initProfileCoin() {
    const coin = app.querySelector('.profile-coin');
    const inner = coin?.querySelector('.profile-coin-inner');

    if (!coin || !inner) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        let startX = 0;
        let startRotation = 0;
        let rotation = 0;
        let dragging = false;
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0;
        let inertiaFrame = null;
        const automaticRotationDuration = 12;

        const renderRotation = () => {
            inner.style.transform = `rotateY(${rotation}deg)`;
        };

        const getVisibleRotation = () => {
            const transform = window.getComputedStyle(inner).transform;

            if (!transform.startsWith('matrix3d(')) return 0;

            const values = transform
                .slice(9, -1)
                .split(',')
                .map(Number);

            return Math.atan2(-values[2], values[0]) * (180 / Math.PI);
        };

        const stopInertia = () => {
            if (inertiaFrame) {
                cancelAnimationFrame(inertiaFrame);
                inertiaFrame = null;
            }
        };

        const resumeAutomaticRotation = () => {
            // Sincroniza la fase de la animación con la posición donde terminó el gesto.
            const normalizedRotation = ((rotation % 360) + 360) % 360;
            inner.style.animationDelay =
                `-${(normalizedRotation / 360) * automaticRotationDuration}s`;
            inner.style.transform = '';
            coin.classList.remove('is-manual');
        };

        const startInertia = () => {
            let previousTime = performance.now();

            const animate = now => {
                const elapsed = now - previousTime;
                previousTime = now;

                rotation += velocity * elapsed;
                // Fricción progresiva: conserva la sensación de impulso y frena suavemente.
                velocity *= Math.pow(0.92, elapsed / 16.67);
                renderRotation();

                if (Math.abs(velocity) > 0.003) {
                    inertiaFrame = requestAnimationFrame(animate);
                } else {
                    inertiaFrame = null;
                    resumeAutomaticRotation();
                }
            };

            inertiaFrame = requestAnimationFrame(animate);
        };

        coin.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse') return;

            stopInertia();
            rotation = getVisibleRotation();
            coin.classList.add('is-manual');
            renderRotation();
            startX = event.clientX;
            startRotation = rotation;
            lastX = event.clientX;
            lastTime = event.timeStamp;
            velocity = 0;
            dragging = true;
            coin.setPointerCapture(event.pointerId);
        });

        coin.addEventListener('pointermove', event => {
            if (!dragging) return;

            const distance = event.clientX - startX;

            if (Math.abs(distance) > 4) event.preventDefault();

            rotation = startRotation + distance * 0.75;
            const elapsed = Math.max(event.timeStamp - lastTime, 1);
            const instantVelocity = ((event.clientX - lastX) * 0.75) / elapsed;

            // Suaviza pequeñas variaciones del sensor táctil antes de aplicar la inercia.
            velocity = velocity * 0.7 + instantVelocity * 0.3;
            lastX = event.clientX;
            lastTime = event.timeStamp;
            renderRotation();
        });

        const stopDragging = event => {
            if (!dragging) return;
            dragging = false;

            if (coin.hasPointerCapture(event.pointerId)) {
                coin.releasePointerCapture(event.pointerId);
            }

            if (event.type === 'pointerup') {
                if (Math.abs(velocity) > 0.003) {
                    startInertia();
                } else {
                    resumeAutomaticRotation();
                }
            } else {
                resumeAutomaticRotation();
            }
        };

        coin.addEventListener('pointerup', stopDragging);
        coin.addEventListener('pointercancel', stopDragging);
        return;
    }

    coin.addEventListener('click', () => {
        const isFlipped = coin.classList.toggle('is-flipped');
        coin.setAttribute('aria-pressed', String(isFlipped));
    });
}

// Ajuste dinámico de padding-top usando la altura real del nav para la página fotografia
function setAppPaddingForPage(pageName) {
    if (!app) return;
    const navHeight = navEl ? navEl.offsetHeight : 0;

    if (pageName === 'fotografia') {
        app.style.paddingTop = navHeight + 'px';
        document.documentElement.style.scrollPaddingTop = navHeight + 'px';
    } else {
        app.style.paddingTop = '';
        document.documentElement.style.scrollPaddingTop = '';
    }
}

// Ajustar padding y offset al cambiar tamaño
function updateMainOffset(extraPx = 8) {
    // Use CSS variables so transitions are handled by CSS rather than inline styles.
    const root = document.documentElement;
    if (!root) return;

    // On small screens, reset to zero so content is full-width
    if (window.innerWidth <= 992) {
        root.style.setProperty('--sidebar-width', '0px');
        root.style.setProperty('--sidebar-extra', extraPx + 'px');
        // remove any inline margins that could override CSS variable-driven layout
        try { if (app) app.style.removeProperty('margin-left'); } catch (e) {}
        try { if (footerEl) footerEl.style.removeProperty('margin-left'); } catch (e) {}
        return;
    }

    const width = sidebar ? sidebar.offsetWidth : 0;

    if (document.body.classList.contains('sidebar-collapsed')) {
        root.style.setProperty('--sidebar-width', '0px');
    } else {
        root.style.setProperty('--sidebar-width', width + 'px');
    }

    root.style.setProperty('--sidebar-extra', extraPx + 'px');
    // ensure no inline margin-left remains on main/footer (so CSS variables take effect)
    try { if (app) app.style.removeProperty('margin-left'); } catch (e) {}
    try { if (footerEl) footerEl.style.removeProperty('margin-left'); } catch (e) {}

}

window.addEventListener('resize', () => {
    if (currentPage === 'fotografia') setAppPaddingForPage(currentPage);
    updateMainOffset();
});


// ============================================================
// EVENTOS DE NAVEGACIÓN
// ============================================================

navLinks.forEach(link => {

    link.addEventListener('click', event => {

        event.preventDefault();

        const page = link.dataset.page;

        if (!page) return;

        history.pushState(
            { page },
            '',
            `#${page}`
        );

        loadPage(page);
            // cerrar sidebar en móviles al navegar
            if (window.innerWidth <= 992) closeSidebar();

    });

});
    // --- Sidebar unified behavior ---

    // Re-bind sidebar links to SPA navigation
    function bindSidebarLinks() {
        sidebarNavLinks = sidebar ? sidebar.querySelectorAll('.sidebar-nav a') : [];
        sidebarNavLinks.forEach(link => {
            link.removeEventListener('click', sidebarLinkHandler);
            link.addEventListener('click', sidebarLinkHandler);
        });
    }

    function sidebarLinkHandler(event) {
        event.preventDefault();
        const page = this.dataset.page;
        if (!page) return;
        history.pushState({ page }, '', `#${page}`);
        loadPage(page);
        if (window.innerWidth <= 992) closeSidebar();
    }

    bindSidebarLinks();

    function openSidebar() {
        if (!sidebar) return;
        if (window.innerWidth <= 992) {
            sidebar.classList.add('open');
            if (sidebarOverlay) { sidebarOverlay.hidden = false; sidebarOverlay.style.display = 'block'; setTimeout(()=> sidebarOverlay.style.opacity = '1', 10); }
            if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('aria-expanded', 'true');
            // ajustar offset (aunque en móvil no se aplica, es seguro llamar)
            updateMainOffset();
        } else {
            document.body.classList.toggle('sidebar-collapsed');
            const expanded = sidebarToggleBtn.getAttribute('aria-expanded') === 'true';
            if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            updateMainOffset();
        }
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('open');
        if (sidebarOverlay) { sidebarOverlay.style.opacity = '0'; setTimeout(()=> { sidebarOverlay.hidden = true; sidebarOverlay.style.display = 'none'; }, 250); }
        if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('aria-expanded', 'false');
        // reposicionar main
        updateMainOffset();
    }

    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                const isOpen = sidebar.classList.contains('open');
                if (isOpen) closeSidebar(); else openSidebar();
            } else {
                document.body.classList.toggle('sidebar-collapsed');
                const expanded = sidebarToggleBtn.getAttribute('aria-expanded') === 'true';
                sidebarToggleBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                // reajustar margen del main cuando se colapsa/expande la sidebar
                updateMainOffset();
            }
        });
    }

    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // Enlazar botón de tema dentro del sidebar (si existe)
    if (themeButtonMobile) {
        themeButtonMobile.addEventListener('click', () => {
            if (body.classList.contains('theme-sober')) enableCrazyMode(); else enableSoberMode();
        });
    }


// ============================================================
// BOTONES ATRÁS / ADELANTE DEL NAVEGADOR
// ============================================================

window.addEventListener('popstate', event => {

    const page =
        event.state?.page ||
        window.location.hash.replace('#', '') ||
        'inicio';

    loadPage(page);

});


// ============================================================
// CARGA INICIAL
// ============================================================

const initialPage =
    window.location.hash.replace('#', '') ||
    'inicio';

loadPage(initialPage);


// ============================================================
// 3. CAMBIO DE TEMA
// ============================================================

function updateThemeButton() {

    if (!themeButton) return;

    const isCrazy =
        body.classList.contains('theme-loco');

    themeButton.innerHTML =
        isCrazy
            ? '🧊 NO'
            : '🌪️ NO!';

}


function enableCrazyMode() {

    body.classList.remove('theme-sober');
    body.classList.add('theme-loco');

    updateThemeButton();

    // BUG CORREGIDO: antes, si el usuario apagaba y volvía a encender
    // el modo loco, "particlesStarted" seguía en true y nunca se
    // volvía a llamar a initParticles(), pero stopParticles() SÍ había
    // cancelado el requestAnimationFrame. Resultado: canvas congelado
    // (partículas quietas o ausentes) a partir del segundo toggle.
    // Ahora initParticles() se encarga de crear las partículas solo
    // una vez, pero siempre puede re-arrancar el loop de animación.
    initParticles();

}


function enableSoberMode() {

    body.classList.remove('theme-loco');
    body.classList.add('theme-sober');

    updateThemeButton();

    stopParticles();

}


if (themeButton) {

    themeButton.addEventListener('click', () => {

        if (body.classList.contains('theme-sober')) {
            enableCrazyMode();
        } else {
            enableSoberMode();
        }

    });

}


updateThemeButton();


// ============================================================
// 4. PARTÍCULAS
// ============================================================

let particles = [];
let particleAnimation = null;

let mouseX = null;
let mouseY = null;

// BUG CORREGIDO: antes, cada llamada a initParticles() volvía a
// registrar listeners de 'mousemove', 'mouseleave' y 'resize' en
// window. Como enableCrazyMode() podía llamar a initParticles()
// más de una vez (ver bug anterior), los listeners se acumulaban
// sin límite (fuga de memoria + partículas cada vez más "pesadas"
// de procesar). Esta bandera asegura que la creación de partículas
// y el registro de listeners ocurra una sola vez en toda la sesión.
let particlesReady = false;
let particlesCanvas = null;
let particlesCtx = null;


function initParticles() {

    const canvas =
        document.getElementById('particles-canvas');

    if (!canvas) return;

    particlesCanvas = canvas;
    particlesCtx = canvas.getContext('2d');
    const ctx = particlesCtx;


    // --------------------------------------------------------
    // Tamaño
    // --------------------------------------------------------

    function resizeCanvas() {

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

    }


    // Si ya se creó todo antes, solo reanudamos el loop de
    // animación (sin recrear partículas ni duplicar listeners).
    if (particlesReady) {
        animateParticles();
        return;
    }

    resizeCanvas();


    // --------------------------------------------------------
    // Partícula
    // --------------------------------------------------------

    class Particle {

        constructor() {

            this.x =
                Math.random() * canvas.width;

            this.y =
                Math.random() * canvas.height;

            this.size =
                Math.random() * 3 + 1;

            this.speedX =
                (Math.random() - 0.5) * 2;

            this.speedY =
                (Math.random() - 0.5) * 2;

            this.color =
                `hsl(${Math.random() * 60 + 280}, 80%, 60%)`;

        }


        update() {

            this.x += this.speedX;
            this.y += this.speedY;


            // Rebote horizontal

            if (
                this.x > canvas.width ||
                this.x < 0
            ) {
                this.speedX *= -1;
            }


            // Rebote vertical

            if (
                this.y > canvas.height ||
                this.y < 0
            ) {
                this.speedY *= -1;
            }


            // Interacción con mouse

            if (
                mouseX !== null &&
                mouseY !== null
            ) {

                const dx =
                    mouseX - this.x;

                const dy =
                    mouseY - this.y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );

                if (distance < 150) {

                    const force =
                        (150 - distance) / 150;

                    this.x -=
                        dx * force * 0.02;

                    this.y -=
                        dy * force * 0.02;

                }

            }

        }


        draw() {

            ctx.beginPath();

            ctx.arc(
                this.x,
                this.y,
                this.size,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                this.color;

            ctx.shadowColor =
                'rgba(255,0,200,0.5)';

            ctx.shadowBlur = 10;

            ctx.fill();

        }

    }


    // --------------------------------------------------------
    // Crear partículas
    // --------------------------------------------------------

    const count =
        Math.min(
            150,
            Math.floor(
                canvas.width *
                canvas.height /
                8000
            )
        );


    particles = Array.from(
        { length: count },
        () => new Particle()
    );


    // --------------------------------------------------------
    // Mouse y resize (se registran UNA sola vez)
    // --------------------------------------------------------

    window.addEventListener(
        'mousemove',
        event => {

            mouseX = event.clientX;
            mouseY = event.clientY;

        }
    );


    window.addEventListener(
        'mouseleave',
        () => {

            mouseX = null;
            mouseY = null;

        }
    );


    window.addEventListener(
        'resize',
        resizeCanvas
    );


    particlesReady = true;

    animateParticles();

}


// Función de animación separada de la creación: así, al reactivar
// el modo loco, solo se vuelve a arrancar el loop sin recrear nada.
function animateParticles() {

    if (!particlesCanvas || !particlesCtx) return;

    const canvas = particlesCanvas;
    const ctx = particlesCtx;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Dibujar partículas

    particles.forEach(particle => {

        particle.update();
        particle.draw();

    });


    // Dibujar conexiones

    for (
        let i = 0;
        i < particles.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < particles.length;
            j++
        ) {

            const dx =
                particles[i].x -
                particles[j].x;

            const dy =
                particles[i].y -
                particles[j].y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (distance < 120) {

                ctx.beginPath();

                ctx.moveTo(
                    particles[i].x,
                    particles[i].y
                );

                ctx.lineTo(
                    particles[j].x,
                    particles[j].y
                );

                ctx.strokeStyle =
                    `rgba(
                        200,
                        100,
                        255,
                        ${0.1 * (1 - distance / 120)}
                    )`;

                ctx.lineWidth = 0.8;

                ctx.stroke();

            }

        }

    }


    particleAnimation =
        requestAnimationFrame(animateParticles);

}


function stopParticles() {

    if (particleAnimation) {

        cancelAnimationFrame(
            particleAnimation
        );

        particleAnimation = null;

    }


    const canvas =
        document.getElementById('particles-canvas');

    if (!canvas) return;

    const ctx =
        canvas.getContext('2d');

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

}


// ============================================================
// 5. OBJETOS FLOTANTES
// ============================================================

function initFloatingObjects() {

    const objects =
        document.querySelectorAll(
            '.float-item'
        );


    objects.forEach(item => {

        item.addEventListener(
            'mousemove',
            event => {

                const rect =
                    item.getBoundingClientRect();

                const x =
                    event.clientX -
                    rect.left -
                    rect.width / 2;

                const y =
                    event.clientY -
                    rect.top -
                    rect.height / 2;


                item.style.transform =
                    `translate(
                        ${x * 0.2}px,
                        ${y * 0.2}px
                    )
                    scale(1.2)
                    rotate(${x * 0.05}deg)`;

            }
        );


        item.addEventListener(
            'mouseleave',
            () => {

                item.style.transform =
                    'translate(0,0) scale(1) rotate(0deg)';

            }
        );

    });

}


// Ejecutar una sola vez

initFloatingObjects();


// ============================================================
// 6. GALERÍA DE FOTOGRAFÍA
// ============================================================

function initPhotoGallery() {

    const wrapper =
        document.getElementById(
            'verticalGalleryWrapper'
        );

    const track =
        document.getElementById(
            'verticalGalleryTrack'
        );

    const filterContainer =
        document.getElementById(
            'galleryFilters'
        );

    const featuredContainer =
        document.getElementById(
            'featuredGrid'
        );


    if (!wrapper || !track) {
        return;
    }


    const photoPath =
        'img/fotos/';

    const categoryOrder = [
        'Todo',
        'Retrato',
        'Paisaje',
        'Urbano',
        'Animalista',
        'Otros'
    ];

    // ------------------------------------------------------------
    // ⚠️ CATÁLOGO DE FOTOS — REEMPLAZAR CON TUS FOTOS REALES
    // ------------------------------------------------------------
    // BUG CORREGIDO (parcial): antes esto generaba 30 nombres
    // inventados (foto_001.jpg ... foto_030.jpg) con el MISMO texto
    // de historia repetido 30 veces. Si esos archivos no existen en
    // tu carpeta img/fotos/, verás iconos de imagen rota.
    //
    // Ya no podemos "adivinar" tus fotos reales por ti, pero:
    //  1) Añadimos abajo un manejador onerror para que una imagen
    //     rota no se vea fea (ver createPhoto/createFeaturedCard).
    //  2) Deja este arreglo como el ÚNICO lugar que debes editar:
    //     agrega un objeto por cada foto real que subas a
    //     img/fotos/, con su nombre de archivo exacto.
    //
    // Ejemplo de cómo reemplazar el catálogo por fotos reales:
    //
    // const photoCatalog = [
    //     {
    //         filename: 'lago-titicaca.jpg',
    //         category: 'Paisaje',
    //         title: 'Amanecer en el Titicaca',
    //         story: 'Historia real y propia de esta foto...'
    //     },
    //     // ...una entrada por cada foto
    // ];
    //
    // Mientras tanto, dejamos el generador de ejemplo para que la
    // galería no quede vacía durante el desarrollo:
    const photoCatalog =
        Array.from(
            { length: 30 },
            (_, index) => {

                const filename =
                    `foto_${String(index + 1).padStart(3, '0')}.jpg`;

                let category = 'Otros';

                if (index < 7) category = 'Retrato';
                else if (index < 15) category = 'Paisaje';
                else if (index < 22) category = 'Urbano';
                else if (index < 28) category = 'Animalista';

                return {
                    filename,
                    category,
                    title: `${category} · Serie ${index + 1}`,
                    story: 'Una mirada personal que combina composición, luz y emoción para contar una historia visual propia.'
                };
            }
        );

    let activeFilter = 'Todo';


    function getVisiblePhotos() {
        return activeFilter === 'Todo'
            ? photoCatalog
            : photoCatalog.filter(photo => photo.category === activeFilter);
    }


    function createFilterButtons() {
        if (!filterContainer) return;

        filterContainer.innerHTML = '';

        categoryOrder.forEach(category => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'filter-chip';
            button.textContent = category;

            if (category === activeFilter) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                activeFilter = category;
                renderGallery();
                renderFeatured();
                createFilterButtons();
            });

            filterContainer.appendChild(button);
        });
    }


    function createFeaturedCard(photo) {
        const card = document.createElement('article');
        card.className = 'featured-card';

        const image = document.createElement('img');
        image.src = photoPath + photo.filename;
        image.alt = photo.title;
        image.loading = 'lazy';

        // BUG CORREGIDO: si el archivo no existe (fotos de ejemplo),
        // en vez de mostrar el icono roto del navegador, marcamos la
        // tarjeta como "sin imagen" y mostramos un placeholder con
        // ícono, ver estilos .featured-card.no-image en styles.css
        image.addEventListener('error', () => {
            card.classList.add('no-image');
            image.remove();
        }, { once: true });

        const label = document.createElement('span');
        label.className = 'featured-label';
        label.textContent = photo.category;

        card.append(image, label);
        return card;
    }


    function renderFeatured() {
        if (!featuredContainer) return;

        const featuredCategories = ['Retrato', 'Paisaje', 'Urbano', 'Animalista'];
        const featuredPhotos = featuredCategories
            .map(category => photoCatalog.find(photo => photo.category === category))
            .filter(Boolean)
            .slice(0, 0);

        featuredContainer.innerHTML = '';
        featuredPhotos.forEach(photo => {
            featuredContainer.appendChild(createFeaturedCard(photo));
        });
    }


    function createPhoto(photo) {

        const item =
            document.createElement('article');

        item.className =
            'gallery-item';

        item.dataset.category = photo.category;

        const inner =
            document.createElement('div');

        inner.className =
            'gallery-item-inner';


        const front =
            document.createElement('div');

        front.className =
            'gallery-item-front';


        const image =
            document.createElement('img');

        image.src =
            photoPath + photo.filename;

        image.alt =
            photo.title;

        image.loading =
            'lazy';

        image.draggable =
            false;

        // BUG CORREGIDO: mismo caso que en createFeaturedCard, evita
        // el icono de imagen rota cuando el archivo aún no existe.
        image.addEventListener('error', () => {
            front.classList.add('no-image');
            image.remove();
        }, { once: true });

        front.appendChild(image);


        const back =
            document.createElement('div');

        back.className =
            'gallery-item-back';

        back.innerHTML = `
            <h4>${photo.title}</h4>
            <p>${photo.story}</p>
            <small>📖 ${photo.category} · Haz clic para volver a la foto</small>
        `;

        inner.append(
            front,
            back
        );

        item.appendChild(inner);

        item.addEventListener(
            'click',
            () => {
                item.classList.toggle('flipped');
            }
        );

        return item;

    }


    function renderGallery() {
        const visiblePhotos = getVisiblePhotos();

        track.innerHTML = '';

        const fragment =
            document.createDocumentFragment();

        visiblePhotos.forEach(photo => {
            fragment.appendChild(createPhoto(photo));
        });

        track.appendChild(fragment);
        track.style.transform = 'none';
        track.style.transition = 'none';

        wrapper.style.cursor = 'default';
        wrapper.onwheel = null;
        wrapper.ondragstart = null;
    }


    createFilterButtons();
    renderFeatured();
    renderGallery();

}


// ============================================================
// FIN DEL MAIN.JS
// ============================================================

console.log(
    '✓ Portafolio cargado correctamente'
);
