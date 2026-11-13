
/* Keep the existing filter controls and their listeners when opening the mobile drawer. */
(() => {

    // Identify sidebar and main content
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('main');

    // Create placeholder for the desktop sidebar location
    const placeholder = document.createComment('Desktop sidebar location');
    sidebar.before(placeholder);

    // Create mobile filter drawer
    const drawer = document.createElement('dialog');
    drawer.className = 'mobile-filter-drawer';
    drawer.id = 'mobile-filters';
    drawer.setAttribute('aria-label', 'Dashboard filters');

    // Create drawer close button
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mobile-filter-close';
    close.textContent = 'Done ×';
    close.setAttribute('aria-label', 'Close filters');

    drawer.append(close);
    document.body.append(drawer);

    // Create mobile toolbar
    const bar = document.createElement('div');
    bar.className = 'mobile-toolbar';

    // Create filter toggle button
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-filter-toggle';
    button.textContent = '☰ Filters';
    button.setAttribute('aria-controls', drawer.id);
    button.setAttribute('aria-expanded', 'false');

    // Add dashboard branding
    const brand = document.createElement('span');
    brand.textContent = 'Group 4 · Road Injury Explorer';

    bar.append(brand, button);
    main.before(bar);

    // Detect mobile screen size
    const mobile = matchMedia('(max-width: 767px)');

    // Move sidebar according to screen size
    function sync() {
        if (mobile.matches) {
            drawer.append(sidebar);
        } else {
            if (drawer.open) {
                drawer.close();
            }

            placeholder.after(sidebar);
        }
    }

    // Open mobile filter drawer
    button.onclick = () => {
        drawer.showModal();

        button.setAttribute('aria-expanded', 'true');
        document.body.classList.add('filters-open');

        close.focus();
    };

    // Close drawer using the close button
    close.onclick = () => drawer.close();

    // Close drawer when clicking outside its content
    drawer.addEventListener('click', e => {
        if (e.target === drawer) {
            const r = drawer.getBoundingClientRect();

            if (
                e.clientX < r.left ||
                e.clientX > r.right ||
                e.clientY < r.top ||
                e.clientY > r.bottom
            ) {
                drawer.close();
            }
        }
    });

    // Reset drawer state when closed
    drawer.addEventListener('close', () => {
        button.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('filters-open');

        if (mobile.matches) {
            button.focus();
        }
    });

    // Update sidebar position when screen size changes
    mobile.addEventListener('change', sync);

    // Initialise sidebar layout
    sync();
})();
