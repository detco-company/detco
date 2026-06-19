(function ProactiveRequirementFormModule() {
  // Config keys
  const STORAGE_DISMISSED_KEY = 'detco_proactive_form_dismissed';
  const SESSION_SHOWN_KEY = 'detco_proactive_form_shown';
  const SESSION_START_KEY = 'detco_visit_start';

  function openProactiveRequirementModal() {
    let proactiveOverlay = document.getElementById('proactiveEnquiryModal');
    if (!proactiveOverlay) {
      proactiveOverlay = document.createElement('div');
      proactiveOverlay.id = 'proactiveEnquiryModal';
      proactiveOverlay.className = 'proactive-modal-overlay';
      document.body.appendChild(proactiveOverlay);
      
      // Inject CSS styles dedicated to the proactive overlay and its container
      const style = document.createElement('style');
      style.innerHTML = `
        .proactive-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .proactive-modal-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        .proactive-modal-container {
          width: 100%;
          max-width: 500px;
          margin: 16px;
          background: #ffffff;
          border: 2.5px solid var(--color-accent, #DC2626);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          position: relative;
          transform: scale(0.95);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          padding: 30px;
          box-sizing: border-box;
        }
        .proactive-modal-overlay.active .proactive-modal-container {
          transform: scale(1);
        }
        .proactive-form-group {
          margin: 0;
          display: flex;
          flex-direction: column;
        }
      `;
      document.head.appendChild(style);
    }

    proactiveOverlay.innerHTML = `
      <div class="proactive-modal-container" onclick="event.stopPropagation()">
        <!-- Close button -->
        <button id="closeProactiveModalBtn" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; font-weight: 700; transition: color 0.2s;" onmouseenter="this.style.color='var(--color-accent, #DC2626)'" onmouseleave="this.style.color='#64748b'">✕</button>
        
        <!-- Modal Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; background: rgba(220,38,38,0.06); border: 2px solid rgba(220,38,38,0.18); border-radius: 50%; color: var(--color-accent, #DC2626); font-size: 1.6rem; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">📋</div>
          <h2 style="font-family: var(--font-header, sans-serif); font-size: 1.5rem; font-weight: 800; color: var(--text-dark, #0f172a); margin: 0 0 6px 0; letter-spacing: -0.5px; line-height: 1.2;">Tell Us Your Requirements</h2>
          <p style="font-family: var(--font-body, sans-serif); font-size: 0.85rem; color: #64748b; line-height: 1.5; margin: 0; max-width: 380px; margin: 0 auto;">Need bulk products, specific specifications, or custom signage? Share your list below and get a volume quotation in 24 hours.</p>
        </div>

        <!-- Form -->
        <form id="proactiveRequirementForm" style="display: flex; flex-direction: column; gap: 14px;">
          <input type="hidden" name="access_key" value="2f4a5fe1-5ec6-40ec-ab6a-6cfdacc71616">
          <input type="hidden" name="subject" value="Proactive Website Requirement Lead">
          <input type="hidden" name="from_name" value="Deepak Trading B2B Portal">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="proactive-form-group">
              <label for="proactiveName" style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Full Name *</label>
              <input type="text" id="proactiveName" name="name" required placeholder="e.g. Rajesh Kumar" style="width: 100%; padding: 8px 12px; border: 1.5px solid var(--color-border-grid, #e2e8f0); border-radius: 8px; font-size: 0.82rem; outline: none; transition: border-color 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='var(--color-accent, #DC2626)'" onblur="this.style.borderColor='var(--color-border-grid, #e2e8f0)'">
            </div>
            <div class="proactive-form-group">
              <label for="proactiveCompany" style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Company Name *</label>
              <input type="text" id="proactiveCompany" name="company" required placeholder="e.g. Apex Builders" style="width: 100%; padding: 8px 12px; border: 1.5px solid var(--color-border-grid, #e2e8f0); border-radius: 8px; font-size: 0.82rem; outline: none; transition: border-color 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='var(--color-accent, #DC2626)'" onblur="this.style.borderColor='var(--color-border-grid, #e2e8f0)'">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="proactive-form-group">
              <label for="proactivePhone" style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Phone Number *</label>
              <input type="tel" id="proactivePhone" name="Contact Number" required placeholder="e.g. +91 98765 43210" style="width: 100%; padding: 8px 12px; border: 1.5px solid var(--color-border-grid, #e2e8f0); border-radius: 8px; font-size: 0.82rem; outline: none; transition: border-color 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='var(--color-accent, #DC2626)'" onblur="this.style.borderColor='var(--color-border-grid, #e2e8f0)'">
            </div>
            <div class="proactive-form-group">
              <label for="proactiveEmail" style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Email Address *</label>
              <input type="email" id="proactiveEmail" name="email" required placeholder="e.g. rkumar@apex.com" style="width: 100%; padding: 8px 12px; border: 1.5px solid var(--color-border-grid, #e2e8f0); border-radius: 8px; font-size: 0.82rem; outline: none; transition: border-color 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='var(--color-accent, #DC2626)'" onblur="this.style.borderColor='var(--color-border-grid, #e2e8f0)'">
            </div>
          </div>

          <div class="proactive-form-group">
            <label for="proactiveSpecs" style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Requirement Details *</label>
            <textarea id="proactiveSpecs" name="requirements" required placeholder="Describe what products you need, estimated quantities, shipping location or specifications..." style="width: 100%; height: 90px; padding: 8px 12px; border: 1.5px solid var(--color-border-grid, #e2e8f0); border-radius: 8px; font-size: 0.82rem; outline: none; resize: none; transition: border-color 0.2s; font-family: var(--font-body, sans-serif); box-sizing: border-box;" onfocus="this.style.borderColor='var(--color-accent, #DC2626)'" onblur="this.style.borderColor='var(--color-border-grid, #e2e8f0)'"></textarea>
          </div>

          <button type="submit" id="proactiveSubmitBtn" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 0.9rem; font-weight: 800; border-radius: 8px; margin-top: 4px; box-sizing: border-box; background: var(--color-accent, #DC2626); color: #fff; border: none; cursor: pointer; transition: opacity 0.2s;" onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">
            Submit Requirements
          </button>
        </form>
      </div>
    `;

    // Trigger open animation transition after inserting into DOM
    setTimeout(() => {
      proactiveOverlay.classList.add('active');
      sessionStorage.setItem(SESSION_SHOWN_KEY, 'true');
    }, 20);
    document.body.style.overflow = 'hidden';

    // Helper close function
    const closeProactiveModal = () => {
      proactiveOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    };

    // Wire close event listener
    document.getElementById('closeProactiveModalBtn').addEventListener('click', closeProactiveModal);

    // Wire form submit
    const proactiveForm = document.getElementById('proactiveRequirementForm');
    if (proactiveForm) {
      proactiveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('proactiveSubmitBtn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending Details...';
        }

        const clientName = document.getElementById('proactiveName').value;

        // Build JSON payload for our own backend
        const payload = {
          name: document.getElementById('proactiveName').value,
          company: document.getElementById('proactiveCompany').value,
          phone: document.getElementById('proactivePhone').value,
          email: document.getElementById('proactiveEmail').value,
          requirements: document.getElementById('proactiveSpecs').value,
          source: 'proactive-form',
        };

        const fd = new FormData(proactiveForm);

        // 1. Submit to Web3Forms API (Primary)
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: fd
        })
        .then(response => response.json())
        .then(async (result) => {
          if (!result.success) {
            throw new Error(result.message || 'Web3Forms API rejected the request');
          }

          // 2. Submit to local backend (Backup logger, non-blocking)
          try {
            await fetch('http://localhost:3001/api/submit-lead', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } catch (backendErr) {
            console.warn('Backup local logging failed (backend offline):', backendErr);
          }

          localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
          const container = proactiveOverlay.querySelector('.proactive-modal-container');
          if (container) {
            container.innerHTML = `
              <div class="success-panel" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px 10px;">
                <div class="success-icon-wrap" style="border: 2px solid var(--color-accent, #DC2626); color: var(--color-accent, #DC2626); background: none; width: 52px; height: 52px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                  <svg style="width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 2.5;" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 class="success-title" style="font-family: var(--font-header, sans-serif); font-size: 1.4rem; font-weight: 800; color: var(--text-dark, #0f172a); margin: 0 0 8px 0;">Requirements Submitted!</h3>
                <p class="success-msg" style="font-family: var(--font-body, sans-serif); font-size: 0.85rem; color: #64748b; line-height: 1.6; max-width: 340px; margin-bottom: 20px; margin-top: 0;">
                  Thank you, <strong style="color: var(--color-accent, #DC2626);">${clientName}</strong>. We have logged your specifications. A B2B manager will contact you with bulk pricing within 24 hours.
                </p>
                <button id="closeSuccessBtn" class="btn btn-primary" style="padding: 10px 24px; font-size: 0.82rem; border-radius: 20px; background: var(--color-accent, #DC2626); color: #fff; border: none; cursor: pointer; transition: opacity 0.2s;" onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">Close Window</button>
              </div>
            `;
            document.getElementById('closeSuccessBtn').addEventListener('click', () => {
              proactiveOverlay.classList.remove('active');
              document.body.style.overflow = 'auto';
            });
          }
        })
        .catch(error => {
          console.error("Submission failed:", error);
          if (window.showB2bToast) {
            window.showB2bToast(`Submission failed: ${error.message || 'Network error occurred.'}`);
          } else {
            alert(`Submission failed: ${error.message || 'Network error occurred.'}`);
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Retry Submission';
          }
        });
      });
    }
  }

  function initProactiveRequirementTimer() {
    const isTestMode = window.location.search.includes('test=true') || window.location.hash.includes('test-popup');

    // Check if user has already interacted with the form or closed it in localStorage
    if (!isTestMode) {
      const hasClosedForm = localStorage.getItem(STORAGE_DISMISSED_KEY);
      if (hasClosedForm) return;
    }

    // Check if form was already shown to the user in this session
    const wasShownInSession = sessionStorage.getItem(SESSION_SHOWN_KEY) === 'true';

    // Track total website visit duration in sessionStorage
    let visitStart = sessionStorage.getItem(SESSION_START_KEY);
    if (!visitStart || isTestMode) {
      visitStart = Date.now().toString();
      sessionStorage.setItem(SESSION_START_KEY, visitStart);
    }

    let triggerDelay;
    if (isTestMode) {
      triggerDelay = 2000;
    } else if (wasShownInSession) {
      // Re-trigger immediately (600ms delay) on reload/navigation until they close it
      triggerDelay = 600;
    } else {
      const totalDelay = 10000; // 10s
      const elapsed = Date.now() - parseInt(visitStart);
      const remaining = Math.max(0, totalDelay - elapsed);
      triggerDelay = remaining > 0 ? remaining : 5000;
    }

    setTimeout(() => {
      // Double check: if they have already closed it or filled it on another tab in the meantime
      if (!isTestMode && localStorage.getItem(STORAGE_DISMISSED_KEY)) return;

      // Check if another modal overlay (like enquiryModal) is active
      const checkAndShow = () => {
        const regularModal = document.getElementById('enquiryModal');
        if (regularModal && regularModal.classList.contains('active')) {
          setTimeout(checkAndShow, isTestMode ? 3000 : 15000);
        } else {
          openProactiveRequirementModal();
        }
      };
      
      checkAndShow();
    }, triggerDelay);
  }

  // Auto-run when the module loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProactiveRequirementTimer);
  } else {
    initProactiveRequirementTimer();
  }
})();
