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


// ============================================================
// 2. NAVEGACIÓN SPA
// ============================================================

async function loadPage(pageName) {

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

    });

});


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
            ? '🧊 Modo Sobrio'
            : '🌪️ Modo Loco';

}


function enableCrazyMode() {

    body.classList.remove('theme-sober');
    body.classList.add('theme-loco');

    updateThemeButton();

    if (!window.particlesStarted) {

        initParticles();

        window.particlesStarted = true;

    }

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


function initParticles() {

    const canvas =
        document.getElementById('particles-canvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');


    // --------------------------------------------------------
    // Tamaño
    // --------------------------------------------------------

    function resizeCanvas() {

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

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
    // Animación
    // --------------------------------------------------------

    function animate() {

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
            requestAnimationFrame(animate);

    }


    animate();


    // --------------------------------------------------------
    // Mouse
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
            .slice(0, 4);

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