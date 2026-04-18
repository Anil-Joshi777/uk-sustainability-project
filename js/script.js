(function () {
  const root = document.documentElement;

  function initThemeToggle() {
    const themeBtn = document.getElementById("theme-toggle");
    if (!themeBtn) return;

    const storedTheme = localStorage.getItem("preferred-theme");
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (systemPrefersDark ? "dark" : "light");

    function applyTheme(theme) {
      root.setAttribute("data-theme", theme);
      localStorage.setItem("preferred-theme", theme);
      const isDark = theme === "dark";
      themeBtn.setAttribute("aria-pressed", String(isDark));
      themeBtn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      themeBtn.textContent = isDark ? "Light" : "Dark";
    }

    applyTheme(initialTheme);

    themeBtn.addEventListener("click", function () {
      const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  function initMobileNav() {
    const nav = document.querySelector("nav[aria-label='Main navigation']");
    if (!nav) return;

    const toggleBtn = nav.querySelector(".nav-toggle");
    const links = nav.querySelectorAll("a");
    if (!toggleBtn) return;

    function setOpen(isOpen) {
      nav.classList.toggle("open", isOpen);
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
      toggleBtn.textContent = isOpen ? "Close Menu" : "Menu";
    }

    toggleBtn.addEventListener("click", function () {
      const isOpen = nav.classList.contains("open");
      setOpen(!isOpen);
    });

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 679) {
          setOpen(false);
        }
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 679) {
        setOpen(false);
      }
    });

    setOpen(false);
  }

  function initFontControls() {
    const up = document.querySelector("[data-font='up']");
    const down = document.querySelector("[data-font='down']");
    const defaultBtn = document.querySelector("[data-font='default']");
    const saved = localStorage.getItem("preferred-font-scale");

    if (saved) {
      root.style.fontSize = `${saved}%`;
    }

    function setScale(next) {
      const clamped = Math.min(120, Math.max(90, next));
      root.style.fontSize = `${clamped}%`;
      localStorage.setItem("preferred-font-scale", String(clamped));
    }

    up && up.addEventListener("click", function () {
      setScale(parseInt(getComputedStyle(root).fontSize, 10) / 16 * 100 + 5);
    });

    down && down.addEventListener("click", function () {
      setScale(parseInt(getComputedStyle(root).fontSize, 10) / 16 * 100 - 5);
    });

    defaultBtn && defaultBtn.addEventListener("click", function () {
      setScale(100);
    });
  }

  function initRevealAnimations() {
    const revealEls = document.querySelectorAll(".reveal");
    if (!revealEls.length || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initAccordion() {
    const triggers = document.querySelectorAll(".accordion-trigger");
    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        const item = trigger.closest(".accordion-item");
        if (!item) return;
        const expanded = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", String(!expanded));
        item.classList.toggle("open", !expanded);
      });

      trigger.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          trigger.click();
        }
      });
    });
  }

  function initTabs() {
    const tabButtons = document.querySelectorAll("[role='tab']");
    if (!tabButtons.length) return;

    function activateTab(button) {
      const tabList = button.closest(".tab-list");
      if (!tabList) return;
      const container = tabList.parentElement;
      const tabs = tabList.querySelectorAll("[role='tab']");
      const activePanelId = button.getAttribute("aria-controls");
      const panels = container.querySelectorAll("[role='tabpanel']");

      tabs.forEach(function (tab) {
        const isActive = tab === button;
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach(function (panel) {
        panel.hidden = panel.id !== activePanelId;
      });

      window.dispatchEvent(new CustomEvent("initiative-tab-activated", { detail: { panelId: activePanelId } }));
    }

    tabButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activateTab(button);
      });

      button.addEventListener("keydown", function (event) {
        const list = button.closest(".tab-list");
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll("[role='tab']"));
        const index = tabs.indexOf(button);
        let target = null;

        if (event.key === "ArrowRight") {
          target = tabs[(index + 1) % tabs.length];
        }
        if (event.key === "ArrowLeft") {
          target = tabs[(index - 1 + tabs.length) % tabs.length];
        }

        if (target) {
          event.preventDefault();
          target.focus();
          activateTab(target);
        }
      });
    });
  }

  function initPledgeForm() {
    const form = document.getElementById("pledge-form");
    if (!form) return;

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const goalInput = document.getElementById("goal");
    const updatesInput = document.getElementById("updates");
    const resetBtn = document.getElementById("reset-pledge");
    const statusBox = document.getElementById("form-status");

    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const goalError = document.getElementById("goal-error");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function showError(el, msg) {
      if (el) el.textContent = msg;
    }

    function clearError(el) {
      if (el) el.textContent = "";
    }

    function validateName() {
      if (!nameInput.value.trim()) {
        showError(nameError, "Please enter your name.");
        return false;
      }
      clearError(nameError);
      return true;
    }

    function validateEmail() {
      const value = emailInput.value.trim();
      if (!value) {
        showError(emailError, "Please enter your email.");
        return false;
      }
      if (!emailRegex.test(value)) {
        showError(emailError, "Please enter a valid email.");
        return false;
      }
      clearError(emailError);
      return true;
    }

    function validateGoal() {
      if (!goalInput.value) {
        showError(goalError, "Please select a pledge goal.");
        return false;
      }
      clearError(goalError);
      return true;
    }

    nameInput.addEventListener("input", validateName);
    emailInput.addEventListener("input", validateEmail);
    goalInput.addEventListener("change", validateGoal);

    resetBtn && resetBtn.addEventListener("click", function () {
      clearError(nameError);
      clearError(emailError);
      clearError(goalError);
      statusBox.textContent = "";
      statusBox.className = "small";
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const valid = [validateName(), validateEmail(), validateGoal()].every(Boolean);
      if (!valid) {
        statusBox.textContent = "Please fix form errors before submitting.";
        statusBox.className = "error";
        return;
      }

      const selectedGoal = goalInput.options[goalInput.selectedIndex].text;
      const updatesMessage = updatesInput && updatesInput.checked
        ? "We'll send you updates soon."
        : "You chose not to receive updates right now.";

      form.reset();
      clearError(nameError);
      clearError(emailError);
      clearError(goalError);
      statusBox.textContent = `Thank you for your pledge! You've committed to ${selectedGoal}. ${updatesMessage}`;
      statusBox.className = "confirmation";
    });
  }

  function initInitiativeCharts() {
    if (typeof window.Chart === "undefined") return;

    const chartConfigs = {
      "panel-emissions": {
        type: "line",
        data: {
          labels: ["2018", "2019", "2020", "2021", "2022", "2023"],
          datasets: [{
            label: "UK carbon emissions (index)",
            data: [100, 96, 90, 88, 84, 79],
            borderColor: "#2e7d32",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            tension: 0.35,
            fill: true,
            pointRadius: 4
          }]
        }
      },
      "panel-renewables": {
        type: "bar",
        data: {
          labels: ["2018", "2019", "2020", "2021", "2022", "2023"],
          datasets: [{
            label: "Renewable share of electricity (%)",
            data: [33, 37, 40, 41, 43, 46],
            backgroundColor: ["#a5d6a7", "#81c784", "#66bb6a", "#4caf50", "#43a047", "#2e7d32"]
          }]
        }
      },
      "panel-recycling-data": {
        type: "doughnut",
        data: {
          labels: ["Recycled", "Not recycled"],
          datasets: [{
            label: "Household waste split",
            data: [44, 56],
            backgroundColor: ["#4caf50", "#d0dfd3"]
          }]
        }
      }
    };

    const renderedCharts = {};

    function createChart(panelId) {
      if (renderedCharts[panelId] || !chartConfigs[panelId]) return;
      const canvas = document.querySelector(`#${panelId} canvas`);
      if (!canvas) return;

      renderedCharts[panelId] = new window.Chart(canvas.getContext("2d"), {
        ...chartConfigs[panelId],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "nearest",
            intersect: false
          },
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true }
          }
        }
      });
    }

    const activePanel = document.querySelector(".tab-panel:not([hidden])");
    if (activePanel) createChart(activePanel.id);

    window.addEventListener("initiative-tab-activated", function (event) {
      if (!event.detail || !event.detail.panelId) return;
      createChart(event.detail.panelId);
    });
  }

  function initResourceSearch() {
    const searchInput = document.getElementById("resource-search");
    const items = document.querySelectorAll(".resource-item");
    if (!searchInput || !items.length) return;

    searchInput.addEventListener("input", function () {
      const term = searchInput.value.trim().toLowerCase();
      items.forEach(function (item) {
        const text = item.textContent.toLowerCase();
        item.hidden = term ? !text.includes(term) : false;
      });
    });
  }

  initThemeToggle();
  initMobileNav();
  initFontControls();
  initRevealAnimations();
  initAccordion();
  initTabs();
  initPledgeForm();
  initInitiativeCharts();
  initResourceSearch();
})();

// interaction refinement checkpoint 1

// interaction refinement checkpoint 6

// interaction refinement checkpoint 9

// interaction refinement checkpoint 14

// interaction refinement checkpoint 17
