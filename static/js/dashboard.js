/**
 * dashboard.js
 * ============
 * Dashboard-specific JavaScript for the Placement Prediction System.
 *
 * Features:
 * - Chart.js integration (model comparison, placement distribution)
 * - Tab switching with smooth transitions
 * - Plot image lazy loading
 * - History table interactions
 * - Real-time model status check via API
 * - Responsive sidebar toggling
 *
 * @version 1.0.0
 */

"use strict";

/* ─────────────────────────────────────────────────────────────
   CHART.JS DEFAULT CONFIGURATION
   ───────────────────────────────────────────────────────────── */

const CHART_DEFAULTS = {
  font: {
    family: "'Inter', -apple-system, sans-serif",
    size: 12
  },
  color: "#94a3b8",
  plugins: {
    legend: {
      labels: {
        color: "#94a3b8",
        font: { family: "'Inter', sans-serif", size: 11 },
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 8
      }
    },
    tooltip: {
      backgroundColor: "#1c2535",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      titleColor: "#f0f4ff",
      bodyColor: "#94a3b8",
      padding: 12,
      cornerRadius: 10,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
      ticks: { color: "#5a6a85", font: { size: 11 } }
    },
    y: {
      grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
      ticks: { color: "#5a6a85", font: { size: 11 } }
    }
  }
};

// Apply defaults
if (typeof Chart !== "undefined") {
  Chart.defaults.font.family = CHART_DEFAULTS.font.family;
  Chart.defaults.color = CHART_DEFAULTS.color;
}

/* ─────────────────────────────────────────────────────────────
   CHART PALETTE
   ───────────────────────────────────────────────────────────── */

const PALETTE = {
  primary:   "#4361ee",
  secondary: "#f72585",
  accent:    "#4cc9f0",
  green:     "#06d6a0",
  yellow:    "#ffd166",
  purple:    "#7209b7",
  orange:    "#ef476f",
  teal:      "#06d6a0"
};

const PALETTE_ARRAY = Object.values(PALETTE);

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─────────────────────────────────────────────────────────────
   INITIALIZATION
   ───────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
  initDashboardCharts();
  initTabSwitching();
  initSidebarHighlight();
  initPlotLazyLoad();
  initHistoryTable();
  initStatCardAnimations();
  checkModelStatus();
  initNavbarScroll();
});

/* ─────────────────────────────────────────────────────────────
   DASHBOARD CHARTS
   ───────────────────────────────────────────────────────────── */

function initDashboardCharts() {
  const chartDataEl = document.getElementById("chartDataJson");
  if (!chartDataEl) return;

  let chartData;
  try {
    chartData = JSON.parse(chartDataEl.textContent || "{}");
  } catch (e) {
    console.warn("Failed to parse chart data:", e);
    return;
  }

  if (chartData.labels && chartData.labels.length > 0) {
    renderAccuracyChart(chartData);
    renderRadarChart(chartData);
    renderMetricBarChart(chartData);
    renderPlacementDonutChart();
  }
}

/**
 * Horizontal bar chart: Model Accuracy Comparison
 */
function renderAccuracyChart(data) {
  const canvas = document.getElementById("accuracyChart");
  if (!canvas) return;

  const colors = data.labels.map((_, i) => PALETTE_ARRAY[i % PALETTE_ARRAY.length]);
  const bgColors = colors.map((c) => hexToRgba(c, 0.75));

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [{
        label: "Accuracy (%)",
        data: data.accuracy || [],
        backgroundColor: bgColors,
        borderColor: colors,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.raw.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          ...CHART_DEFAULTS.scales.x,
          min: 0,
          max: 100,
          ticks: {
            ...CHART_DEFAULTS.scales.x.ticks,
            callback: (v) => `${v}%`
          }
        },
        y: { ...CHART_DEFAULTS.scales.y }
      }
    }
  });
}

/**
 * Radar chart: Multi-metric comparison
 */
function renderRadarChart(data) {
  const canvas = document.getElementById("radarChart");
  if (!canvas) return;

  const metricKeys = ["accuracy", "precision", "recall", "f1", "roc_auc"];
  const metricLabels = ["Accuracy", "Precision", "Recall", "F1 Score", "ROC AUC"];

  const datasets = data.labels.slice(0, 5).map((label, i) => {
    const color = PALETTE_ARRAY[i % PALETTE_ARRAY.length];
    return {
      label,
      data: metricKeys.map((k) => (data[k] ? data[k][i] : 0)),
      backgroundColor: hexToRgba(color, 0.12),
      borderColor: color,
      borderWidth: 2,
      pointBackgroundColor: color,
      pointBorderColor: "#fff",
      pointBorderWidth: 1.5,
      pointRadius: 4
    };
  });

  new Chart(canvas, {
    type: "radar",
    data: { labels: metricLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: "easeOutQuart" },
      plugins: {
        legend: {
          ...CHART_DEFAULTS.plugins.legend,
          position: "bottom"
        },
        tooltip: CHART_DEFAULTS.plugins.tooltip
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            color: "#5a6a85",
            font: { size: 10 },
            backdropColor: "transparent",
            callback: (v) => `${v}%`
          },
          grid: { color: "rgba(255,255,255,0.06)" },
          pointLabels: {
            color: "#94a3b8",
            font: { size: 11, family: "'Inter', sans-serif" }
          },
          angleLines: { color: "rgba(255,255,255,0.06)" }
        }
      }
    }
  });
}

/**
 * Grouped bar chart: All metrics side-by-side
 */
function renderMetricBarChart(data) {
  const canvas = document.getElementById("metricsBarChart");
  if (!canvas) return;

  const metricKeys   = ["accuracy", "precision", "recall", "f1", "roc_auc", "cv_score"];
  const metricLabels = ["Accuracy", "Precision", "Recall", "F1 Score", "ROC AUC", "CV Score"];
  const metricColors = [
    PALETTE.primary, PALETTE.secondary, PALETTE.accent,
    PALETTE.green,   PALETTE.yellow,    PALETTE.purple
  ];

  const datasets = metricKeys.map((key, i) => ({
    label: metricLabels[i],
    data: data[key] || [],
    backgroundColor: hexToRgba(metricColors[i], 0.75),
    borderColor: metricColors[i],
    borderWidth: 1.5,
    borderRadius: 4,
    borderSkipped: false
  }));

  new Chart(canvas, {
    type: "bar",
    data: { labels: data.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: {
          ...CHART_DEFAULTS.plugins.legend,
          position: "top"
        },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          ...CHART_DEFAULTS.scales.x,
          ticks: {
            ...CHART_DEFAULTS.scales.x.ticks,
            maxRotation: 30,
            minRotation: 20
          }
        },
        y: {
          ...CHART_DEFAULTS.scales.y,
          min: 0,
          max: 100,
          ticks: {
            ...CHART_DEFAULTS.scales.y.ticks,
            callback: (v) => `${v}%`
          }
        }
      }
    }
  });
}

/**
 * Doughnut chart: Placement distribution
 */
function renderPlacementDonutChart() {
  const canvas = document.getElementById("placementDonutChart");
  if (!canvas) return;

  const placed    = parseInt(canvas.getAttribute("data-placed") || "0");
  const notPlaced = parseInt(canvas.getAttribute("data-not-placed") || "0");

  if (placed + notPlaced === 0) return;

  const placedPct    = ((placed / (placed + notPlaced)) * 100).toFixed(1);
  const notPlacedPct = (100 - parseFloat(placedPct)).toFixed(1);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: [`Placed (${placedPct}%)`, `Not Placed (${notPlacedPct}%)`],
      datasets: [{
        data: [placed, notPlaced],
        backgroundColor: [
          hexToRgba(PALETTE.primary, 0.85),
          hexToRgba(PALETTE.secondary, 0.85)
        ],
        borderColor: ["#0a0e1a", "#0a0e1a"],
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      cutout: "70%",
      plugins: {
        legend: {
          ...CHART_DEFAULTS.plugins.legend,
          position: "bottom"
        },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} students`
          }
        }
      }
    }
  });

  // Center text plugin
  renderDonutCenterText(canvas, placed, placed + notPlaced, placedPct);
}

function renderDonutCenterText(canvas, placed, total, pct) {
  const ctx = canvas.getContext("2d");
  const originalDraw = Chart.getChart(canvas)?.draw;

  Chart.register({
    id: "donutCenterText",
    afterDraw(chart) {
      if (chart.canvas !== canvas) return;
      const { width, height, ctx: context } = chart;
      context.save();
      context.font = `800 ${Math.min(width, height) * 0.12}px 'Outfit', sans-serif`;
      context.fillStyle = "#f0f4ff";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`${pct}%`, width / 2, height / 2 - 10);
      context.font = `500 ${Math.min(width, height) * 0.07}px 'Inter', sans-serif`;
      context.fillStyle = "#5a6a85";
      context.fillText("Placed", width / 2, height / 2 + 14);
      context.restore();
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   TAB SWITCHING
   ───────────────────────────────────────────────────────────── */

function initTabSwitching() {
  const tabs = document.querySelectorAll(".dashboard-tab");
  const panels = document.querySelectorAll(".dashboard-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");

      // Remove active from all
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      // Hide all panels, show target
      panels.forEach((p) => {
        if (p.id === targetId) {
          p.style.display = "block";
          p.style.animation = "fadeInUp 0.3s ease forwards";
        } else {
          p.style.display = "none";
        }
      });

      // Update sidebar active link
      const sidebarLink = document.querySelector(
        `.sidebar-nav-item[data-tab="${targetId}"]`
      );
      if (sidebarLink) {
        document.querySelectorAll(".sidebar-nav-item").forEach((l) =>
          l.classList.remove("active")
        );
        sidebarLink.classList.add("active");
      }
    });
  });

  // Sidebar links trigger tabs
  document.querySelectorAll(".sidebar-nav-item[data-tab]").forEach((link) => {
    link.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");
      const tab = document.querySelector(`.dashboard-tab[data-target="${tabId}"]`);
      if (tab) tab.click();
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR ACTIVE STATE
   ───────────────────────────────────────────────────────────── */

function initSidebarHighlight() {
  const currentPath = window.location.pathname;
  document.querySelectorAll(".sidebar-nav-item[href]").forEach((link) => {
    if (link.href && link.href.includes(currentPath)) {
      link.classList.add("active");
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   PLOT LAZY LOADING
   ───────────────────────────────────────────────────────────── */

function initPlotLazyLoad() {
  const plotImages = document.querySelectorAll("img[data-lazy-src]");
  if (plotImages.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute("data-lazy-src");
          img.removeAttribute("data-lazy-src");
          img.classList.add("loaded");
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: "200px 0px", threshold: 0.01 }
  );

  plotImages.forEach((img) => observer.observe(img));
}

/* ─────────────────────────────────────────────────────────────
   HISTORY TABLE
   ───────────────────────────────────────────────────────────── */

function initHistoryTable() {
  const clearBtn = document.getElementById("clearHistoryBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to clear all prediction history?")) {
        document.getElementById("clearHistoryForm")?.submit();
      }
    });
  }
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD ANIMATIONS
   ───────────────────────────────────────────────────────────── */

function initStatCardAnimations() {
  // Animate stat bars
  const bars = document.querySelectorAll(".stat-card-bar-fill");
  bars.forEach((bar) => {
    const targetWidth = bar.getAttribute("data-width") || "0%";
    requestAnimationFrame(() => {
      setTimeout(() => {
        bar.style.width = targetWidth;
      }, 200);
    });
  });

  // Animate count-up numbers
  const countEls = document.querySelectorAll("[data-count-up]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  countEls.forEach((el) => observer.observe(el));
}

function animateCounter(el) {
  const target   = parseFloat(el.getAttribute("data-count-up")) || 0;
  const duration = parseInt(el.getAttribute("data-duration"))   || 1200;
  const suffix   = el.getAttribute("data-suffix")               || "";
  const decimals = target % 1 !== 0 ? 1 : 0;
  const start    = performance.now();

  const update = (timestamp) => {
    const elapsed  = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);

    el.textContent = (target * eased).toFixed(decimals) + suffix;

    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toFixed(decimals) + suffix;
  };

  requestAnimationFrame(update);
}

/* ─────────────────────────────────────────────────────────────
   MODEL STATUS API CHECK
   ───────────────────────────────────────────────────────────── */

function checkModelStatus() {
  fetch("/api/status")
    .then((res) => res.json())
    .then((data) => {
      const statusEl = document.getElementById("modelStatusBadge");
      if (!statusEl) return;

      if (data.model_ready) {
        statusEl.innerHTML = `
          <span class="live-indicator">
            <span class="live-dot"></span>
            Model Ready
          </span>
        `;
      } else {
        statusEl.innerHTML = `
          <span style="color:var(--secondary); font-size:0.78rem; font-weight:600;">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>Model Not Trained
          </span>
        `;
      }
    })
    .catch(() => {
      // Silently fail; no status badge update
    });
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR SCROLL (SHARED)
   ───────────────────────────────────────────────────────────── */

function initNavbarScroll() {
  const navbar = document.querySelector(".navbar-custom");
  if (!navbar) return;

  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    },
    { passive: true }
  );
}

/* ─────────────────────────────────────────────────────────────
   PLOT MODAL (CLICK TO EXPAND)
   ───────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
  const plotImages = document.querySelectorAll(".plot-panel img, .plot-card img");

  plotImages.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", function () {
      openImageModal(this.src, this.alt || "Chart");
    });
  });
});

function openImageModal(src, title) {
  // Create modal
  let modal = document.getElementById("plotModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "plotModal";
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9998;
      background: rgba(10,14,26,0.92); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      padding: 2rem; animation: fadeIn 0.2s ease;
    `;
    modal.innerHTML = `
      <div style="max-width:900px; width:100%; position:relative;">
        <button id="plotModalClose"
          style="position:absolute; top:-40px; right:0; background:none; border:none;
                 color:#94a3b8; font-size:1.5rem; cursor:pointer; line-height:1;"
          aria-label="Close">
          <i class="bi bi-x-lg"></i>
        </button>
        <p id="plotModalTitle" style="color:#f0f4ff; font-weight:600; margin-bottom:0.75rem; font-size:0.95rem;"></p>
        <img id="plotModalImg" style="width:100%; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,0.5);" src="" alt="" />
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("plotModalClose").addEventListener("click", closePlotModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closePlotModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePlotModal(); });
  }

  document.getElementById("plotModalImg").src = src;
  document.getElementById("plotModalTitle").textContent = title;
  modal.style.display = "flex";
}

function closePlotModal() {
  const modal = document.getElementById("plotModal");
  if (modal) {
    modal.style.animation = "fadeOut 0.2s ease forwards";
    setTimeout(() => { modal.style.display = "none"; }, 200);
  }
}

/* ─────────────────────────────────────────────────────────────
   RESULT PAGE: ANIMATED PROBABILITY RINGS
   ───────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
  const rings = document.querySelectorAll(".animated-ring");
  rings.forEach((ring) => {
    const targetDash = ring.getAttribute("data-dash");
    const targetGap  = ring.getAttribute("data-gap");
    if (!targetDash || !targetGap) return;

    // Animate with a slight delay
    setTimeout(() => {
      ring.style.transition = "stroke-dasharray 1.2s ease-out";
      ring.style.strokeDasharray = `${targetDash} ${targetGap}`;
    }, 300);
  });
});

/* ─────────────────────────────────────────────────────────────
   EXPORT FUNCTIONS
   ───────────────────────────────────────────────────────────── */

window.openImageModal   = openImageModal;
window.closePlotModal   = closePlotModal;
window.checkModelStatus = checkModelStatus;
