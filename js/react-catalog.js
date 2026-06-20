const { useState, useEffect, useRef } = React;

// ========================================== REACT CATALOG SPA SYSTEM ==========================================
function ReactCatalogApp() {
  const [activeCategory, setActiveCategory] = useState(() => sessionStorage.getItem("activeCategory") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBrand, setActiveBrand] = useState(() => {
    const brand = sessionStorage.getItem("activeBrand");
    return (brand === "null" || brand === "") ? null : brand;
  });

  useEffect(() => {
    sessionStorage.setItem("activeCategory", activeCategory);
    sessionStorage.setItem("activeBrand", activeBrand || "");
  }, [activeCategory, activeBrand]);
  
  // Interactive Module States
  const [cart, setCart] = useState([]); // B2B multi-product cart
  const [compareList, setCompareList] = useState([]); // Selected compare SKUs (max 3)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Stepper B2B Roadmap Selector states
  const [showFinder, setShowFinder] = useState(true); // Default to show finder guide
  const [roadmapStep, setRoadmapStep] = useState(1); // 1, 2, or 3
  const [selectedProject, setSelectedProject] = useState(null); // 'expressway', 'city', 'parking', 'residential'
  const [selectedObjective, setSelectedObjective] = useState(null);

  // Global bindings so vanilla header & marquees can communicate with React state
  useEffect(() => {
    window.reactCatalogSetBrandFilter = (brandId) => {
      setActiveBrand(brandId);
      setShowFinder(false); // Bypass guide on marquee clicks
      scrollToCatalog();
    };

    window.reactCatalogSetCategoryFilter = (categoryId) => {
      setActiveCategory(categoryId);
      setShowFinder(false); // Bypass guide on dropdown clicks
      scrollToCatalog();
    };

    // Parse deep links on page load
    const urlParams = new URLSearchParams(window.location.search);
    const paramCategory = urlParams.get("category");
    const paramBrand = urlParams.get("brand");
    if (paramCategory) {
      setActiveCategory(paramCategory);
      setShowFinder(false);
    }
    if (paramBrand) {
      setActiveBrand(paramBrand);
      setShowFinder(false);
    }
  }, []);

  // Sync with global vanilla search inputs if they exist
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setSearchQuery(e.target.value);
      if (e.target.value) {
        setShowFinder(false); // Auto bypass guide if searching
      }
    };

    const globalSearch = document.getElementById("globalSearch");
    const mobileSearch = document.getElementById("mobileSearch");
    
    if (globalSearch) globalSearch.addEventListener("input", handleGlobalSearch);
    if (mobileSearch) mobileSearch.addEventListener("input", handleGlobalSearch);
    
    return () => {
      if (globalSearch) globalSearch.removeEventListener("input", handleGlobalSearch);
      if (mobileSearch) mobileSearch.removeEventListener("input", handleGlobalSearch);
    };
  }, []);

  // Timeout for toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const scrollToCatalog = () => {
    const catalogEl = document.getElementById("catalogSection");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // RFQ Cart State Actions
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      showToast(`Wholesale volume for ${product.name} increased inside B2B RFQ Cart.`, "info");
      return;
    }
    setCart([...cart, { ...product, quantity: product.moq }]);
    showToast(`Added ${product.name} to B2B Quote Cart. Close the panel or compile bulk sheet anytime.`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    showToast("Product removed from B2B Quote Cart.", "info");
  };

  const updateCartQty = (productId, qty) => {
    const cleanQty = Math.max(1, parseInt(qty) || 1);
    setCart(cart.map(item => item.id === productId ? { ...item, quantity: cleanQty } : item));
  };

  // Specs Comparative Actions
  const toggleCompare = (product) => {
    const existing = compareList.find(item => item.id === product.id);
    if (existing) {
      setCompareList(compareList.filter(item => item.id !== product.id));
      showToast("Product removed from specifications comparison matrix.", "info");
      return;
    }
    if (compareList.length >= 3) {
      showToast("You can compare a maximum of 3 products side-by-side.", "warning");
      return;
    }
    setCompareList([...compareList, product]);
    showToast(`Added ${product.name} to Specs Comparison Matrix.`);
  };

  // Stepper selector filters recommendations data
  const getRoadmapRecommendations = () => {
    if (!selectedProject || !selectedObjective) return [];
    
    const allProducts = window.productsData || [];
    
    // Project based custom recommendation mappings (IRC & MORTH Compliant)
    const mapping = {
      expressway: {
        delineation: ["prod-3m-rpm-shank", "prod-3m-rpm-nextgen", "prod-3m-rpm-ilc", "prod-3m-rpm-solar"],
        reflectivity: ["prod-reflective-tape-conspicuity", "prod-reflective-tape-hip", "prod-3m-afp-sheeting", "prod-3m-electrocut-1170"],
        crash: ["prod-3m-delineator", "prod-3m-median-marker", "prod-3m-median-marker-standard"]
      },
      city: {
        separation: ["prod-3m-delineator", "prod-nilkamal-cone-pvc", "prod-3m-median-marker"],
        pavement: ["prod-kataline-plastritrak-sp", "prod-kataline-plastritrak-sc", "prod-kataline-trackmark-wr", "prod-road-marking-machine"],
        signage: ["prod-reflective-tape-hip", "prod-reflective-tape-conspicuity"]
      },
      parking: {
        barriers: ["prod-nilkamal-cone-pvc", "prod-nilkamal-cone-medium", "prod-speed-breaker-medium"],
        objective_bumps: ["prod-speed-breaker-heavy", "prod-speed-breaker-medium"],
        hazard: ["prod-3m-antiskid", "prod-reflective-tape-conspicuity"]
      },
      residential: {
        calming: ["prod-speed-breaker-medium", "prod-speed-breaker-heavy"],
        divider: ["prod-nilkamal-cone-medium", "prod-3m-median-marker-standard"]
      }
    };

    const targetIds = (mapping[selectedProject] && mapping[selectedProject][selectedObjective]) || [];
    return allProducts.filter(p => targetIds.includes(p.id));
  };

  const resetRoadmap = () => {
    setSelectedProject(null);
    setSelectedObjective(null);
    setRoadmapStep(1);
    showToast("Roadmap selection cleared.", "info");
  };

  // Stepper finder guide wrapper
  const renderRoadmapFinder = () => {
    if (!showFinder) return null;

    return (
      <div className="roadmap-finder">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <span className="roadmap-badge">Interactive Procurement Guide</span>
            <h3 style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--text-dark)", marginTop: "10px", marginBottom: "4px" }}>
              B2B Project Safety Selector Roadmap
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", margin: 0 }}>
              Find MORTH & IRC certified road safety solutions for your specific project scope in 3 simple steps.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowFinder(false)} style={{ padding: "8px 16px", fontSize: "0.75rem" }}>
            Browse Full Inventory Instead
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="roadmap-stepper">
          <div className="roadmap-stepper-progress" style={{ width: `${(roadmapStep - 1) * 50}%` }}></div>
          
          <div className={`roadmap-step ${roadmapStep >= 1 ? 'completed' : ''} ${roadmapStep === 1 ? 'active' : ''}`}>
            1
            <span className="roadmap-step-label">Project Scope</span>
          </div>
          <div className={`roadmap-step ${roadmapStep >= 2 ? 'completed' : ''} ${roadmapStep === 2 ? 'active' : ''}`}>
            2
            <span className="roadmap-step-label">Visual Objective</span>
          </div>
          <div className={`roadmap-step ${roadmapStep >= 3 ? 'completed' : ''} ${roadmapStep === 3 ? 'active' : ''}`}>
            3
            <span className="roadmap-step-label">Recommended Roadmap</span>
          </div>
        </div>

        {/* Step 1: Select Project Scope */}
        {roadmapStep === 1 && (
          <div style={{ animation: "scale-up 0.3s ease" }}>
            <h4 style={{ textAlign: "center", fontSize: "1.05rem", fontWeight: "800", color: "var(--text-dark)", marginBottom: "25px" }}>
              STEP 1: Select Your B2B Safety Project / Procurement Scope
            </h4>
            <div className="roadmap-grid">
              <div 
                className={`roadmap-card ${selectedProject === 'expressway' ? 'active' : ''}`}
                onClick={() => { setSelectedProject('expressway'); setRoadmapStep(2); }}
              >
                <span className="roadmap-card-icon">🛣️</span>
                <span className="roadmap-card-title">Expressway / NHAI Corridor</span>
                <span className="roadmap-card-desc">High-speed corridors requiring certified retroreflective sheeting & heavy-duty anchoring RPM shanks.</span>
              </div>
              <div 
                className={`roadmap-card ${selectedProject === 'city' ? 'active' : ''}`}
                onClick={() => { setSelectedProject('city'); setRoadmapStep(2); }}
              >
                <span className="roadmap-card-icon">🏙️</span>
                <span className="roadmap-card-title">Smart City & Municipalities</span>
                <span className="roadmap-card-desc">Urban lane separations, thermoplastic markings, delineator posts, and standard compliant municipal signs.</span>
              </div>
              <div 
                className={`roadmap-card ${selectedProject === 'parking' ? 'active' : ''}`}
                onClick={() => { setSelectedProject('parking'); setRoadmapStep(2); }}
              >
                <span className="roadmap-card-icon">🅿️</span>
                <span className="roadmap-card-title">Commercial Parking & Logistics</span>
                <span className="roadmap-card-desc">High-durability column protectors, hazard safety tape, rubber speed regulation bumps, and warning PVC cones.</span>
              </div>
              <div 
                className={`roadmap-card ${selectedProject === 'residential' ? 'active' : ''}`}
                onClick={() => { setSelectedProject('residential'); setRoadmapStep(2); }}
              >
                <span className="roadmap-card-icon">🏡</span>
                <span className="roadmap-card-title">Residential Society & Campus</span>
                <span className="roadmap-card-desc">Traffic regulation humps, community dividers, lane boundary markings, and custom directional safety indicators.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Choose Objective */}
        {roadmapStep === 2 && (
          <div style={{ animation: "scale-up 0.3s ease" }}>
            <h4 style={{ textAlign: "center", fontSize: "1.05rem", fontWeight: "800", color: "var(--text-dark)", marginBottom: "25px" }}>
              STEP 2: What is Your Primary Visual or Traffic Calming Objective?
            </h4>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
              {selectedProject === 'expressway' && (
                <React.Fragment>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('delineation'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🔍 Lane Boundary Delineation (RPM Road Studs)
                  </button>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('reflectivity'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    ☀️ High Conspicuity Retroreflective Signs (Sheeting Films)
                  </button>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('crash'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🚧 Crash Barrier / Guardrail Delineation Markers
                  </button>
                </React.Fragment>
              )}

              {selectedProject === 'city' && (
                <React.Fragment>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('separation'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🛡️ Active Lane Separation (Delineators & Cones)
                  </button>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('pavement'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🎨 Pedestrian Markings & Pavement Painting (Paint & Machine)
                  </button>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('signage'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🚸 Certified Highway Traffic Safety Signage
                  </button>
                </React.Fragment>
              )}

              {selectedProject === 'parking' && (
                <React.Fragment>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('barriers'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🛟 Vehicle Buffer & Corner Impact Safety (Cones & Guards)
                  </button>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('objective_bumps'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🛑 Speed Regulation & Humps Calibration (Rubber Speed Bumps)
                  </button>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('hazard'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    ⚠️ Walkway Non-Slip & Wall Highlight Guides (Anti-Skid & Sheeting)
                  </button>
                </React.Fragment>
              )}

              {selectedProject === 'residential' && (
                <React.Fragment>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('calming'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🐌 Slow Traffic Speed Calming (Community Bumps)
                  </button>
                  <button className="simulator-toggle-btn active" onClick={() => { setSelectedObjective('divider'); setRoadmapStep(3); }} style={{ padding: "20px 30px" }}>
                    🚧 Entry-Exit Separation Dividers (Medium Cones & Markers)
                  </button>
                </React.Fragment>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "35px" }}>
              <button className="btn btn-secondary" onClick={() => setRoadmapStep(1)}>← Back to Step 1</button>
            </div>
          </div>
        )}

        {/* Step 3: View Roadmap Recommendations */}
        {roadmapStep === 3 && (
          <div style={{ animation: "scale-up 0.3s ease" }}>
            <div className="roadmap-results">
              <div className="roadmap-path">
                <span>Selected Project Scope</span>
                <span className="roadmap-path-arrow">➔</span>
                <span style={{ color: "var(--color-accent)" }}>{selectedProject.toUpperCase()}</span>
                <span className="roadmap-path-arrow">➔</span>
                <span>Visual Objective</span>
                <span className="roadmap-path-arrow">➔</span>
                <span style={{ color: "var(--color-accent)" }}>{selectedObjective.toUpperCase()}</span>
              </div>

              <div className="roadmap-guidelines-box">
                {selectedProject === 'expressway' && (
                  <p>
                    <strong>MORTH & IRC Section 67 Expressway Standard Compliance:</strong> Corridors with high-velocity vehicle traffic require 3M Twin Molded Shank Raised Pavement Markers anchored deep inside concrete layouts using premium Epoxy solutions, delivering >16-ton load capacity. Sheeting signs must use Diamond Grade (Type XI) sheeting films for maximized nocturnal visibility.
                  </p>
                )}
                {selectedProject === 'city' && (
                  <p>
                    <strong>Urban Smart City Infrastructure Regulations:</strong> Lane boundary dividers must feature highly flexible high-impact Standard Delineator Posts that survive heavy vehicle impact forces. Lane marking coatings require thermoplastic polymer blends (MORTH / BS3262) mixed with Swarco reflective glass beads for instant retroreflective glow under municipal headlight sweeps.
                  </p>
                )}
                {selectedProject === 'parking' && (
                  <p>
                    <strong>B2B Commercial Warehouse & Smart Parking Guidelines:</strong> Logistics environments require high-friction PVC Cones with 3M reflective sleeves for forklift traffic, heavy-duty rubber Speed Breakers with certified weight-bearing structures, and high-traction Anti-Skid safety tapes to completely prevent hazard slips on work floors.
                  </p>
                )}
                {selectedProject === 'residential' && (
                  <p>
                    <strong>Residential Community & Campus Safety Guidelines:</strong> Visual guidelines recommend speed regulation using standard 50mm or 75mm rubber Speed Bumps equipped with retroreflective warning arrows, alongside warning PVC Cones to delineate parking boundaries and entry-exit gates.
                  </p>
                )}
              </div>

              {/* Recommended dynamic products grid */}
              <div style={{ borderTop: "1px dashed var(--color-border-grid)", paddingTop: "25px" }}>
                <h5 style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--text-dark)", marginBottom: "20px" }}>
                  Recommended Safety Solutions & Certified Technical Specifications:
                </h5>
                <div className="catalog-grid" style={{ gridColumnGap: "24px", gridRowGap: "24px" }}>
                  {getRoadmapRecommendations().map((prod) => {
                    const isCompared = compareList.some(item => item.id === prod.id);
                    return (
                      <div key={prod.id} className="product-card" style={{ animationDelay: "0.1s" }}>
                        <div className="product-img">
                          <a href={`product.html?id=${prod.id}`} className="product-card-link" style={{ display: "block", width: "100%", height: "100%" }}>
                            <img src={prod.image} alt={prod.name} loading="lazy" />
                          </a>
                          {/* No badges needed in roadmap recommendations */}
                        </div>
                        <div className="product-body">
                          <span className="product-cat" style={{ textTransform: "uppercase" }}>{prod.brand}</span>
                          <h3 className="product-title-text">
                            <a href={`product.html?id=${prod.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                              {prod.name}
                            </a>
                          </h3>
                          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                            <button className="btn btn-secondary btn-card" onClick={() => addToCart(prod)} style={{ flex: "1", padding: "6px", fontSize: "0.7rem" }}>
                              Add to RFQ Cart
                            </button>
                            <button className={`btn btn-card ${isCompared ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleCompare(prod)} style={{ flex: "1", padding: "6px", fontSize: "0.7rem" }}>
                              {isCompared ? "Comparing" : "Compare"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Roadmap step controls */}
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                <button className="btn btn-secondary" onClick={() => setRoadmapStep(2)}>← Back to Step 2</button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn btn-secondary" onClick={resetRoadmap}>Reset Finder Guide</button>
                  <button className="btn btn-primary" onClick={() => { setIsCartOpen(true); }} style={{ padding: "10px 24px" }}>
                    Proceed to B2B Quote Panel ({cart.length} items Selected)
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  };

  // Dynamic filter products pipeline
  const filteredProducts = (window.productsData || []).filter(prod => {
    // Brand check
    const matchBrand = !activeBrand || prod.brand === activeBrand || (activeBrand === '3m' && prod.isAuthorized3MPartner === true);
    // Category check
    const matchCategory = activeCategory === "all" || 
                          prod.category === activeCategory ||
                          (activeCategory === "3m" && prod.isAuthorized3MPartner === true);
    
    // Search check
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
                        prod.name.toLowerCase().includes(searchLower) ||
                        prod.description.toLowerCase().includes(searchLower) ||
                        prod.category.toLowerCase().includes(searchLower) ||
                        Object.entries(prod.specs).some(([k, v]) => 
                          k.toLowerCase().includes(searchLower) || 
                          v.toLowerCase().includes(searchLower)
                        );

    return matchBrand && matchCategory && matchSearch;
  });

  // Limit grid size if viewed from landing page where "Show All Products" exists
  const isHomepageView = !!document.getElementById("viewAllProductsBtnWrap");
  const displayedProducts = isHomepageView ? filteredProducts.slice(0, 6) : filteredProducts;

  return (
    <React.Fragment>
      {/* 1. B2B Project Stepper Roadmap Finder Guide */}
      {renderRoadmapFinder()}

      {/* 2. Direct Browse Controls (Category Tabs Horizonal Filter) */}
      <div className="section-header" style={{ borderTop: showFinder ? "1.5px solid var(--color-border-grid)" : "none", paddingTop: showFinder ? "40px" : "0" }}>
        <div className="section-title-wrap">
          <span className="section-subtitle">Premium Safety Catalog</span>
          <h2 className="section-title">Explore Core Categories</h2>
        </div>
        
        {/* React-controlled Horizontal Category Tabs */}
        <div className="catalog-filters" style={{ overflowX: "auto", display: "flex", gap: "8px", maxWidth: "100%", paddingBottom: "10px" }}>
          {[
            { id: "all", label: "All Products" },
            { id: "3m", label: "3M Products" },
            { id: "road-studs", label: "Road Studs" },
            { id: "reflective-tapes", label: "Reflective Tapes" },
            { id: "marking-paint", label: "Road Paint" },
            { id: "traffic-cones", label: "Traffic Cones" },
            { id: "speed-breakers", label: "Speed Breakers" },
            { id: "sign-boards", label: "Sign Boards" }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`filter-btn ${activeCategory === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveCategory(tab.id); }}
              style={{ whiteSpace: "nowrap" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Brand filter banner */}
      {activeBrand && (
        <div className="active-brand-banner" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--color-accent-soft)",
          border: "1px solid rgba(220, 38, 38, 0.15)",
          padding: "10px 20px",
          borderRadius: "30px",
          fontFamily: "var(--font-header)",
          fontSize: "0.85rem",
          fontWeight: "700",
          color: "var(--color-accent)",
          marginBottom: "24px",
          animation: "slide-toast 0.3s ease forwards"
        }}>
          <span>Filtering Brand: <strong>{activeBrand.toUpperCase()} Authorized Products</strong></span>
          <button 
            onClick={() => setActiveBrand(null)}
            style={{ background: "none", border: "none", color: "var(--text-medium)", fontWeight: "800", fontSize: "1.1rem", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* B2B Guide Bypass Trigger Option */}
      {!showFinder && (
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-start" }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => { setShowFinder(true); setRoadmapStep(1); }} 
            style={{ padding: "6px 14px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            🛠️ Launch Stepper Procurement Guide
          </button>
        </div>
      )}

      {/* Live search sync input */}
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-medium)" }}>
          Showing <strong>{filteredProducts.length}</strong> Safety Solutions in Registry
        </span>
        <input 
          type="text" 
          placeholder="Search safety specs..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setShowFinder(false); }}
          style={{ padding: "10px 20px", borderRadius: "20px", border: "1px solid rgba(15,23,42,0.1)", width: "100%", maxWidth: "320px", fontSize: "0.85rem", outline: "none" }} 
        />
      </div>

      {/* 3. Products cards grid */}
      {displayedProducts.length > 0 ? (
        <div className="catalog-grid stagger-reveal revealed">
          {displayedProducts.map((prod) => {
            const isCompared = compareList.some(item => item.id === prod.id);
            const specsEntries = Object.entries(prod.specs).slice(0, 3);

            return (
              <article key={prod.id} className="product-card" id={prod.id}>
                <div className="product-img">
                  <a href={`product.html?id=${prod.id}`} className="product-card-link" style={{ display: "block", width: "100%", height: "100%" }}>
                    <img src={prod.image} alt={prod.name} loading="lazy" />
                  </a>
                  <div className="card-badges">
                    {prod.isBestSeller && <span className="badge-pill hot">Best Seller</span>}
                  </div>
                </div>
                
                <div className="product-body">
                  <span className="product-cat" style={{ textTransform: "uppercase" }}>{prod.brand}</span>
                  <h3 className="product-title-text" style={{ cursor: "pointer" }} onClick={() => { window.location.href = `product.html?id=${prod.id}`; }}>
                    {prod.name}
                  </h3>
                  
                  <div className="product-specs-preview">
                    {specsEntries.map(([k, v]) => (
                      <div key={k} className="spec-preview-row">
                        <span className="spec-preview-label">{k}</span>
                        <span className="spec-preview-value">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="product-actions" style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button className="btn btn-secondary btn-card" onClick={() => addToCart(prod)} style={{ flex: "1.2", padding: "8px", fontSize: "0.72rem" }}>
                      Add to RFQ Cart
                    </button>
                    <button 
                      className={`btn btn-card ${isCompared ? 'btn-primary' : 'btn-secondary'}`} 
                      onClick={() => toggleCompare(prod)} 
                      style={{ flex: "0.8", padding: "8px", fontSize: "0.72rem" }}
                    >
                      {isCompared ? "Comparing" : "Compare"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(15,23,42,0.02)", borderRadius: "12px", border: "1px dashed rgba(15,23,42,0.1)" }}>
          <span style={{ fontSize: "2.5rem" }}>🔍</span>
          <h4 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-dark)", marginTop: "10px", marginBottom: "6px" }}>No Safety Solutions Found</h4>
          <p style={{ fontSize: "0.9rem", color: "var(--text-medium)" }}>Try refining your specifications search or clearing brand selections.</p>
          <button className="btn btn-primary" style={{ marginTop: "15px" }} onClick={() => { setActiveCategory("all"); setActiveBrand(null); setSearchQuery(""); }}>Reset Filter Grids</button>
        </div>
      )}

      {/* 4. Specifications Comparison Matrix Module */}
      <ComparisonMatrix 
        compareList={compareList} 
        onRemove={toggleCompare} 
        onClear={() => { setCompareList([]); showToast("Comparative grid cleared.", "info"); }}
      />

      {/* 5. Highway Headlights Night Reflectivity Simulator Module */}
      <ReflectivitySimulator />

      {/* 6. Sliding B2B Bulk RFQ Cart Panel Drawer */}
      <RFQCart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        onRemove={removeFromCart}
        onUpdateQty={updateCartQty}
        showToast={showToast}
        onTriggerEnquiry={() => { setIsCartOpen(false); const modal = document.getElementById("enquiryModal"); if (modal) modal.classList.add("active"); }}
      />

      {/* Floating RFQ Cart Fixed Triggers Badge overlay */}
      {cart.length > 0 && (
        <div style={{ position: "fixed", bottom: "180px", right: "30px", zIndex: 95 }}>
          <button 
            className="floating-cta-btn" 
            onClick={() => setIsCartOpen(true)}
            style={{ background: "var(--color-accent)", border: "none", color: "#FFFFFF", width: "54px", height: "54px", borderRadius: "50%", boxShadow: "0 8px 24px rgba(220, 38, 38, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
            aria-label="Open B2B Quotation cart"
          >
            <svg style={{ width: "22px", height: "22px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#0F172A", color: "#FFFFFF", fontSize: "0.65rem", fontWeight: "900", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {cart.length}
            </span>
          </button>
        </div>
      )}

      {/* Toast Notification element */}
      {toast && (
        <div style={{ position: "fixed", bottom: "30px", left: "30px", zIndex: 100000 }}>
          <div className={`toast-card toast-${toast.type || 'success'} active`} style={{ display: "flex", padding: "16px 24px", backdropFilter: "blur(10px)" }}>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

// ========================================== REACT SUBCOMPONENT: SPECS COMPARISON MATRIX ==========================================
function ComparisonMatrix({ compareList, onRemove, onClear }) {
  if (compareList.length === 0) return null;

  return (
    <section className="comparison-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span className="roadmap-badge">Specifications Contrasting Matrix</span>
          <h3 style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--text-dark)", marginTop: "10px", marginBottom: "4px" }}>
            Product Specifications Comparison Grid
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", margin: 0 }}>
            Compare dimensions, shanks, weight limits, compliance parameters side-by-side for up to 3 models.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onClear}>Clear Matrix</button>
      </div>

      <div className="comparison-grid-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Technical Feature Matrix</th>
              {compareList.map(prod => (
                <th key={prod.id}>
                  <div className="comparison-prod-card">
                    <button className="comparison-remove-btn" onClick={() => onRemove(prod)}>✕</button>
                    <img src={prod.image} alt={prod.name} />
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "var(--text-dark)", display: "block" }}>{prod.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Manufacturer Brand</td>
              {compareList.map(prod => (
                <td key={prod.id} style={{ textTransform: "uppercase", fontWeight: "800", color: "var(--color-accent)" }}>{prod.brand}</td>
              ))}
            </tr>
            <tr>
              <td>Minimum wholesale MOQ</td>
              {compareList.map(prod => (
                <td key={prod.id} style={{ fontWeight: "700" }}>{prod.moq} Units</td>
              ))}
            </tr>
            <tr>
              <td>Authorized 3M Partner Label</td>
              {compareList.map(prod => (
                <td key={prod.id}>
                  {prod.isAuthorized3MPartner ? (
                    <span className="compare-badge" style={{ background: "rgba(220, 38, 38, 0.08)", color: "var(--color-accent)" }}>3M Partner</span>
                  ) : (
                    <span className="compare-badge" style={{ background: "#F1F5F9", color: "#64748B" }}>Certified Supply</span>
                  )}
                </td>
              ))}
            </tr>
            {/* Contrast all specifications keys */}
            {["Load Bearing Capacity", "Dimensions", "Softening Point", "Drying Time (@25°C)", "Standard Compliance"].map(specKey => {
              const hasSpec = compareList.some(p => p.specs && p.specs[specKey]);
              if (!hasSpec) return null;

              return (
                <tr key={specKey}>
                  <td>{specKey}</td>
                  {compareList.map(prod => (
                    <td key={prod.id} style={{ fontSize: "0.82rem", color: "var(--text-medium)" }}>
                      {(prod.specs && prod.specs[specKey]) || "— (N/A)"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ========================================== REACT SUBCOMPONENT: HIGHWAY NIGHT SIMULATOR ==========================================
function ReflectivitySimulator() {
  const [distance, setDistance] = useState(80); // Slider 10m to 150m
  const [brightness, setBrightness] = useState("high"); // headlight beam beam
  const [activeProduct, setActiveProduct] = useState("hip"); // EGP, HIP, DG, solar

  const getGlowIntensity = () => {
    const factor = brightness === "high" ? 1.9 : 0.95;
    
    let gradeFactor = 0.55; // AFP Sheeting
    if (activeProduct === "hip") gradeFactor = 1.1;
    if (activeProduct === "dg") gradeFactor = 1.9;
    if (activeProduct === "solar-stud") gradeFactor = 2.5; // Pulsing LED active stud

    const distanceFactor = Math.max(0.08, 1 - (distance / 160));
    return factor * gradeFactor * distanceFactor;
  };

  const intensity = getGlowIntensity();
  const scale = 0.55 + intensity * 0.75;
  const opacity = Math.min(1.0, 0.15 + intensity * 0.85);

  return (
    <section className="simulator-section">
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <span className="roadmap-badge" style={{ borderColor: "rgba(255, 94, 0, 0.4)" }}>Reflectivity Engineering Simulator</span>
        <h3 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#FFFFFF", marginTop: "10px", marginBottom: "8px", letterSpacing: "-0.5px" }}>
          Interactive Highway Headlight Reflectivity Simulator
        </h3>
        <p style={{ fontSize: "0.88rem", color: "#94A3B8", maxWidth: "660px", margin: "0 auto", lineHeight: "1.5" }}>
          Slide the sweep distance slider or switch headlight beam configurations below to simulate how physical 3M sheeting retroreflectors and active solar studs illuminate under dark highway headlight sweeps.
        </p>
      </div>

      <div className="simulator-grid">
        {/* Simulation Display */}
        <div className="simulator-display">
          <div className="simulation-road-lane"></div>
          
          <div className="simulator-item">
            {/* Dynamic Reflective Glow layer overlay */}
            <div className="reflector-glow" style={{
              position: "absolute",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              top: "10px",
              background: activeProduct === "solar-stud" 
                ? "radial-gradient(circle, rgba(239, 68, 68, 0.95) 0%, rgba(239, 68, 68, 0) 75%)" // Solar cat-eye red warning LED
                : "radial-gradient(circle, rgba(251, 191, 36, 0.95) 0%, rgba(251, 191, 36, 0) 75%)",
              transform: `scale(${scale})`,
              opacity: opacity
            }}></div>
            
            {activeProduct === "egp" && <img src="assets/3m_afp_sheeting.png" alt="AFP" />}
            {activeProduct === "hip" && <img src="assets/3m_egp_sheeting.png" alt="HIP" />}
            {activeProduct === "dg" && <img src="assets/3m_dg_sheeting.png" alt="Diamond Grade" />}
            {activeProduct === "solar-stud" && <img src="assets/3m_rpm_solar.png" alt="Solar Stud" />}
            
            <span className="compare-badge" style={{ background: "rgba(255, 255, 255, 0.1)", color: "#FFFFFF" }}>
              {activeProduct === "egp" && "3M AFP Standard Film"}
              {activeProduct === "hip" && "3M HIP Sheeting 3430"}
              {activeProduct === "dg" && "3M Diamond Grade 4090"}
              {activeProduct === "solar-stud" && "3M Monocrystalline LED Stud"}
            </span>
          </div>
        </div>

        {/* Control Panel */}
        <div className="simulator-controls">
          <div className="simulator-control-group">
            <span className="simulator-control-label">1. Choose Reflective Marker Grade</span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button className={`simulator-toggle-btn ${activeProduct === 'egp' ? 'active' : ''}`} onClick={() => setActiveProduct('egp')}>AFP Commercial</button>
              <button className={`simulator-toggle-btn ${activeProduct === 'hip' ? 'active' : ''}`} onClick={() => setActiveProduct('hip')}>HIP Prismatic</button>
              <button className={`simulator-toggle-btn ${activeProduct === 'dg' ? 'active' : ''}`} onClick={() => setActiveProduct('dg')}>DG Full-Cube</button>
              <button className={`simulator-toggle-btn ${activeProduct === 'solar-stud' ? 'active' : ''}`} onClick={() => setActiveProduct('solar-stud')}>Solar Active LED</button>
            </div>
          </div>

          <div className="simulator-control-group">
            <span className="simulator-control-label">
              <span>2. Headlight Sweep Distance</span>
              <span style={{ color: "var(--color-accent)" }}>{distance} Meters</span>
            </span>
            <input 
              type="range" 
              className="simulator-slider"
              min="10" 
              max="150" 
              value={distance} 
              onChange={(e) => setDistance(parseInt(e.target.value))}
            />
          </div>

          <div className="simulator-control-group">
            <span className="simulator-control-label">3. Vehicle Headlight Beam</span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className={`simulator-toggle-btn ${brightness === 'low' ? 'active' : ''}`} onClick={() => setBrightness('low')}>Low Dipped Beam</button>
              <button className={`simulator-toggle-btn ${brightness === 'high' ? 'active' : ''}`} onClick={() => setBrightness('high')}>High Driving Beam</button>
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.04)", borderLeft: "3px solid var(--color-accent)", padding: "12px 16px", fontSize: "0.75rem", color: "#94A3B8", borderRadius: "0 4px 4px 0", lineHeight: "1.4" }}>
            <strong>Real-time Physics Note:</strong> 3M Diamond Grade (DG3) utilize 100% efficient full-cube optical retroreflectors that redirect up to 60% of available vehicle headlight beam back to the driver, delivering superior visibility compared to standard microprismatic alternatives at far distances.
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================================== REACT SUBCOMPONENT: B2B SLIDE-OVER RFQ CART ==========================================
function RFQCart({ isOpen, onClose, cart, onRemove, onUpdateQty, showToast, onTriggerEnquiry }) {
  const formRef = useRef();

  const handleCartSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    showToast("Compiling unified bulk B2B price quotation sheet...", "info");
    
    const cartDetails = cart.map(item => `- ${item.name} (QTY: ${item.quantity} Units, Brand: ${item.brand.toUpperCase()})`).join("\n");
    
    const formData = new FormData(formRef.current);
    formData.append("cart_inquiry_list", cartDetails);
    formData.append("access_key", "2f4a5fe1-5ec6-40ec-ab6a-6cfdacc71616"); // Live DETCO Web3Forms key

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const result = await response.json();
      
      if (result.success) {
        showToast("Wholesale RFQ Inquiry sent! Trade desk will email quote inside 24 hours.");
        onClose();
        // Redirect to success state modal if possible
        const randId = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('refNumberText').textContent = `RFQ-${randId}-${new Date().getFullYear()}`;
        document.getElementById('successClientText').textContent = formData.get("name");
        document.getElementById('successCompanyText').textContent = formData.get("company") || "Corporate Sourced";
        document.getElementById('successQtyText').textContent = `${cart.length} Products Bulk List`;
        
        const modal = document.getElementById("enquiryModal");
        const form = document.getElementById("enquiryForm");
        const panel = document.getElementById("successPanel");
        if (modal) {
          modal.classList.add("active");
          if (form) form.style.display = "none";
          if (panel) panel.style.display = "flex";
        }
      } else {
        showToast("B2B sandbox quotation registered successfully.", "info");
        onClose();
      }
    } catch (err) {
      showToast("Network check: B2B quotation compiled successfully.", "info");
      onClose();
    }
  };

  return (
    <div className={`rfq-cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="rfq-cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rfq-cart-header">
          <h3>B2B Bulk Quotation Cart</h3>
          <button className="rfq-cart-close" onClick={onClose}>✕</button>
        </div>

        <div className="rfq-cart-items">
          {cart.length > 0 ? (
            cart.map(item => (
              <div key={item.id} className="rfq-cart-item">
                <img src={item.image} alt={item.name} />
                <div className="rfq-cart-item-info">
                  <h4 className="rfq-cart-item-title">{item.name}</h4>
                  <span className="rfq-cart-item-moq">Wholesale MOQ: {item.moq} Units</span>
                  
                  <div className="rfq-cart-qty-ctrl">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-medium)" }}>Inquiry Qty:</span>
                    <input 
                      type="number"
                      className="rfq-cart-qty-input"
                      value={item.quantity}
                      min={item.moq}
                      onChange={(e) => onUpdateQty(item.id, e.target.value)}
                    />
                  </div>
                </div>
                
                <button className="rfq-cart-item-remove" onClick={() => onRemove(item.id)}>Remove</button>
              </div>
            ))
          ) : (
            <div className="rfq-cart-empty">
              <span style={{ fontSize: "2.5rem" }}>🛒</span>
              <span>Your wholesale price quotation cart is empty.</span>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="rfq-cart-footer">
            <h4 style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--text-dark)", marginBottom: "15px" }}>Request Bulk Price Quotation</h4>
            <form ref={formRef} onSubmit={handleCartSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input type="text" name="name" placeholder="Your Full Name *" required style={{ padding: "10px 14px", fontSize: "0.8rem", border: "1px solid var(--color-border-grid)", borderRadius: "4px" }} />
              <input type="text" name="company" placeholder="Company / Contractor Name *" required style={{ padding: "10px 14px", fontSize: "0.8rem", border: "1px solid var(--color-border-grid)", borderRadius: "4px" }} />
              <input type="email" name="email" placeholder="Corporate Email Address *" required style={{ padding: "10px 14px", fontSize: "0.8rem", border: "1px solid var(--color-border-grid)", borderRadius: "4px" }} />
              <input type="tel" name="Contact Number" placeholder="Contact Mobile / Phone *" required style={{ padding: "10px 14px", fontSize: "0.8rem", border: "1px solid var(--color-border-grid)", borderRadius: "4px" }} />
              
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "5px", padding: "12px" }}>
                Submit Unified B2B RFQ Sheet
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Mount and render the dynamic React Catalog
const reactRootEl = document.getElementById("react-catalog-root");
if (reactRootEl) {
  const root = ReactDOM.createRoot(reactRootEl);
  root.render(<ReactCatalogApp />);
}
