/* ==========================================================
   North Star Bakery - Interactivity
   1. Pre-Order List: customers add products to a personal list
      on the Products page. The list is saved in localStorage
      and pre-fills the pre-order form on the Contact page.
   2. Form validation with clear messages next to each field.
   3. Remembered customer name and email (localStorage).
   ========================================================== */

/* ---------- Data ---------- */

// Array of product objects shown on the Products page
const products = [
  { id: "country-sourdough", name: "Country Sourdough", category: "Breads", price: "$7–$9" },
  { id: "honey-wheat", name: "Honey Whole Wheat", category: "Breads", price: "$6–$8" },
  { id: "baguette", name: "French Baguette", category: "Breads", price: "$4–$5" },
  { id: "signature-loaf", name: "Signature Loaf", category: "Breads", price: "$9–$11" },
  { id: "croissant", name: "Butter Croissants", category: "Pastries", price: "$3–$4 each" },
  { id: "danish", name: "Seasonal Fruit Danishes", category: "Pastries", price: "$4–$5 each" },
  { id: "cinnamon-swirl", name: "Cinnamon Swirls", category: "Pastries", price: "$3–$4 each" },
  { id: "cookies", name: "Cookies", category: "Pastries", price: "$20–$24 per dozen" },
  { id: "celebration-cake", name: "Celebration Cakes", category: "Cakes", price: "$35–$75" },
  { id: "wedding-cake", name: "Wedding and Event Cakes", category: "Cakes", price: "$150–$400" },
  { id: "loaf-cake", name: "Everyday Loaf Cakes", category: "Cakes", price: "$4–$20" }
];

// Object that keeps all localStorage key names in one place
const STORAGE_KEYS = {
  preorderList: "northStarPreorderList",
  customer: "northStarCustomer"
};

// Array of days the bakery is closed (0 = Sunday, 1 = Monday)
const CLOSED_DAYS = [1];

// Object of error messages used by the form validation
const MESSAGES = {
  nameRequired: "Please enter your full name.",
  nameShort: "Your name must be at least 2 characters long.",
  emailRequired: "Please enter your email address.",
  emailFormat: "Please enter a valid email address, such as name@example.com.",
  requestType: "Please choose a request type.",
  dateRequired: "Please choose a pickup date.",
  datePast: "Please choose a pickup date after today.",
  dateClosed: "We are closed on Mondays. Please choose Tuesday through Sunday.",
  itemsShort: "Please describe the items you want in at least 5 characters.",
  allergyLong: "Allergy notes must be 300 characters or fewer."
};

/* ---------- Storage helpers ---------- */

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage may be blocked (private mode); the page still works.
  }
}

function getPreorderList() {
  return loadFromStorage(STORAGE_KEYS.preorderList, []);
}

function savePreorderList(list) {
  saveToStorage(STORAGE_KEYS.preorderList, list);
}

function findProduct(productId) {
  return products.find(function (product) {
    return product.id === productId;
  });
}

/* ---------- Feature: Pre-Order List (Products page) ---------- */

function isInList(productId) {
  return getPreorderList().includes(productId);
}

function toggleProduct(productId) {
  let list = getPreorderList();
  if (list.includes(productId)) {
    list = list.filter(function (id) {
      return id !== productId;
    });
  } else {
    list.push(productId);
  }
  savePreorderList(list);
  updateProductButtons();
  renderPreorderList();
}

function addListButtons() {
  const items = document.querySelectorAll("[data-product]");
  items.forEach(function (item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-button";
    button.dataset.productId = item.dataset.product;
    button.addEventListener("click", function () {
      toggleProduct(item.dataset.product);
    });
    item.appendChild(button);
  });
  updateProductButtons();
}

function updateProductButtons() {
  const buttons = document.querySelectorAll(".list-button");
  buttons.forEach(function (button) {
    const product = findProduct(button.dataset.productId);
    const added = isInList(button.dataset.productId);
    button.textContent = added ? "✓ In My List (remove)" : "+ Add to My Pre-Order List";
    button.setAttribute("aria-pressed", added ? "true" : "false");
    button.setAttribute("aria-label", (added ? "Remove " : "Add ") + product.name + (added ? " from" : " to") + " my pre-order list");
    button.classList.toggle("added", added);
  });
}

function renderPreorderList() {
  const listElement = document.getElementById("preorder-items");
  const countElement = document.getElementById("preorder-count");
  const emptyMessage = document.getElementById("preorder-empty");
  const actions = document.getElementById("preorder-actions");
  if (!listElement) {
    return;
  }

  const list = getPreorderList();
  listElement.innerHTML = "";

  list.forEach(function (productId) {
    const product = findProduct(productId);
    if (!product) {
      return;
    }
    const li = document.createElement("li");
    li.textContent = product.name + " (" + product.category + ", " + product.price + ") ";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove " + product.name);
    removeButton.addEventListener("click", function () {
      toggleProduct(productId);
    });

    li.appendChild(removeButton);
    listElement.appendChild(li);
  });

  countElement.textContent = list.length + (list.length === 1 ? " item" : " items");
  emptyMessage.hidden = list.length > 0;
  actions.hidden = list.length === 0;
}

function clearPreorderList() {
  savePreorderList([]);
  updateProductButtons();
  renderPreorderList();
}

function setupPreorderFeature() {
  if (!document.getElementById("preorder-list")) {
    return;
  }
  addListButtons();
  renderPreorderList();
  document.getElementById("clear-list").addEventListener("click", clearPreorderList);
}

/* ---------- Contact page: pre-fill form from storage ---------- */

function buildItemDetailsText(list) {
  return list
    .map(function (productId) {
      const product = findProduct(productId);
      return product ? "1 x " + product.name : "";
    })
    .filter(function (line) {
      return line !== "";
    })
    .join("\n");
}

function prefillForm(form) {
  const list = getPreorderList();
  const itemDetails = form.elements["item-details"];
  const notice = document.getElementById("prefill-notice");

  if (list.length > 0 && itemDetails.value.trim() === "") {
    itemDetails.value = buildItemDetailsText(list);
    form.elements["request-type"].value = "pre-order";
    notice.textContent = "We added the " + list.length + " item(s) from your Pre-Order List. You can change the quantities below.";
    notice.hidden = false;
  }

  const customer = loadFromStorage(STORAGE_KEYS.customer, null);
  if (customer) {
    form.elements["name"].value = customer.name;
    form.elements["email"].value = customer.email;
  }
}

/* ---------- Form validation ---------- */

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function getTomorrow() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() + 1);
  return today;
}

function toDateInputValue(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

// Object that maps each field name to its validation function.
// Each function returns an error message, or "" when the value is valid.
const validators = {
  name: function (value) {
    if (value.trim() === "") return MESSAGES.nameRequired;
    if (value.trim().length < 2) return MESSAGES.nameShort;
    return "";
  },
  email: function (value) {
    if (value.trim() === "") return MESSAGES.emailRequired;
    if (!isValidEmail(value.trim())) return MESSAGES.emailFormat;
    return "";
  },
  "request-type": function (value) {
    return value === "" ? MESSAGES.requestType : "";
  },
  "pickup-date": function (value) {
    if (value === "") return MESSAGES.dateRequired;
    const chosen = new Date(value + "T00:00:00");
    if (chosen < getTomorrow()) return MESSAGES.datePast;
    if (CLOSED_DAYS.includes(chosen.getDay())) return MESSAGES.dateClosed;
    return "";
  },
  "item-details": function (value) {
    return value.trim().length < 5 ? MESSAGES.itemsShort : "";
  },
  "allergy-notes": function (value) {
    return value.length > 300 ? MESSAGES.allergyLong : "";
  }
};

function showError(field, message) {
  const errorElement = document.getElementById(field.id + "-error");
  errorElement.textContent = message;
  field.setAttribute("aria-invalid", message ? "true" : "false");
  field.classList.toggle("invalid", message !== "");
}

function validateField(field) {
  const message = validators[field.name](field.value);
  showError(field, message);
  return message === "";
}

function validateForm(form) {
  let firstInvalid = null;
  Object.keys(validators).forEach(function (fieldName) {
    const field = form.elements[fieldName];
    if (!validateField(field) && !firstInvalid) {
      firstInvalid = field;
    }
  });
  if (firstInvalid) {
    firstInvalid.focus();
  }
  return firstInvalid === null;
}

function showSuccess(form) {
  const success = document.getElementById("form-success");
  const name = form.elements["name"].value.trim();
  const date = form.elements["pickup-date"].value;
  success.textContent = "Thank you, " + name + "! Your request for pickup on " + date + " has been received. We will email you within one business day.";
  success.hidden = false;
  success.focus();
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  document.getElementById("form-success").hidden = true;

  if (!validateForm(form)) {
    return;
  }

  // Remember the customer so the form is pre-filled next time
  saveToStorage(STORAGE_KEYS.customer, {
    name: form.elements["name"].value.trim(),
    email: form.elements["email"].value.trim()
  });
  showSuccess(form);
}

function setupFormValidation() {
  const form = document.getElementById("preorder-form");
  if (!form) {
    return;
  }

  form.setAttribute("novalidate", "");
  form.elements["pickup-date"].min = toDateInputValue(getTomorrow());
  prefillForm(form);

  Object.keys(validators).forEach(function (fieldName) {
    const field = form.elements[fieldName];
    // Check a field when the user leaves it, and re-check as they fix it
    field.addEventListener("blur", function () {
      validateField(field);
    });
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });

  form.addEventListener("submit", handleSubmit);
}

/* ---------- Start ---------- */

document.addEventListener("DOMContentLoaded", function () {
  setupPreorderFeature();
  setupFormValidation();
});
