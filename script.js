const body = document.body;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navBackdrop = document.querySelector(".nav-backdrop");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const sectionLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
const scrollTopButton = document.getElementById("scroll-top-button");
const cookieBanner = document.getElementById("cookie-banner");
const cookieDismiss = document.getElementById("cookie-dismiss");
const form = document.getElementById("contact-form");
const successMessage = document.getElementById("form-success");
const faqCards = Array.from(document.querySelectorAll(".faq-card"));
const observedSections = navLinks
  .map((link) => document.getElementById(link.dataset.section))
  .filter(Boolean);

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

window.scrollTo(0, 0);

const toggleMenu = (open) => {
  const shouldOpen = typeof open === "boolean" ? open : !body.classList.contains("menu-open");
  body.classList.toggle("menu-open", shouldOpen);
  if (navToggle) {
    navToggle.setAttribute("aria-expanded", String(shouldOpen));
    navToggle.setAttribute("aria-label", shouldOpen ? "Sluit menu" : "Open menu");
  }
};

if (navToggle) {
  navToggle.addEventListener("click", () => toggleMenu());
}

if (navBackdrop) {
  navBackdrop.addEventListener("click", () => toggleMenu(false));
}

const clearHash = () => {
  const nextUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", nextUrl);
};

if (window.location.hash) {
  clearHash();
}

const scrollToTop = () => {
  toggleMenu(false);
  clearHash();
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

if (scrollTopButton) {
  scrollTopButton.addEventListener("click", scrollToTop);
}

sectionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") {
      return;
    }

    if (targetId === "#top") {
      event.preventDefault();
      scrollToTop();
      return;
    }

    const target = document.querySelector(targetId);
    if (!(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    toggleMenu(false);
    clearHash();
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleMenu(false);
  }
});

const setActiveNavLink = (activeId = "") => {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.section === activeId);
  });
};

const updateActiveNavLink = () => {
  const headerOffset = header ? header.offsetHeight : 0;
  const activationLine = headerOffset + 72;
  const activeSection = observedSections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= activationLine && rect.bottom > activationLine;
  });

  setActiveNavLink(activeSection ? activeSection.id : "");
};

const updateHeaderState = () => {
  const isScrolled = window.scrollY > 12;
  header.classList.toggle("is-scrolled", isScrolled);

  if (scrollTopButton) {
    scrollTopButton.classList.toggle("is-visible", window.scrollY > 240);
  }

  updateActiveNavLink();
};

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });
window.addEventListener("resize", updateHeaderState);

faqCards.forEach((card) => {
  const trigger = card.querySelector(".faq-question");
  if (!(trigger instanceof HTMLButtonElement)) {
    return;
  }

  trigger.addEventListener("click", () => {
    const isOpen = card.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });
});

const fieldConfigs = [
  {
    input: document.getElementById("naam"),
    error: document.getElementById("naam-error"),
    validate(value) {
      if (!value.trim()) {
        return "Vul je naam in.";
      }
      return "";
    }
  },
  {
    input: document.getElementById("email"),
    error: document.getElementById("email-error"),
    validate(value) {
      if (!value.trim()) {
        return "Vul je e-mailadres in.";
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value.trim())) {
        return "Geef een geldig e-mailadres op.";
      }

      return "";
    }
  },
  {
    input: document.getElementById("probleem"),
    error: document.getElementById("probleem-error"),
    validate(value) {
      if (!value.trim()) {
        return "Beschrijf kort het probleem.";
      }
      return "";
    }
  }
];

const renderFieldState = (config) => {
  const message = config.validate(config.input.value);
  config.error.textContent = message;
  config.input.setAttribute("aria-invalid", message ? "true" : "false");
  return message === "";
};

fieldConfigs.forEach((config) => {
  config.input.addEventListener("input", () => {
    renderFieldState(config);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isValid = fieldConfigs.every((config) => renderFieldState(config));
  if (!isValid) {
    successMessage.classList.remove("is-visible");
    const firstInvalid = fieldConfigs.find((config) => config.input.getAttribute("aria-invalid") === "true");
    if (firstInvalid) {
      firstInvalid.input.focus();
    }
    return;
  }

  const formData = new FormData(form);
  const lines = [
    "Nieuwe aanvraag via TECHDIRECT",
    "",
    `Naam: ${formData.get("naam") || ""}`,
    `E-mail: ${formData.get("email") || ""}`,
    `Telefoonnummer: ${formData.get("telefoon") || "Niet ingevuld"}`,
    `Gemeente: ${formData.get("gemeente") || "Niet ingevuld"}`,
    "",
    "Probleem:",
    `${formData.get("probleem") || ""}`
  ];

  const mailtoUrl = `mailto:techdirect.brasschaat@gmail.com?subject=${encodeURIComponent("Nieuwe aanvraag via TECHDIRECT")}&body=${encodeURIComponent(lines.join("\n"))}`;

  successMessage.classList.add("is-visible");
  form.reset();
  fieldConfigs.forEach((config) => {
    config.error.textContent = "";
    config.input.setAttribute("aria-invalid", "false");
  });

  window.location.href = mailtoUrl;
});

const cookieStorageKey = "techdirect-cookie-dismissed";

try {
  if (window.localStorage.getItem(cookieStorageKey) === "true") {
    cookieBanner.hidden = true;
  }
} catch (error) {
  cookieBanner.hidden = false;
}

cookieDismiss.addEventListener("click", () => {
  cookieBanner.hidden = true;
  try {
    window.localStorage.setItem(cookieStorageKey, "true");
  } catch (error) {
    /* no-op */
  }
});
