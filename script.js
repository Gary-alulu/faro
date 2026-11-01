(() => {
  "use strict";

  const body = document.body;
  const header = document.getElementById("site-header");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const navLinks = Array.from(document.querySelectorAll(".site-nav__link"));
  const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
  const dialogs = Array.from(document.querySelectorAll(".modal"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menuBreakpoint = window.matchMedia("(max-width: 1100px)");
  const openedFrom = new Map();

  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeader();

  const revealAll = () => {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  };

  // Motion animations removed for Figma compatibility
    if (reducedMotion.matches) {
      revealAll();
      return;
    }

    if (typeof window.Motion !== "undefined") {
      const { animate, inView, scroll } = window.Motion;

      inView("[data-reveal]", ({ target }) => {
        animate(
          target,
          { opacity: [0, 1], y: [20, 0] },
          { duration: 0.8, easing: [0.22, 0.61, 0.36, 1], delay: parseFloat(target.style.getPropertyValue("--delay") || "0") }
        );
      }, { margin: "-40px" });

      scroll(
        animate(".hero__media", { y: [-20, 40] }, { easing: "linear" }),
        { target: document.querySelector(".hero") }
      );

      const serviceItems = document.querySelectorAll(".service-item");
      serviceItems.forEach((item) => {
        inView(item, ({ target }) => {
          animate(
            target,
            { opacity: [0, 1], y: [30, 0] },
            { duration: 0.7, easing: [0.22, 0.61, 0.36, 1] }
          );
        }, { margin: "-50px" });
      });

      const processSteps = document.querySelectorAll(".process-step");
      processSteps.forEach((step, i) => {
        inView(step, ({ target }) => {
          animate(
            target,
            { opacity: [0, 1], y: [24, 0] },
            { duration: 0.7, delay: i * 0.1, easing: [0.22, 0.61, 0.36, 1] }
          );
        }, { margin: "-40px" });
      });
    } else if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -36px 0px"
        }
      );

      revealElements.forEach((element) => revealObserver.observe(element));
    } else {
      revealAll();
  }
})();

  const setMenuState = (isOpen) => {
    if (!menuToggle || !mobileMenu) return;

    body.classList.toggle("menu-open", isOpen);
    mobileMenu.classList.toggle("is-open", isOpen);
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    mobileMenu.inert = !isOpen;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuToggle.classList.toggle("is-active", isOpen);
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    setMenuState(true);
    window.requestAnimationFrame(() => {
      const firstLink = mobileMenu.querySelector(".mobile-menu__link");
      if (firstLink) firstLink.focus();
    });
  };

  const closeMenu = ({ returnFocus = true } = {}) => {
    if (!menuToggle || !mobileMenu) return;
    if (!body.classList.contains("menu-open")) return;
    setMenuState(false);
    if (returnFocus && menuBreakpoint.matches) {
      menuToggle.focus();
    }
  };

  if (menuToggle && mobileMenu) {
    mobileMenu.inert = true;

    menuToggle.addEventListener("click", () => {
      if (body.classList.contains("menu-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileMenu.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      const action = event.target.closest("button");
      if (!link && !action) return;
      closeMenu({ returnFocus: !action });
    });

    document.addEventListener("keydown", (event) => {
      if (!body.classList.contains("menu-open")) return;

      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = [
        menuToggle,
        ...Array.from(mobileMenu.querySelectorAll("a, button"))
      ].filter((element) => element.offsetParent !== null);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (!menuBreakpoint.matches) {
        closeMenu({ returnFocus: false });
      }
    });
  }

  const syncScrollLock = () => {
    const hasOpenDialog = Boolean(document.querySelector("dialog[open]"));
    const shouldLock = hasOpenDialog || body.classList.contains("menu-open");
    body.classList.toggle("modal-open", shouldLock && !body.classList.contains("menu-open"));
    if (!shouldLock) {
      body.classList.remove("modal-open");
    }
  };

  const focusFirstField = (dialog) => {
    const firstField = dialog.querySelector(
      "input:not([type='hidden']), select, textarea"
    );
    const target = firstField || dialog.querySelector("[data-close-dialog]");
    if (target) target.focus();
  };

  const openDialog = (dialog, opener) => {
    if (!dialog) return;

    const focusReturnTarget =
      opener && opener.closest("#mobile-menu") ? menuToggle : opener;
    openedFrom.set(dialog, focusReturnTarget || document.activeElement);

    if (body.classList.contains("menu-open")) {
      closeMenu({ returnFocus: false });
    }

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    body.classList.add("modal-open");
    window.setTimeout(() => focusFirstField(dialog), 60);
  };

  const closeDialog = (dialog) => {
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      syncScrollLock();
    }
  };

  const resetFormsInDialog = (dialog) => {
    dialog.querySelectorAll("form").forEach((form) => {
      form.reset();
      form.hidden = false;
      delete form.dataset.submitted;
    });

    dialog.querySelectorAll("[data-field]").forEach((field) => {
      field.classList.remove("is-invalid");
      const input = field.querySelector("input, select, textarea");
      const error = field.querySelector("[data-error]");
      if (input) input.removeAttribute("aria-invalid");
      if (error) error.textContent = "";
    });

    dialog.querySelectorAll("[data-success]").forEach((panel) => {
      panel.hidden = true;
    });
  };

  dialogs.forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener("close", () => {
      syncScrollLock();
      resetFormsInDialog(dialog);

      const opener = openedFrom.get(dialog);
      openedFrom.delete(dialog);

      if (opener && document.contains(opener)) {
        opener.focus();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (body.classList.contains("menu-open")) {
      const insideMenu = event.target.closest("#mobile-menu");
      const toggleButton = event.target.closest("#menu-toggle");
      if (!insideMenu && !toggleButton) closeMenu({ returnFocus: false });
    }

    const opener = event.target.closest("[data-open-dialog]");

    if (opener) {
      const dialog = document.getElementById(opener.dataset.openDialog);

      if (dialog) {
        const service = opener.dataset.service;
        const serviceSelect = dialog.querySelector("#care-type");

        if (service && serviceSelect) {
          serviceSelect.value = service;
        }

        openDialog(dialog, opener);
      }

      return;
    }

    const closer = event.target.closest("[data-close-dialog]");
    if (closer) {
      const dialog = closer.closest("dialog");
      if (dialog) closeDialog(dialog);
    }
  });

  const validators = {
    name: (value) =>
      value.trim().length >= 2 ? "" : "Please enter your full name.",
    email: (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        ? ""
        : "Please enter a valid email address.",
    phone: (value) =>
      !value.trim() || /^[+()\d\s.-]{7,}$/.test(value.trim())
        ? ""
        : "Please enter a valid phone number.",
    location: (value) =>
      value.trim().length >= 2 ? "" : "Please enter your city or area.",
    message: (value) =>
      value.trim().length >= 10
        ? ""
        : "Please share a little more (at least 10 characters)."
  };

  const clearField = (field) => {
    const input = field.querySelector("input, select, textarea");
    const error = field.querySelector("[data-error]");
    field.classList.remove("is-invalid");
    if (input) input.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  };

  const validateField = (field) => {
    const input = field.querySelector("input, select, textarea");
    const error = field.querySelector("[data-error]");
    if (!input) return true;

    const value = input.value;
    let message = "";

    if (input.required && !value.trim()) {
      message =
        input.tagName === "SELECT"
          ? "Please choose an option."
          : "This field is required.";
    } else if (value.trim() && validators[input.name]) {
      message = validators[input.name](value);
    }

    if (message) {
      field.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      if (error) error.textContent = message;
      return false;
    }

    clearField(field);
    return true;
  };

  const setupForm = (form) => {
    if (!form) return;

    const panel = form.closest(".modal__panel");
    if (!panel) return;

    const success = panel.querySelector("[data-success]");
    const fields = Array.from(form.querySelectorAll("[data-field]"));

    fields.forEach((field) => {
      const input = field.querySelector("input, select, textarea");
      const error = field.querySelector("[data-error]");
      if (!input) return;

      if (error && input.id) {
        const errorId = `${input.id}-error`;
        error.id = errorId;
        const describedBy = new Set(
          (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean)
        );
        describedBy.add(errorId);
        input.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
      }

      input.addEventListener("input", () => {
        if (field.classList.contains("is-invalid")) validateField(field);
      });

      input.addEventListener("change", () => {
        if (form.dataset.submitted === "true") validateField(field);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.dataset.submitted = "true";

      let firstInvalid = null;

      fields.forEach((field) => {
        const valid = validateField(field);
        if (!valid && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        const input = firstInvalid.querySelector("input, select, textarea");
        if (input) input.focus();
        return;
      }

      if (!success) return;

      const nameInput = form.querySelector("[name='name']");
      const fullName = nameInput ? nameInput.value.trim() : "";
      const firstName = fullName ? fullName.split(/\s+/)[0] : "friend";
      const successName = success.querySelector("[data-success-name]");
      const successHeading = success.querySelector("[data-success-heading]");

      if (successName) successName.textContent = firstName;

      form.hidden = true;
      success.hidden = false;

      if (successHeading) successHeading.focus();
    });
  };

  document.querySelectorAll(".form").forEach(setupForm);

  const faqItems = Array.from(document.querySelectorAll(".faq-item"));

  const syncFaqState = (item, isOpen) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (question) question.setAttribute("aria-expanded", String(isOpen));
    if (answer) answer.setAttribute("aria-hidden", String(!isOpen));
  };

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (!question) return;

    syncFaqState(item, item.classList.contains("is-open"));

    question.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");

      faqItems.forEach((otherItem) => {
        if (otherItem === item) return;
        otherItem.classList.remove("is-open");
        syncFaqState(otherItem, false);
      });

      item.classList.toggle("is-open", willOpen);
      syncFaqState(item, willOpen);
    });
  });

  const spySections = ["home", "services", "how-it-works", "about-faro", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let activeSection = "";

  const updateActiveNav = () => {
    if (!spySections.length) return;

    const headerOffset = header ? header.offsetHeight : 0;
    const scrollPoint = window.scrollY + headerOffset + 90;
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;

    let current = spySections[0].id;

    spySections.forEach((section) => {
      if (section.offsetTop <= scrollPoint) current = section.id;
    });

    if (atBottom) current = "contact";
    if (current === activeSection) return;

    activeSection = current;

    navLinks.forEach((link) => {
      const isActive = link.dataset.section === current;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  let scrollTicking = false;

  const handleScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;

    window.requestAnimationFrame(() => {
      updateHeader();
      updateActiveNav();
      scrollTicking = false;
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", updateActiveNav);
  window.addEventListener("load", updateActiveNav);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateActiveNav);
  }

  updateActiveNav();
})();
