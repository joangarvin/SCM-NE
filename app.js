// Agentes de la red: identificador interno, nombre visible e icono SVG.
const roles = [
  [
    "central",
    "Zara Central",
    "M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6M9 18h6",
  ],
  [
    "fabric",
    "Proveedores de telas",
    "M4 5h13a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3V5Zm0 0a3 3 0 0 1 6 0v12a3 3 0 0 0-6 0M10 8h10",
  ],
  [
    "cut",
    "Fábricas de corte",
    "m20 4-9 9m9 7L11 11M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  ],
  [
    "sew",
    "Talleres de confección",
    "M3 19h18M5 15V7h10l3 4v4H5Zm5-8V4h5v3M8 15v4m9-4v4",
  ],
  [
    "store",
    "Tienda Tokio",
    "M3 10h18M5 10v11h14V10M3 10l2-7h14l2 7M9 21v-7h6v7",
  ],
];

// La vista y los campos temporales se guardan en memoria; los hitos se recuperan del navegador.
let role = "central",
  tab = "operation";
const ui = {
  complete: false,
  labels: false,
  mino: "720",
  lima: "480",
  forecast: "1800",
  lot: "TM",
};
let state;
try {
  state = JSON.parse(localStorage.getItem("zara-scm-demo-v1")) || {};
} catch {
  state = {};
}
state = {
  fabric: false,
  cut: false,
  sew: false,
  finished: false,
  shipped: false,
  hubReceived: false,
  delivered: false,
  plan: false,
  ...state,
};
if (state.shipped) state.finished = true;
if (state.delivered) state.hubReceived = true;
const $ = (s) => document.querySelector(s);
const euro = (v) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
const pill = (s, c = "") => `<span class="pill ${c}">${s}</span>`;
// Avisos temporales: se pueden cerrar con el botón o con Escape.
function dismissToast() {
  clearTimeout(window.toastTimer);
  $("#toast").classList.remove("visible");
}
function notify(s) {
  $("#toast-message").textContent = s;
  $("#toast").classList.add("visible");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(dismissToast, 6000);
}
// Persiste los hitos; si el navegador bloquea el almacenamiento, la sesión sigue funcionando.
function save() {
  try {
    localStorage.setItem("zara-scm-demo-v1", JSON.stringify(state));
  } catch {
    notify(
      "Cambios aplicados. El navegador no permite guardarlos al cerrar esta pestaña.",
    );
  }
}
// Componentes HTML compartidos por las vistas de operación.
function metrics(items) {
  return `<div class="metrics">${items.map((i) => `<div class="metric"><small>${i[0]}</small><strong>${i[1]}</strong><em>${i[2]}</em></div>`).join("")}</div>`;
}
function panel(title, body, extra = "") {
  return `<section class="panel"><div class="panel-head"><h2>${title}</h2>${extra}</div>${body}</section>`;
}
function table(head, rows) {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Tabla de datos; desplázate para ver todas las columnas"><table><thead><tr>${head.map((x) => `<th scope="col">${x}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
const row = (a, b) =>
  `<div class="row"><span>${a}</span><strong>${b}</strong></div>`;
// Datos ilustrativos del pedido: la recomendación no modifica el volumen total.
const sizeNames = ["XS", "S", "M", "L", "XL"];
const requestedCurve = [100, 300, 450, 240, 110];
const recommendedCurve = [84, 324, 456, 228, 108];
const curveTotal = 1200;
let curveDraft = null;
const units = (n) => n.toLocaleString("es-ES", { useGrouping: "always" });
const curvePercent = (n) =>
  `${((n / curveTotal) * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`;
const validCurve = (values) =>
  Array.isArray(values) &&
  values.length === 5 &&
  values.every((n) => Number.isInteger(n) && n >= 0 && n <= curveTotal) &&
  values.reduce((a, b) => a + b, 0) === curveTotal;
function currentCurve() {
  return validCurve(state.sizeCurve?.values)
    ? state.sizeCurve.values
    : requestedCurve;
}
function curveSource() {
  return (
    {
      store: "Curva de la tienda",
      history: "Curva recomendada",
      manual: "Ajuste manual",
    }[state.sizeCurve?.source] || "Curva de la tienda · pendiente de decisión"
  );
}
function sizes(values = currentCurve(), percentages = false) {
  return `<div class="sizes curve-sizes">${sizeNames.map((name, i) => `<div>${name}<strong>${percentages ? curvePercent(values[i]) : units(values[i])}</strong></div>`).join("")}</div>`;
}

// Reparto por restos mayores: conserva 720/480 unidades y el total de cada talla.
function workshopCurves() {
  const values = currentCurve();
  const first = values.map((n) => Math.floor(n * 0.6));
  const priority = values
    .map((n, i) => ({ i, rest: (n * 6) % 10 }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i);
  const remaining = 720 - first.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) first[priority[i].i]++;
  return [first, values.map((n, i) => n - first[i])];
}
function curveDistribution(values) {
  return sizeNames.map((name, i) => `${name} ${units(values[i])}`).join(" · ");
}
function confirmedCurveCard() {
  return panel(
    "Curva de tallas confirmada",
    `<p class="legend">Tokio · ${curveSource()} · Datos ilustrativos</p>${sizes(currentCurve(), true)}<div class="note">Los metros cuadrados requeridos se calculan a partir de esta curva.</div>`,
  );
}
function cuttingCurve() {
  const reinforced =
    currentCurve()[1] > requestedCurve[1] &&
    currentCurve()[2] > requestedCurve[2];
  return `<div class="curve-cut"><h3>Curva confirmada</h3><p class="legend">${curveSource()} · Datos ilustrativos · unidades de juego por talla</p>${sizes()}<div class="note">${reinforced ? "Marcada optimizada para curva S/M reforzada." : "Las marcadas se planifican a partir de la curva confirmada."}</div></div>`;
}
function curveEditor() {
  if (!curveDraft) return "";
  return `<form id="curve-editor" class="curve-editor" novalidate aria-labelledby="curve-editor-title">
    <h3 id="curve-editor-title">Ajustar unidades por talla</h3>
    <p class="legend" id="curve-editor-help">Introduce unidades enteras, sin valores negativos. La suma debe ser 1.200.</p>
    <div class="curve-inputs">${sizeNames.map((name, i) => `<label class="field" for="curve-${name}">${name}<input id="curve-${name}" data-curve-size="${i}" type="number" min="0" max="1200" step="1" required value="${curveDraft[i]}" aria-describedby="curve-editor-help curve-validation"></label>`).join("")}</div>
    <p id="curve-validation" class="curve-validation" role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="curve-actions"><button class="primary" type="submit">Guardar ajuste</button><button type="button" data-action="curve-cancel">Cancelar</button></div>
  </form>`;
}
function sizeCurvePanel() {
  const values = currentCurve();
  const confirmed = !!state.sizeCurve;
  const currentLabel = confirmed
    ? "Curva confirmada"
    : "Solicitada por la tienda";
  const maximum = Math.max(500, ...values, ...recommendedCurve);
  const body = `<p class="legend">Datos ilustrativos · Pedido JP-TKO-261026 · ${curveSource()}</p>
    <figure class="curve-figure">
      <figcaption class="curve-legend"><span><i class="curve-key current"></i>${currentLabel}</span><span><i class="curve-key recommended"></i>Recomendada por histórico</span></figcaption>
      <p class="legend">Unidades por talla · escala de 0 a ${units(maximum)} · detalle en la tabla inferior</p>
      <div class="curve-chart-scroll"><div class="curve-chart" aria-hidden="true">${sizeNames.map((name, i) => `<div class="curve-group"><div class="curve-bars"><div class="curve-bar-column"><span>${values[i]}</span><i class="curve-bar current" data-size-bar="${i}" style="height:${(values[i] / maximum) * 180}px"></i></div><div class="curve-bar-column"><span>${recommendedCurve[i]}</span><i class="curve-bar recommended" style="height:${(recommendedCurve[i] / maximum) * 180}px"></i></div></div><strong>${name}</strong></div>`).join("")}</div></div>
    </figure>
    ${table(
      [
        "Talla",
        confirmed ? "Confirmada" : "Solicitada",
        "Recomendada",
        "Diferencia",
        "% sobre el total<br><small>Actual / recomendada</small>",
      ],
      sizeNames
        .map((name, i) => {
          const difference = recommendedCurve[i] - values[i];
          return [
            `<strong>${name}</strong>`,
            units(values[i]),
            units(recommendedCurve[i]),
            `<span class="curve-difference ${difference > 0 ? "positive" : difference < 0 ? "negative" : ""}">${difference < 0 ? "−" : "+"}${Math.abs(difference)}</span>`,
            `${curvePercent(values[i])} / ${curvePercent(recommendedCurve[i])}`,
          ];
        })
        .concat([
          [
            "<strong>Total</strong>",
            "<strong>1.200</strong>",
            "<strong>1.200</strong>",
            "+0",
            "100 % / 100 %",
          ],
        ]),
    )}
    <p class="legend curve-table-note">Diferencia = recomendada − ${confirmed ? "confirmada" : "solicitada"}. Los porcentajes se calculan sobre las 1.200 unidades.</p>
    <div class="curve-summary"><dl><div><dt>Tienda</dt><dd>Tokio</dd></div><div><dt>Base del cálculo</dt><dd>Ventas de pantalones · últimas 3 temporadas</dd></div><div><dt>Nivel de confianza</dt><dd>87 %</dd></div></dl><p>El histórico sugiere reforzar S y M y reducir XS, L y XL respecto a la solicitud inicial.</p></div>
    <div class="curve-actions"><button class="primary" data-action="curve-accept" aria-pressed="${state.sizeCurve?.source === "history"}">Aceptar curva recomendada</button><button data-action="curve-store" aria-pressed="${state.sizeCurve?.source === "store"}">Mantener curva de la tienda</button><button data-action="curve-manual" aria-expanded="${!!curveDraft}" aria-controls="curve-editor">Ajustar manualmente</button></div>
    <p class="curve-feedback" role="status" aria-live="polite" aria-atomic="true">${confirmed ? '<span class="pill">✓ Curva actualizada</span> ' + curveSource() + " · 1.200 unidades" : "La curva de la tienda se utiliza hasta confirmar una decisión."}</p>
    ${curveEditor()}`;
  return `<div class="size-curve-comparison">${panel("Curva de tallas: solicitada vs. recomendada", body)}</div>`;
}

// El borrador no se comparte: solo una curva válida y confirmada llega a los agentes.
function validateCurveEditor() {
  if (!$("#curve-editor")) return false;
  let allValid = true;
  const values = sizeNames.map((name) => {
    const field = $("#curve-" + name);
    const value = Number(field.value);
    const valid =
      field.value.trim() !== "" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= curveTotal;
    field.setAttribute("aria-invalid", String(!valid));
    if (!valid) allValid = false;
    return value;
  });
  const total = values.reduce((a, b) => a + b, 0);
  const valid = allValid && total === curveTotal;
  $("#curve-validation").textContent = !allValid
    ? "Introduce una cantidad entera entre 0 y 1.200 en cada talla."
    : `Suma actual: ${units(total)} / 1.200 unidades. ${valid ? "El ajuste está listo para guardar." : "Ajusta las cantidades hasta sumar exactamente 1.200."}`;
  $("#curve-validation").classList.toggle("invalid", !valid);
  return valid;
}
function applySizeCurve(values, source) {
  if (!validCurve(values)) return;
  const previous = [...currentCurve()];
  state.sizeCurve = { values: [...values], source };
  curveDraft = null;
  save();
  render();
  // Transición breve; la preferencia de movimiento reducido evita la animación.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const maximum = Math.max(500, ...values, ...recommendedCurve);
    document.querySelectorAll("[data-size-bar]").forEach((bar) => {
      const i = Number(bar.dataset.sizeBar);
      bar.animate(
        [
          { height: `${(previous[i] / maximum) * 180}px` },
          { height: `${(values[i] / maximum) * 180}px` },
        ],
        { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      );
    });
    $(".size-curve-comparison table")?.animate(
      [{ opacity: 0.6 }, { opacity: 1 }],
      { duration: 180 },
    );
  }
  notify(
    `Curva actualizada: ${curveSource().toLowerCase()} · 1.200 unidades. Disponible para todos los agentes.`,
  );
}

// Sincroniza el agente activo, las pestañas y el estado global del pedido.
function nav() {
  if (!$("#agents").children.length)
    $("#agents").innerHTML = roles
      .map(
        (r) =>
          `<button data-role="${r[0]}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${r[2]}"/></svg><span>${r[1]}</span></button>`,
      )
      .join("");
  document.querySelectorAll("[data-role]").forEach((b) => {
    const active = tab === "operation" && role === b.dataset.role;
    b.classList.toggle("active", active);
    b.setAttribute("aria-current", active ? "page" : "false");
  });
  $("#title").textContent =
    tab === "timeline"
      ? "Trazabilidad del pedido"
      : tab === "shared"
        ? "Inteligencia compartida"
        : role === "central"
          ? "Del diseño a Tokio."
          : roles.find((r) => r[0] === role)[1];
  $("#subtitle").textContent =
    tab === "timeline"
      ? "Sigue qué recibe y qué entrega cada agente, desde el tejido hasta la tienda."
      : tab === "shared"
        ? "Previsiones, capacidad y datos compartidos por toda la red de aprovisionamiento."
        : {
            central:
              "Diseño, compras y comerciales de Arteixo coordinan el pedido.",
            fabric:
              "Reserva algodón, identifica lotes y confirma la expedición.",
            cut: "Las fábricas propias de Inditex cortan el tejido y coordinan los juegos de piezas.",
            sew: "Los talleres externos cosen las prendas y las envían a Inditex para el acabado.",
            store: "Tienda solicitante y receptora · Yukiko Tanaka · Tokio.",
          }[role];
  $("#status").textContent = state.delivered
    ? "● Entregado"
    : state.hubReceived
      ? "● Hub de Japón"
      : state.shipped
        ? "● En tránsito"
        : state.finished
          ? "● Preparación logística"
          : state.sew
            ? "● Acabado en Inditex"
            : state.cut
              ? "● Confección"
              : state.fabric
                ? "● Corte"
                : "● Aprovisionamiento";
  document.querySelectorAll("[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
    b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false");
  });
}

// Vista de Central: planificación, reparto de producción y desglose económico.
function central() {
  return (
    metrics([
      ["Volumen del pedido", "1.200 uds.", "5 tallas · un color"],
      ["Coste planificado", "17.400 €", "14,50 € / prenda"],
      ["Plazo de extremo a extremo", "14 días", "26 oct → 09 nov"],
      [
        state.plan ? "Red asignada" : "Red propuesta",
        "6 socios",
        "2 proveedores · 2 cortes · 2 talleres",
      ],
    ]) +
    `<div class="columns"><div>${scmAssignmentPanel()}${panel("Distribución por talla", sizes())}</div><div>${scmCentralIssues()}${panel("Compromiso de entrega", `<div class="eyebrow">TIENDA · TOKIO</div><h2 style="font-size:1.6rem;margin:10px 0">09 noviembre</h2><p class="legend">Aceptado el 26 oct 2026. Escenario académico de respuesta rápida.</p>${row("Acabado y control · Inditex", "04 nov")}${row("Centro logístico · A Coruña", "05 nov")}${row("Transporte + hub de reparto", "06–08 nov")}`)}${panel("Desglose de costes", row("Tejido · 1.800 m² × 4 €", "7.200 €") + row("Corte · 1.200 × 1,20 €", "1.440 €") + row("Confección · 1.200 × 3,80 €", "4.560 €") + row("Acabado y control · Inditex", "1.800 €") + row("Transporte y aduana", "2.400 €") + row("Total", "17.400 €"))}${panel("Decisión de abastecimiento", `<div class="alert"><strong>El menor precio no garantiza el plazo</strong>Algodones Sur ofrece 3,70 €/m², pero entrega el 31 oct. La opción seleccionada cuesta 540 € más y protege el inicio del corte.</div><p class="legend">La división 60 / 40 evita superar la capacidad de confección reservada.</p>`)}</div></div>`
  );
}

// Cada etapa describe responsable, entradas y salidas; done consulta los hitos guardados.
const traceStages = [
  {
    key: "accepted",
    title: "Pedido aceptado",
    owner: "Zara Central · Arteixo",
    date: "26 oct",
    input: "Nueva tendencia detectada por Yukiko en Tokio.",
    output: "Pedido JP-TKO-261026: 1.200 pantalones pirata.",
    info: "Modelo CP-026, algodón azul noche y reparto por tallas aprobados.",
    summary:
      "El diseño ya está aprobado. Este es el punto de partida del ejercicio.",
    done: () => true,
  },
  {
    key: "fabric",
    title: "Tejido preparado",
    owner: "Proveedores de telas",
    date: "27–28 oct",
    input: "Especificación de algodón y órdenes de suministro.",
    output: "1.800 m² de tejido en dos lotes para las fábricas de corte.",
    info: "Lote, composición, ancho útil, calidad y fecha de recepción: 29 oct.",
    summary:
      "Los proveedores reservan el algodón y expiden los dos lotes. Todavía no hay prendas.",
    task: "Revisa los lotes TM-261027 y AG-261028 y confirma su expedición desde la vista del proveedor.",
    action: "Ir a proveedores",
    open: "fabric",
    done: () => !!state.fabric,
  },
  {
    key: "cut",
    title: "Piezas cortadas",
    owner: "Fábricas propias de Inditex",
    date: "29–30 oct",
    input: "1.800 m² de tejido recibidos y patrones CP-026.",
    output: "1.200 juegos de 12 piezas: 14.400 piezas cortadas.",
    info: "Cada juego conserva talla, color y lote. Corte comparte instrucciones con los talleres.",
    summary:
      "Las fábricas transforman el tejido en juegos de piezas. Un juego corresponde a un pantalón.",
    task: "Comprueba que los juegos están completos y etiquetados; después registra su envío a los talleres.",
    action: "Ir a corte",
    open: "cut",
    done: () => !!state.cut,
  },
  {
    key: "sew",
    title: "Prendas cosidas",
    owner: "Talleres externos · Miño y Lima",
    date: "31 oct–03 nov",
    input: "720 juegos para Miño y 480 juegos para Lima.",
    output: "1.200 prendas cosidas, pendientes de acabado final.",
    info: "Cantidades conformes, incidencias y lote de origen. El 01 nov no se trabaja.",
    summary:
      "Los talleres cosen las piezas. El planchado y el etiquetado final se realizan después en Inditex.",
    task: "Registra 720 y 480 prendas conformes, resuelve las incidencias y envíalas a acabado.",
    action: "Ir a confección",
    open: "sew",
    done: () => !!state.sew,
  },
  {
    key: "finished",
    title: "Acabado y etiquetado",
    owner: "Fábricas de Inditex",
    date: "04 nov",
    input: "1.200 prendas cosidas procedentes de los talleres.",
    output: "1.200 prendas terminadas, planchadas y etiquetadas.",
    info: "Ficha de acabado, control de calidad y conformidad del lote.",
    summary:
      "Inditex completa el acabado, plancha, etiqueta y verifica las prendas antes de distribuirlas.",
    task: "Confirma que las 1.200 prendas han superado acabado, planchado, etiquetado y control de calidad.",
    action: "Confirmar acabado",
    command: "finish",
    done: () => !!state.finished,
  },
  {
    key: "shipped",
    title: "Salida del centro logístico",
    owner: "Centro logístico de A Coruña",
    date: "05 nov",
    input: "1.200 prendas terminadas recibidas de Inditex.",
    output: "Pedido clasificado por destino y expedido hacia Japón.",
    info: "Código de pedido, cantidades, destino, documentación y fecha prevista de llegada.",
    summary:
      "El centro logístico prepara la expedición. Es un agente distinto de la central de Arteixo.",
    task: "Confirma la recepción del lote terminado, su clasificación para Tokio y la salida de la expedición.",
    action: "Confirmar salida logística",
    command: "ship",
    done: () => !!state.shipped,
  },
  {
    key: "hubReceived",
    title: "Llegada al hub de Japón",
    owner: "Transporte y hub de reparto",
    date: "06–08 nov",
    input: "Expedición internacional desde el centro logístico.",
    output: "1.200 prendas recibidas en el hub y listas para el reparto local.",
    info: "Seguimiento del transporte, despacho aduanero y recepción de bultos.",
    summary:
      "Tras el vuelo y la aduana, el hub recibe el pedido. La tienda todavía no lo ha recibido.",
    task: "Confirma que la expedición ha llegado al hub de Japón y está preparada para su reparto a Tokio.",
    action: "Confirmar llegada al hub",
    command: "hub",
    done: () => !!state.hubReceived,
  },
  {
    key: "delivered",
    title: "Entrega en tienda",
    owner: "Tienda Zara · Tokio",
    date: "09 nov",
    input: "Pedido de 1.200 prendas enviado desde el hub.",
    output: "1.200 prendas recibidas por Yukiko Tanaka.",
    info: "Recepción por talla, posibles diferencias y ventas para futuras reposiciones.",
    summary:
      "Yukiko confirma la recepción completa. Aquí termina el recorrido de este pedido.",
    task: "Verifica que la tienda ha recibido las 1.200 prendas previstas y confirma la entrega.",
    action: "Confirmar recepción en Tokio",
    command: "deliver",
    done: () => !!state.delivered,
  },
];
let traceSelected = null,
  traceLastView = null,
  lastRenderedTab = null,
  animateInteraction = false;

// Solo cuentan los hitos consecutivos: una etapa posterior no permite saltar las anteriores.
function traceModel() {
  let count = 0;
  while (count < traceStages.length && traceStages[count].done()) count++;
  return {
    count,
    current: Math.min(count, 7),
    complete: count === 8,
    selected: traceSelected === null ? Math.min(count, 7) : traceSelected,
  };
}

// Construye el recorrido y el detalle de la etapa seleccionada, con su siguiente acción.
function timeline() {
  const m = traceModel(),
    stage = traceStages[m.selected],
    done = m.selected < m.count,
    current = !m.complete && m.selected === m.current;
  const check =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  const next = traceStages[m.current];
  return `<section class="trace-overview" aria-label="Resumen del recorrido"><div><div class="eyebrow">PEDIDO JP-TKO-261026 · 26 OCT — 09 NOV 2026</div><h2>${m.complete ? "El pedido ha llegado a Tokio." : "Siguiente hito: " + next.title.toLowerCase() + "."}</h2><p>${m.complete ? "Los ocho hitos están confirmados. Yukiko ha recibido las 1.200 prendas." : next.owner + " · " + next.date + ". Confirma cada entrega para avanzar."}</p></div><div class="trace-count"><strong>${m.count}<span> / 8</span></strong><span>hitos confirmados</span></div><div class="trace-progress" role="progressbar" aria-label="Hitos confirmados del pedido" aria-valuemin="0" aria-valuemax="8" aria-valuenow="${m.count}"><i style="transform:scaleX(${m.count / 8})"></i></div><div class="trace-summary"><span><i class="trace-dot done"></i>Confirmado</span><span><i class="trace-dot current"></i>Por confirmar ahora</span><span><i class="trace-dot"></i>Después</span><span class="trace-simulation">Simulación académica · fechas del caso</span></div></section>
 <div class="trace-layout"><section class="trace-map" aria-labelledby="trace-map-title"><div class="trace-map-heading"><h2 id="trace-map-title">Recorrido del pedido</h2><p>Selecciona una etapa para ver qué se entrega.<span class="trace-mobile-hint">Desliza para recorrer las ocho etapas.</span></p></div><ol class="trace-steps">${traceStages
   .map((s, i) => {
     const status =
       i < m.count
         ? "done"
         : !m.complete && i === m.current
           ? "current"
           : "future";
     return `<li class="trace-step ${status} ${i === m.selected ? "selected" : ""}" data-index="${i}"><button data-trace-index="${i}" aria-pressed="${i === m.selected}" aria-controls="trace-detail" ${status === "current" ? 'aria-current="step"' : ""}><span class="trace-number">${status === "done" ? check : String(i + 1).padStart(2, "0")}</span><span class="trace-step-copy"><span class="trace-step-date">${s.date}</span><strong>${s.title}</strong><span class="trace-step-status">${status === "done" ? "Confirmado" : status === "current" ? "Por confirmar ahora" : "Después"}</span></span><svg class="trace-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></li>`;
   })
   .join("")}</ol></section>
 <section class="trace-detail" id="trace-detail" aria-labelledby="trace-detail-title" tabindex="-1"><div class="trace-detail-top"><span class="eyebrow">ETAPA ${String(m.selected + 1).padStart(2, "0")} / 08</span>${pill(done ? "✓ Confirmado" : current ? "Por confirmar ahora" : "Pendiente de etapas previas", done ? "" : current ? "neutral" : "neutral")}</div><h2 id="trace-detail-title">${stage.title}</h2><p class="trace-description">${stage.summary}</p><div class="trace-meta"><div><small>RESPONSABLE</small><strong>${stage.owner}</strong></div><div><small>FECHA PREVISTA</small><strong>${stage.date} 2026</strong><small>FECHA REALIZADA · CASO SIMULADO</small><strong>${scmActual(stage.key)}</strong></div></div><div class="trace-handoff"><div><span class="trace-handoff-label">RECIBE</span><p>${stage.input}</p></div><span class="trace-handoff-arrow" aria-hidden="true">↓</span><div class="trace-output"><span class="trace-handoff-label">ENTREGA</span><p>${stage.output}</p></div></div><div class="trace-info"><h3>Información que acompaña al lote</h3><p>${stage.info}</p></div>
 ${current ? `<div class="trace-next"><h3>Qué falta por confirmar</h3><p>${state.incident && stage.key === "sew" ? "Hay una incidencia de costura abierta. Confirma el retrabajo antes de cerrar la confección." : stage.task}</p>${scmLogisticsControl(stage)}${stage.key === "delivered" ? "" : `<button class="primary trace-primary" ${stage.open ? `data-open="${stage.open}"` : `data-action="${stage.command}"`}>${stage.action}<span aria-hidden="true">→</span></button>`}</div>` : done ? `<div class="trace-confirmed">${check}<p>${m.complete && m.selected === 7 ? "Entrega completa. Las 1.200 prendas ya están en la tienda de Tokio." : "Este hito ya está confirmado en la simulación."}</p></div>${!m.complete ? '<button class="trace-return" data-trace-current>Ir al hito actual →</button>' : ""}` : `<div class="trace-waiting"><h3>Esta etapa viene después</h3><p>Primero completa «${traceStages[m.current].title.toLowerCase()}». Cada confirmación desbloquea la siguiente entrega.</p><button class="trace-return" data-trace-current>Ir al hito actual →</button></div>`}</section></div>
 <details class="trace-context"><summary>Cómo leer este recorrido</summary><div><p><strong>Recibe / entrega</strong> muestra el flujo físico: tejido → piezas → prendas cosidas → prendas terminadas → tienda. La información que acompaña al lote permite coordinar a los agentes.</p><p>Central supervisa acabado y logística; proveedores, fábricas, talleres y tienda confirman sus propias operaciones. En este caso se ha elegido A Coruña; vuestro diagrama también incluye Zaragoza. Las fechas, cantidades y confirmaciones son una simulación académica.</p></div></details><div class="trace-footer"><p>Las confirmaciones representan hitos del caso, no actividad real.</p><button data-action="reset">Reiniciar simulación</button></div>`;
}

// Anima los cambios iniciados por interacción y respeta la preferencia de movimiento reducido.
function animateTrace(previous, current) {
  if (
    !animateInteraction ||
    !previous ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const timing = { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };
  if (
    previous.selected !== current.selected ||
    previous.count !== current.count
  ) {
    $("#trace-detail")?.animate(
      [
        { opacity: 0.65, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      timing,
    );
  }
  if (previous.count !== current.count) {
    $(".trace-progress i")?.animate(
      [
        { transform: `scaleX(${previous.count / 8})` },
        { transform: `scaleX(${current.count / 8})` },
      ],
      { ...timing, duration: 250 },
    );
    if (current.count > previous.count) {
      $(
        `.trace-step[data-index="${current.count - 1}"] .trace-number`,
      )?.animate(
        [
          { opacity: 0.5, transform: "scale(.92)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        timing,
      );
    }
  }
}

// La simulación deriva siempre del volumen introducido y de la curva vigente.
// El redondeo mantiene el total incluso con volúmenes que no son múltiplos de 1.200.
function forecastModel(raw = ui.forecast) {
  const n = Number(raw);
  if (String(raw).trim() === "" || !Number.isInteger(n) || n < 0 || n > 100000)
    return null;
  const values = currentCurve();
  const quantities = values.map((value) =>
    Math.floor((value * n) / curveTotal),
  );
  const priority = values
    .map((value, i) => ({ i, remainder: (value * n) % curveTotal }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const remaining = n - quantities.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) quantities[priority[i].i]++;
  return {
    total: n,
    quantities,
    net: n * 1.2,
    gross: n * 1.5,
    waste: n * 0.3,
    length: n,
  };
}
function forecastResult() {
  const model = forecastModel();
  if (!model)
    return `<p class="forecast-error">Introduce un número entero entre 0 y 100.000 prendas para calcular el tejido.</p>`;
  return `<div class="forecast-totals">${row("Tejido bruto necesario", `${units(model.gross)} m²`)}${row("Longitud de tejido", `${units(model.length)} m lineales`)}</div>
    <div class="forecast-mix"><h3>Reparto simulado por talla</h3><p class="legend">Tokio · ${curveSource()}</p>${sizes(model.quantities)}<p class="legend">Total: ${units(model.total)} prendas. El reparto utiliza las proporciones de la curva vigente.</p></div>
    <details class="forecast-method"><summary>Cómo se calcula el tejido</summary><div>${row("Área neta · 1,20 m² por prenda", `${units(model.net)} m²`)}${row("Aprovechamiento", "80 %")}${row("Merma de corte", `${units(model.waste)} m²`)}${row("Ancho útil", "1,50 m")}<p class="legend">Área bruta = área neta / 0,80. Metros lineales = área bruta / 1,50 m. Este modelo utiliza el mismo consumo en todas las tallas: cambiar la curva cambia el reparto, no el tejido total.</p></div></details>`;
}
function forecastPanel() {
  return `<div class="forecast-panel">${panel("Simular necesidad de tejido", `<p class="legend forecast-intro">Reposición para Tokio · Datos ilustrativos</p><label class="field" for="forecast">Volumen a simular<input type="number" id="forecast" min="0" max="100000" step="1" value="1800" aria-describedby="forecast-help" aria-controls="forecast-result"></label><p class="legend" id="forecast-help">Cálculo automático. El pedido JP-TKO-261026 mantiene sus 1.200 prendas.</p><div id="forecast-result" aria-live="polite" aria-atomic="true">${forecastResult()}</div>`)}</div>`;
}
function updateForecast() {
  const input = $("#forecast");
  if (!input) return;
  ui.forecast = input.value;
  input.setAttribute("aria-invalid", String(!forecastModel()));
  input.setAttribute(
    "aria-describedby",
    forecastModel() ? "forecast-help" : "forecast-help forecast-result",
  );
  // Actualiza solo el resultado: el cursor y el foco permanecen en el campo.
  $("#forecast-result").innerHTML = forecastResult();
}

// Previsiones didácticas independientes del pedido firme y calculadora de tejido.
function shared() {
  return (
    metrics([
      [
        "Demanda a 4 semanas",
        "1.800 uds.",
        "Escenario posterior · no amplía el pedido",
      ],
      ["Precisión prevista", "± 20 %", "Intervalo: 1.440–2.160 uds."],
      ["Punto de revisión", "Cada 7 días", "Ventas y demanda no satisfecha"],
      ["Horizonte de capacidad", "4 semanas", "Reserva flexible entre socios"],
    ]) +
    `<div class="columns"><div>${panel(
      "Señales para planificar la siguiente reposición",
      table(
        ["Dato compartido", "Valor de ejemplo", "Quién lo utiliza", "Decisión"],
        [
          [
            "Ventas en Tokio",
            "300 uds. / semana",
            "Central y talleres",
            "Ajustar volumen futuro",
          ],
          [
            "Demanda no satisfecha",
            "60 uds. / semana",
            "Central y proveedores",
            "Revisar la previsión",
          ],
          [
            "Preferencia de tallas",
            "M 35 % · S 25 %",
            "Corte y confección",
            "Ajustar mix de patrones",
          ],
          [
            "Fiabilidad de entregas",
            "Minho 97 % · Galicia 95 %",
            "Zara Central",
            "Distribuir próximos lotes",
          ],
          [
            "Merma / retrabajo",
            "20 % tejido / objetivo < 2 % prendas",
            "Corte y talleres",
            "Revisar marcada y calidad",
          ],
        ],
      ) +
        `<div class="note">Datos ilustrativos agregados, sin datos personales de clientes. Previsión y pedido firme se muestran por separado.</div>`,
    )}${sizeCurvePanel()}</div><div>${forecastPanel()}${scmSharedInformation()}${panel("Reglas de visibilidad", `<p class="legend">Todos comparten código de pedido, especificación vigente, hitos e incidencias.</p>${row("Central", "Coste y red completos")}${row("Proveedor", "Su lote y destino")}${row("Corte", "Su tejido y patrones")}${row("Taller", "Sus juegos y ficha")}<div class="note">En este prototipo el selector permite revisar todos los roles. En producción requeriría permisos de acceso.</div>`)}</div></div>`
  );
}

// Recrea la vista y restaura campos y foco para conservar el contexto de interacción.
function render() {
  const focused = document.activeElement;
  const action = focused?.dataset?.action;
  const traceFocus = focused?.dataset?.traceIndex;
  const returnFocus = focused?.hasAttribute?.("data-trace-current");
  const fieldId = focused?.id;
  const previousTrace = lastRenderedTab === "timeline" ? traceLastView : null;
  nav();
  $("#content").innerHTML =
    tab === "timeline"
      ? timeline()
      : tab === "shared"
        ? shared()
        : role === "central"
          ? central()
          : role === "store"
            ? storeWorkspace()
            : agentWorkspace(role);
  if (tab === "timeline") {
    const currentTrace = traceModel();
    const rail = $(".trace-steps"),
      selected = $(".trace-step.selected");
    if (window.matchMedia("(max-width: 950px)").matches && rail && selected)
      rail.scrollLeft =
        selected.getBoundingClientRect().left -
        rail.getBoundingClientRect().left +
        rail.scrollLeft -
        12;
    animateTrace(previousTrace, currentTrace);
    traceLastView = currentTrace;
  }
  validateCurveEditor();
  lastRenderedTab = tab;
  for (const [id, value] of Object.entries(ui)) {
    const field = $("#" + id);
    if (field) {
      if (field.type === "checkbox") field.checked = state.cut || value;
      else field.value = value;
    }
  }
  if ($("#forecast")) {
    $("#forecast").setAttribute("aria-invalid", String(!forecastModel()));
    $("#forecast").setAttribute(
      "aria-describedby",
      forecastModel() ? "forecast-help" : "forecast-help forecast-result",
    );
  }
  if (traceFocus !== undefined) {
    $('[data-trace-index="' + traceFocus + '"]')?.focus({
      preventScroll: true,
    });
  } else if (returnFocus) {
    $('[data-trace-index="' + traceModel().current + '"]')?.focus({
      preventScroll: true,
    });
  } else if (action) {
    const next =
      $('[data-action="' + action + '"]') ||
      (tab === "timeline" ? $(".trace-primary") : null);
    if (next && !next.disabled) next.focus({ preventScroll: true });
    else if (focused && !focused.isConnected) {
      const target = tab === "timeline" ? $("#trace-detail") : $("#content");
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  } else if (fieldId) {
    const next = $("#" + fieldId);
    if (next && focused !== next) next.focus({ preventScroll: true });
  }
}

// Conserva las ediciones de los campos cuando se vuelve a dibujar la vista.
document.addEventListener("input", (e) => {
  if (e.target.id === "forecast") updateForecast();
  if (e.target.dataset.curveSize !== undefined && curveDraft) {
    curveDraft[Number(e.target.dataset.curveSize)] = e.target.value;
    validateCurveEditor();
  }
  if (Object.hasOwn(ui, e.target.id))
    ui[e.target.id] =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
});

// Lleva la navegación al comienzo del contenido que se acaba de abrir.
function openView() {
  render();
  // La navegación global permanece visible al entrar en cualquier sección.
  $("header").scrollIntoView({ block: "start", behavior: "instant" });
}

// Delegación de clics: los botones dinámicos se resuelven mediante atributos data-*.
document.addEventListener("click", (e) => {
  let b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.hasAttribute("data-scm-partner-store")) {
    role = "store";
    tab = "operation";
    scmPerspective = "agent";
    openView();
    return;
  }
  if (scmHandleClick(b)) return;
  animateInteraction = e.detail !== 0;
  if (b.dataset.traceIndex !== undefined) {
    traceSelected = Number(b.dataset.traceIndex);
    render();
    return;
  }
  if (b.hasAttribute("data-trace-current")) {
    traceSelected = null;
    render();
    return;
  }
  if (b.dataset.role) {
    role = b.dataset.role;
    scmPerspective = "central";
    tab = "operation";
    openView();
    return;
  }
  if (b.dataset.tab) {
    tab = b.dataset.tab;
    if (tab === "timeline") traceSelected = null;
    openView();
    return;
  }
  if (b.dataset.open) {
    if (b.dataset.open === "timeline") {
      tab = "timeline";
      traceSelected = null;
    } else {
      role = b.dataset.open;
      scmPerspective = "central";
      tab = "operation";
    }
    openView();
    return;
  }
  let a = b.dataset.action;
  if (!a) return;
  if (a === "curve-accept") return applySizeCurve(recommendedCurve, "history");
  if (a === "curve-store") return applySizeCurve(requestedCurve, "store");
  if (a === "curve-manual") {
    curveDraft = currentCurve().map(String);
    render();
    $("#curve-XS").focus({ preventScroll: true });
    return;
  }
  if (a === "curve-cancel") {
    curveDraft = null;
    render();
    $('[data-action="curve-manual"]').focus({ preventScroll: true });
    return;
  }
  if (scmConfirmLogistics(a)) return;
  if (a === "reset") {
    traceSelected = null;
    state = {};
    curveDraft = null;
    scmPerspective = "central";
    scmAssignmentTab = "fabric";
    scmSelected = { fabric: "minho", cut: "atlantico", sew: "mino" };
    initializeSCM();
    scmSync();
    Object.assign(ui, {
      complete: false,
      labels: false,
      mino: "720",
      lima: "480",
      forecast: "1800",
      lot: "TM",
    });
    notify("Simulación reiniciada en el punto de pedido aceptado.");
  }
  save();
  render();
});
document.addEventListener("change", (e) => {
  if (e.target.id === "scm-partner-select") {
    scmSelected[role] = e.target.value;
    render();
    $("#scm-partner-select")?.focus({ preventScroll: true });
  }
});
document.addEventListener("submit", (e) => {
  if (scmHandleSubmit(e)) return;
  if (e.target.id !== "curve-editor") return;
  e.preventDefault();
  if (!validateCurveEditor()) {
    const invalid = $('#curve-editor [aria-invalid="true"]') || $("#curve-XS");
    invalid.focus({ preventScroll: true });
    return;
  }
  const values = sizeNames.map((name) => Number($("#curve-" + name).value));
  applySizeCurve(values, "manual");
  $('[data-action="curve-manual"]').focus({ preventScroll: true });
});
$("#toast-close").onclick = dismissToast;
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") dismissToast();
});

// Exporta los datos del caso y los hitos actuales; libera después la URL temporal.
$("#export").onclick = () => {
  const data = {
    aviso: "Caso académico T14.2. Datos y socios simulados.",
    pedido: "JP-TKO-261026",
    modelo: "CP-026",
    aceptacion: "2026-10-26",
    entrega: "2026-11-09",
    unidades: 1200,
    tallas: Object.fromEntries(
      sizeNames.map((name, i) => [name, currentCurve()[i]]),
    ),
    tejido: {
      neto_m2: 1440,
      bruto_m2: 1800,
      merma_m2: 360,
      ancho_m: 1.5,
      lineales_m: 1200,
    },
    piezas: 14400,
    coste_eur: 17400,
    estado: state,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "JP-TKO-261026.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Datos del pedido exportados en JSON.");
};
initializeSCM();
scmSync();
render();
