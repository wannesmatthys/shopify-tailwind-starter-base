/*
    EG Wishlist
    © 2022 EcomGraduates
    https://wwww.ecomgraduates.com
*/

const localStorageKey = 'eg_wishlist_v2';

const heartSvgIconEmpty = `
    <svg class="icon icon-wishlist icon-wishlist-empty" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="fill: currentColor;">
        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"></path>
    </svg>
`;

const heartSvgIconFull = `
    <svg class="icon icon-wishlist icon-wishlist-full" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="fill: currentColor;">
        <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
    </svg>
`;

// Shopify resize image (helper function)
// https://gist.github.com/DanWebb/cce6ab34dd521fcac6ba
const resizeImage = (src, size, crop = '') =>
  src
    .replace(
      /_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048|master)+\./g,
      '.',
    )
    .replace(/\.jpg|\.png|\.gif|\.jpeg/g, (match) => {
      if (crop.length) {
        // eslint-disable-next-line no-param-reassign
        crop = `_crop_${crop}`;
      }
      return `_${size}${crop}${match}`;
    });

// Shopify format money (helper function)
// https://gist.github.com/stewartknapman/8d8733ea58d2314c373e94114472d44c
const formatMoney = (cents, format) => {
  if (typeof cents === 'string') {
    // eslint-disable-next-line no-param-reassign
    cents = cents.replace('.', '');
  }
  let value = '';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || window.eg_wishlist.money_format;

  function defaultOption(opt, def) {
    return typeof opt === 'undefined' ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    // eslint-disable-next-line no-param-reassign
    precision = defaultOption(precision, 2);
    // eslint-disable-next-line no-param-reassign
    thousands = defaultOption(thousands, ',');
    // eslint-disable-next-line no-param-reassign
    decimal = defaultOption(decimal, '.');

    if (Number.isNaN(number) || number == null) {
      return 0;
    }

    // eslint-disable-next-line no-param-reassign
    number = (number / 100.0).toFixed(precision);

    const parts = number.split('.');
    // eslint-disable-next-line prefer-template
    const dollars = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      '$1' + thousands,
    );
    // eslint-disable-next-line no-param-reassign
    cents = parts[1] ? decimal + parts[1] : '';

    return dollars + cents;
  }

  // eslint-disable-next-line default-case
  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

// Dynamically insert wishlist icons (header, menu drawer)
const insertWishlistIcons = () => {
  const cartIconBubble = document.querySelector('#cart-icon-bubble');

  if (cartIconBubble) {
    cartIconBubble.insertAdjacentHTML(
      'beforebegin',
      `
            <a href="#" class="eg-wishlist-icon header__icon header__icon--wishlist link focus-inset" id="wishlist-icon-bubble" role="button" aria-haspopup="dialog">
                ${heartSvgIconEmpty}
                <span class="visually-hidden">
                    ${window.eg_wishlist.text_wishlist}
                </span>
                <div class="wishlist-count-bubble" hidden>
                    <span></span>
                </div>
            </a>
        `,
    );
  }

  const menuDrawerUtilityLinks = document.querySelector(
    '.menu-drawer__utility-links',
  );

  if (menuDrawerUtilityLinks) {
    menuDrawerUtilityLinks.insertAdjacentHTML(
      'afterbegin',
      `
            <a href="#" class="eg-wishlist-icon menu-drawer__wishlist link focus-inset h5" role="button" aria-haspopup="dialog">
                ${heartSvgIconEmpty}
                ${window.eg_wishlist.text_wishlist}
                <div class="wishlist-count-bubble" hidden>
                    <span></span>
                </div>
            </a>
        `,
    );
  }
};
insertWishlistIcons();

// Dynamically insert 'Add/Remove' wishlist buttons (product card, product page)
const insertWishlistButtons = () => {
  document
    .querySelectorAll('#rental .product-grid .product-card-wrapper')
    .forEach((card) => {
      const productLink = card.querySelector('[href*="/products"]').href;
      let productHandle = productLink.split('products/')[1];
      productHandle = productHandle.split('?')[0];

      card.insertAdjacentHTML(
        'afterbegin',
        `
            <button
                type="button"
                class="btn-add-remove-from-wishlist"
                onclick="onClickEgWishlistButton(this, event)"
                style="color: ${window.eg_wishlist.card_icon_color}"
                data-product-handle="${productHandle}"
                hidden>
                <span data-add hidden>
                    ${heartSvgIconEmpty}
                    <span class="visually-hidden">
                        ${window.eg_wishlist.text_add}
                    </span>
                </span>
                <span data-remove hidden>
                    ${heartSvgIconFull}
                    <span class="visually-hidden">
                        ${window.eg_wishlist.text_remove}
                    </span>
                </span>
                
            </button>
        `,
      );
    });

  const productForm = document.querySelector('#rental.product-form');

  if (productForm) {
    const productLink = productForm
      .closest('.product')
      .querySelector('[href*="/products"]').href;
    let productHandle = productLink.split('products/')[1];
    productHandle = productHandle.split('?')[0];

    productForm.insertAdjacentHTML(
      'afterend',
      `
            <button
                type="button"
                class="btn-add-remove-from-wishlist button button--full-width button--tertiary"
                onclick="onClickEgWishlistButton(this, event)"
                style="color: ${window.eg_wishlist.card_icon_color}"
                data-product-handle="${productHandle}"
                hidden>
                <span data-add hidden>
                    ${heartSvgIconEmpty}
                    <span class="">
                        ${window.eg_wishlist.text_add}
                    </span>
                </span>
                <span data-remove hidden>
                    ${heartSvgIconFull}
                    <span class="">
                        ${window.eg_wishlist.text_remove}
                    </span>
                </span>
                
            </button>
        `,
    );

    productForm
      .closest('.product')
      .querySelector(
        '.btn-add-remove-from-wishlist + .btn-add-remove-from-wishlist',
      )
      ?.remove();
  }
};
insertWishlistButtons();

// Inject buttons again if the url changes (e.g filters)
const initMutationObserver = () => {
  let lastUrl = location.href;

  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      setTimeout(() => {
        const productCard = document.querySelector('.product-card-wrapper');
        if (productCard) {
          if (!productCard.querySelector('.btn-add-remove-from-wishlist')) {
            insertWishlistButtons();
          }
        }
        initWishlist();
      }, 1000);

      lastUrl = location.href;
    }
  }).observe(document, { subtree: true, childList: true });
};
initMutationObserver();

// Add or Remove products from the wishlist
window.onClickEgWishlistButton = async (btn, event) => {
  event.preventDefault();

  let wishlist = JSON.parse(localStorage.getItem(localStorageKey)) || [];
  const isWishlisted = wishlist.some(
    (elem) => elem.handle === btn.dataset.productHandle,
  );

  if (isWishlisted) {
    wishlist = wishlist.filter(
      (elem) => elem.handle !== btn.dataset.productHandle,
    );
  } else {
    const response = await fetch(`/products/${btn.dataset.productHandle}.js`);
    const product = await response.json();

    if (product.variants[0].taxable) {
      product.price_exclusive_tax = product.price * 0.79;
      product.tax = product.price - product.price_exclusive_tax;
    }

    wishlist.push({
      id: product.id,
      handle: product.handle,
      url: product.url,
      title: product.title,
      compare_at_price: product.compare_at_price,
      compare_at_price_varies: product.compare_at_price_varies,
      price: product.price,
      featured_image: product.featured_image,
      vendor: product.vendor,
      time: Date.now(),
      tax: product.tax,
      price_exclusive_tax: product.price_exclusive_tax,
    });
  }

  localStorage.setItem(localStorageKey, JSON.stringify(wishlist));
  initWishlist();
};

class EgWishlistDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      'keyup',
      (evt) => evt.code === 'Escape' && this.close(),
    );
    this.querySelector('#WishlistDrawer-Overlay').addEventListener(
      'click',
      this.close.bind(this),
    );
    this.setWishlistIconsAccessibility();
  }

  setWishlistIconsAccessibility() {
    document.querySelectorAll('.eg-wishlist-icon').forEach((icon) => {
      icon.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(icon);
      });

      icon.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(icon);
        }
      });
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);

    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('WishlistDrawer');
        const focusElement =
          this.querySelector('.drawer__inner') ||
          this.querySelector('.drawer__close');
        window.trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true },
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    window.removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  static buildDrawer() {
    if (!document.querySelector('#CartDrawer')) {
      console.error('EG Wishlist - Please enable the Dawn Cart Drawer.');
      return;
    }

    const drawer = document.querySelector('eg-wishlist-drawer');
    const wishlist = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    if (wishlist.length === 0) {
      drawer.classList.add('is-empty');
      drawer.querySelector('.drawer__inner-empty').removeAttribute('hidden');
      drawer
        .querySelector('.drawer__inner-filled')
        .setAttribute('hidden', 'hidden');
    } else {
      drawer.classList.remove('is-empty');
      drawer
        .querySelector('.drawer__inner-empty')
        .setAttribute('hidden', 'hidden');
      drawer.querySelector('.drawer__inner-filled').removeAttribute('hidden');
    }

    if (wishlist) {
      let buildProductListItems = '';

      let total = 0;
      let total_tax = 0;
      let total_excl_tax = 0;

      wishlist.forEach((product) => {
        total += product.price;
        total_tax += product.tax;
        total_excl_tax += product.price_exclusive_tax;

        buildProductListItems += `
                    <li class="eg-wishlist-drawer-product-list-item" style="height:fit-content">
                        <a href="${product.url}" class="">
                            <img 
                                class="wishlist-item__image img-fluid" 
                                src="${resizeImage(
                                  product.featured_image || 'no-image.gif',
                                  '120x120',
                                  'center',
                                )}"
                                alt="" 
                                width="120"
                                height="120"
                                loading="lazy">
                        </a>
                        <div class="" style="width: 100%;">
                            <a href="${
                              product.url
                            }" class="cart-item__name h4 break">
                                ${product.title}
                            </a>
                            <div class="product-price-container product-option">
                                <s class="product-price-compare" style="${
                                  product.compare_at_price > product.price
                                    ? ''
                                    : 'display: none;'
                                }">
                                    <span class="visually-hidden">
                                        Old price
                                    </span>
                                    ${formatMoney(product.compare_at_price)}
                                </s>
                                <span class="product-price-final">
                                    ${formatMoney(product.price)}
                                </span>
                            </div>
                        </div>
                        <button 
                            class="btn-remove-from-wishlist button button--tertiary px-2 ms-3"
                            onclick="onClickEgWishlistButton(this, event)"
                            aria-label="${window.eg_wishlist.text_remove}"
                            data-product-handle="${product.handle}">
                            <svg width="15" height="15" class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false" role="presentation" class="icon icon-remove">
                                <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"></path>
                                <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"></path>
                            </svg>
                        </button>
                    </li>
                `;
      });

      buildProductListItems += `
      <li class="eg-wishlist-drawer-product-list-item" style="display:block; height:fit-content; margin-top:auto; padding-bottom: 2rem">
      <div style="display: grid; grid-template-columns: auto auto; gap: 5px; float: right; padding-bottom: 2rem;">
    <div style="text-align: right;"><strong>Totaal excl. BTW:</strong></div>
    <div>${formatMoney(total_excl_tax)}</div>

    <div style="text-align: right;"><strong>BTW:</strong></div>
    <div>${formatMoney(total_tax)}</div>

    <div style="text-align: right;"><strong>Totaal incl. BTW:</strong></div>
    <div>${formatMoney(total)}</div>
</div>


  
        <a href="/pages/contact#form" class="product-form__submit button button--full-width button--primary">
        Contacteer ons
        </a>
      </li>
      
      `;

      drawer.querySelector('.eg-wishlist-drawer-product-list').innerHTML =
        buildProductListItems;
    }
  }
}
customElements.define('eg-wishlist-drawer', EgWishlistDrawer);

// Init Wishlist
const initWishlist = () => {
  const wishlistStorage =
    JSON.parse(localStorage.getItem(localStorageKey)) || [];

  document.querySelectorAll('.btn-add-remove-from-wishlist').forEach((btn) => {
    const isWishlisted = wishlistStorage.some(
      (elem) => elem.handle === btn.dataset.productHandle,
    );

    if (isWishlisted) {
      btn.querySelector('[data-add]').setAttribute('hidden', 'hidden');
      btn.querySelector('[data-remove]').removeAttribute('hidden');
    } else {
      btn.querySelector('[data-add]').removeAttribute('hidden');
      btn.querySelector('[data-remove]').setAttribute('hidden', 'hidden');
    }

    btn.removeAttribute('hidden');
  });

  document.querySelectorAll('.wishlist-count-bubble').forEach((bubble) => {
    if (wishlistStorage.length === 0) {
      bubble.setAttribute('hidden', 'hidden');
    } else {
      bubble.removeAttribute('hidden');
      bubble.textContent = wishlistStorage.length;
    }
  });

  EgWishlistDrawer.buildDrawer();
};
initWishlist();
