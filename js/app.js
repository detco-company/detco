/**
 * Deepak Trading Corp - Interactive Web Experience & B2B Engine
 * Core Logic: Live Search, B2B Category Filter, Count-Up Stats, Modal validations
 */

document.addEventListener('DOMContentLoaded', () => {
  // Helper to show a premium, floating B2B Toast Notification
  function showB2bToast(message, type = 'error') {
    const existing = document.querySelector('.b2b-toast');
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'b2b-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: ${type === 'success' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(220, 38, 38, 0.85)'};
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.15);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: var(--font-body, sans-serif);
      font-size: 0.88rem;
      font-weight: 600;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    const icon = type === 'success' 
      ? `<svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      : `<svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;

    toast.innerHTML = `${icon} <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }
  window.showB2bToast = showB2bToast;

  // 1. Sticky Header — keep the curved header visible at all times

  // Save scroll position when navigating to product detail pages via anchor tags
  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    if (targetLink && targetLink.getAttribute('href') && targetLink.getAttribute('href').includes('product.html')) {
      sessionStorage.setItem('detco_scroll_restore', window.scrollY);
    }
  });

  // 2. Mobile Menu Drawer Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('drawer-active');
      // Morph menu toggle stripes into X
      const spans = menuToggle.querySelectorAll('span');
      if (navLinks.classList.contains('drawer-active')) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Automatically collapse mobile drawer upon clicking any anchor links inside it
    const drawerLinks = navLinks.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('drawer-active')) {
          navLinks.classList.remove('drawer-active');
          const spans = menuToggle.querySelectorAll('span');
          spans[0].style.transform = 'none';
          spans[1].style.opacity = '1';
          spans[2].style.transform = 'none';
        }
      });
    });
  }

  // 3. Dynamic B2B Catalog Rendering & Filtering
  const catalogGrid = document.getElementById('catalogGrid');
  const globalSearchInput = document.getElementById('globalSearch');
  const catalogSearchInput = document.getElementById('catalogSearch');
  const mobileSearchInput = document.getElementById('mobileSearch');
  const explorerContainer = document.getElementById('productMapExplorer');

  let activeCategory = sessionStorage.getItem('activeCategory') || 'all';
  let searchQuery = '';
  let activeBrand = sessionStorage.getItem('activeBrand') || null;
  if (activeBrand === 'null' || activeBrand === '') activeBrand = null;

  function saveFilterState() {
    sessionStorage.setItem('activeCategory', activeCategory);
    sessionStorage.setItem('activeBrand', activeBrand || '');
  }

  const brands = [
    { id: '3m', name: '3M', tagline: 'Authorized Safety Sheeting' },
    { id: 'detco', name: 'DETCO', tagline: 'Premium Safety Solutions' },
    { id: 'darkeye', name: 'Dark Eye', tagline: 'High-Performance Studs' },
    { id: 'nilkamal', name: 'Nilkamal', tagline: 'Quality Utility Cones' },
    { id: 'kataline', name: 'Kataline', tagline: 'Paint & Speed Breakers' },
    { id: 'swarco', name: 'Swarco', tagline: 'Premium Reflective Beads' }
  ];

  const categoryNames = {
    'all': 'All Products',
    'road-studs': 'Road Studs',
    'reflective-tapes': 'Reflective Tapes',
    'marking-paint': 'Road Paint',
    'traffic-cones': 'Traffic Cones',
    'speed-breakers': 'Speed Breakers',
    'sign-boards': 'Sign Boards'
  };

  // Parse B2B category deep links from URL query parameters (supports redirect links!)
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get('category');
  const paramBrand = urlParams.get('brand');
  if (paramCategory) {
    activeCategory = paramCategory;
    saveFilterState();
  }
  if (paramBrand) {
    activeBrand = paramBrand;
    saveFilterState();
  }

  // Render Select Product Category
  function renderMapExplorer() {
    if (!explorerContainer) return;
    explorerContainer.innerHTML = '';
    
    // 1. Render Header and Breadcrumb Progress Map
    const header = document.createElement('div');
    header.className = 'map-explorer-header';
    
    const title = document.createElement('div');
    title.className = 'map-explorer-title';
    title.innerHTML = `
      <span>Select Product Category</span>
    `;
    
    const steps = document.createElement('div');
    steps.className = 'map-explorer-steps';
    steps.innerHTML = `
      <span class="map-step ${!activeBrand ? 'active' : ''}">1. Choose Brand</span>
      <span class="map-step-arrow">➔</span>
      <span class="map-step ${activeBrand ? 'active' : ''}">2. Choose Category</span>
    `;
    
    header.appendChild(title);
    header.appendChild(steps);
    explorerContainer.appendChild(header);
    
    // 2. Render Steps View
    if (!activeBrand) {
      // --- STEP 1: CHOOSE BRAND ---
      const brandGrid = document.createElement('div');
      brandGrid.className = 'brand-map-grid';
      
      // "All Products" option card
      const allBrandsCard = document.createElement('div');
      allBrandsCard.className = `brand-map-card ${activeBrand === null ? 'active' : ''}`;
      allBrandsCard.innerHTML = `
        <div class="brand-map-name">All Products</div>
        <div class="brand-map-tagline">View entire safety catalog</div>
      `;
      allBrandsCard.addEventListener('click', () => {
        activeBrand = null;
        activeCategory = 'all';
        saveFilterState();
        renderCatalog();
        renderMapExplorer();
      });
      brandGrid.appendChild(allBrandsCard);
      
      // Each Brand card
      brands.forEach(br => {
        const card = document.createElement('div');
        card.className = `brand-map-card ${activeBrand === br.id ? 'active' : ''}`;
        card.innerHTML = `
          <div class="brand-map-name">${br.name}</div>
          <div class="brand-map-tagline">${br.tagline}</div>
        `;
        card.addEventListener('click', () => {
          activeBrand = br.id;
          activeCategory = 'all';
          saveFilterState();
          renderCatalog();
          renderMapExplorer();
        });
        brandGrid.appendChild(card);
      });
      
      explorerContainer.appendChild(brandGrid);
    } else {
      // --- STEP 2: CHOOSE CATEGORY ---
      const categorySection = document.createElement('div');
      categorySection.className = 'category-map-section';
      
      const brandObj = brands.find(b => b.id === activeBrand) || { name: activeBrand.toUpperCase() };
      
      const subheader = document.createElement('div');
      subheader.style.marginBottom = '15px';
      subheader.innerHTML = `
        <span style="font-size: 0.9rem; color: var(--text-medium);">
          Active Brand: <strong style="color: var(--color-accent); text-transform: uppercase;">${brandObj.name}</strong>. Select a specific product line below:
        </span>
      `;
      categorySection.appendChild(subheader);
      
      // Find all categories that actually have products for this brand
      const rawProducts = window.productsData || [];
      const availableCategoriesMap = {};
      
      rawProducts.forEach(p => {
        if (p.brand === activeBrand || (activeBrand === '3m' && p.isAuthorized3MPartner === true)) {
          availableCategoriesMap[p.category] = (availableCategoriesMap[p.category] || 0) + 1;
        }
      });
      
      const categoryGrid = document.createElement('div');
      categoryGrid.className = 'category-map-grid';
      
      // "Back to Brands" option card (box type)
      const backGridBtn = document.createElement('button');
      backGridBtn.className = 'category-map-btn';
      backGridBtn.style.borderColor = 'var(--text-light)';
      backGridBtn.style.color = 'var(--text-light)';
      backGridBtn.style.backgroundColor = 'var(--color-bg-light)';
      backGridBtn.innerHTML = `
        <span>◀ Back to Brands</span>
      `;
      backGridBtn.addEventListener('click', () => {
        activeBrand = null;
        activeCategory = 'all';
        saveFilterState();
        renderCatalog();
        renderMapExplorer();
      });
      categoryGrid.appendChild(backGridBtn);
      
      // "Show All" option
      const allCount = rawProducts.filter(p => p.brand === activeBrand || (activeBrand === '3m' && p.isAuthorized3MPartner === true)).length;
      const allBtn = document.createElement('button');
      allBtn.className = `category-map-btn ${activeCategory === 'all' ? 'active' : ''}`;
      allBtn.innerHTML = `
        <span>All ${brandObj.name} Products</span>
        <span class="category-badge-count">${allCount}</span>
      `;
      allBtn.addEventListener('click', () => {
        activeCategory = 'all';
        saveFilterState();
        renderCatalog();
        renderMapExplorer();
      });
      categoryGrid.appendChild(allBtn);
      
      // Each matching category pill
      Object.entries(availableCategoriesMap).forEach(([catId, count]) => {
        const catDisplayName = categoryNames[catId] || catId;
        const btn = document.createElement('button');
        btn.className = `category-map-btn ${activeCategory === catId ? 'active' : ''}`;
        btn.innerHTML = `
          <span>${catDisplayName}</span>
          <span class="category-badge-count">${count}</span>
        `;
        btn.addEventListener('click', () => {
          activeCategory = catId;
          saveFilterState();
          renderCatalog();
          renderMapExplorer();
        });
        categoryGrid.appendChild(btn);
      });
      
      categorySection.appendChild(categoryGrid);
      explorerContainer.appendChild(categorySection);
    }
  }

  // Function to render products
  function renderCatalog() {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    // Get catalog data from window scope
    const rawProducts = window.productsData || [];

    // Filter products
    const filteredProducts = rawProducts.filter(product => {
      const matchBrand = !activeBrand || product.brand === activeBrand || (activeBrand === '3m' && product.isAuthorized3MPartner === true);
      
      const matchCategory = activeCategory === 'all' || 
                            product.category === activeCategory ||
                            (activeCategory === '3m' && product.isAuthorized3MPartner === true);
      
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = product.name.toLowerCase().includes(searchLower) ||
                          product.description.toLowerCase().includes(searchLower) ||
                          product.category.toLowerCase().includes(searchLower) ||
                          Object.entries(product.specs).some(([k, v]) => 
                            k.toLowerCase().includes(searchLower) || 
                            v.toLowerCase().includes(searchLower)
                          );
      
      return matchBrand && matchCategory && matchSearch;
    });

    // Sort products brand-wise alphabetically, and maintain original chronological category order within brands
    if (activeCategory === 'all' && activeBrand === null) {
      filteredProducts.sort((a, b) => {
        const brandA = (a.brand || '').toLowerCase();
        const brandB = (b.brand || '').toLowerCase();
        if (brandA < brandB) return -1;
        if (brandA > brandB) return 1;
        return rawProducts.indexOf(a) - rawProducts.indexOf(b);
      });
    }


    // Render Brand Indicator Bar
    const activeBrandIndicator = document.getElementById('activeBrandIndicator');
    if (activeBrandIndicator) {
      if (activeBrand) {
        const brandNames = {
          '3m': '3M Authorized Safety Sheeting',
          'kataline': 'Kataline Road Marking Equipment',
          'darkeye': 'Dark-Eye High-Performance Studs',
          'nilkamal': 'Nilkamal Quality Utility Cones',
          'detco': 'DETCO Quality Road Safety Solutions'
        };
        const brandDisplayName = brandNames[activeBrand] || activeBrand.toUpperCase();
        
        activeBrandIndicator.innerHTML = `
          <div class="active-brand-banner" style="
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: var(--color-accent-soft);
            border: 1px solid rgba(220, 38, 38, 0.15);
            padding: 10px 20px;
            border-radius: 30px;
            font-family: var(--font-header);
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--color-accent);
            margin-bottom: 24px;
            animation: slide-toast 0.3s ease forwards;
          ">
            <span>Filtering Brand: <strong>${brandDisplayName}</strong></span>
            <button id="clearBrandBtn" style="background: none; border: none; color: var(--text-medium); font-weight: 800; font-size: 1.1rem; cursor: pointer;">✕</button>
          </div>
        `;
        activeBrandIndicator.style.display = 'block';

        // Add clear brand button listener
        const clearBrandBtn = document.getElementById('clearBrandBtn');
        if (clearBrandBtn) {
          clearBrandBtn.addEventListener('click', () => {
            activeBrand = null;
            saveFilterState();
            renderCatalog();
          });
        }
      } else {
        activeBrandIndicator.style.display = 'none';
        activeBrandIndicator.innerHTML = '';
      }
    }

    // Update count
    const catalogCount = document.getElementById('catalogCount');
    if (catalogCount) {
      catalogCount.textContent = filteredProducts.length;
    }

    // Limit grid size if viewed from landing page where "Show All Products" exists
    const isHomepageView = !!document.getElementById('viewAllProductsBtnWrap');
    const displayedProducts = isHomepageView ? filteredProducts.slice(0, 8) : filteredProducts;

    if (displayedProducts.length === 0) {
      catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(15,23,42,0.02); border-radius: 12px; border: 1px dashed rgba(15,23,42,0.1);">
          <span style="font-size: 2.5rem;">🔍</span>
          <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--text-dark); margin-top: 10px; margin-bottom: 6px;">No Safety Solutions Found</h4>
          <p style="font-size: 0.9rem; color: var(--text-medium);">Try refining your specifications search or clearing brand selections.</p>
          <button class="btn btn-primary" style="margin-top: 15px;" id="resetCatalogFiltersBtn">Reset Filter Grids</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetCatalogFiltersBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          activeCategory = 'all';
          activeBrand = null;
          searchQuery = '';
          saveFilterState();
          
          // Sync search inputs
          if (globalSearchInput) globalSearchInput.value = '';
          if (catalogSearchInput) catalogSearchInput.value = '';
          if (mobileSearchInput) mobileSearchInput.value = '';

          renderCatalog();
          renderMapExplorer();
        });
      }
      return;
    }

    // Generate product card HTML and insert into grid
    displayedProducts.forEach((product, idx) => {
      const card = document.createElement('article');
      card.className = 'product-card scroll-reveal';
      card.id = product.id;
      card.style.animationDelay = `${0.08 * (idx + 1)}s`;

      const specsPreview = Object.entries(product.specs).slice(0, 3).map(([k, v]) => `
        <div class="spec-preview-row">
          <span class="spec-preview-label">${k}</span>
          <span class="spec-preview-value">${v}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="product-img">
          <a href="product.html?id=${product.id}" class="product-card-link" style="display: block; width: 100%; height: 100%;">
            <img src="${product.image}" alt="${product.name}" loading="lazy" />
          </a>
          <div class="card-badges">
            ${product.isAuthorized3MPartner ? '<span class="badge-pill partner-label">3M Partner</span>' : ''}
            ${product.isBestSeller ? '<span class="badge-pill hot">Best Seller</span>' : ''}
          </div>
        </div>
        
        <div class="product-body">
          <span class="product-cat" style="text-transform: uppercase;">${product.brand}</span>
          <h3 class="product-title-text" style="cursor: pointer;">
            <a href="product.html?id=${product.id}" style="color: inherit; text-decoration: none;">${product.name}</a>
          </h3>
          
          <div class="product-specs-preview">
            ${specsPreview}
          </div>

          <div class="product-actions" style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn btn-primary btn-card btn-quick-enquiry" data-id="${product.id}" data-category="${product.category}" style="flex: 1.1; padding: 8px 4px; font-size: 0.7rem; white-space: nowrap;">
              ENQUIRE NOW
            </button>
            <button class="btn btn-card btn-secondary btn-view-details" data-id="${product.id}" style="flex: 0.9; padding: 8px 4px; font-size: 0.7rem; white-space: nowrap;">
              MORE DETAILS
            </button>
          </div>
        </div>
      `;

      catalogGrid.appendChild(card);
    });

    // Rebind enquiry and specs buttons event listeners
    attachCardEvents();
    
    // Trigger entrance animation
    const cards = catalogGrid.querySelectorAll('.product-card');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));

    // Restore scroll position if returning from product detail page
    const restoreScrollPos = sessionStorage.getItem('detco_scroll_restore');
    if (restoreScrollPos !== null) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(restoreScrollPos));
        sessionStorage.removeItem('detco_scroll_restore');
      }, 80);
    }
  }

  // Handle Map Explorer Initialization
  renderMapExplorer();

  // Handle Search Input in Header
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (catalogSearchInput) catalogSearchInput.value = searchQuery; // sync values
      if (mobileSearchInput) mobileSearchInput.value = searchQuery; // sync values
      renderCatalog();
    });
  }

  // Handle Search Input in Catalog header
  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (globalSearchInput) globalSearchInput.value = searchQuery; // sync values
      if (mobileSearchInput) mobileSearchInput.value = searchQuery; // sync values
      renderCatalog();
    });
  }

  // Handle Search Input in Mobile Drawer
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (globalSearchInput) globalSearchInput.value = searchQuery; // sync values
      if (catalogSearchInput) catalogSearchInput.value = searchQuery; // sync values
      renderCatalog();
    });
  }

  // Wire up Brand Marquee logo click filtering
  const brandItems = document.querySelectorAll('.brand-item');
  brandItems.forEach(item => {
    item.addEventListener('click', () => {
      const selectedBrand = item.getAttribute('data-brand');
      if (selectedBrand) {
        activeBrand = selectedBrand;
        saveFilterState();
        renderCatalog();
        
        // Scroll smoothly to catalog section
        const catalogSec = document.getElementById('catalogSection');
        if (catalogSec) {
          catalogSec.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Wire up B2B navigation dropdown category clicks
  const dropdownLinks = document.querySelectorAll('.nav-dropdown-menu a[data-category]');
  dropdownLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const selectedCategory = link.getAttribute('data-category');
      
      // If we are on a page containing the catalogGrid (index.html or catalog.html), filter dynamically
      if (catalogGrid) {
        e.preventDefault();
        activeCategory = selectedCategory;
        saveFilterState();
        
        renderCatalog();
        renderMapExplorer();
        
        // Scroll smoothly to catalog section
        const catalogSec = document.getElementById('catalogSection');
        if (catalogSec) {
          catalogSec.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // If we are on another page (e.g. product.html details), redirect to the catalog deep link page
        const isProductPage = window.location.pathname.includes('product.html');
        const targetPage = isProductPage ? 'catalog.html' : 'index.html';
        link.setAttribute('href', `${targetPage}?category=${selectedCategory}`);
      }
    });
  });

  // Wire up B2B navigation DETCO Products brand clicks
  const detcoTriggerLinks = document.querySelectorAll('.nav-detco-trigger, .nav-detco-trigger-drawer');
  detcoTriggerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // If we are on a page containing the catalogGrid (index.html or catalog.html), filter dynamically
      if (catalogGrid) {
        e.preventDefault();
        activeBrand = 'detco';
        activeCategory = 'all'; // Change from null to 'all' to show all DETCO products
        saveFilterState();
        
        renderCatalog();
        renderMapExplorer();
        
        // Scroll smoothly to catalog section
        const catalogSec = document.getElementById('catalogSection');
        if (catalogSec) {
          catalogSec.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // If we are on another page (e.g. product.html details), redirect to the catalog deep link page
        const isProductPage = window.location.pathname.includes('product.html');
        const targetPage = isProductPage ? 'catalog.html' : 'index.html';
        link.setAttribute('href', `${targetPage}?brand=detco`);
      }
    });
  });

  // Initial catalog draw
  renderCatalog();


  // 4. Interactive Enquiry Modal Logic (WhatsApp Conversational B2B Quote Wizard)
  const modalOverlay = document.getElementById('enquiryModal');
  
  // 5. Global Enquiry Modal Controller
  function openEnquiryModal(category = null, productName = '', productImage = '') {
    if (!modalOverlay) return;

    const form = document.getElementById('enquiryForm');
    const successPanel = document.getElementById('successPanel');
    if (form) form.style.display = 'block';
    if (successPanel) successPanel.style.display = 'none';

    if (form) {
      form.reset();
    }

    // Pre-fill Category
    const catSelect = document.getElementById('prodCategory');
    if (catSelect && category) {
      catSelect.value = category;
    }

    // Pre-fill requirements/message
    const reqTextarea = document.getElementById('requirements');
    if (reqTextarea) {
      if (productName) {
        reqTextarea.value = `Interested in B2B Bulk Price for "${productName}". Please provide detailed pricing catalog, minimum order quantity, and lead time.`;
      } else {
        reqTextarea.value = '';
      }
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeEnquiryModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  // Close modal click handlers
  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeEnquiryModal();
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeEnquiryModal();
    });
  }

  // Form Submit
  const enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = enquiryForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit Request for Bulk Pricing';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px; margin-right: 6px; display: inline-block; vertical-align: middle;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.283 6M11 3v9h9" />
          </svg> Processing Request...
        `;
      }

      const fullName = document.getElementById('fullName').value;
      const companyName = document.getElementById('companyName').value || 'Individually Sourced';
      const prodCategorySelect = document.getElementById('prodCategory');
      const prodCategoryText = prodCategorySelect ? prodCategorySelect.options[prodCategorySelect.selectedIndex].text : '';
      const estQty = document.getElementById('estQty').value;

      const formData = new FormData(enquiryForm);

      try {
        // Submit to Web3Forms
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Web3Forms submission failed");
        }

        // Backup call to local backend
        try {
          await fetch('http://localhost:3001/api/submit-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: fullName,
              company: companyName,
              phone: document.getElementById('phoneNum').value,
              email: document.getElementById('emailAddr').value,
              requirements: document.getElementById('requirements').value,
              quantity: estQty,
              category: prodCategoryText,
              source: 'centered-modal'
            })
          });
        } catch (backendErr) {
          console.warn('Backup local logging failed:', backendErr);
        }

        // Show success panel
        const randId = Math.floor(1000 + Math.random() * 9000);
        const refNo = `RFQ-${randId}-${new Date().getFullYear()}`;

        const successPanel = document.getElementById('successPanel');
        if (successPanel) {
          document.getElementById('refNumberText').textContent = refNo;
          document.getElementById('successClientText').textContent = fullName;
          document.getElementById('successCompanyText').textContent = companyName;
          document.getElementById('successQtyText').textContent = `${estQty} Units (${prodCategoryText})`;
          
          enquiryForm.style.display = 'none';
          successPanel.style.display = 'flex';
        }
      } catch (err) {
        console.error('Submission error:', err);
        showB2bToast(`Submission failed: ${err.message || 'Network error occurred.'}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  // Attach click handlers to dynamic product cards
  function attachCardEvents() {
    // "Enquire" button handler
    const enquireButtons = document.querySelectorAll('.btn-quick-enquiry');
    enquireButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        const prodCat = btn.getAttribute('data-category');
        const rawProducts = window.productsData || [];
        const product = rawProducts.find(p => p.id === prodId);
        
        openEnquiryModal(prodCat, product ? product.name : '', product ? product.image : '');
      });
    });

    // "Specs" (View Details) button handler
    const viewButtons = document.querySelectorAll('.btn-view-details');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        sessionStorage.setItem('detco_scroll_restore', window.scrollY);
        window.location.href = `product.html?id=${prodId}`;
      });
    });
  }

  // Bind Navbar CTA & Floating FAB CTA
  const requestQuoteNav = document.getElementById('requestQuoteNav');
  const floatingFAB = document.getElementById('floatingFAB');
  const heroCTAEnquire = document.getElementById('heroCTAEnquire');
  const customSolutionCTA = document.getElementById('customSolutionCTA');

  if (requestQuoteNav) {
    requestQuoteNav.addEventListener('click', (e) => {
      e.preventDefault();
      openEnquiryModal();
    });
  }

  if (floatingFAB) {
    floatingFAB.addEventListener('click', () => {
      openEnquiryModal();
    });
  }

  if (heroCTAEnquire) {
    heroCTAEnquire.addEventListener('click', () => {
      openEnquiryModal();
    });
  }

  if (customSolutionCTA) {
    customSolutionCTA.addEventListener('click', () => {
      openEnquiryModal();
    });
  }


  // 6. Intersection Observer for Numeric Count-Up legacy animations
  const statsSection = document.getElementById('statsSection');
  const countElements = document.querySelectorAll('.stat-number');
  let hasCounted = false;

  const countUpObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasCounted) {
        hasCounted = true;
        countElements.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          let current = 0;
          const duration = 1500; // 1.5 seconds
          const stepTime = Math.max(Math.floor(duration / target), 15);
          
          const timer = setInterval(() => {
            current += Math.ceil(target / (duration / stepTime));
            if (current >= target) {
              el.textContent = target + suffix;
              clearInterval(timer);
            } else {
              el.textContent = current + suffix;
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  if (statsSection) {
    countUpObserver.observe(statsSection);
  }

  // 7. Modern Scroll Reveal Motion Observer
  function initScrollReveals() {
    const revealElements = document.querySelectorAll('.scroll-reveal, .stagger-reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // If dynamically populating inside stagger-reveal, trigger unobserve
          if (!entry.target.classList.contains('stagger-reveal')) {
            revealObserver.unobserve(entry.target);
          }
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Trigger slightly before entering full viewport
    });

    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  }

  initScrollReveals();


  // 8. B2B Hero Automatic Slideshow Crossfade
  function initHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 4500); // Transition every 4.5s slowly
  }

  initHeroSlideshow();

  // 9. Products Nav Link Hover attention blinker
  function initProductsHoverBlinker() {
    const productsNavLink = document.getElementById('productsNavLink');
    if (!productsNavLink) return;
    
    productsNavLink.addEventListener('mouseenter', () => {
      const cards = document.querySelectorAll('.product-card');
      cards.forEach(card => {
        card.classList.add('highlight-blink');
      });
    });

    productsNavLink.addEventListener('mouseleave', () => {
      const cards = document.querySelectorAll('.product-card');
      cards.forEach(card => {
        card.classList.remove('highlight-blink');
      });
    });
  }

  initProductsHoverBlinker();

  // 10. Inline Enquiry Form B2B Submission State Machine
  function initInlineEnquiryForm() {
    const inlineForm = document.getElementById('inlineEnquiryForm');
    const inlineSuccess = document.getElementById('inlineSuccessPanel');
    if (!inlineForm) return;

    inlineForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Simple visual submit loading
      const submitBtn = inlineForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px; margin-right: 6px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.283 6M11 3v9h9" />
        </svg> Processing B2B Quote...
      `;

      // Form properties capture
      const fullName = document.getElementById('inlineFullName').value;
      const companyName = document.getElementById('inlineCompanyName').value || 'Individually Sourced';
      const prodCategory = document.getElementById('inlineProdCategory').value;
      const estQty = document.getElementById('inlineEstQty').value;

      // Extract form data
      const formData = new FormData(inlineForm);
      const accessKey = formData.get('access_key');

      // Helper function to complete UI transition
      const handleSuccess = (isSandbox = false) => {
        // Generate RFQ Reference
        const randId = Math.floor(1000 + Math.random() * 9000);
        const refNo = `RFQ-${randId}-${new Date().getFullYear()}`;

        // Populate Success details
        document.getElementById('inlineRefNumberText').textContent = refNo;
        document.getElementById('inlineSuccessClientText').textContent = fullName;
        document.getElementById('inlineSuccessCompanyText').textContent = companyName;
        document.getElementById('inlineSuccessQtyText').textContent = `${estQty} Units (${prodCategory.replace('-', ' ')})`;

        const timerText = inlineSuccess.querySelector('.success-meta-timer');
        if (timerText) {
          if (isSandbox) {
            timerText.innerHTML = `Sandbox Preview Mode Enabled.<br><span style="color: var(--color-accent); font-size: 0.82rem; font-weight: 500; display: block; margin-top: 6px;">🔔 Note: Update the Access Key in index.html to receive actual email alerts.</span>`;
          } else {
            timerText.textContent = `Assigned to Safety Lead - Callback Guaranteed within 24 Hours!`;
          }
        }

        // Smoothly hide form and show success banner
        inlineForm.style.display = 'none';
        inlineSuccess.style.display = 'flex';

        // Reset submit button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      };

      // Check if key is placeholder sandbox
      if (accessKey === 'YOUR_ACCESS_KEY_HERE') {
        console.warn('Deepak Trading Corp B2B Redesign: Form submitted using default Sandbox Access Key.');
        setTimeout(() => {
          handleSuccess(true);
        }, 1200);
        return;
      }

      // Live production AJAX fetch request
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      })
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 200 || data.success) {
          handleSuccess(false);
        } else {
          throw new Error(data.message || 'API rejected submission.');
        }
      })
      .catch((error) => {
        console.error('B2B Quote Submission Error:', error);
        showB2bToast(`Submission failed: ${error.message || 'Network error occurred.'}`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      });
    });
  }

  initInlineEnquiryForm();

  // 11. Live Autocomplete Search Suggestions Dropdown setup
  function setupSearchSuggestions() {
    const searchInputs = [
      { input: globalSearchInput, id: 'globalSearch' },
      { input: catalogSearchInput, id: 'catalogSearch' },
      { input: mobileSearchInput, id: 'mobileSearch' }
    ];

    searchInputs.forEach(({ input }) => {
      if (!input) return;

      // Ensure absolute parent relative positioning for catalog search input container
      if (input.id === 'catalogSearch') {
        const parent = input.parentElement;
        if (parent && parent.style.position !== 'relative') {
          parent.style.position = 'relative';
        }
      }

      // Create dynamic suggestions dropdown element
      const dropdown = document.createElement('div');
      dropdown.className = 'search-suggestions-dropdown';
      dropdown.style.display = 'none';
      input.parentElement.appendChild(dropdown);

      // Listen to input changes
      input.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        if (val.length < 1) {
          dropdown.style.display = 'none';
          dropdown.innerHTML = '';
          return;
        }

        // Filter up to 6 matching products
        const matches = products.filter(p => 
          p.name.toLowerCase().includes(val) || 
          p.brand.toLowerCase().includes(val) || 
          p.category.toLowerCase().includes(val)
        ).slice(0, 6);

        if (matches.length === 0) {
          dropdown.innerHTML = '<div class="search-suggestions-empty">No B2B specifications found</div>';
          dropdown.style.display = 'block';
          return;
        }

        dropdown.innerHTML = '';
        matches.forEach(item => {
          const itemLink = document.createElement('a');
          itemLink.href = `product.html?id=${item.id}`;
          itemLink.className = 'search-suggestion-item';
          itemLink.innerHTML = `
            <img class="search-suggestion-img" src="${item.image}" alt="${item.name}">
            <div class="search-suggestion-info">
              <span class="search-suggestion-name">${item.name}</span>
              <span class="search-suggestion-meta">${item.brand.toUpperCase()} | ${item.category.replace('-', ' ')}</span>
            </div>
          `;
          dropdown.appendChild(itemLink);
        });

        dropdown.style.display = 'block';
      });

      // Close suggestion dropdown if user clicks outside of bounds
      document.addEventListener('click', (e) => {
        if (e.target !== input && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });

      // Restore dropdown visibility on click/focus if value exists
      input.addEventListener('focus', () => {
        if (input.value.trim().length >= 1) {
          dropdown.style.display = 'block';
        }
      });
    });
  }

  // Global B2B specifications modal logic
  window.openSpecsModal = function(prodId) {
    const overlay = document.getElementById('specsOverlay');
    const titleNode = document.getElementById('specsTitle');
    const bodyNode = document.getElementById('specsBody');
    
    const productsList = window.productsData || [];
    const product = productsList.find(p => p.id === prodId || p.id === `prod-${prodId}` || `prod-${p.id}` === prodId);
    
    if (product && overlay && titleNode && bodyNode) {
      titleNode.textContent = product.name + " Specs Sheet";
      
      let html = '';
      Object.entries(product.specs).forEach(([k, v]) => {
        html += `
          <div class="specs-row">
            <span class="specs-label">${k}</span>
            <span class="specs-value">${v}</span>
          </div>
        `;
      });
      bodyNode.innerHTML = html;
      
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
    }
  };

  window.closeSpecsModal = function() {
    const overlay = document.getElementById('specsOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
  };

  setupSearchSuggestions();
});


/* =====================================================================
   TRUST SECTION — Premium Animation Engine
   - Floating particle canvas backdrop
   - KPI number count-up on scroll
   - Staggered brand card entrance (spring physics)
   - Spotlight scanner beam on the marquee track
   - Shimmer sweep on brand card hover
   - Magnetic 3D tilt on brand card mouse-move
   ===================================================================== */

(function TrustAnimations() {

  /* ── 1. Floating Particle Canvas ───────────────────────────── */
  function initTrustParticles() {
    const banner = document.querySelector('.trust-banner');
    if (!banner) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position:absolute;inset:0;width:100%;height:100%;
      pointer-events:none;z-index:1;opacity:0.45;
    `;
    banner.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, particles = [], raf;

    const COLORS = ['#DC2626','#EF4444','#F87171','#2563EB','#60A5FA','#FFFFFF'];
    const COUNT  = 55;

    function resize() {
      W = canvas.width  = banner.offsetWidth;
      H = canvas.height = banner.offsetHeight;
    }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawn() {
      return {
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.6, 2.2),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.4, -0.1),
        alpha: rand(0.15, 0.6),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pulse: rand(0, Math.PI * 2),
        pulseSpeed: rand(0.012, 0.028)
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: COUNT }, spawn);
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.pulse += p.pulseSpeed;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -5) { p.y = H + 5; p.x = rand(0, W); }
        if (p.x < -5 || p.x > W + 5) p.vx *= -1;
      });
      raf = requestAnimationFrame(tick);
    }

    // Draw connecting lines between nearby particles
    function drawLines() {
      const MAX_DIST = 80;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(220,38,38,0.08)';
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = (1 - d / MAX_DIST) * 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // Rewire tick to include lines
    cancelAnimationFrame(raf);
    function frame() {
      ctx.clearRect(0, 0, W, H);
      drawLines();
      particles.forEach(p => {
        p.pulse += p.pulseSpeed;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -5) { p.y = H + 5; p.x = rand(0, W); }
        if (p.x < -5 || p.x > W + 5) p.vx *= -1;
      });
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => { resize(); });
    init();
    frame();
  }


  /* ── 2. KPI Number Count-Up on Scroll ──────────────────────── */
  function initKpiCountUp() {
    const kpiCards = document.querySelectorAll('.trust-kpi-card');
    if (!kpiCards.length) return;

    const nums = [
      { el: kpiCards[0]?.querySelector('.trust-kpi-num'), target: 50,   suffix: '+',   prefix: '' },
      { el: kpiCards[1]?.querySelector('.trust-kpi-num'), target: 5,    suffix: '+',   prefix: '' },
      { el: kpiCards[2]?.querySelector('.trust-kpi-num'), target: 100,  suffix: '+',   prefix: '' },
      { el: kpiCards[3]?.querySelector('.trust-kpi-num'), target: 24,   suffix: ' Hr', prefix: '' },
    ];

    let counted = false;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counted) {
          counted = true;
          nums.forEach(({ el, target, suffix, prefix }) => {
            if (!el) return;
            let start = 0;
            const dur = 1600;
            const step = Math.max(16, Math.floor(dur / target));
            const inc = Math.ceil(target / (dur / step));
            const timer = setInterval(() => {
              start = Math.min(start + inc, target);
              el.textContent = prefix + start + suffix;
              if (start >= target) clearInterval(timer);
            }, step);
          });
        }
      });
    }, { threshold: 0.4 });

    const intro = document.querySelector('.trust-intro');
    if (intro) observer.observe(intro);
  }


  /* ── 3. Staggered Brand Card Entrance ──────────────────────── */
  function initBrandCardEntrance() {
    const boxes = document.querySelectorAll('.trust-banner-box');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const cards = entry.target.querySelectorAll('.brand-item');
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.style.transition = `opacity 0.5s ease ${i * 60}ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms, box-shadow 0.35s ease, filter 0.3s ease, border-color 0.3s ease, background 0.3s ease`;
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
          }, i * 60);
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    boxes.forEach(box => observer.observe(box));
  }


  /* ── 4. Spotlight Scanner Beam on Marquee ──────────────────── */
  function initSpotlightBeam() {
    const containers = document.querySelectorAll('.marquee-container');
    containers.forEach(container => {
      const beam = document.createElement('div');
      beam.style.cssText = `
        position:absolute;top:0;left:-20%;width:15%;height:100%;
        background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 40%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.06) 60%,transparent 100%);
        pointer-events:none;z-index:3;
        animation:spotlight-scan 4s cubic-bezier(0.4,0,0.6,1) infinite;
      `;
      container.style.position = 'relative';
      container.appendChild(beam);
    });

    // Inject keyframe if not already present
    if (!document.getElementById('spotlight-anim')) {
      const style = document.createElement('style');
      style.id = 'spotlight-anim';
      style.textContent = `
        @keyframes spotlight-scan {
          0%   { left: -20%; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { left: 115%; opacity: 0; }
        }
        @keyframes trust-kpi-glow-in {
          from { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          to   { box-shadow: 0 0 24px 4px rgba(220,38,38,0.15); }
        }
        @keyframes brand-shimmer {
          0%   { transform: translateX(-120%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }


  /* ── 5. KPI Card entrance glow animation ───────────────────── */
  function initKpiCardEntrance() {
    const cards = document.querySelectorAll('.trust-kpi-card');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.animation = 'trust-kpi-glow-in 0.8s ease forwards';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    cards.forEach((c, i) => {
      c.style.animationDelay = `${i * 0.12}s`;
      observer.observe(c);
    });
  }



  /* ── Boot all animations once DOM is settled ───────────────── */
  function boot() {
    initTrustParticles();
    initKpiCountUp();
    initBrandCardEntrance();
    initSpotlightBeam();
    initKpiCardEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
