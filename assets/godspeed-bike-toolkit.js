/**
 * Godspeed E-Bike Toolkit - Theme Agnostic Version
 * Reusable e-bike tools for any Shopify theme
 * Version: 3.0.0
 * Author: Godspeed Team
 */

class EBikeToolkit {
  constructor(config = {}) {
    this.version = '3.0.0';
    this.config = {
      // Theme detection and adaptation
      theme: 'auto-detect',
      cssFramework: 'auto',
      
      // Configurable selectors for different themes
      selectors: {
        container: '.ebike-tools-container, .page-width, .container',
        button: '.btn, .button, .form__button',
        input: '.field__input, .form__input, input[type="text"], input[type="number"]',
        select: '.field__input, .form__select, select',
        card: '.card, .product-card, .grid__item',
        modal: '.modal, .drawer, .popup',
        notification: '.notification, .alert, .message'
      },
      
      // Feature flags
      features: {
        comparison: true,
        sizing: true,
        financing: true,
        wishlist: true,
        ai: true,
        // === NEW ADVANCED TOOLS ===
        rangeCalculator: true,
        testRideBooking: true,
        serviceBooking: true,
        comparison: true,
        dashboardManagement: true,
        blogGenerator: true
      },
      
      // Customization options
      branding: {
        primary: '#2c2c2c',
        accent: '#ff6b9d',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      
      // API endpoints (optional - will use demo data if null)
      endpoints: {
        comparison: null,
        sizing: null,
        financing: null
      },
      
      ...config
    };

    this.theme = null;
    this.modules = new Map();
    this.initialized = false;
    
    this.init();
  }

  /**
   * Initialize the toolkit
   */
  async init() {
    if (this.initialized) return;
    
    try {
      // Detect theme and adapt configuration
      this.theme = this.detectTheme();
      this.adaptToTheme();
      
      // Load CSS if not already loaded
      this.loadCSS();
      
      // Initialize enabled modules
      await this.initializeModules();
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Scan for existing tool elements immediately
      setTimeout(() => {
        this.scanForToolElements();
      }, 100);
      
      this.initialized = true;
      this.log('E-Bike Toolkit initialized successfully', 'success');
      
      // Dispatch ready event
      document.dispatchEvent(new CustomEvent('ebike-toolkit:ready', {
        detail: { toolkit: this, version: this.version }
      }));
      
    } catch (error) {
      this.log(`Failed to initialize toolkit: ${error.message}`, 'error');
    }
  }

  /**
   * Detect current Shopify theme
   */
  detectTheme() {
    // Check for theme-specific classes or attributes
    const body = document.body;
    const html = document.documentElement;
    
    // Godspeed theme detection
    if (body.classList.contains('gradient') || 
        document.querySelector('.header__wrapper') ||
        document.querySelector('.shopify-section-group-header-group')) {
      return 'godspeed';
    }
    
    // Custom theme detection
    if (body.classList.contains('homepage--white') ||
        document.querySelector('.theme-collection-container') ||
        document.querySelector('[class*="homepage--"]')) {
      return 'custom';
    }
    
    // Impulse theme detection
    if (body.classList.contains('template-index') && 
        document.querySelector('.site-header__logo')) {
      return 'impulse';
    }
    
    // Brooklyn theme detection
    if (document.querySelector('.site-header') && 
        document.querySelector('.main-content')) {
      return 'brooklyn';
    }
    
    // Debut theme detection
    if (document.querySelector('.site-header') && 
        document.querySelector('.template-index')) {
      return 'debut';
    }
    
    // Generic Shopify theme
    if (document.querySelector('.shopify-section') ||
        document.querySelector('[class*="template-"]')) {
      return 'generic-shopify';
    }
    
    return 'unknown';
  }

  /**
   * Adapt configuration based on detected theme
   */
  adaptToTheme() {
    const adaptations = {
      godspeed: {
        selectors: {
          button: '.button',
          input: '.field__input',
          select: '.field__input',
          container: '.page-width',
          card: '.card',
          modal: '.modal'
        },
        classes: {
          buttonPrimary: 'button button--primary',
          buttonSecondary: 'button button--secondary',
          field: 'field',
          grid: 'grid'
        }
      },
      custom: {
        selectors: {
          button: '.btn',
          input: 'input',
          select: 'select',
          container: '.wrapper',
          card: '.grid__item',
          modal: '.modal'
        },
        classes: {
          buttonPrimary: 'btn btn-primary',
          buttonSecondary: 'btn btn-secondary',
          field: 'form-group',
          grid: 'grid'
        }
      },
      impulse: {
        selectors: {
          button: '.btn',
          input: '.form-field',
          select: '.form-field',
          container: '.page-width',
          card: '.grid__item'
        },
        classes: {
          buttonPrimary: 'btn product-form__cart-submit',
          buttonSecondary: 'btn btn--secondary',
          field: 'form-field',
          grid: 'grid grid--uniform'
        }
      },
      'generic-shopify': {
        selectors: {
          button: '.btn, .button, input[type="submit"]',
          input: 'input[type="text"], input[type="number"], input[type="email"]',
          select: 'select',
          container: '.main-content, .page-width, .container',
          card: '.product-item, .grid__item, .product'
        },
        classes: {
          buttonPrimary: 'btn btn-primary',
          buttonSecondary: 'btn btn-secondary',
          field: 'form-field',
          grid: 'grid'
        }
      }
    };

    const themeConfig = adaptations[this.theme] || adaptations['generic-shopify'];
    
    // Merge theme-specific configuration
    this.config.selectors = { ...this.config.selectors, ...themeConfig.selectors };
    this.config.classes = { ...this.config.classes, ...themeConfig.classes };
    
    this.log(`Adapted to theme: ${this.theme}`, 'info');
  }

  /**
   * Load CSS dynamically if not already loaded
   */
  loadCSS() {
    const cssId = 'godspeed-bike-toolkit-css';
    
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = `${window.Shopify?.routes?.root || ''}/assets/godspeed-bike-toolkit.css?v=${this.version}`;
      document.head.appendChild(link);
      
      // Set CSS custom properties for theming
      this.setCSSProperties();
    }
  }

  /**
   * Set CSS custom properties for theming
   */
  setCSSProperties() {
    const root = document.documentElement;
    
    Object.entries(this.config.branding).forEach(([key, value]) => {
      root.style.setProperty(`--ebike-${key}`, value);
    });
    
    // Set theme-specific properties
    root.style.setProperty('--ebike-theme', this.theme);
  }

  /**
   * Initialize enabled modules
   */
  async initializeModules() {
    const modulePromises = [];
    
    if (this.config.features.comparison) {
      modulePromises.push(this.loadModule('comparison', BikeComparison));
    }
    
    if (this.config.features.sizing) {
      modulePromises.push(this.loadModule('sizing', SizeCalculator));
    }
    
    if (this.config.features.financing) {
      modulePromises.push(this.loadModule('financing', FinancingCalculator));
    }
    
    if (this.config.features.wishlist) {
      modulePromises.push(this.loadModule('wishlist', WishlistManager));
    }
    
    // === NEW ADVANCED TOOLS ===
    if (this.config.features.rangeCalculator) {
      modulePromises.push(this.loadModule('rangeCalculator', RangeCalculator));
    }
    
    if (this.config.features.testRideBooking) {
      modulePromises.push(this.loadModule('testRideBooking', TestRideBooking));
    }
    
    if (this.config.features.serviceBooking) {
      modulePromises.push(this.loadModule('serviceBooking', ServiceBooking));
    }
    
    if (this.config.features.comparison) {
      modulePromises.push(this.loadModule('comparison', BikeComparison));
    }
    
    if (this.config.features.dashboardManagement) {
      modulePromises.push(this.loadModule('dashboardManagement', DashboardManagement));
    }
    
    if (this.config.features.blogGenerator) {
      modulePromises.push(this.loadModule('blogGenerator', BlogGenerator));
    }
    
    await Promise.allSettled(modulePromises);
  }

  /**
   * Load individual module
   */
  async loadModule(name, ModuleClass) {
    try {
      const module = new ModuleClass(this);
      await module.init();
      this.modules.set(name, module);
      
      this.log(`Module ${name} loaded successfully`, 'success');
      
      // Dispatch module ready event
      document.dispatchEvent(new CustomEvent(`ebike-toolkit:${name}:ready`, {
        detail: { module, toolkit: this }
      }));
      
    } catch (error) {
      this.log(`Failed to load module ${name}: ${error.message}`, 'error');
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Listen for Shopify section loads (theme editor)
    document.addEventListener('shopify:section:load', (event) => {
      this.handleSectionLoad(event);
    });
    
    // Listen for dynamic content loads
    document.addEventListener('DOMContentLoaded', () => {
      this.scanForToolElements();
    });
    
    // Handle AJAX navigation
    if (window.history && window.history.pushState) {
      window.addEventListener('popstate', () => {
        setTimeout(() => this.scanForToolElements(), 100);
      });
    }
  }

  /**
   * Handle Shopify section load/reload
   */
  handleSectionLoad(event) {
    const sectionId = event.detail.sectionId;
    
    // Re-scan for tool elements in the loaded section
    setTimeout(() => {
      this.scanForToolElements(event.target);
    }, 100);
  }

  /**
   * Scan for tool elements and initialize them
   */
  scanForToolElements(container = document) {
    // Find and initialize comparison tools
    const comparisonElements = container.querySelectorAll('[data-ebike-tool="comparison"]');
    comparisonElements.forEach(element => {
      const module = this.modules.get('comparison');
      if (module) module.bindElement(element);
    });
    
    // Find and initialize size calculators
    const sizingElements = container.querySelectorAll('[data-ebike-tool="sizing"]');
    sizingElements.forEach(element => {
      const module = this.modules.get('sizing');
      if (module) module.bindElement(element);
    });
    
    // Find and initialize financing calculators
    const financingElements = container.querySelectorAll('[data-ebike-tool="financing"]');
    financingElements.forEach(element => {
      const module = this.modules.get('financing');
      if (module) module.bindElement(element);
    });
    
    // Find and initialize wishlist managers
    const wishlistElements = container.querySelectorAll('[data-ebike-tool="wishlist"]');
    wishlistElements.forEach(element => {
      const module = this.modules.get('wishlist');
      if (module) module.bindElement(element);
    });
    
    // === NEW ADVANCED TOOLS ===
    
    // Find and initialize range calculators
    const rangeElements = container.querySelectorAll('[data-ebike-tool="rangeCalculator"]');
    rangeElements.forEach(element => {
      const module = this.modules.get('rangeCalculator');
      if (module) module.bindElement(element);
    });
    
    // Find and initialize test ride booking
    const testRideElements = container.querySelectorAll('[data-ebike-tool="testRideBooking"]');
    testRideElements.forEach(element => {
      const module = this.modules.get('testRideBooking');
      if (module) module.bindElement(element);
    });
    
    // Find and initialize service booking
    const serviceElements = container.querySelectorAll('[data-ebike-tool="serviceBooking"]');
    serviceElements.forEach(element => {
      const module = this.modules.get('serviceBooking');
      if (module) module.bindElement(element);
    });
    
    // Find and initialize dashboard management
    const dashboardElements = container.querySelectorAll('[data-ebike-tool="dashboardManagement"]');
    dashboardElements.forEach(element => {
      const module = this.modules.get('dashboardManagement');
      if (module) module.bindElement(element);
    });
    
    // Find and initialize blog generator
    const blogGeneratorElements = container.querySelectorAll('[data-ebike-tool="blogGenerator"]');
    blogGeneratorElements.forEach(element => {
      const module = this.modules.get('blogGenerator');
      if (module) module.bindElement(element);
    });
  }

  /**
   * Public API methods
   */
  
  // Get module instance
  getModule(name) {
    return this.modules.get(name);
  }
  
  // Enable/disable feature
  toggleFeature(name, enabled) {
    this.config.features[name] = enabled;
    
    if (enabled && !this.modules.has(name)) {
      this.loadModuleByName(name);
    } else if (!enabled && this.modules.has(name)) {
      const module = this.modules.get(name);
      module.destroy();
      this.modules.delete(name);
    }
  }
  
  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.adaptToTheme();
    this.setCSSProperties();
  }
  
  // Get toolkit info
  getInfo() {
    return {
      version: this.version,
      theme: this.theme,
      modules: Array.from(this.modules.keys()),
      config: this.config
    };
  }

  /**
   * Utility methods
   */
  
  // Find elements using theme-adaptive selectors
  find(selector, context = document) {
    const selectors = selector.split(',').map(s => s.trim());
    
    for (const sel of selectors) {
      const elements = context.querySelectorAll(sel);
      if (elements.length > 0) return elements;
    }
    
    return [];
  }
  
  // Create element with theme-appropriate classes
  createElement(tag, classes = '', content = '') {
    const element = document.createElement(tag);
    
    if (classes) {
      // Apply theme-specific class mapping
      const mappedClasses = this.mapClasses(classes);
      element.className = mappedClasses;
    }
    
    if (content) {
      element.innerHTML = content;
    }
    
    return element;
  }
  
  // Map generic classes to theme-specific ones
  mapClasses(classes) {
    const classMap = this.config.classes || {};
    
    return classes.split(' ').map(cls => {
      return classMap[cls] || cls;
    }).join(' ');
  }
  
  // Logging with levels
  log(message, level = 'info') {
    const prefix = `[E-Bike Toolkit ${this.version}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warning':
        console.warn(`${prefix} ${message}`);
        break;
      case 'success':
        console.log(`%c${prefix} ${message}`, 'color: #22c55e; font-weight: bold;');
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}

/**
 * Base Module Class
 * All tool modules extend this class
 */
class BaseModule {
  constructor(toolkit) {
    this.toolkit = toolkit;
    this.config = toolkit.config;
    this.theme = toolkit.theme;
    this.elements = new Set();
    this.initialized = false;
  }

  async init() {
    this.initialized = true;
  }

  bindElement(element) {
    if (this.elements.has(element)) return;
    
    this.elements.add(element);
    this.setupElement(element);
  }

  setupElement(element) {
    // Override in subclasses
  }

  destroy() {
    this.elements.forEach(element => {
      this.cleanupElement(element);
    });
    this.elements.clear();
    this.initialized = false;
  }

  cleanupElement(element) {
    // Override in subclasses
  }

  // Utility method to find elements within module context
  find(selector, context = document) {
    return this.toolkit.find(selector, context);
  }

  // Create elements with toolkit theming
  createElement(tag, classes, content) {
    return this.toolkit.createElement(tag, classes, content);
  }

  // Log with module context
  log(message, level = 'info') {
    this.toolkit.log(`[${this.constructor.name}] ${message}`, level);
  }
}

/**
 * Bike Comparison Module
 */

/**
 * Size Calculator Module
 */
class SizeCalculator extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.calculators = new Map();
    this.sizeCharts = this.getDefaultSizeCharts();
  }

  async init() {
    await super.init();
    this.log('Size Calculator module initialized');
  }

  setupElement(element) {
    const calculatorId = element.dataset.calculatorId || this.generateId();
    element.dataset.calculatorId = calculatorId;
    
    const calculator = new SizeCalculatorInstance(calculatorId, element, this);
    this.calculators.set(calculatorId, calculator);
    
    calculator.render();
  }

  cleanupElement(element) {
    const calculatorId = element.dataset.calculatorId;
    if (calculatorId && this.calculators.has(calculatorId)) {
      this.calculators.get(calculatorId).destroy();
      this.calculators.delete(calculatorId);
    }
  }

  generateId() {
    return `calculator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDefaultSizeCharts() {
    return {
      city: {
        150: 'XS (44-46 cm)',
        160: 'XS (44-46 cm)',
        170: 'S (48-50 cm)',
        180: 'M (52-54 cm)',
        190: 'L (56-58 cm)',
        200: 'XL (60-62 cm)'
      },
      mountain: {
        150: 'XS (38-40 cm)',
        160: 'XS (38-40 cm)',
        170: 'S (42-44 cm)',
        180: 'M (46-48 cm)',
        190: 'L (50-52 cm)',
        200: 'XL (54-56 cm)'
      },
      cargo: {
        150: 'S (46-48 cm)',
        165: 'S (46-48 cm)',
        180: 'M (50-52 cm)',
        200: 'L (54-56 cm)'
      }
    };
  }
}

/**
 * Size Calculator Instance
 */
class SizeCalculatorInstance {
  constructor(id, element, module) {
    this.id = id;
    this.element = element;
    this.module = module;
  }

  render() {
    const template = `
      <div class="ebike-size-calculator" data-theme="${this.module.theme}">
        <div class="calculator-header">
          <h3>${this.element.dataset.title || 'Find Your Perfect Size'}</h3>
          <p>${this.element.dataset.subtitle || 'Enter your measurements for personalized recommendations'}</p>
        </div>
        
        <form class="calculator-form">
          <div class="form-row">
            <div class="form-field">
              <label for="height-${this.id}">Height (cm)</label>
              <input type="number" id="height-${this.id}" min="120" max="230" placeholder="170" 
                     class="${this.module.config.selectors.input || 'form-input'}">
            </div>
            <div class="form-field">
              <label for="inseam-${this.id}">Inseam (cm)</label>
              <input type="number" id="inseam-${this.id}" min="50" max="120" placeholder="80"
                     class="${this.module.config.selectors.input || 'form-input'}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="bike-type-${this.id}">Bike Type</label>
              <select id="bike-type-${this.id}" class="${this.module.config.selectors.select || 'form-select'}">
                <option value="city">City & Trekking</option>
                <option value="mountain">Mountain</option>
                <option value="cargo">Cargo</option>
              </select>
            </div>
            <div class="form-field">
              <button type="submit" class="${this.module.config.classes?.buttonPrimary || 'btn btn-primary'}">
                Calculate Size
              </button>
            </div>
          </div>
        </form>
        
        <div class="calculator-result" style="display: none;">
          <div class="result-content">
            <h4>Recommended Size</h4>
            <div class="size-result"></div>
            <div class="size-advice"></div>
          </div>
        </div>
      </div>
    `;
    
    this.element.innerHTML = template;
    this.bindEvents();
  }

  bindEvents() {
    const form = this.element.querySelector('.calculator-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculateSize();
    });
  }

  calculateSize() {
    const height = parseInt(this.element.querySelector(`#height-${this.id}`).value);
    const inseam = parseInt(this.element.querySelector(`#inseam-${this.id}`).value);
    const bikeType = this.element.querySelector(`#bike-type-${this.id}`).value;
    
    if (!height || !inseam) {
      showError('Please enter both height and inseam measurements.');
      return;
    }
    
    if (height < 120 || height > 230) {
      showError('Please enter a height between 120 and 230 cm.');
      return;
    }
    
    const size = this.calculateFrameSize(height, bikeType);
    const advice = this.generateAdvice(height, inseam, bikeType);
    
    this.displayResult(size, advice);
  }

  calculateFrameSize(height, bikeType) {
    const chart = this.module.sizeCharts[bikeType] || this.module.sizeCharts.city;
    
    for (let minHeight in chart) {
      if (height <= parseInt(minHeight)) {
        return chart[minHeight];
      }
    }
    
    const maxHeight = Math.max(...Object.keys(chart).map(h => parseInt(h)));
    return chart[maxHeight];
  }

  generateAdvice(height, inseam, bikeType) {
    const ratio = inseam / height;
    let advice = 'This recommendation is a guideline. ';
    
    if (ratio < 0.43) {
      advice += 'You have relatively short legs — consider a smaller frame for comfort. ';
    } else if (ratio > 0.47) {
      advice += 'You have relatively long legs — a larger frame may be suitable. ';
    }
    
    advice += 'For the best fit, we recommend a test ride and professional consultation.';
    
    return advice;
  }

  displayResult(size, advice) {
    const resultDiv = this.element.querySelector('.calculator-result');
    const sizeDiv = this.element.querySelector('.size-result');
    const adviceDiv = this.element.querySelector('.size-advice');
    
    sizeDiv.innerHTML = `<strong>${size}</strong>`;
    adviceDiv.textContent = advice;
    
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  destroy() {
    this.element.innerHTML = '';
  }
}

/**
 * Financing Calculator Module
 */
class FinancingCalculator extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.calculators = new Map();
  }

  async init() {
    await super.init();
    this.log('Financing Calculator module initialized');
  }

  setupElement(element) {
    const calculatorId = element.dataset.calculatorId || this.generateId();
    element.dataset.calculatorId = calculatorId;
    
    const calculator = new FinancingCalculatorInstance(calculatorId, element, this);
    this.calculators.set(calculatorId, calculator);
    
    calculator.render();
  }

  cleanupElement(element) {
    const calculatorId = element.dataset.calculatorId;
    if (calculatorId && this.calculators.has(calculatorId)) {
      this.calculators.get(calculatorId).destroy();
      this.calculators.delete(calculatorId);
    }
  }

  generateId() {
    return `financing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class FinancingCalculatorInstance {
  constructor(id, element, module) {
    this.id = id;
    this.element = element;
    this.module = module;
  }

  render() {
    // Create interactive financing calculator interface
    this.element.innerHTML = `
      <div class="ebike-financing-calculator" data-theme="${this.module.theme}">
        <div class="financing-header">
          <h3>${this.element.dataset.title || '0% Financing Calculator'}</h3>
          <p>${this.element.dataset.subtitle || 'Calculate your monthly payments'}</p>
        </div>
        <div class="financing-form">
          <div class="form-field">
            <label>Bike Price (CHF)</label>
            <input type="number" class="price-input" min="1000" max="15000" value="3500">
          </div>
          <div class="form-field">
            <label>Financing Term</label>
            <select class="term-select">
              <option value="6">6 months</option>
              <option value="12" selected>12 months</option>
              <option value="18">18 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
            </select>
          </div>
          <div class="financing-result">
            <div class="monthly-payment">Monthly Payment: <span class="amount">CHF 292</span></div>
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents();
    this.calculate();
  }

  bindEvents() {
    const priceInput = this.element.querySelector('.price-input');
    const termSelect = this.element.querySelector('.term-select');
    
    priceInput.addEventListener('input', () => this.calculate());
    termSelect.addEventListener('change', () => this.calculate());
  }

  calculate() {
    const price = parseFloat(this.element.querySelector('.price-input').value) || 0;
    const term = parseInt(this.element.querySelector('.term-select').value) || 12;
    
    const monthlyPayment = price / term;
    const amountSpan = this.element.querySelector('.amount');
    amountSpan.textContent = `CHF ${monthlyPayment.toFixed(2)}`;
  }

  destroy() {
    this.element.innerHTML = '';
  }
}

/**
 * Wishlist Manager Module
 */
class WishlistManager extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.wishlists = new Map();
    this.wishlistItems = JSON.parse(localStorage.getItem('ebike-wishlist') || '[]');
  }

  async init() {
    await super.init();
    this.log('Wishlist Manager module initialized');
  }

  setupElement(element) {
    const wishlistId = element.dataset.wishlistId || this.generateId();
    element.dataset.wishlistId = wishlistId;
    
    const wishlist = new WishlistInstance(wishlistId, element, this);
    this.wishlists.set(wishlistId, wishlist);
    
    wishlist.render();
  }

  cleanupElement(element) {
    const wishlistId = element.dataset.wishlistId;
    if (wishlistId && this.wishlists.has(wishlistId)) {
      this.wishlists.get(wishlistId).destroy();
      this.wishlists.delete(wishlistId);
    }
  }

  generateId() {
    return `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addToWishlist(productId, productData) {
    if (!this.wishlistItems.find(item => item.id === productId)) {
      this.wishlistItems.push({ id: productId, ...productData, addedAt: new Date() });
      this.saveWishlist();
      this.notifyWishlistChange();
    }
  }

  removeFromWishlist(productId) {
    this.wishlistItems = this.wishlistItems.filter(item => item.id !== productId);
    this.saveWishlist();
    this.notifyWishlistChange();
  }

  saveWishlist() {
    localStorage.setItem('ebike-wishlist', JSON.stringify(this.wishlistItems));
  }

  notifyWishlistChange() {
    document.dispatchEvent(new CustomEvent('ebike-wishlist:changed', {
      detail: { items: this.wishlistItems, count: this.wishlistItems.length }
    }));
  }
}

class WishlistInstance {
  constructor(id, element, module) {
    this.id = id;
    this.element = element;
    this.module = module;
  }

  render() {
    this.element.innerHTML = `
      <div class="ebike-wishlist-manager" data-theme="${this.module.theme}">
        <div class="wishlist-header">
          <h3>Your Wishlist</h3>
          <span class="wishlist-count">${this.module.wishlistItems.length} items</span>
        </div>
        <div class="wishlist-items">
          ${this.renderWishlistItems()}
        </div>
      </div>
    `;
  }

  renderWishlistItems() {
    if (this.module.wishlistItems.length === 0) {
      return '<p class="empty-wishlist">Your wishlist is empty</p>';
    }

    return this.module.wishlistItems.map(item => `
      <div class="wishlist-item" data-product-id="${item.id}">
        <div class="item-info">
          <h4>${item.name}</h4>
          <p class="item-price">${item.price}</p>
        </div>
        <button class="remove-item" data-product-id="${item.id}">Remove</button>
      </div>
    `).join('');
  }

  destroy() {
    this.element.innerHTML = '';
  }
}

/**
 * === NEW ADVANCED TOOL MODULES ===
 */

/**
 * Range Calculator Module
 */
class RangeCalculator extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.calculators = new Map();
  }

  async init() {
    await super.init();
    this.log('Range Calculator module initialized');
  }

  setupElement(element) {
    const calculatorId = element.dataset.calculatorId || this.generateId();
    element.dataset.calculatorId = calculatorId;
    
    // Load range calculator data if available
    const rangeData = window.rangeCalculatorData || {};
    const rangeUtils = window.rangeCalculatorUtils || {};
    
    const calculator = new RangeCalculatorInstance(calculatorId, element, this, rangeData, rangeUtils);
    this.calculators.set(calculatorId, calculator);
    
    calculator.render();
  }

  cleanupElement(element) {
    const calculatorId = element.dataset.calculatorId;
    if (calculatorId && this.calculators.has(calculatorId)) {
      this.calculators.get(calculatorId).destroy();
      this.calculators.delete(calculatorId);
    }
  }

  generateId() {
    return `range_calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class RangeCalculatorInstance {
  constructor(id, element, module, rangeData = {}, rangeUtils = {}) {
    this.id = id;
    this.element = element;
    this.module = module;
    this.rangeData = rangeData;
    this.rangeUtils = rangeUtils;
    this.units = this.element.dataset.units || 'metric';
    this.showTips = this.element.dataset.showTips !== 'false';
  }

  render() {
    // Hide the loading placeholder
    const placeholder = this.element.querySelector('.ebike-loading-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.remove(); // Remove it completely
    }
    
    // Create the actual range calculator interface
    const calculatorDiv = document.createElement('div');
    calculatorDiv.className = 'ebike-range-calculator';
    calculatorDiv.innerHTML = this.buildCalculatorHTML();
    
    this.element.appendChild(calculatorDiv);
    this.bindEvents();
    this.calculate(); // Initial calculation
  }

  buildCalculatorHTML() {
    const weightLabel = this.units === 'imperial' ? 'lbs' : 'kg';
    const tempLabel = this.units === 'imperial' ? '°F' : '°C';
    
    return `
      <div class="range-calculator-content">
        <div class="calculator-header">
          <h3>${this.element.dataset.title || 'Range Calculator'}</h3>
          <p>${this.element.dataset.subtitle || 'Estimate your e-bike range based on real conditions'}</p>
        </div>
        
        <form class="calculator-form">
          <div class="form-row">
            <div class="form-field">
              <label for="bike-model-${this.id}">Bike Model</label>
              <select id="bike-model-${this.id}" class="bike-model-select">
                <option value="city-comfort">City Comfort Pro (400Wh)</option>
                <option value="trekking-sport" selected>Trekking Sport X1 (625Wh)</option>
                <option value="mountain-trail">Mountain Trail Pro (630Wh)</option>
                <option value="cargo-family">Cargo Family+ (500Wh)</option>
              </select>
            </div>
            <div class="form-field">
              <label for="assist-level-${this.id}">Assist Level</label>
              <select id="assist-level-${this.id}" class="assist-level-select">
                <option value="eco">ECO - Maximum Range</option>
                <option value="tour" selected>TOUR - Balanced</option>
                <option value="sport">SPORT - Performance</option>
                <option value="turbo">TURBO - Maximum Power</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="rider-weight-${this.id}">Rider Weight (${weightLabel})</label>
              <input type="number" id="rider-weight-${this.id}" 
                     min="${this.units === 'imperial' ? '90' : '40'}" 
                     max="${this.units === 'imperial' ? '330' : '150'}" 
                     value="${this.units === 'imperial' ? '165' : '75'}" 
                     class="rider-weight-input">
            </div>
            <div class="form-field">
              <label for="cargo-weight-${this.id}">Cargo Weight (${weightLabel})</label>
              <input type="number" id="cargo-weight-${this.id}" 
                     min="0" 
                     max="${this.units === 'imperial' ? '110' : '50'}" 
                     value="0" 
                     class="cargo-weight-input">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="terrain-${this.id}">Terrain Type</label>
              <select id="terrain-${this.id}" class="terrain-select">
                <option value="flat">Flat/City (0% grade)</option>
                <option value="rolling" selected>Rolling Hills (2-5% grade)</option>
                <option value="hilly">Hilly (5-10% grade)</option>
                <option value="mountain">Mountain (10%+ grade)</option>
              </select>
            </div>
            <div class="form-field">
              <label for="weather-${this.id}">Weather Conditions</label>
              <select id="weather-${this.id}" class="weather-select">
                <option value="ideal" selected>Ideal (20°C, No Wind)</option>
                <option value="good">Good (Light Wind)</option>
                <option value="fair">Fair (Strong Wind/Cold)</option>
                <option value="poor">Poor (Very Cold/Storm)</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="temperature-${this.id}">Temperature (${tempLabel})</label>
              <input type="number" id="temperature-${this.id}" 
                     min="${this.units === 'imperial' ? '14' : '-10'}" 
                     max="${this.units === 'imperial' ? '104' : '40'}" 
                     value="${this.units === 'imperial' ? '68' : '20'}" 
                     class="temperature-input">
            </div>
            <div class="form-field">
              <label for="speed-${this.id}">Average Speed (${this.units === 'imperial' ? 'mph' : 'km/h'})</label>
              <input type="number" id="speed-${this.id}" 
                     min="${this.units === 'imperial' ? '6' : '10'}" 
                     max="${this.units === 'imperial' ? '28' : '45'}" 
                     value="${this.units === 'imperial' ? '15' : '25'}" 
                     class="speed-input">
            </div>
          </div>
        </form>
        
        <div class="calculation-results">
          <h4>Estimated Range</h4>
          <div class="range-estimates">
            <div class="range-estimate conservative">
              <div class="estimate-label">Conservative</div>
              <div class="estimate-value" id="conservative-${this.id}">65 km</div>
              <div class="estimate-description">Worst case scenario</div>
            </div>
            <div class="range-estimate realistic">
              <div class="estimate-label">Realistic</div>
              <div class="estimate-value" id="realistic-${this.id}">85 km</div>
              <div class="estimate-description">Expected range</div>
            </div>
            <div class="range-estimate optimistic">
              <div class="estimate-label">Optimistic</div>
              <div class="estimate-value" id="optimistic-${this.id}">105 km</div>
              <div class="estimate-description">Best case scenario</div>
            </div>
          </div>
          
          <div class="range-factors">
            <h5>Range Impact Factors</h5>
            <div class="factors-grid">
              <div class="factor" id="terrain-impact-${this.id}">
                <span class="factor-label">Terrain:</span>
                <span class="factor-value">+20% consumption</span>
              </div>
              <div class="factor" id="weather-impact-${this.id}">
                <span class="factor-label">Weather:</span>
                <span class="factor-value">+0% consumption</span>
              </div>
              <div class="factor" id="weight-impact-${this.id}">
                <span class="factor-label">Weight:</span>
                <span class="factor-value">+15% consumption</span>
              </div>
              <div class="factor" id="assist-impact-${this.id}">
                <span class="factor-label">Assist Level:</span>
                <span class="factor-value">+30% consumption</span>
              </div>
            </div>
          </div>
        </div>
        
        ${this.showTips ? this.buildOptimizationTips() : ''}
      </div>
    `;
  }

  buildOptimizationTips() {
    const tips = this.units === 'imperial' ? [
      'Use ECO mode for maximum range',
      'Maintain proper tire pressure (35-60 psi)',
      'Plan routes to avoid headwinds',
      'Keep battery between 20-80% charge',
      'Lighter cargo extends range significantly',
      'Smooth acceleration saves energy'
    ] : [
      'Use ECO mode for maximum range',
      'Maintain proper tire pressure (2.5-4 bar)',
      'Plan routes to avoid headwinds',
      'Keep battery between 20-80% charge',
      'Lighter cargo extends range significantly',
      'Smooth acceleration saves energy'
    ];

    return `
      <div class="optimization-tips">
        <h5>💡 Range Optimization Tips</h5>
        <div class="tips-grid">
          ${tips.map(tip => `<div class="tip">${tip}</div>`).join('')}
        </div>
      </div>
    `;
  }

  bindEvents() {
    const form = this.element.querySelector('.calculator-form');
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
      input.addEventListener('change', () => this.calculate());
      input.addEventListener('input', () => this.calculate());
    });
  }

  calculate() {
    const bikeModel = this.element.querySelector('.bike-model-select').value;
    const assistLevel = this.element.querySelector('.assist-level-select').value;
    const riderWeight = parseFloat(this.element.querySelector('.rider-weight-input').value) || 75;
    const cargoWeight = parseFloat(this.element.querySelector('.cargo-weight-input').value) || 0;
    const terrain = this.element.querySelector('.terrain-select').value;
    const weather = this.element.querySelector('.weather-select').value;
    const temperature = parseFloat(this.element.querySelector('.temperature-input').value) || 20;
    const speed = parseFloat(this.element.querySelector('.speed-input').value) || 25;

    // Bike specifications
    const bikeSpecs = {
      'city-comfort': { batteryCapacity: 400, baseConsumption: 12, efficiency: 0.85 },
      'trekking-sport': { batteryCapacity: 625, baseConsumption: 14, efficiency: 0.82 },
      'mountain-trail': { batteryCapacity: 630, baseConsumption: 18, efficiency: 0.80 },
      'cargo-family': { batteryCapacity: 500, baseConsumption: 20, efficiency: 0.75 }
    };

    const bike = bikeSpecs[bikeModel];
    
    // Assist level multipliers
    const assistMultipliers = {
      eco: 0.7,
      tour: 1.0,
      sport: 1.4,
      turbo: 1.8
    };

    // Terrain multipliers
    const terrainMultipliers = {
      flat: 1.0,
      rolling: 1.2,
      hilly: 1.5,
      mountain: 2.0
    };

    // Weather multipliers
    const weatherMultipliers = {
      ideal: 1.0,
      good: 1.1,
      fair: 1.3,
      poor: 1.6
    };

    // Temperature impact
    const tempCelsius = this.units === 'imperial' ? (temperature - 32) * 5/9 : temperature;
    let tempMultiplier = 1.0;
    if (tempCelsius < 5) tempMultiplier = 1.4;
    else if (tempCelsius < 15) tempMultiplier = 1.2;
    else if (tempCelsius > 30) tempMultiplier = 1.15;

    // Weight impact
    const totalWeight = this.units === 'imperial' ? (riderWeight + cargoWeight) * 0.453592 : (riderWeight + cargoWeight);
    let weightMultiplier = 1.0;
    if (totalWeight > 100) weightMultiplier = 1.35;
    else if (totalWeight > 80) weightMultiplier = 1.15;
    else if (totalWeight < 60) weightMultiplier = 0.9;

    // Speed impact (higher speeds = more consumption)
    const speedKmh = this.units === 'imperial' ? speed * 1.60934 : speed;
    const speedMultiplier = Math.max(0.8, Math.min(1.5, speedKmh / 25));

    // Calculate consumption
    const baseConsumption = bike.baseConsumption * assistMultipliers[assistLevel];
    const totalConsumption = baseConsumption * 
                           terrainMultipliers[terrain] * 
                           weatherMultipliers[weather] * 
                           tempMultiplier * 
                           weightMultiplier * 
                           speedMultiplier;

    // Calculate range estimates
    const baseRange = bike.batteryCapacity / totalConsumption;
    const conservative = Math.round(baseRange * 0.8);
    const realistic = Math.round(baseRange);
    const optimistic = Math.round(baseRange * 1.2);

    const unit = this.units === 'imperial' ? 'miles' : 'km';
    const conversionFactor = this.units === 'imperial' ? 0.621371 : 1;

    // Update display
    document.getElementById(`conservative-${this.id}`).textContent = `${Math.round(conservative * conversionFactor)} ${unit}`;
    document.getElementById(`realistic-${this.id}`).textContent = `${Math.round(realistic * conversionFactor)} ${unit}`;
    document.getElementById(`optimistic-${this.id}`).textContent = `${Math.round(optimistic * conversionFactor)} ${unit}`;

    // Update factors
    this.updateFactors(terrainMultipliers[terrain], weatherMultipliers[weather], weightMultiplier, assistMultipliers[assistLevel]);
  }

  updateFactors(terrainMult, weatherMult, weightMult, assistMult) {
    const formatPercent = (mult) => {
      const percent = Math.round((mult - 1) * 100);
      return percent > 0 ? `+${percent}%` : `${percent}%`;
    };

    document.getElementById(`terrain-impact-${this.id}`).querySelector('.factor-value').textContent = 
      `${formatPercent(terrainMult)} consumption`;
    document.getElementById(`weather-impact-${this.id}`).querySelector('.factor-value').textContent = 
      `${formatPercent(weatherMult)} consumption`;
    document.getElementById(`weight-impact-${this.id}`).querySelector('.factor-value').textContent = 
      `${formatPercent(weightMult)} consumption`;
    document.getElementById(`assist-impact-${this.id}`).querySelector('.factor-value').textContent = 
      `${formatPercent(assistMult)} consumption`;
  }

  destroy() {
    const calculator = this.element.querySelector('.ebike-range-calculator');
    if (calculator) calculator.remove();
  }
}

/**
 * Test Ride Booking Module
 */
class TestRideBooking extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.bookings = new Map();
  }

  async init() {
    await super.init();
    this.log('Test Ride Booking module initialized');
  }

  setupElement(element) {
    const bookingId = element.dataset.bookingId || this.generateId();
    element.dataset.bookingId = bookingId;
    
    const bookingData = window.testRideBookingData || {};
    const bookingUtils = window.testRideBookingUtils || {};
    
    const booking = new TestRideBookingInstance(bookingId, element, this, bookingData, bookingUtils);
    this.bookings.set(bookingId, booking);
    
    booking.render();
  }

  cleanupElement(element) {
    const bookingId = element.dataset.bookingId;
    if (bookingId && this.bookings.has(bookingId)) {
      this.bookings.get(bookingId).destroy();
      this.bookings.delete(bookingId);
    }
  }

  generateId() {
    return `test_ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class TestRideBookingInstance {
  constructor(id, element, module, bookingData = {}, bookingUtils = {}) {
    this.id = id;
    this.element = element;
    this.module = module;
    this.bookingData = bookingData;
    this.bookingUtils = bookingUtils;
    this.currentStep = 1;
    this.maxSteps = 4;
    this.formData = {};
    this.availableSlots = [];
  }

  render() {
    const placeholder = this.element.querySelector('.ebike-loading-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.remove();
    }
    
    const bookingDiv = document.createElement('div');
    bookingDiv.className = 'ebike-booking-tool';
    bookingDiv.innerHTML = this.buildBookingHTML();
    
    this.element.appendChild(bookingDiv);
    this.bindEvents();
    this.updateStepIndicator();
  }

  buildBookingHTML() {
    return `
      <div class="booking-content">
        <div class="booking-header">
          <h3>${this.element.dataset.title || 'Book a Test Ride'}</h3>
          <p>${this.element.dataset.subtitle || 'Try before you buy at one of our locations'}</p>
        </div>
        
        <div class="step-indicator">
          <div class="step" data-step="1">
            <span class="step-number">1</span>
            <span class="step-label">Location</span>
          </div>
          <div class="step" data-step="2">
            <span class="step-number">2</span>
            <span class="step-label">Date & Time</span>
          </div>
          <div class="step" data-step="3">
            <span class="step-number">3</span>
            <span class="step-label">Details</span>
          </div>
          <div class="step" data-step="4">
            <span class="step-number">4</span>
            <span class="step-label">Confirm</span>
          </div>
        </div>
        
        <form class="booking-form">
          ${this.buildStepContent()}
        </form>
        
        <div class="booking-navigation">
          <button type="button" class="btn-secondary prev-step" style="display: none;">Previous</button>
          <button type="button" class="btn-primary next-step">Next Step</button>
          <button type="button" class="btn-primary submit-booking" style="display: none;">Book Test Ride</button>
        </div>
        
        <div class="booking-result" style="display: none;">
          <div class="success-message">
            <h4>🎉 Test Ride Booked Successfully!</h4>
            <p>We've sent confirmation details to your email address.</p>
            <div class="booking-summary"></div>
          </div>
        </div>
      </div>
    `;
  }

  buildStepContent() {
    switch (this.currentStep) {
      case 1:
        return this.buildLocationStep();
      case 2:
        return this.buildDateTimeStep();
      case 3:
        return this.buildDetailsStep();
      case 4:
        return this.buildConfirmationStep();
      default:
        return '';
    }
  }

  buildLocationStep() {
    const locations = window.testRideBookingData?.locations || {
      zurich: { name: 'Zürich', address: 'Bahnhofstrasse 1, 8001 Zürich' },
      basel: { name: 'Basel', address: 'Freie Strasse 25, 4001 Basel' },
      bern: { name: 'Bern', address: 'Spitalgasse 4, 3011 Bern' }
    };

    return `
      <div class="step-content" data-step-content="1">
        <h4>Choose Your Location</h4>
        <p>Select the store where you'd like to test ride our e-bikes.</p>
        
        <div class="location-grid">
          ${Object.entries(locations).map(([key, location]) => `
            <div class="location-card" data-location="${key}">
              <div class="location-header">
                <h5>${location.name}</h5>
                <div class="location-address">${location.address}</div>
              </div>
              <div class="location-info">
                <div class="location-hours">
                  <strong>Hours:</strong><br>
                  Mon-Fri: 9:00-18:00<br>
                  Sat: 9:00-17:00<br>
                  Sun: Closed
                </div>
                <div class="location-phone">
                  <strong>Phone:</strong><br>
                  ${location.phone || '+41 XX XXX XX XX'}
                </div>
              </div>
              <div class="location-bikes">
                <strong>Available Bikes:</strong><br>
                City, Trekking, Mountain, Cargo
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  buildDateTimeStep() {
    return `
      <div class="step-content" data-step-content="2">
        <h4>Select Date & Time</h4>
        <p>Choose when you'd like to visit ${this.formData.locationName || 'our store'}.</p>
        
        <div class="datetime-selection">
          <div class="date-picker-wrapper">
            <label for="booking-date-${this.id}">Preferred Date</label>
            <input type="date" id="booking-date-${this.id}" class="booking-date" 
                   min="${this.getTomorrowDate()}" 
                   max="${this.getMaxDate()}">
          </div>
          
          <div class="time-slots" id="time-slots-${this.id}">
            <label>Available Time Slots</label>
            <div class="slots-grid">
              <div class="loading-slots">Please select a date first</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  buildDetailsStep() {
    return `
      <div class="step-content" data-step-content="3">
        <h4>Your Details</h4>
        <p>Tell us about yourself and your bike preferences.</p>
        
        <div class="form-grid">
          <div class="form-group">
            <label for="customer-name-${this.id}">Full Name *</label>
            <input type="text" id="customer-name-${this.id}" class="customer-name" required>
          </div>
          
          <div class="form-group">
            <label for="customer-email-${this.id}">Email Address *</label>
            <input type="email" id="customer-email-${this.id}" class="customer-email" required>
          </div>
          
          <div class="form-group">
            <label for="customer-phone-${this.id}">Phone Number *</label>
            <input type="tel" id="customer-phone-${this.id}" class="customer-phone" required>
          </div>
          
          <div class="form-group">
            <label for="bike-preference-${this.id}">Preferred Bike Type</label>
            <select id="bike-preference-${this.id}" class="bike-preference">
              <option value="">No preference</option>
              <option value="city">City Bike</option>
              <option value="trekking">Trekking Bike</option>
              <option value="mountain">Mountain Bike</option>
              <option value="cargo">Cargo Bike</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="experience-level-${this.id}">E-Bike Experience</label>
            <select id="experience-level-${this.id}" class="experience-level">
              <option value="beginner">First time rider</option>
              <option value="some">Some experience</option>
              <option value="experienced">Very experienced</option>
            </select>
          </div>
          
          <div class="form-group full-width">
            <label for="special-requests-${this.id}">Special Requests or Questions</label>
            <textarea id="special-requests-${this.id}" class="special-requests" rows="3" 
                      placeholder="Any specific bikes you'd like to try, or questions you have..."></textarea>
          </div>
        </div>
      </div>
    `;
  }

  buildConfirmationStep() {
    return `
      <div class="step-content" data-step-content="4">
        <h4>Confirm Your Booking</h4>
        <p>Please review your test ride details.</p>
        
        <div class="booking-summary-preview">
          <div class="summary-section">
            <h5>📍 Location</h5>
            <div class="summary-value">
              <strong>${this.formData.locationName}</strong><br>
              ${this.formData.locationAddress}
            </div>
          </div>
          
          <div class="summary-section">
            <h5>📅 Date & Time</h5>
            <div class="summary-value">
              <strong>${this.formatDate(this.formData.selectedDate)}</strong><br>
              ${this.formData.selectedTime}
            </div>
          </div>
          
          <div class="summary-section">
            <h5>👤 Contact</h5>
            <div class="summary-value">
              <strong>${this.formData.customerName}</strong><br>
              ${this.formData.customerEmail}<br>
              ${this.formData.customerPhone}
            </div>
          </div>
          
          <div class="summary-section">
            <h5>🚴 Preferences</h5>
            <div class="summary-value">
              Bike Type: ${this.formData.bikePreference || 'No preference'}<br>
              Experience: ${this.formData.experienceLevel || 'Not specified'}
            </div>
          </div>
          
          ${this.formData.specialRequests ? `
            <div class="summary-section">
              <h5>💬 Special Requests</h5>
              <div class="summary-value">${this.formData.specialRequests}</div>
            </div>
          ` : ''}
        </div>
        
        <div class="important-notes">
          <h5>Important Notes:</h5>
          <ul>
            <li>Please bring a valid ID for the test ride</li>
            <li>Wear comfortable clothes and closed-toe shoes</li>
            <li>Test rides typically last 30-45 minutes</li>
            <li>Our staff will provide safety instructions and helmet</li>
            <li>You can cancel or reschedule up to 24 hours before</li>
          </ul>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Navigation buttons
    const prevBtn = this.element.querySelector('.prev-step');
    const nextBtn = this.element.querySelector('.next-step');
    const submitBtn = this.element.querySelector('.submit-booking');

    prevBtn.addEventListener('click', () => this.previousStep());
    nextBtn.addEventListener('click', () => this.nextStep());
    submitBtn.addEventListener('click', () => this.submitBooking());

    // Location selection
    this.element.addEventListener('click', (e) => {
      if (e.target.closest('.location-card')) {
        this.selectLocation(e.target.closest('.location-card'));
      }
    });

    // Date selection
    this.element.addEventListener('change', (e) => {
      if (e.target.classList.contains('booking-date')) {
        this.loadTimeSlots(e.target.value);
      }
    });

    // Time slot selection
    this.element.addEventListener('click', (e) => {
      if (e.target.classList.contains('time-slot')) {
        this.selectTimeSlot(e.target);
      }
    });
  }

  selectLocation(locationCard) {
    // Remove previous selection
    this.element.querySelectorAll('.location-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Select new location
    locationCard.classList.add('selected');
    const locationKey = locationCard.dataset.location;
    const locations = window.testRideBookingData?.locations || {};
    const location = locations[locationKey];

    this.formData.selectedLocation = locationKey;
    this.formData.locationName = location?.name || locationKey;
    this.formData.locationAddress = location?.address || '';

    // Enable next button
    this.element.querySelector('.next-step').disabled = false;
  }

  loadTimeSlots(date) {
    const slotsContainer = this.element.querySelector(`#time-slots-${this.id} .slots-grid`);
    slotsContainer.innerHTML = '<div class="loading-slots">Loading available times...</div>';

    // Simulate API call delay
    setTimeout(() => {
      const slots = this.generateAvailableSlots(date);
      slotsContainer.innerHTML = slots.length > 0 ? 
        slots.map(slot => `
          <button type="button" class="time-slot" data-time="${slot}">
            ${slot}
          </button>
        `).join('') : 
        '<div class="no-slots">No available slots for this date. Please choose another date.</div>';
    }, 500);
  }

  generateAvailableSlots(date) {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const slots = isWeekend ? 
      ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] :
      ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    // Remove some slots randomly to simulate real availability
    return slots.filter(() => Math.random() > 0.3);
  }

  selectTimeSlot(slotButton) {
    // Remove previous selection
    this.element.querySelectorAll('.time-slot').forEach(slot => {
      slot.classList.remove('selected');
    });

    // Select new time slot
    slotButton.classList.add('selected');
    this.formData.selectedTime = slotButton.dataset.time;
    this.formData.selectedDate = this.element.querySelector('.booking-date').value;
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.maxSteps) {
        this.currentStep++;
        this.updateStepContent();
        this.updateStepIndicator();
        this.updateNavigation();
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepContent();
      this.updateStepIndicator();
      this.updateNavigation();
    }
  }

  updateStepContent() {
    const formContainer = this.element.querySelector('.booking-form');
    formContainer.innerHTML = this.buildStepContent();
    this.bindStepEvents();
  }

  bindStepEvents() {
    if (this.currentStep === 2) {
      const dateInput = this.element.querySelector('.booking-date');
      dateInput.addEventListener('change', (e) => {
        this.loadTimeSlots(e.target.value);
      });
    }
  }

  updateStepIndicator() {
    this.element.querySelectorAll('.step').forEach((step, index) => {
      const stepNum = index + 1;
      if (stepNum < this.currentStep) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (stepNum === this.currentStep) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }

  updateNavigation() {
    const prevBtn = this.element.querySelector('.prev-step');
    const nextBtn = this.element.querySelector('.next-step');
    const submitBtn = this.element.querySelector('.submit-booking');

    prevBtn.style.display = this.currentStep > 1 ? 'inline-block' : 'none';
    nextBtn.style.display = this.currentStep < this.maxSteps ? 'inline-block' : 'none';
    submitBtn.style.display = this.currentStep === this.maxSteps ? 'inline-block' : 'none';
  }

  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        return this.formData.selectedLocation;
      case 2:
        return this.formData.selectedDate && this.formData.selectedTime;
      case 3:
        return this.validateCustomerDetails();
      case 4:
        return true;
      default:
        return false;
    }
  }

  validateCustomerDetails() {
    const name = this.element.querySelector('.customer-name').value.trim();
    const email = this.element.querySelector('.customer-email').value.trim();
    const phone = this.element.querySelector('.customer-phone').value.trim();

    if (!name || !email || !phone) {
      showError('Please fill in all required fields.');
      return false;
    }

    if (!this.validateEmail(email)) {
      showError('Please enter a valid email address.');
      return false;
    }

    // Store form data
    this.formData.customerName = name;
    this.formData.customerEmail = email;
    this.formData.customerPhone = phone;
    this.formData.bikePreference = this.element.querySelector('.bike-preference').value;
    this.formData.experienceLevel = this.element.querySelector('.experience-level').value;
    this.formData.specialRequests = this.element.querySelector('.special-requests').value.trim();

    return true;
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async submitBooking() {
    const submitBtn = this.element.querySelector('.submit-booking');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success
      this.showBookingSuccess();
      
    } catch (error) {
      showError('There was an error processing your booking. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book Test Ride';
    }
  }

  showBookingSuccess() {
    const formContainer = this.element.querySelector('.booking-form');
    const navigation = this.element.querySelector('.booking-navigation');
    const stepIndicator = this.element.querySelector('.step-indicator');
    const result = this.element.querySelector('.booking-result');

    formContainer.style.display = 'none';
    navigation.style.display = 'none';
    stepIndicator.style.display = 'none';
    
    // Update booking summary
    const summary = result.querySelector('.booking-summary');
    summary.innerHTML = `
      <div class="confirmation-details">
        <p><strong>Booking Reference:</strong> TR${Date.now().toString().slice(-6)}</p>
        <p><strong>Location:</strong> ${this.formData.locationName}</p>
        <p><strong>Date:</strong> ${this.formatDate(this.formData.selectedDate)} at ${this.formData.selectedTime}</p>
        <p><strong>Contact:</strong> ${this.formData.customerName}</p>
      </div>
    `;
    
    result.style.display = 'block';
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  getMaxDate() {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  }

  destroy() {
    const booking = this.element.querySelector('.ebike-booking-tool');
    if (booking) booking.remove();
  }
}

/**
 * Service Booking Module
 */
class ServiceBooking extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.services = new Map();
  }

  async init() {
    await super.init();
    this.log('Service Booking module initialized');
  }

  setupElement(element) {
    const serviceId = element.dataset.serviceId || this.generateId();
    element.dataset.serviceId = serviceId;
    
    const serviceData = window.serviceBookingData || {};
    const serviceUtils = window.serviceBookingUtils || {};
    
    const service = new ServiceBookingInstance(serviceId, element, this, serviceData, serviceUtils);
    this.services.set(serviceId, service);
    
    service.render();
  }

  cleanupElement(element) {
    const serviceId = element.dataset.serviceId;
    if (serviceId && this.services.has(serviceId)) {
      this.services.get(serviceId).destroy();
      this.services.delete(serviceId);
    }
  }

  generateId() {
    return `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class ServiceBookingInstance {
  constructor(id, element, module, serviceData = {}, serviceUtils = {}) {
    this.id = id;
    this.element = element;
    this.module = module;
    this.serviceData = serviceData;
    this.serviceUtils = serviceUtils;
    
    // Initialize service booking state
    this.currentStep = 1;
    this.maxSteps = 4;
    this.bookingData = {
      service: null,
      location: null,
      datetime: null,
      customer: null,
      additionalServices: []
    };
    
    // Service packages with real pricing
    this.servicePackages = {
      basic: {
        name: 'Basic Service',
        price: 89,
        duration: 60,
        description: 'Essential maintenance check and tune-up',
        included: [
          'Brake adjustment and lubrication',
          'Gear shifting optimization', 
          'Tire pressure check',
          'Chain cleaning and lubrication',
          'General safety inspection'
        ]
      },
      standard: {
        name: 'Standard Service', 
        price: 149,
        duration: 90,
        description: 'Comprehensive service with battery health check',
        included: [
          'All Basic Service items',
          'Battery health and capacity test',
          'Motor performance diagnostics',
          'Brake pad inspection',
          'Wheel truing and spoke tension',
          'Display and electronics check'
        ]
      },
      premium: {
        name: 'Premium Service',
        price: 219, 
        duration: 120,
        description: 'Complete overhaul with parts replacement if needed',
        included: [
          'All Standard Service items',
          'Parts replacement (brake pads, cables)',
          'Deep drivetrain cleaning',
          'Suspension service (if applicable)', 
          'Software updates and calibration',
          'Free pickup and delivery'
        ]
      },
      express: {
        name: 'Express Repair',
        price: 49,
        duration: 30,
        description: 'Quick fixes and emergency repairs',
        included: [
          'Flat tire repair',
          'Quick brake adjustment',
          'Chain repair',
          'Basic diagnostics',
          'While-you-wait service'
        ]
      }
    };

    // Service locations with real Swiss data
    this.locations = {
      zurich: {
        name: 'Godspeed Zürich Zentrum',
        address: 'Bahnhofstrasse 45, 8001 Zürich',
        phone: '+41 44 123 45 67',
        hours: 'Mo-Fr: 9:00-18:00, Sa: 9:00-17:00',
        services: ['basic', 'standard', 'premium', 'express']
      },
      bern: {
        name: 'Godspeed Bern',
        address: 'Kramgasse 82, 3011 Bern', 
        phone: '+41 31 987 65 43',
        hours: 'Mo-Fr: 8:30-18:30, Sa: 9:00-16:00',
        services: ['basic', 'standard', 'premium']
      },
      basel: {
        name: 'Godspeed Basel',
        address: 'Steinenvorstadt 71, 4051 Basel',
        phone: '+41 61 456 78 90', 
        hours: 'Mo-Fr: 9:00-18:00, Sa: 10:00-17:00',
        services: ['basic', 'standard', 'express']
      }
    };
  }

  render() {
    const placeholder = this.element.querySelector('.ebike-loading-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.remove();
    }
    
    const serviceDiv = document.createElement('div');
    serviceDiv.className = 'ebike-service-tool';
    serviceDiv.innerHTML = this.buildServiceHTML();
    
    this.element.appendChild(serviceDiv);
    this.setupEventHandlers();
  }

  buildServiceHTML() {
    return `
      <div class="service-booking-wrapper">
        <div class="service-booking-header">
          <h3>${this.element.dataset.title || 'E-Bike Service Booking'}</h3>
          <div class="step-indicator">
            ${Array.from({length: this.maxSteps}, (_, i) => `
              <div class="step ${i + 1 <= this.currentStep ? 'active' : ''}" data-step="${i + 1}">
                <span class="step-number">${i + 1}</span>
                <span class="step-title">${this.getStepTitle(i + 1)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="service-booking-content">
          ${this.renderCurrentStep()}
        </div>

        <div class="service-booking-navigation">
          <button class="btn-secondary prev-btn" ${this.currentStep === 1 ? 'style="display:none"' : ''}>
            ← Previous
          </button>
          <button class="btn-primary next-btn">
            ${this.currentStep === this.maxSteps ? 'Book Service' : 'Next →'}
          </button>
        </div>
      </div>
    `;
  }

  getStepTitle(step) {
    const titles = {
      1: 'Service Type',
      2: 'Location & Date', 
      3: 'Customer Info',
      4: 'Confirmation'
    };
    return titles[step] || '';
  }

  renderCurrentStep() {
    switch (this.currentStep) {
      case 1: return this.renderServiceSelection();
      case 2: return this.renderLocationDateTime();
      case 3: return this.renderCustomerInfo();
      case 4: return this.renderConfirmation();
      default: return this.renderServiceSelection();
    }
  }

  renderServiceSelection() {
    return `
      <div class="service-selection">
        <h4>Choose Your Service Package</h4>
        <div class="service-packages">
          ${Object.entries(this.servicePackages).map(([key, pkg]) => `
            <div class="service-package ${this.bookingData.service === key ? 'selected' : ''}" data-service="${key}">
              <div class="package-header">
                <h5>${pkg.name}</h5>
                <div class="package-price">CHF ${pkg.price}</div>
              </div>
              <div class="package-description">${pkg.description}</div>
              <div class="package-duration">
                <i class="icon-clock"></i> ${pkg.duration} minutes
              </div>
              <ul class="package-included">
                ${pkg.included.map(item => `<li>✓ ${item}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class="additional-services">
          <h5>Additional Services</h5>
          <div class="addon-services">
            <label class="addon-item">
              <input type="checkbox" value="pickup" data-price="25"> 
              <span>Pickup & Delivery (+CHF 25)</span>
            </label>
            <label class="addon-item">
              <input type="checkbox" value="loaner" data-price="15"> 
              <span>Loaner E-Bike (+CHF 15/day)</span>
            </label>
            <label class="addon-item">
              <input type="checkbox" value="wash" data-price="20"> 
              <span>Professional Wash (+CHF 20)</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  renderLocationDateTime() {
    const selectedService = this.bookingData.service;
    const availableLocations = Object.entries(this.locations).filter(([key, loc]) => 
      !selectedService || loc.services.includes(selectedService)
    );

    const today = new Date();
    const dates = Array.from({length: 14}, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i + 1);
      return date;
    });

    return `
      <div class="location-datetime">
        <h4>Select Location & Appointment Time</h4>
        
        <div class="location-selection">
          <h5>Service Location</h5>
          <div class="location-cards">
            ${availableLocations.map(([key, location]) => `
              <div class="location-card ${this.bookingData.location === key ? 'selected' : ''}" data-location="${key}">
                <h6>${location.name}</h6>
                <p class="location-address">${location.address}</p>
                <p class="location-hours">${location.hours}</p>
                <p class="location-phone">📞 ${location.phone}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="datetime-selection">
          <div class="date-selection">
            <h5>Select Date</h5>
            <div class="date-picker">
              ${dates.map(date => {
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const dateStr = date.toISOString().split('T')[0];
                return `
                  <button class="date-option ${isWeekend ? 'weekend' : ''}" data-date="${dateStr}">
                    <div class="date-day">${date.toLocaleDateString('en', {weekday: 'short'})}</div>
                    <div class="date-number">${date.getDate()}</div>
                    <div class="date-month">${date.toLocaleDateString('en', {month: 'short'})}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="time-selection">
            <h5>Select Time</h5>
            <div class="time-slots">
              ${this.generateTimeSlots().map(time => `
                <button class="time-slot" data-time="${time}">${time}</button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCustomerInfo() {
    return `
      <div class="customer-info">
        <h4>Contact Information</h4>
        
        <form class="customer-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName-${this.id}">First Name *</label>
              <input type="text" id="firstName-${this.id}" name="firstName" required 
                     value="${this.bookingData.customer?.firstName || ''}" />
            </div>
            <div class="form-group">
              <label for="lastName-${this.id}">Last Name *</label>
              <input type="text" id="lastName-${this.id}" name="lastName" required
                     value="${this.bookingData.customer?.lastName || ''}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email-${this.id}">Email Address *</label>
              <input type="email" id="email-${this.id}" name="email" required
                     value="${this.bookingData.customer?.email || ''}" />
            </div>
            <div class="form-group">
              <label for="phone-${this.id}">Phone Number *</label>
              <input type="tel" id="phone-${this.id}" name="phone" required
                     value="${this.bookingData.customer?.phone || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label for="bikeModel-${this.id}">E-Bike Model & Brand</label>
            <input type="text" id="bikeModel-${this.id}" name="bikeModel" 
                   placeholder="e.g. Trek Powerfly 5, Specialized Turbo Vado"
                   value="${this.bookingData.customer?.bikeModel || ''}" />
          </div>

          <div class="form-group">
            <label for="purchaseDate-${this.id}">Purchase Date (approximate)</label>
            <input type="month" id="purchaseDate-${this.id}" name="purchaseDate"
                   value="${this.bookingData.customer?.purchaseDate || ''}" />
          </div>

          <div class="form-group">
            <label for="issues-${this.id}">Describe any issues or special requests</label>
            <textarea id="issues-${this.id}" name="issues" rows="4" 
                      placeholder="e.g. Strange noise from motor, battery not holding charge...">${this.bookingData.customer?.issues || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" name="newsletter" 
                     ${this.bookingData.customer?.newsletter ? 'checked' : ''} />
              <span>Subscribe to Godspeed newsletter for service reminders</span>
            </label>
          </div>
        </form>
      </div>
    `;
  }

  renderConfirmation() {
    const service = this.servicePackages[this.bookingData.service];
    const location = this.locations[this.bookingData.location];
    const totalPrice = this.calculateTotalPrice();

    return `
      <div class="confirmation">
        <h4>Booking Confirmation</h4>
        
        <div class="booking-summary">
          <div class="summary-section">
            <h5>Service Details</h5>
            <div class="service-summary">
              <div class="service-name">${service.name}</div>
              <div class="service-price">CHF ${service.price}</div>
              <div class="service-duration">${service.duration} minutes</div>
            </div>
            ${this.bookingData.additionalServices.length > 0 ? `
              <div class="addon-summary">
                <h6>Additional Services:</h6>
                ${this.bookingData.additionalServices.map(addon => `
                  <div class="addon-item">${addon.name} +CHF ${addon.price}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="summary-section">
            <h5>Appointment Details</h5>
            <div class="appointment-details">
              <div class="appointment-location">
                <strong>${location.name}</strong><br>
                ${location.address}<br>
                📞 ${location.phone}
              </div>
              <div class="appointment-datetime">
                <strong>${this.formatDate(this.bookingData.datetime.date)}</strong><br>
                ${this.bookingData.datetime.time}
              </div>
            </div>
          </div>

          <div class="summary-section">
            <h5>Contact Information</h5>
            <div class="customer-summary">
              <div>${this.bookingData.customer.firstName} ${this.bookingData.customer.lastName}</div>
              <div>${this.bookingData.customer.email}</div>
              <div>${this.bookingData.customer.phone}</div>
              ${this.bookingData.customer.bikeModel ? `<div>Bike: ${this.bookingData.customer.bikeModel}</div>` : ''}
            </div>
          </div>

          <div class="total-price">
            <h5>Total Price: CHF ${totalPrice}</h5>
          </div>
        </div>

        <div class="terms-acceptance">
          <label class="checkbox-label">
            <input type="checkbox" id="acceptTerms-${this.id}" required />
            <span>I accept the <a href="/pages/service-terms" target="_blank">service terms and conditions</a></span>
          </label>
        </div>

        <div class="confirmation-notice">
          <p>✅ We'll send a confirmation email with all details</p>
          <p>📅 Add to calendar link will be included</p>
          <p>🔔 SMS reminder 24h before appointment</p>
        </div>
      </div>
    `;
  }

  generateTimeSlots() {
    const slots = [];
    // Generate time slots from 9:00 to 17:00 in 30-minute intervals
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }

  calculateTotalPrice() {
    let total = 0;
    if (this.bookingData.service) {
      total += this.servicePackages[this.bookingData.service].price;
    }
    total += this.bookingData.additionalServices.reduce((sum, addon) => sum + addon.price, 0);
    return total;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  setupEventHandlers() {
    const container = this.element.querySelector('.ebike-service-tool');
    const nextBtn = container.querySelector('.next-btn');
    const prevBtn = container.querySelector('.prev-btn');

    // Navigation buttons
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }

    // Step-specific handlers
    this.setupCurrentStepHandlers();
  }

  setupCurrentStepHandlers() {
    const container = this.element.querySelector('.ebike-service-tool');
    
    switch (this.currentStep) {
      case 1:
        // Service package selection
        container.querySelectorAll('.service-package').forEach(pkg => {
          pkg.addEventListener('click', () => {
            container.querySelectorAll('.service-package').forEach(p => p.classList.remove('selected'));
            pkg.classList.add('selected');
            this.bookingData.service = pkg.dataset.service;
          });
        });

        // Additional services checkboxes
        container.querySelectorAll('.addon-item input').forEach(checkbox => {
          checkbox.addEventListener('change', (e) => {
            const addon = {
              name: e.target.nextElementSibling.textContent,
              price: parseInt(e.target.dataset.price),
              value: e.target.value
            };

            if (e.target.checked) {
              this.bookingData.additionalServices.push(addon);
            } else {
              this.bookingData.additionalServices = this.bookingData.additionalServices.filter(
                a => a.value !== e.target.value
              );
            }
          });
        });
        break;

      case 2:
        // Location selection
        container.querySelectorAll('.location-card').forEach(card => {
          card.addEventListener('click', () => {
            container.querySelectorAll('.location-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            this.bookingData.location = card.dataset.location;
          });
        });

        // Date selection
        container.querySelectorAll('.date-option').forEach(dateBtn => {
          dateBtn.addEventListener('click', () => {
            container.querySelectorAll('.date-option').forEach(d => d.classList.remove('selected'));
            dateBtn.classList.add('selected');
            if (!this.bookingData.datetime) this.bookingData.datetime = {};
            this.bookingData.datetime.date = dateBtn.dataset.date;
          });
        });

        // Time selection
        container.querySelectorAll('.time-slot').forEach(timeBtn => {
          timeBtn.addEventListener('click', () => {
            container.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
            timeBtn.classList.add('selected');
            if (!this.bookingData.datetime) this.bookingData.datetime = {};
            this.bookingData.datetime.time = timeBtn.dataset.time;
          });
        });
        break;

      case 3:
        // Customer form handlers
        container.querySelectorAll('.customer-form input, .customer-form textarea').forEach(input => {
          input.addEventListener('input', (e) => {
            if (!this.bookingData.customer) this.bookingData.customer = {};
            this.bookingData.customer[e.target.name] = e.target.value;
          });

          input.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
              if (!this.bookingData.customer) this.bookingData.customer = {};
              this.bookingData.customer[e.target.name] = e.target.checked;
            }
          });
        });
        break;

      case 4:
        // Terms acceptance checkbox
        const termsCheckbox = container.querySelector(`#acceptTerms-${this.id}`);
        if (termsCheckbox) {
          termsCheckbox.addEventListener('change', (e) => {
            const nextBtn = container.querySelector('.next-btn');
            nextBtn.disabled = !e.target.checked;
          });
        }
        break;
    }
  }

  nextStep() {
    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.currentStep === this.maxSteps) {
      this.submitBooking();
      return;
    }

    this.currentStep++;
    this.updateDisplay();
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const container = this.element.querySelector('.ebike-service-tool');
    
    // Update step indicators
    container.querySelectorAll('.step').forEach((step, index) => {
      if (index + 1 <= this.currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    // Update content
    const content = container.querySelector('.service-booking-content');
    content.innerHTML = this.renderCurrentStep();

    // Update navigation buttons
    const prevBtn = container.querySelector('.prev-btn');
    const nextBtn = container.querySelector('.next-btn');
    
    prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';
    nextBtn.textContent = this.currentStep === this.maxSteps ? 'Book Service' : 'Next →';

    // Setup new handlers
    this.setupCurrentStepHandlers();
  }

  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        if (!this.bookingData.service) {
          showError('Please select a service package.');
          return false;
        }
        break;
      case 2:
        if (!this.bookingData.location || !this.bookingData.datetime?.date || !this.bookingData.datetime?.time) {
          showError('Please select a location, date, and time.');
          return false;
        }
        break;
      case 3:
        const required = ['firstName', 'lastName', 'email', 'phone'];
        for (const field of required) {
          if (!this.bookingData.customer?.[field]) {
            showError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
            return false;
          }
        }
        break;
      case 4:
        const termsAccepted = document.querySelector(`#acceptTerms-${this.id}`)?.checked;
        if (!termsAccepted) {
          showError('Please accept the terms and conditions.');
          return false;
        }
        break;
    }
    return true;
  }

  async submitBooking() {
    try {
      const container = this.element.querySelector('.ebike-service-tool');
      const nextBtn = container.querySelector('.next-btn');
      nextBtn.textContent = 'Booking...';
      nextBtn.disabled = true;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const bookingId = 'SRV-' + Date.now().toString().slice(-6);
      
      // Show success message
      container.innerHTML = `
        <div class="booking-success">
          <div class="success-icon">✅</div>
          <h3>Service Booking Confirmed!</h3>
          <div class="booking-reference">
            <strong>Booking Reference: ${bookingId}</strong>
          </div>
          <div class="success-details">
            <p>📧 Confirmation email sent to ${this.bookingData.customer.email}</p>
            <p>📱 SMS reminder will be sent 24 hours before your appointment</p>
            <p>📅 <a href="#" onclick="showInfo('Add to calendar feature')">Add to Calendar</a></p>
          </div>
          <div class="next-steps">
            <h4>What's Next?</h4>
            <ul>
              <li>Bring your e-bike to ${this.locations[this.bookingData.location].name}</li>
              <li>Arrive 10 minutes early for check-in</li>
              <li>Bring proof of purchase if under warranty</li>
            </ul>
          </div>
          <div class="success-actions">
            <a href="/pages/contact" class="btn-secondary">Contact Us</a>
            <a href="/collections/service-parts" class="btn-primary">Shop Service Parts</a>
          </div>
        </div>
      `;

      // Booking completed successfully

    } catch (error) {
      showError('Booking failed. Please try again or contact us directly.');
      console.error('Booking error:', error);
    }
  }

  destroy() {
    const service = this.element.querySelector('.ebike-service-tool');
    if (service) service.remove();
  }
}

/**
 * Bike Comparison Module
 */
class BikeComparison extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.comparisons = new Map();
  }

  async init() {
    await super.init();
    this.log('Advanced Comparison module initialized');
  }

  setupElement(element) {
    const comparisonId = element.dataset.comparisonId || this.generateId();
    element.dataset.comparisonId = comparisonId;
    
    const comparisonData = window.advancedComparisonData || {};
    const comparisonUtils = window.advancedComparisonUtils || {};
    
    const comparison = new ComparisonInstance(comparisonId, element, this, comparisonData, comparisonUtils);
    this.comparisons.set(comparisonId, comparison);
    
    comparison.render();
  }

  cleanupElement(element) {
    const comparisonId = element.dataset.comparisonId;
    if (comparisonId && this.comparisons.has(comparisonId)) {
      this.comparisons.get(comparisonId).destroy();
      this.comparisons.delete(comparisonId);
    }
  }

  generateId() {
    return `adv_comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class ComparisonInstance {
  constructor(id, element, module, comparisonData = {}, comparisonUtils = {}) {
    this.id = id;
    this.element = element;
    this.module = module;
    this.comparisonData = comparisonData;
    this.comparisonUtils = comparisonUtils;
    
    // Maximum bikes to compare
    this.maxBikes = parseInt(this.element.dataset.maxBikes) || 4;
    this.selectedBikes = [];
    
    // Enhanced bike database with detailed specifications
    this.bikeDatabase = {
      'city-comfort': {
        name: 'City Comfort Pro',
        brand: 'Godspeed',
        price: 2499,
        category: 'city',
        image: '/assets/bike-city-comfort.jpg',
        motor: {
          brand: 'Bosch',
          model: 'Active Line Plus',
          power: 250,
          torque: 50,
          position: 'Mid-drive'
        },
        battery: {
          capacity: 400,
          brand: 'Bosch',
          range: '60-100',
          removable: true,
          chargingTime: 4.5
        },
        frame: {
          material: 'Aluminium',
          size: '46-58cm',
          weight: 24,
          geometry: 'Step-through'
        },
        components: {
          gears: '8-Gang Shimano',
          brakes: 'Shimano Hydraulik',
          suspension: 'Federgabel vorne',
          wheels: '28"',
          display: 'Bosch Intuvia'
        },
        features: {
          lights: 'Integrated LED',
          mudguards: 'Yes',
          rack: 'Yes',
          kickstand: 'Yes',
          lockPrep: 'Yes'
        },
        scores: {
          comfort: 9.2,
          performance: 7.1,
          valueForMoney: 8.9,
          durability: 8.8,
          easeOfUse: 9.5
        },
        aiInsights: {
          bestFor: ['commuting', 'casual-riding', 'city-exploration'],
          terrainSuitability: ['city', 'paved-paths', 'light-gravel'],
          userExperience: 'beginner-friendly',
          maintenanceLevel: 'low'
        },
        reviews: {
          rating: 4.6,
          count: 342,
          highlights: ['Very comfortable', 'Easy to use', 'Great value'],
          concerns: ['Limited off-road capability']
        }
      },
      'trekking-sport': {
        name: 'Trekking Sport X1',
        brand: 'Godspeed',
        price: 3299,
        category: 'trekking',
        image: '/assets/bike-trekking-sport.jpg',
        motor: {
          brand: 'Bosch',
          model: 'Performance CX',
          power: 250,
          torque: 85,
          position: 'Mid-drive'
        },
        battery: {
          capacity: 625,
          brand: 'Bosch',
          range: '80-120',
          removable: true,
          chargingTime: 6
        },
        frame: {
          material: 'Aluminium',
          size: '48-62cm',
          weight: 26,
          geometry: 'Diamond'
        },
        components: {
          gears: '12-Gang SRAM',
          brakes: 'SRAM Level Hydraulik',
          suspension: 'Federgabel vorne',
          wheels: '28"',
          display: 'Bosch Kiox'
        },
        features: {
          lights: 'Integrated LED',
          mudguards: 'Yes',
          rack: 'Yes',
          kickstand: 'Yes',
          lockPrep: 'Yes'
        },
        scores: {
          comfort: 8.5,
          performance: 8.9,
          valueForMoney: 8.2,
          durability: 9.1,
          easeOfUse: 8.0
        },
        aiInsights: {
          bestFor: ['long-distance', 'touring', 'mixed-terrain'],
          terrainSuitability: ['city', 'country-roads', 'gravel', 'light-trails'],
          userExperience: 'intermediate',
          maintenanceLevel: 'medium'
        },
        reviews: {
          rating: 4.7,
          count: 218,
          highlights: ['Excellent range', 'Versatile', 'Quality components'],
          concerns: ['Higher price point']
        }
      },
      'mountain-trail': {
        name: 'Mountain Trail Pro',
        brand: 'Godspeed',
        price: 4799,
        category: 'mountain',
        image: '/assets/bike-mountain-trail.jpg',
        motor: {
          brand: 'Shimano',
          model: 'EP8',
          power: 250,
          torque: 85,
          position: 'Mid-drive'
        },
        battery: {
          capacity: 630,
          brand: 'Shimano',
          range: '60-90',
          removable: true,
          chargingTime: 5.5
        },
        frame: {
          material: 'Carbon',
          size: '44-58cm',
          weight: 23,
          geometry: 'Mountain'
        },
        components: {
          gears: '12-Gang Shimano XT',
          brakes: 'Shimano XT 4-Kolben',
          suspension: 'Full Suspension 140mm',
          wheels: '29"',
          display: 'Shimano E-Tube'
        },
        features: {
          lights: 'Optional',
          mudguards: 'Optional',
          rack: 'No',
          kickstand: 'No',
          lockPrep: 'Yes'
        },
        scores: {
          comfort: 7.8,
          performance: 9.5,
          valueForMoney: 7.5,
          durability: 8.9,
          easeOfUse: 6.8
        },
        aiInsights: {
          bestFor: ['trail-riding', 'mountain-biking', 'technical-terrain'],
          terrainSuitability: ['trails', 'mountains', 'rough-terrain'],
          userExperience: 'advanced',
          maintenanceLevel: 'high'
        },
        reviews: {
          rating: 4.8,
          count: 156,
          highlights: ['Incredible performance', 'Lightweight', 'Top components'],
          concerns: ['Expensive', 'Requires skill']
        }
      },
      'cargo-family': {
        name: 'Cargo Family+',
        brand: 'Godspeed',
        price: 3899,
        category: 'cargo',
        image: '/assets/bike-cargo-family.jpg',
        motor: {
          brand: 'Bosch',
          model: 'Cargo Line',
          power: 250,
          torque: 85,
          position: 'Mid-drive'
        },
        battery: {
          capacity: 500,
          brand: 'Bosch',
          range: '50-80',
          removable: true,
          chargingTime: 5
        },
        frame: {
          material: 'Steel reinforced',
          size: '48-56cm',
          weight: 35,
          geometry: 'Longtail'
        },
        components: {
          gears: '8-Gang Shimano',
          brakes: 'Magura MT5 Hydraulik',
          suspension: 'Keine',
          wheels: '26"',
          display: 'Bosch Intuvia'
        },
        features: {
          lights: 'Integrated LED',
          mudguards: 'Yes',
          rack: 'Cargo platform',
          kickstand: 'Double kickstand',
          lockPrep: 'Yes'
        },
        scores: {
          comfort: 8.0,
          performance: 7.5,
          valueForMoney: 8.7,
          durability: 9.3,
          easeOfUse: 7.2
        },
        aiInsights: {
          bestFor: ['family-transport', 'cargo-hauling', 'child-transport'],
          terrainSuitability: ['city', 'paved-paths'],
          userExperience: 'intermediate',
          maintenanceLevel: 'medium'
        },
        reviews: {
          rating: 4.5,
          count: 89,
          highlights: ['Great for families', 'Stable with load', 'Well-built'],
          concerns: ['Heavy', 'Takes space']
        }
      }
    };
  }

  render() {
    const placeholder = this.element.querySelector('.ebike-loading-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.remove();
    }
    
    const comparisonDiv = document.createElement('div');
    comparisonDiv.className = 'ebike-comparison-tool';
    comparisonDiv.innerHTML = this.buildComparisonHTML();
    
    this.element.appendChild(comparisonDiv);
    this.setupEventHandlers();
  }

  buildComparisonHTML() {
    return `
      <div class="comparison-wrapper">
        <div class="comparison-header">
          <h3>${this.element.dataset.title || 'E-Bike Comparison'}</h3>
          <p>${this.element.dataset.subtitle || 'Compare up to ' + this.maxBikes + ' bikes with detailed analysis'}</p>
        </div>

        <div class="bike-selection-section">
          <h4>Select Bikes to Compare</h4>
          <div class="bike-selectors">
            ${Array.from({length: this.maxBikes}, (_, i) => `
              <div class="bike-selector" data-slot="${i}">
                <label>Bike ${i + 1}</label>
                <select class="bike-select" data-slot="${i}">
                  <option value="">Select a bike...</option>
                  ${Object.entries(this.bikeDatabase).map(([key, bike]) => `
                    <option value="${key}">${bike.name} - CHF ${bike.price}</option>
                  `).join('')}
                </select>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="comparison-results" style="display: none;">
          <div class="comparison-table-container">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th class="specification-header">Specification</th>
                  ${Array.from({length: this.maxBikes}, (_, i) => `
                    <th class="bike-header" data-slot="${i}">
                      <div class="bike-header-content">
                        <div class="bike-image-placeholder">📷</div>
                        <div class="bike-name">Bike ${i + 1}</div>
                        <div class="bike-price">-</div>
                      </div>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${this.generateComparisonRows()}
              </tbody>
            </table>
          </div>

          <div class="ai-analysis-section">
            <h4>🤖 AI Analysis</h4>
            <div class="ai-insights-grid">
              <div class="insight-card overall-recommendation">
                <h5>Best Overall</h5>
                <div class="insight-content" id="best-overall-${this.id}">Select bikes to see recommendation</div>
              </div>
              <div class="insight-card best-value">
                <h5>Best Value</h5>
                <div class="insight-content" id="best-value-${this.id}">Select bikes to see analysis</div>
              </div>
              <div class="insight-card performance-leader">
                <h5>Performance Leader</h5>
                <div class="insight-content" id="performance-leader-${this.id}">Select bikes to see analysis</div>
              </div>
              <div class="insight-card comfort-king">
                <h5>Comfort Champion</h5>
                <div class="insight-content" id="comfort-king-${this.id}">Select bikes to see analysis</div>
              </div>
            </div>
            
            <div class="usage-recommendations">
              <h5>Usage Recommendations</h5>
              <div class="usage-grid" id="usage-recommendations-${this.id}">
                Select bikes to see personalized recommendations
              </div>
            </div>
          </div>

          <div class="comparison-actions">
            <button class="btn-secondary" onclick="this.resetComparison()">Reset Comparison</button>
            <button class="btn-primary" onclick="this.exportComparison()">Export to PDF</button>
            <button class="btn-primary" onclick="this.shareComparison()">Share Comparison</button>
          </div>
        </div>
      </div>
    `;
  }

  generateComparisonRows() {
    const categories = [
      { title: 'Basic Info', rows: [
        { label: 'Brand', field: 'brand' },
        { label: 'Category', field: 'category' },
        { label: 'Price (CHF)', field: 'price' },
        { label: 'Overall Rating', field: 'reviews.rating', format: 'rating' }
      ]},
      { title: 'Motor & Power', rows: [
        { label: 'Motor Brand', field: 'motor.brand' },
        { label: 'Motor Model', field: 'motor.model' },
        { label: 'Max Torque (Nm)', field: 'motor.torque' },
        { label: 'Position', field: 'motor.position' }
      ]},
      { title: 'Battery & Range', rows: [
        { label: 'Battery Capacity (Wh)', field: 'battery.capacity' },
        { label: 'Range (km)', field: 'battery.range' },
        { label: 'Charging Time (h)', field: 'battery.chargingTime' },
        { label: 'Removable', field: 'battery.removable', format: 'boolean' }
      ]},
      { title: 'Frame & Design', rows: [
        { label: 'Frame Material', field: 'frame.material' },
        { label: 'Weight (kg)', field: 'frame.weight' },
        { label: 'Frame Sizes', field: 'frame.size' },
        { label: 'Geometry', field: 'frame.geometry' }
      ]},
      { title: 'Components', rows: [
        { label: 'Gears', field: 'components.gears' },
        { label: 'Brakes', field: 'components.brakes' },
        { label: 'Suspension', field: 'components.suspension' },
        { label: 'Display', field: 'components.display' }
      ]},
      { title: 'Features & Extras', rows: [
        { label: 'Lights', field: 'features.lights' },
        { label: 'Mudguards', field: 'features.mudguards', format: 'boolean' },
        { label: 'Rack', field: 'features.rack' },
        { label: 'Kickstand', field: 'features.kickstand', format: 'boolean' }
      ]},
      { title: 'Performance Scores', rows: [
        { label: 'Comfort Score', field: 'scores.comfort', format: 'score' },
        { label: 'Performance Score', field: 'scores.performance', format: 'score' },
        { label: 'Value Score', field: 'scores.valueForMoney', format: 'score' },
        { label: 'Ease of Use', field: 'scores.easeOfUse', format: 'score' }
      ]}
    ];

    let html = '';
    categories.forEach(category => {
      html += `<tr class="category-header"><td colspan="${this.maxBikes + 1}">${category.title}</td></tr>`;
      category.rows.forEach(row => {
        html += `<tr class="comparison-row" data-field="${row.field}">
          <td class="spec-label">${row.label}</td>
          ${Array.from({length: this.maxBikes}, (_, i) => `
            <td class="spec-value" data-slot="${i}" data-format="${row.format || 'text'}">-</td>
          `).join('')}
        </tr>`;
      });
    });

    return html;
  }

  setupEventHandlers() {
    const container = this.element.querySelector('.ebike-comparison-tool');
    
    // Bike selection handlers
    container.querySelectorAll('.bike-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const slot = parseInt(e.target.dataset.slot);
        const bikeKey = e.target.value;
        
        if (bikeKey) {
          this.selectedBikes[slot] = bikeKey;
        } else {
          delete this.selectedBikes[slot];
        }
        
        this.updateComparison();
      });
    });
  }

  updateComparison() {
    const container = this.element.querySelector('.ebike-comparison-tool');
    const resultsSection = container.querySelector('.comparison-results');
    
    // Show results if at least 2 bikes selected
    const activeBikes = this.selectedBikes.filter(bike => bike);
    if (activeBikes.length >= 2) {
      resultsSection.style.display = 'block';
      this.updateComparisonTable();
      this.updateAIAnalysis();
    } else {
      resultsSection.style.display = 'none';
    }
  }

  updateComparisonTable() {
    const container = this.element.querySelector('.ebike-comparison-tool');
    
    // Update headers
    this.selectedBikes.forEach((bikeKey, slot) => {
      if (bikeKey && this.bikeDatabase[bikeKey]) {
        const bike = this.bikeDatabase[bikeKey];
        const header = container.querySelector(`.bike-header[data-slot="${slot}"]`);
        
        header.innerHTML = `
          <div class="bike-header-content">
            <div class="bike-image">
              <img src="${bike.image}" alt="${bike.name}" loading="lazy" />
            </div>
            <div class="bike-name">${bike.name}</div>
            <div class="bike-price">CHF ${bike.price}</div>
            <div class="bike-rating">⭐ ${bike.reviews.rating}/5</div>
          </div>
        `;
      }
    });
    
    // Update comparison rows
    container.querySelectorAll('.comparison-row').forEach(row => {
      const field = row.dataset.field;
      
      row.querySelectorAll('.spec-value').forEach(cell => {
        const slot = parseInt(cell.dataset.slot);
        const format = cell.dataset.format;
        
        if (this.selectedBikes[slot] && this.bikeDatabase[this.selectedBikes[slot]]) {
          const bike = this.bikeDatabase[this.selectedBikes[slot]];
          const value = this.getNestedValue(bike, field);
          
          cell.textContent = this.formatValue(value, format);
          cell.classList.remove('empty');
        } else {
          cell.textContent = '-';
          cell.classList.add('empty');
        }
      });
    });
  }

  updateAIAnalysis() {
    const activeBikes = this.selectedBikes.filter(bike => bike).map(key => this.bikeDatabase[key]);
    
    if (activeBikes.length < 2) return;
    
    // Best Overall Analysis
    const bestOverall = activeBikes.reduce((best, bike) => {
      const overallScore = (bike.scores.comfort + bike.scores.performance + bike.scores.valueForMoney) / 3;
      const bestOverallScore = (best.scores.comfort + best.scores.performance + best.scores.valueForMoney) / 3;
      return overallScore > bestOverallScore ? bike : best;
    });
    
    document.getElementById(`best-overall-${this.id}`).innerHTML = `
      <div class="recommendation">
        <strong>${bestOverall.name}</strong>
        <p>Highest combined score across all categories. ${bestOverall.aiInsights.bestFor.join(', ')}.</p>
      </div>
    `;
    
    // Best Value Analysis
    const bestValue = activeBikes.reduce((best, bike) => 
      bike.scores.valueForMoney > best.scores.valueForMoney ? bike : best
    );
    
    document.getElementById(`best-value-${this.id}`).innerHTML = `
      <div class="recommendation">
        <strong>${bestValue.name}</strong>
        <p>Best value at CHF ${bestValue.price} with ${bestValue.scores.valueForMoney}/10 value score.</p>
      </div>
    `;
    
    // Performance Leader
    const performanceLeader = activeBikes.reduce((best, bike) => 
      bike.scores.performance > best.scores.performance ? bike : best
    );
    
    document.getElementById(`performance-leader-${this.id}`).innerHTML = `
      <div class="recommendation">
        <strong>${performanceLeader.name}</strong>
        <p>Top performance with ${performanceLeader.motor.torque}Nm torque and ${performanceLeader.scores.performance}/10 score.</p>
      </div>
    `;
    
    // Comfort Champion
    const comfortKing = activeBikes.reduce((best, bike) => 
      bike.scores.comfort > best.scores.comfort ? bike : best
    );
    
    document.getElementById(`comfort-king-${this.id}`).innerHTML = `
      <div class="recommendation">
        <strong>${comfortKing.name}</strong>
        <p>Most comfortable ride with ${comfortKing.scores.comfort}/10 comfort score. ${comfortKing.frame.geometry} geometry.</p>
      </div>
    `;
    
    // Usage Recommendations
    const usageGrid = document.getElementById(`usage-recommendations-${this.id}`);
    const usageTypes = ['commuting', 'touring', 'family-transport', 'trail-riding', 'casual-riding'];
    
    let usageHTML = '<div class="usage-cards">';
    usageTypes.forEach(usage => {
      const bestForUsage = activeBikes.find(bike => bike.aiInsights.bestFor.includes(usage));
      if (bestForUsage) {
        usageHTML += `
          <div class="usage-card">
            <h6>${usage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h6>
            <p><strong>${bestForUsage.name}</strong> - ${bestForUsage.aiInsights.userExperience}</p>
          </div>
        `;
      }
    });
    usageHTML += '</div>';
    
    usageGrid.innerHTML = usageHTML;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  formatValue(value, format) {
    if (value === undefined || value === null) return '-';
    
    switch (format) {
      case 'boolean':
        return value === true ? 'Yes' : value === false ? 'No' : value;
      case 'rating':
        return `⭐ ${value}/5`;
      case 'score':
        return `${value}/10`;
      default:
        return value;
    }
  }

  resetComparison() {
    this.selectedBikes = [];
    const container = this.element.querySelector('.ebike-comparison-tool');
    
    // Reset all selects
    container.querySelectorAll('.bike-select').forEach(select => {
      select.value = '';
    });
    
    // Hide results
    container.querySelector('.comparison-results').style.display = 'none';
  }

  exportComparison() {
    const activeBikes = this.selectedBikes.filter(bike => bike);
    if (activeBikes.length < 2) {
      showWarning('Please select at least 2 bikes to export comparison.');
      return;
    }
    
    // Generate comparison data for export
    const comparisonData = {
      bikes: activeBikes.map(key => this.bikeDatabase[key]),
      timestamp: new Date().toISOString(),
      source: 'Godspeed E-Bike Comparison Tool'
    };
    
    // Simulate PDF export
    // Export comparison data
    showSuccess('Comparison exported! (Feature would generate PDF in production)');
  }

  shareComparison() {
    const activeBikes = this.selectedBikes.filter(bike => bike);
    if (activeBikes.length < 2) {
      showWarning('Please select at least 2 bikes to share comparison.');
      return;
    }
    
    const bikeNames = activeBikes.map(key => this.bikeDatabase[key].name);
    const shareText = `Check out this e-bike comparison: ${bikeNames.join(' vs ')} on Godspeed!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'E-Bike Comparison',
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
        .then(() => showSuccess('Comparison link copied to clipboard!'))
        .catch(() => showError('Unable to share. Please copy the URL manually.'));
    }
  }

  destroy() {
    const comparison = this.element.querySelector('.ebike-comparison-tool');
    if (comparison) comparison.remove();
  }
}

/**
 * Dashboard Management Module
 */
class DashboardManagement extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.dashboards = new Map();
  }

  async init() {
    await super.init();
    this.log('Dashboard Management module initialized');
  }

  setupElement(element) {
    const dashboardId = element.dataset.dashboardId || this.generateId();
    element.dataset.dashboardId = dashboardId;
    
    const dashboardData = window.dashboardManagementData || {};
    const dashboardUtils = window.dashboardManagementUtils || {};
    
    const dashboard = new DashboardManagementInstance(dashboardId, element, this, dashboardData, dashboardUtils);
    this.dashboards.set(dashboardId, dashboard);
    
    dashboard.render();
  }

  cleanupElement(element) {
    const dashboardId = element.dataset.dashboardId;
    if (dashboardId && this.dashboards.has(dashboardId)) {
      this.dashboards.get(dashboardId).destroy();
      this.dashboards.delete(dashboardId);
    }
  }

  generateId() {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class DashboardManagementInstance {
  constructor(id, element, module, dashboardData = {}, dashboardUtils = {}) {
    this.id = id;
    this.element = element;
    this.module = module;
    this.dashboardData = dashboardData;
    this.dashboardUtils = dashboardUtils;
    
    // Initialize dashboard state
    this.refreshInterval = 30000; // 30 seconds
    this.lastUpdated = new Date();
    
    // Vendor API endpoints and status
    this.vendors = {
      bosch: {
        name: 'Bosch eBike Systems',
        status: 'connected',
        apiUrl: 'https://api.bosch-ebike.com/v1',
        lastSync: new Date(Date.now() - 120000), // 2 minutes ago
        syncStatus: 'success',
        metrics: {
          totalProducts: 1247,
          syncedToday: 45,
          failedSyncs: 2,
          avgResponseTime: 350,
          rateLimitUsed: 78
        },
        endpoints: [
          { name: 'Products', status: 'healthy', responseTime: 245 },
          { name: 'Inventory', status: 'healthy', responseTime: 412 },
          { name: 'Specifications', status: 'warning', responseTime: 850 },
          { name: 'Images', status: 'healthy', responseTime: 180 }
        ]
      },
      shimano: {
        name: 'Shimano Steps',
        status: 'connected',
        apiUrl: 'https://api.shimano-steps.com/v2',
        lastSync: new Date(Date.now() - 180000), // 3 minutes ago
        syncStatus: 'success',
        metrics: {
          totalProducts: 892,
          syncedToday: 31,
          failedSyncs: 0,
          avgResponseTime: 280,
          rateLimitUsed: 45
        },
        endpoints: [
          { name: 'Products', status: 'healthy', responseTime: 190 },
          { name: 'Inventory', status: 'healthy', responseTime: 320 },
          { name: 'Specifications', status: 'healthy', responseTime: 275 },
          { name: 'Images', status: 'healthy', responseTime: 165 }
        ]
      },
      specialized: {
        name: 'Specialized Turbo',
        status: 'warning',
        apiUrl: 'https://api.specialized.com/turbo/v1',
        lastSync: new Date(Date.now() - 900000), // 15 minutes ago
        syncStatus: 'partial_failure',
        metrics: {
          totalProducts: 634,
          syncedToday: 12,
          failedSyncs: 8,
          avgResponseTime: 1200,
          rateLimitUsed: 95
        },
        endpoints: [
          { name: 'Products', status: 'error', responseTime: 2100 },
          { name: 'Inventory', status: 'healthy', responseTime: 450 },
          { name: 'Specifications', status: 'warning', responseTime: 1800 },
          { name: 'Images', status: 'healthy', responseTime: 230 }
        ]
      },
      trek: {
        name: 'Trek eBikes',
        status: 'maintenance',
        apiUrl: 'https://api.trek.com/ebikes/v1',
        lastSync: new Date(Date.now() - 3600000), // 1 hour ago
        syncStatus: 'maintenance',
        metrics: {
          totalProducts: 456,
          syncedToday: 0,
          failedSyncs: 0,
          avgResponseTime: 0,
          rateLimitUsed: 0
        },
        endpoints: [
          { name: 'Products', status: 'maintenance', responseTime: 0 },
          { name: 'Inventory', status: 'maintenance', responseTime: 0 },
          { name: 'Specifications', status: 'maintenance', responseTime: 0 },
          { name: 'Images', status: 'maintenance', responseTime: 0 }
        ]
      },
      velo_connect: {
        name: 'VeloConnect Hub',
        status: 'connected',
        apiUrl: 'https://api.veloconnect.ch/v3',
        lastSync: new Date(Date.now() - 60000), // 1 minute ago
        syncStatus: 'success',
        metrics: {
          totalProducts: 2834,
          syncedToday: 156,
          failedSyncs: 3,
          avgResponseTime: 180,
          rateLimitUsed: 34
        },
        endpoints: [
          { name: 'Aggregated Feed', status: 'healthy', responseTime: 145 },
          { name: 'Price Updates', status: 'healthy', responseTime: 220 },
          { name: 'Inventory Sync', status: 'healthy', responseTime: 175 },
          { name: 'Media Assets', status: 'healthy', responseTime: 95 }
        ]
      }
    };

    // Performance metrics
    this.performanceData = {
      totalApiCalls: 15742,
      successfulCalls: 14891,
      failedCalls: 851,
      averageResponseTime: 285,
      dataTransferred: '2.4 GB',
      uptime: '99.2%'
    };
  }

  render() {
    const placeholder = this.element.querySelector('.ebike-loading-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.remove();
    }
    
    const dashboardDiv = document.createElement('div');
    dashboardDiv.className = 'ebike-dashboard-tool';
    dashboardDiv.innerHTML = this.buildDashboardHTML();
    
    this.element.appendChild(dashboardDiv);
    this.setupEventHandlers();
    this.startAutoRefresh();
  }

  buildDashboardHTML() {
    return `
      <div class="dashboard-wrapper">
        <div class="dashboard-header">
          <h3>${this.element.dataset.title || 'VeloConnect Dashboard'}</h3>
          <div class="dashboard-controls">
            <div class="last-updated">
              Last updated: ${this.formatTime(this.lastUpdated)}
            </div>
            <button class="btn-secondary refresh-btn" title="Refresh Dashboard">
              🔄 Refresh
            </button>
            <button class="btn-secondary settings-btn" title="Dashboard Settings">
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div class="dashboard-overview">
          <div class="overview-cards">
            <div class="overview-card total-vendors">
              <h4>Connected Vendors</h4>
              <div class="card-value">${Object.keys(this.vendors).length}</div>
              <div class="card-detail">${this.getHealthyVendorsCount()} healthy</div>
            </div>
            <div class="overview-card total-products">
              <h4>Total Products</h4>
              <div class="card-value">${this.getTotalProducts().toLocaleString()}</div>
              <div class="card-detail">${this.getSyncedTodayCount()} synced today</div>
            </div>
            <div class="overview-card api-health">
              <h4>API Health</h4>
              <div class="card-value">${this.performanceData.uptime}</div>
              <div class="card-detail">${this.performanceData.averageResponseTime}ms avg</div>
            </div>
            <div class="overview-card sync-status">
              <h4>Sync Status</h4>
              <div class="card-value">${this.getOverallSyncStatus()}</div>
              <div class="card-detail">${this.getTotalFailedSyncs()} failed today</div>
            </div>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="vendors-section">
            <h4>Vendor Status</h4>
            <div class="vendors-grid">
              ${Object.entries(this.vendors).map(([key, vendor]) => `
                <div class="vendor-card ${vendor.status}" data-vendor="${key}">
                  <div class="vendor-header">
                    <h5>${vendor.name}</h5>
                    <div class="vendor-status ${vendor.status}">
                      ${this.getStatusIcon(vendor.status)} ${vendor.status.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div class="vendor-metrics">
                    <div class="metric">
                      <span class="metric-label">Products:</span>
                      <span class="metric-value">${vendor.metrics.totalProducts.toLocaleString()}</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Synced Today:</span>
                      <span class="metric-value">${vendor.metrics.syncedToday}</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Response Time:</span>
                      <span class="metric-value">${vendor.metrics.avgResponseTime}ms</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Rate Limit:</span>
                      <span class="metric-value">${vendor.metrics.rateLimitUsed}%</span>
                    </div>
                  </div>
                  
                  <div class="vendor-endpoints">
                    <h6>Endpoint Health</h6>
                    ${vendor.endpoints.map(endpoint => `
                      <div class="endpoint ${endpoint.status}">
                        <span class="endpoint-name">${endpoint.name}</span>
                        <span class="endpoint-status">
                          ${this.getStatusIcon(endpoint.status)} ${endpoint.responseTime}ms
                        </span>
                      </div>
                    `).join('')}
                  </div>
                  
                  <div class="vendor-actions">
                    <button class="btn-small" onclick="this.testConnection('${key}')">Test</button>
                    <button class="btn-small" onclick="this.forcSync('${key}')">Sync</button>
                    <button class="btn-small" onclick="this.viewLogs('${key}')">Logs</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="performance-section">
            <h4>Performance Analytics</h4>
            <div class="performance-grid">
              <div class="performance-chart">
                <h5>API Response Times (24h)</h5>
                <div class="chart-placeholder">
                  ${this.generateResponseTimeChart()}
                </div>
              </div>
              
              <div class="performance-chart">
                <h5>Sync Success Rate</h5>
                <div class="chart-placeholder">
                  ${this.generateSuccessRateChart()}
                </div>
              </div>
              
              <div class="performance-stats">
                <h5>Today's Statistics</h5>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value">${this.performanceData.totalApiCalls.toLocaleString()}</div>
                    <div class="stat-label">Total API Calls</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">${this.performanceData.successfulCalls.toLocaleString()}</div>
                    <div class="stat-label">Successful Calls</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">${this.performanceData.dataTransferred}</div>
                    <div class="stat-label">Data Transferred</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">${((this.performanceData.successfulCalls / this.performanceData.totalApiCalls) * 100).toFixed(1)}%</div>
                    <div class="stat-label">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="alerts-section">
            <h4>Active Alerts & Recommendations</h4>
            <div class="alerts-list">
              ${this.generateAlerts()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getStatusIcon(status) {
    const icons = {
      'connected': '✅',
      'healthy': '✅', 
      'warning': '⚠️',
      'error': '❌',
      'maintenance': '🔧',
      'partial_failure': '⚠️'
    };
    return icons[status] || '❓';
  }

  getHealthyVendorsCount() {
    return Object.values(this.vendors).filter(v => v.status === 'connected').length;
  }

  getTotalProducts() {
    return Object.values(this.vendors).reduce((sum, v) => sum + v.metrics.totalProducts, 0);
  }

  getSyncedTodayCount() {
    return Object.values(this.vendors).reduce((sum, v) => sum + v.metrics.syncedToday, 0);
  }

  getTotalFailedSyncs() {
    return Object.values(this.vendors).reduce((sum, v) => sum + v.metrics.failedSyncs, 0);
  }

  getOverallSyncStatus() {
    const totalFailed = this.getTotalFailedSyncs();
    if (totalFailed === 0) return 'Excellent';
    if (totalFailed < 5) return 'Good';
    if (totalFailed < 15) return 'Warning';
    return 'Critical';
  }

  generateResponseTimeChart() {
    // Simulated chart data - would use real charting library in production
    const hours = Array.from({length: 24}, (_, i) => i);
    const avgTimes = hours.map(() => Math.floor(Math.random() * 300 + 200));
    
    return `
      <div class="simple-chart">
        ${avgTimes.map((time, i) => `
          <div class="chart-bar" style="height: ${(time / 500) * 100}%" 
               title="${i}:00 - ${time}ms"></div>
        `).join('')}
      </div>
      <div class="chart-labels">
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
      </div>
    `;
  }

  generateSuccessRateChart() {
    const successRate = (this.performanceData.successfulCalls / this.performanceData.totalApiCalls) * 100;
    
    return `
      <div class="success-rate-circle">
        <div class="circle-chart" data-percent="${successRate.toFixed(1)}">
          <div class="circle-progress" style="--percent: ${successRate}"></div>
          <div class="circle-text">${successRate.toFixed(1)}%</div>
        </div>
      </div>
    `;
  }

  generateAlerts() {
    const alerts = [];
    
    // Check for vendor issues
    Object.entries(this.vendors).forEach(([key, vendor]) => {
      if (vendor.status === 'warning') {
        alerts.push({
          level: 'warning',
          message: `${vendor.name} has slow response times (${vendor.metrics.avgResponseTime}ms)`,
          action: 'Monitor performance'
        });
      }
      
      if (vendor.status === 'error') {
        alerts.push({
          level: 'error',
          message: `${vendor.name} connection failed`,
          action: 'Check API credentials'
        });
      }
      
      if (vendor.metrics.rateLimitUsed > 90) {
        alerts.push({
          level: 'warning',
          message: `${vendor.name} approaching rate limit (${vendor.metrics.rateLimitUsed}%)`,
          action: 'Reduce sync frequency'
        });
      }
    });
    
    // Performance alerts
    if (this.performanceData.averageResponseTime > 500) {
      alerts.push({
        level: 'warning',
        message: 'Overall API response time is slow',
        action: 'Optimize API calls'
      });
    }
    
    if (alerts.length === 0) {
      alerts.push({
        level: 'success',
        message: 'All systems operating normally',
        action: 'No action required'
      });
    }
    
    return alerts.map(alert => `
      <div class="alert ${alert.level}">
        <div class="alert-icon">${this.getStatusIcon(alert.level === 'success' ? 'healthy' : alert.level)}</div>
        <div class="alert-content">
          <div class="alert-message">${alert.message}</div>
          <div class="alert-action">${alert.action}</div>
        </div>
      </div>
    `).join('');
  }

  setupEventHandlers() {
    const container = this.element.querySelector('.ebike-dashboard-tool');
    
    // Refresh button
    const refreshBtn = container.querySelector('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshDashboard());
    }
    
    // Settings button
    const settingsBtn = container.querySelector('.settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }
    
    // Vendor card click handlers
    container.querySelectorAll('.vendor-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          const vendor = card.dataset.vendor;
          this.showVendorDetails(vendor);
        }
      });
    });
  }

  startAutoRefresh() {
    this.refreshTimer = setInterval(() => {
      this.refreshDashboard(false); // Silent refresh
    }, this.refreshInterval);
  }

  async refreshDashboard(showLoading = true) {
    if (showLoading) {
      const refreshBtn = this.element.querySelector('.refresh-btn');
      if (refreshBtn) {
        refreshBtn.innerHTML = '🔄 Refreshing...';
        refreshBtn.disabled = true;
      }
    }
    
    try {
      // Simulate API calls to refresh vendor data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update timestamps and simulate some data changes
      this.lastUpdated = new Date();
      this.simulateDataUpdates();
      
      // Re-render the dashboard
      const container = this.element.querySelector('.ebike-dashboard-tool');
      container.innerHTML = this.buildDashboardHTML();
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
    }
    
    if (showLoading) {
      const refreshBtn = this.element.querySelector('.refresh-btn');
      if (refreshBtn) {
        refreshBtn.innerHTML = '🔄 Refresh';
        refreshBtn.disabled = false;
      }
    }
  }

  simulateDataUpdates() {
    // Simulate some realistic data changes
    Object.keys(this.vendors).forEach(key => {
      const vendor = this.vendors[key];
      
      // Update sync counts
      if (vendor.status === 'connected') {
        vendor.metrics.syncedToday += Math.floor(Math.random() * 3);
        vendor.lastSync = new Date();
      }
      
      // Simulate occasional failures
      if (Math.random() < 0.1) {
        vendor.metrics.failedSyncs += 1;
      }
      
      // Update response times
      vendor.metrics.avgResponseTime += Math.floor(Math.random() * 40 - 20);
      vendor.metrics.avgResponseTime = Math.max(150, Math.min(2000, vendor.metrics.avgResponseTime));
      
      // Update endpoint response times
      vendor.endpoints.forEach(endpoint => {
        endpoint.responseTime += Math.floor(Math.random() * 40 - 20);
        endpoint.responseTime = Math.max(100, Math.min(3000, endpoint.responseTime));
      });
    });
  }

  testConnection(vendorKey) {
    const vendor = this.vendors[vendorKey];
    if (!vendor) return;
    
    showInfo(`Testing connection to ${vendor.name}...\n\nResult: Connection successful ✅\nLatency: ${vendor.metrics.avgResponseTime}ms\nEndpoint: ${vendor.apiUrl}`);
  }

  forcSync(vendorKey) {
    const vendor = this.vendors[vendorKey];
    if (!vendor) return;
    
    showInfo(`Force sync initiated for ${vendor.name}...\n\nSync started successfully ✅\nEstimated completion: 2-3 minutes\nProducts to sync: ${vendor.metrics.totalProducts}`);
    
    // Simulate sync update
    setTimeout(() => {
      vendor.metrics.syncedToday += Math.floor(Math.random() * 10 + 5);
      vendor.lastSync = new Date();
      this.refreshDashboard(false);
    }, 2000);
  }

  viewLogs(vendorKey) {
    const vendor = this.vendors[vendorKey];
    if (!vendor) return;
    
    const sampleLogs = [
      `[${new Date().toLocaleTimeString()}] INFO: Sync started for ${vendor.name}`,
      `[${new Date(Date.now() - 60000).toLocaleTimeString()}] SUCCESS: 25 products updated`,
      `[${new Date(Date.now() - 120000).toLocaleTimeString()}] WARNING: Rate limit at 85%`,
      `[${new Date(Date.now() - 180000).toLocaleTimeString()}] INFO: Connection established`,
    ];
    
    showInfo(`Recent logs for ${vendor.name}:\n\n${sampleLogs.join('\n')}\n\n(Full logs would open in new window)`);
  }

  showVendorDetails(vendorKey) {
    const vendor = this.vendors[vendorKey];
    if (!vendor) return;
    
    // Show vendor details
    showInfo(`Detailed information for ${vendor.name} would open in a modal window.`);
  }

  openSettings() {
    showInfo('Dashboard settings would open here:\n\n• Refresh interval\n• Alert thresholds\n• Vendor configurations\n• API credentials\n• Export options');
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    const dashboard = this.element.querySelector('.ebike-dashboard-tool');
    if (dashboard) dashboard.remove();
  }
}

/**
 * Auto-initialize toolkit when script loads
 */
/**
 * Blog Generator Module - Automatic news and content generation
 */
class BlogGenerator extends BaseModule {
  constructor(toolkit) {
    super(toolkit);
    this.generators = new Map();
  }

  async init() {
    await super.init();
    this.log('Blog Generator module initialized');
  }

  setupElement(element) {
    const generatorId = element.dataset.generatorId || this.generateId();
    element.dataset.generatorId = generatorId;
    
    const generator = new BlogGeneratorInstance(generatorId, element, this);
    this.generators.set(generatorId, generator);
    
    generator.render();
  }

  cleanupElement(element) {
    const generatorId = element.dataset.generatorId;
    if (generatorId && this.generators.has(generatorId)) {
      this.generators.get(generatorId).destroy();
      this.generators.delete(generatorId);
    }
  }

  generateId() {
    return `blog_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class BlogGeneratorInstance {
  constructor(id, element, module) {
    this.id = id;
    this.element = element;
    this.module = module;
    
    // RSS Feed sources
    this.feedSources = [
      { name: 'Bike Europe', url: 'https://www.bike-europe.com/rss', category: 'industry' },
      { name: 'Electric Bike Report', url: 'https://electricbikereport.com/feed/', category: 'reviews' },
      { name: 'Pedelec Magazine', url: 'https://www.pedelec-magazin.de/feed/', category: 'news' },
      { name: 'E-Bike News', url: 'https://ebike-news.de/feed/', category: 'german' },
      { name: 'Swiss Cycling', url: 'https://www.swiss-cycling.ch/feed/', category: 'swiss' }
    ];
    
    // Content templates
    this.contentTemplates = {
      industry_news: {
        structure: ['headline', 'summary', 'context', 'analysis', 'implications', 'cta'],
        tone: 'professional',
        length: '800-1200'
      },
      buying_guide: {
        structure: ['problem', 'overview', 'comparison', 'recommendations', 'next_steps'],
        tone: 'helpful',
        length: '1200-1800'
      },
      maintenance: {
        structure: ['context', 'instructions', 'tools', 'tips', 'service_link'],
        tone: 'instructional',
        length: '800-1500'
      }
    };
    
    // Current state
    this.currentView = 'dashboard';
    this.selectedFeeds = [];
    this.generatedDrafts = [];
    this.publishSchedule = [];
  }

  render() {
    const placeholder = this.element.querySelector('.ebike-loading-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.remove();
    }
    
    const generatorDiv = document.createElement('div');
    generatorDiv.className = 'ebike-blog-generator-tool';
    generatorDiv.innerHTML = this.buildGeneratorHTML();
    
    this.element.appendChild(generatorDiv);
    this.setupEventHandlers();
    this.loadFeedStatus();
  }

  buildGeneratorHTML() {
    return `
      <div class="blog-generator-wrapper">
        <div class="generator-header">
          <h3>AI Blog Content Generator</h3>
          <div class="generator-tabs">
            <button class="tab-btn active" data-view="dashboard">Dashboard</button>
            <button class="tab-btn" data-view="feeds">RSS Feeds</button>
            <button class="tab-btn" data-view="drafts">Drafts</button>
            <button class="tab-btn" data-view="schedule">Schedule</button>
            <button class="tab-btn" data-view="settings">Settings</button>
          </div>
        </div>

        <div class="generator-content">
          ${this.renderCurrentView()}
        </div>
      </div>
    `;
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard': return this.renderDashboard();
      case 'feeds': return this.renderFeedsManager();
      case 'drafts': return this.renderDraftsManager();
      case 'schedule': return this.renderScheduleManager();
      case 'settings': return this.renderSettings();
      default: return this.renderDashboard();
    }
  }

  renderDashboard() {
    return `
      <div class="blog-dashboard">
        <div class="dashboard-stats">
          <div class="stat-card">
            <h4>Active Feeds</h4>
            <div class="stat-value">${this.feedSources.length}</div>
            <div class="stat-detail">5 new articles today</div>
          </div>
          <div class="stat-card">
            <h4>Draft Articles</h4>
            <div class="stat-value">${this.generatedDrafts.length}</div>
            <div class="stat-detail">3 ready to publish</div>
          </div>
          <div class="stat-card">
            <h4>Scheduled Posts</h4>
            <div class="stat-value">${this.publishSchedule.length}</div>
            <div class="stat-detail">Next: Tomorrow 10:00</div>
          </div>
          <div class="stat-card">
            <h4>AI Credits</h4>
            <div class="stat-value">8,542</div>
            <div class="stat-detail">of 10,000 this month</div>
          </div>
        </div>

        <div class="recent-activity">
          <h4>Recent Activity</h4>
          <div class="activity-list">
            <div class="activity-item">
              <span class="activity-time">2 hours ago</span>
              <span class="activity-text">Generated draft: "E-Bike Trends 2025"</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">5 hours ago</span>
              <span class="activity-text">Published: "Winter Maintenance Guide"</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">Yesterday</span>
              <span class="activity-text">Translated 3 articles to German</span>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <button class="btn-primary generate-now-btn">🤖 Generate New Article</button>
          <button class="btn-secondary scan-feeds-btn">🔍 Scan RSS Feeds</button>
          <button class="btn-secondary review-drafts-btn">📝 Review Drafts</button>
        </div>
      </div>
    `;
  }

  renderFeedsManager() {
    return `
      <div class="feeds-manager">
        <div class="feeds-header">
          <h4>RSS Feed Management</h4>
          <button class="btn-primary add-feed-btn">+ Add Feed</button>
        </div>

        <div class="feeds-list">
          ${this.feedSources.map(feed => `
            <div class="feed-item" data-feed="${feed.url}">
              <div class="feed-info">
                <h5>${feed.name}</h5>
                <div class="feed-url">${feed.url}</div>
                <div class="feed-category">Category: ${feed.category}</div>
              </div>
              <div class="feed-status">
                <span class="status-indicator active">●</span>
                <span>Active</span>
              </div>
              <div class="feed-stats">
                <div>Last checked: 5 min ago</div>
                <div>Articles today: 3</div>
              </div>
              <div class="feed-actions">
                <button class="btn-small test-feed">Test</button>
                <button class="btn-small edit-feed">Edit</button>
                <button class="btn-small delete-feed">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="feed-preview">
          <h4>Latest Articles from Feeds</h4>
          <div class="preview-articles">
            <div class="preview-article">
              <h5>New Bosch Performance Line CX 2025</h5>
              <p>The latest motor offers 85Nm torque with improved efficiency...</p>
              <button class="btn-small generate-from-article">Generate Article</button>
            </div>
            <div class="preview-article">
              <h5>Swiss E-Bike Market Grows 23%</h5>
              <p>Latest statistics show significant growth in Swiss e-bike adoption...</p>
              <button class="btn-small generate-from-article">Generate Article</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDraftsManager() {
    return `
      <div class="drafts-manager">
        <div class="drafts-header">
          <h4>Article Drafts</h4>
          <div class="draft-filters">
            <select class="filter-status">
              <option value="all">All Drafts</option>
              <option value="ready">Ready to Publish</option>
              <option value="needs-review">Needs Review</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <select class="filter-language">
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="it">Italian</option>
            </select>
          </div>
        </div>

        <div class="drafts-list">
          <div class="draft-item">
            <div class="draft-preview">
              <h5>E-Bike Trends 2025: What to Expect</h5>
              <p class="draft-excerpt">The e-bike industry is set for major innovations in 2025, with advances in battery technology...</p>
              <div class="draft-meta">
                <span>Generated: 2 hours ago</span>
                <span>Language: EN</span>
                <span>Word count: 1,245</span>
              </div>
            </div>
            <div class="draft-actions">
              <button class="btn-primary publish-btn">Publish</button>
              <button class="btn-secondary edit-btn">Edit</button>
              <button class="btn-secondary translate-btn">Translate</button>
              <button class="btn-secondary schedule-btn">Schedule</button>
              <button class="btn-danger delete-btn">Delete</button>
            </div>
          </div>

          <div class="draft-item">
            <h5>Winter E-Bike Maintenance Guide</h5>
            <p class="draft-excerpt">Keep your e-bike running smoothly through winter with these essential maintenance tips...</p>
            <div class="draft-meta">
              <span>Generated: Yesterday</span>
              <span>Language: DE</span>
              <span>Word count: 987</span>
            </div>
            <div class="draft-actions">
              <button class="btn-primary publish-btn">Publish</button>
              <button class="btn-secondary edit-btn">Edit</button>
              <button class="btn-secondary preview-btn">Preview</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderScheduleManager() {
    return `
      <div class="schedule-manager">
        <div class="schedule-header">
          <h4>Publishing Schedule</h4>
          <button class="btn-primary add-scheduled-post">+ Schedule Post</button>
        </div>

        <div class="schedule-calendar">
          <div class="calendar-week">
            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
              <div class="calendar-day">
                <div class="day-header">${day}</div>
                <div class="day-posts">
                  ${day === 'Mon' ? '<div class="scheduled-post">10:00 - Industry News</div>' : ''}
                  ${day === 'Wed' ? '<div class="scheduled-post">14:00 - Buying Guide</div>' : ''}
                  ${day === 'Fri' ? '<div class="scheduled-post">09:00 - Swiss Market Update</div>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="schedule-queue">
          <h4>Upcoming Publications</h4>
          <div class="queue-list">
            <div class="queue-item">
              <span class="queue-time">Tomorrow 10:00</span>
              <span class="queue-title">E-Bike Trends 2025</span>
              <button class="btn-small reschedule">Reschedule</button>
            </div>
            <div class="queue-item">
              <span class="queue-time">Wed 14:00</span>
              <span class="queue-title">Choosing Your First E-Bike</span>
              <button class="btn-small reschedule">Reschedule</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSettings() {
    return `
      <div class="generator-settings">
        <h4>Blog Generator Settings</h4>
        
        <div class="settings-section">
          <h5>AI Configuration</h5>
          <div class="setting-item">
            <label>AI Provider</label>
            <select class="ai-provider">
              <option value="openai">OpenAI GPT-4</option>
              <option value="claude">Claude</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Content Tone</label>
            <select class="content-tone">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Target Audience</label>
            <select class="target-audience">
              <option value="general">General Public</option>
              <option value="enthusiasts">E-Bike Enthusiasts</option>
              <option value="commuters">Commuters</option>
              <option value="technical">Technical Readers</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <h5>Language Settings</h5>
          <div class="setting-item">
            <label>Primary Language</label>
            <select class="primary-language">
              <option value="en">English</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="it">Italian</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Auto-Translate</label>
            <input type="checkbox" checked /> Enable automatic translation
          </div>
          <div class="setting-item">
            <label>Translation Languages</label>
            <div class="checkbox-group">
              <label><input type="checkbox" checked /> German</label>
              <label><input type="checkbox" checked /> French</label>
              <label><input type="checkbox" checked /> Italian</label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h5>SEO Settings</h5>
          <div class="setting-item">
            <label>Focus Keywords</label>
            <textarea rows="3" placeholder="e-bike schweiz, elektrofahrrad, pedelec...">e-bike schweiz, elektrofahrrad kaufen, pedelec test, e-bike beratung</textarea>
          </div>
          <div class="setting-item">
            <label>Meta Description Template</label>
            <textarea rows="2">{title} - Expert advice from Godspeed, your Swiss e-bike specialist. {excerpt}</textarea>
          </div>
        </div>

        <div class="settings-actions">
          <button class="btn-primary save-settings">Save Settings</button>
          <button class="btn-secondary reset-settings">Reset to Defaults</button>
        </div>
      </div>
    `;
  }

  setupEventHandlers() {
    const container = this.element.querySelector('.ebike-blog-generator-tool');
    
    // Tab navigation
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentView = e.target.dataset.view;
        this.updateView();
      });
    });

    // Quick action buttons
    const generateBtn = container.querySelector('.generate-now-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateNewArticle());
    }

    const scanBtn = container.querySelector('.scan-feeds-btn');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => this.scanFeeds());
    }
  }

  updateView() {
    const content = this.element.querySelector('.generator-content');
    content.innerHTML = this.renderCurrentView();
    this.setupEventHandlers(); // Re-attach handlers for new content
  }

  async generateNewArticle() {
    // Show generation modal
    const modal = this.showGenerationModal();
    
    // Simulate article generation
    setTimeout(() => {
      this.generatedDrafts.push({
        title: 'New E-Bike Safety Standards in Switzerland',
        excerpt: 'Understanding the latest regulatory changes for e-bikes in Switzerland...',
        content: '<p>Full article content here...</p>',
        language: 'en',
        wordCount: 1234,
        generatedAt: new Date()
      });
      
      modal.remove();
      showSuccess('Article generated successfully! Check the Drafts tab.');
      this.currentView = 'drafts';
      this.updateView();
    }, 3000);
  }

  showGenerationModal() {
    const modal = document.createElement('div');
    modal.className = 'generation-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Generating Article...</h3>
        <div class="generation-progress">
          <div class="progress-step active">📰 Analyzing RSS feeds...</div>
          <div class="progress-step">🤖 AI processing content...</div>
          <div class="progress-step">✏️ Optimizing for SEO...</div>
          <div class="progress-step">🌐 Preparing translations...</div>
        </div>
        <div class="loading-spinner">⏳</div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Animate progress steps
    let step = 0;
    const steps = modal.querySelectorAll('.progress-step');
    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        steps[step].classList.add('active');
      } else {
        clearInterval(interval);
      }
    }, 750);
    
    return modal;
  }

  async scanFeeds() {
    showInfo('Scanning RSS feeds for new content...');
    // Simulate feed scanning
    setTimeout(() => {
      showSuccess('Found 5 new articles across all feeds!');
    }, 2000);
  }

  loadFeedStatus() {
    // Simulate loading feed status
    // Load RSS feed status
  }

  destroy() {
    const generator = this.element.querySelector('.ebike-blog-generator-tool');
    if (generator) generator.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check if toolkit should be auto-initialized
  const autoInit = !document.querySelector('[data-ebike-toolkit-manual]');
  
  if (autoInit) {
    window.EBikeToolkitInstance = new EBikeToolkit(window.ebikeToolkitConfig || {});
  }
});

// Export for manual initialization
window.EBikeToolkit = EBikeToolkit;
window.EBikeToolkitModules = {
  BaseModule,
  BikeComparison,
  SizeCalculator,
  FinancingCalculator,
  WishlistManager,
  // === NEW ADVANCED TOOLS ===
  RangeCalculator,
  TestRideBooking,
  ServiceBooking,
  DashboardManagement,
  BlogGenerator
};

// Make modules available under GodspeedToolkit namespace for sections
window.GodspeedToolkit = window.EBikeToolkitModules;

// Create standalone versions of modules that don't require toolkit parameter
window.GodspeedToolkit.WishlistManager = class extends WishlistManager {
  constructor() {
    // Create a minimal toolkit instance for standalone use
    const minimalToolkit = { 
      config: {}, 
      theme: null,
      log: console.log.bind(console)
    };
    super(minimalToolkit);
  }
  
  init(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      this.setupElement(element);
    }
  }
};

window.GodspeedToolkit.SizeCalculator = class extends SizeCalculator {
  constructor() {
    const minimalToolkit = { config: {}, theme: null, log: console.log.bind(console) };
    super(minimalToolkit);
  }
  init(elementId) {
    const element = document.getElementById(elementId);
    if (element) this.setupElement(element);
  }
};

window.GodspeedToolkit.RangeCalculator = class extends RangeCalculator {
  constructor() {
    const minimalToolkit = { config: {}, theme: null, log: console.log.bind(console) };
    super(minimalToolkit);
  }
  init(elementId) {
    const element = document.getElementById(elementId);
    if (element) this.setupElement(element);
  }
};

window.GodspeedToolkit.DashboardManagement = class extends DashboardManagement {
  constructor() {
    const minimalToolkit = { config: {}, theme: null, log: console.log.bind(console) };
    super(minimalToolkit);
  }
  init(elementId) {
    const element = document.getElementById(elementId);
    if (element) this.setupElement(element);
  }
};

window.GodspeedToolkit.BlogGenerator = class extends BlogGenerator {
  constructor() {
    const minimalToolkit = { config: {}, theme: null, log: console.log.bind(console) };
    super(minimalToolkit);
  }
  init(elementId) {
    const element = document.getElementById(elementId);
    if (element) this.setupElement(element);
  }
};