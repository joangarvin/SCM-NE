// Extensión del caso académico: coordinación de Central y operaciones por socio.
// Comparte el estado persistente y los componentes visuales de app.js.
const scmGroups = {
  fabric: {
    title: "Proveedores de telas",
    decision: "Compras · Zara Central",
    unit: "m²",
    target: 1800,
    prior: null,
    date: "2026-10-28",
    criteria:
      "Homologación de calidad y color, stock de algodón, llegada antes del 29 oct y coste total.",
    execution: "Inspección de calidad y reserva",
    input: "Orden de suministro y algodón disponible",
    output: "Tejido identificado para la fábrica de corte",
  },
  cut: {
    title: "Fábricas de corte",
    decision: "Planificación industrial · Zara Central",
    unit: "juegos",
    target: 1200,
    prior: "fabric",
    date: "2026-10-30",
    criteria:
      "Patrón CP-026 homologado, capacidad reservable los días 29–30 oct, marcada y proximidad al taller.",
    execution: "Corte y verificación de marcadas",
    input: "Tejido identificado del proveedor asignado",
    output: "Juegos completos de 12 piezas para el taller",
  },
  sew: {
    title: "Talleres de confección",
    decision: "Producción externa · Zara Central",
    unit: "prendas",
    target: 1200,
    prior: "cut",
    date: "2026-11-03",
    criteria:
      "Especialización en algodón, calidad de costura, capacidad los días 31 oct, 02 y 03 nov y coste por unidad.",
    execution: "Confección y control del lote",
    input: "Juegos cortados con talla y lote",
    output: "Prendas cosidas para acabado en Inditex",
  },
};
const scmPartners = [
  {
    id: "minho",
    group: "fabric",
    name: "Textil Minho",
    qty: 1080,
    route: 0,
    lot: "TM-261027",
    daily: "Stock: 1.200 m²",
    cost: "4,00 €/m²",
    availability: "27 oct · llegada 29 oct",
    quality: "Algodón AN-026 homologado",
    eligible: true,
    receive: "2026-10-27",
    execute: "2026-10-27",
    send: "2026-10-28",
    destination: "Corte Atlántico",
    reason: "1.080 m² disponibles; cumple calidad y llegada al corte.",
  },
  {
    id: "galicia",
    group: "fabric",
    name: "Algodón Galicia",
    qty: 720,
    route: 1,
    lot: "AG-261028",
    daily: "Stock: 900 m²",
    cost: "4,00 €/m²",
    availability: "28 oct · llegada 29 oct",
    quality: "Algodón AN-026 homologado",
    eligible: true,
    receive: "2026-10-28",
    execute: "2026-10-28",
    send: "2026-10-28",
    destination: "Corte Norte",
    reason: "Completa los 720 m² restantes dentro de plazo.",
  },
  {
    id: "sur",
    group: "fabric",
    name: "Algodones Sur",
    qty: 0,
    daily: "Stock: 2.000 m²",
    cost: "3,70 €/m²",
    availability: "Llegada 31 oct",
    quality: "Especificación compatible",
    eligible: false,
    reason:
      "Excluido: llega después del inicio del corte. El ahorro de 540 € compromete el plazo.",
  },
  {
    id: "atlantico",
    group: "cut",
    name: "Corte Atlántico",
    qty: 720,
    route: 0,
    lot: "COR-A · TM-261027",
    daily: "400 juegos/día · 800 en 2 días",
    cost: "1,20 €/juego",
    availability: "29–30 oct",
    quality: "Patrón CP-026 v1.3 homologado",
    eligible: true,
    upstream: "minho",
    receive: "2026-10-29",
    execute: "2026-10-30",
    send: "2026-10-30",
    destination: "Taller Miño",
    reason: "720 juegos en dos jornadas; misma ruta del lote TM-261027.",
  },
  {
    id: "norte",
    group: "cut",
    name: "Corte Norte",
    qty: 480,
    route: 1,
    lot: "COR-B · AG-261028",
    daily: "300 juegos/día · 600 en 2 días",
    cost: "1,20 €/juego",
    availability: "29–30 oct",
    quality: "Patrón CP-026 v1.3 homologado",
    eligible: true,
    upstream: "galicia",
    receive: "2026-10-29",
    execute: "2026-10-30",
    send: "2026-10-30",
    destination: "Taller Lima",
    reason: "480 juegos reservables; protege el límite del 30 oct.",
  },
  {
    id: "interior",
    group: "cut",
    name: "Corte Interior",
    qty: 0,
    daily: "250 juegos/día",
    cost: "1,10 €/juego",
    availability: "29–30 oct",
    quality: "CP-026 pendiente de homologación",
    eligible: false,
    reason: "Excluido: no tiene validado el patrón del pedido.",
  },
  {
    id: "mino",
    group: "sew",
    name: "Taller Miño",
    qty: 720,
    route: 0,
    lot: "CON-A · COR-A · TM-261027",
    daily: "240 prendas/día · 720 en 3 días",
    cost: "3,80 €/prenda",
    availability: "31 oct, 02 y 03 nov",
    quality: "Especialista en algodón · ficha v1.3",
    eligible: true,
    upstream: "atlantico",
    receive: "2026-10-31",
    execute: "2026-11-03",
    send: "2026-11-03",
    destination: "Acabado · Inditex",
    reason: "Su reserva cubre exactamente 720 prendas en las tres jornadas.",
  },
  {
    id: "lima",
    group: "sew",
    name: "Taller Lima",
    qty: 480,
    route: 1,
    lot: "CON-B · COR-B · AG-261028",
    daily: "160 prendas/día · 480 en 3 días",
    cost: "3,80 €/prenda",
    availability: "31 oct, 02 y 03 nov",
    quality: "Especialista en algodón · ficha v1.3",
    eligible: true,
    upstream: "norte",
    receive: "2026-10-31",
    execute: "2026-11-03",
    send: "2026-11-03",
    destination: "Acabado · Inditex",
    reason:
      "Completa 480 prendas; mantiene el reparto 60/40 equilibrado por talla.",
  },
  {
    id: "levante",
    group: "sew",
    name: "Taller Levante",
    qty: 0,
    daily: "300 prendas/día",
    cost: "3,60 €/prenda",
    availability: "Disponible desde 04 nov",
    quality: "Algodón homologado",
    eligible: false,
    reason:
      "Excluido: comienza después de la salida comprometida de confección.",
  },
];
let scmPerspective = "central";
let scmSelected = { fabric: "minho", cut: "atlantico", sew: "mino" };
let scmAssignmentTab = "fabric";
const scmEscape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
const scmDate = (date) =>
  date
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(date + "T12:00:00Z"))
    : "Sin fecha registrada";
const scmDateValid = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date || "") &&
  !Number.isNaN(Date.parse(date + "T12:00:00Z")) &&
  new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date;
const scmNow = () => new Date().toISOString();
const scmPartner = (id) => scmPartners.find((p) => p.id === id);
const scmActive = (group) =>
  scmPartners.filter((p) => p.group === group && p.eligible);
function initializeSCM() {
  if (state.scm?.version === 1) return;
  const previous = { ...state };
  state.scm = {
    version: 1,
    assignments: {},
    operations: {},
    events: {},
    issues: [],
    issueSequence: 0,
  };
  for (const group of Object.keys(scmGroups)) {
    if (previous.plan || previous[group])
      state.scm.assignments[group] = {
        selected: scmActive(group).map((p) => p.id),
        imported: true,
      };
    for (const partner of scmActive(group)) {
      state.scm.operations[partner.id] = previous[group]
        ? {
            receive: { imported: true },
            execute: { imported: true },
            send: { imported: true },
          }
        : {};
    }
  }
  for (const key of ["finished", "shipped", "hubReceived", "delivered"])
    if (previous[key]) state.scm.events[key] = { imported: true };
  if (previous.incident) {
    state.scm.issues.push({
      id: "INC-026-01",
      partner: "mino",
      subject: "Costura irregular · 12 prendas",
      status: "open",
      createdAt: scmNow(),
      messages: [
        {
          sender: "Taller Miño",
          text: "Incidencia recuperada: 12 prendas retenidas para retrabajo.",
          at: scmNow(),
        },
      ],
    });
    state.scm.issueSequence = 1;
  }
  save();
}
function scmOperation(id) {
  return state.scm.operations[id] || {};
}
function scmIssues(id, openOnly = false) {
  return state.scm.issues.filter(
    (issue) =>
      (!id || issue.partner === id) && (!openOnly || issue.status === "open"),
  );
}
// Una incidencia de origen bloquea también el avance pendiente de esa ruta.
function scmRouteIssues(id) {
  const partner = scmPartner(id);
  return [
    ...scmIssues(id, true),
    ...(partner?.upstream ? scmRouteIssues(partner.upstream) : []),
  ];
}
function scmActual(key) {
  if (key === "accepted") return "26 oct 2026";
  if (scmGroups[key]) {
    const records = scmActive(key).map((p) => scmOperation(p.id).send);
    if (!records.every(Boolean)) return "Pendiente";
    return records.every((r) => r.date)
      ? scmDate(
          records
            .map((r) => r.date)
            .sort()
            .at(-1),
        )
      : "Confirmado · sin fecha registrada";
  }
  const record = state.scm.events[key];
  return record
    ? record.date
      ? scmDate(record.date)
      : "Confirmado · sin fecha registrada"
    : "Pendiente";
}
function scmPreviousDate(key) {
  if (scmGroups[key])
    return (
      scmActive(key)
        .map((p) => scmOperation(p.id).send?.date)
        .filter(Boolean)
        .sort()
        .at(-1) || "2026-10-26"
    );
  return state.scm.events[key]?.date || "2026-10-26";
}
function scmSync() {
  for (const group of Object.keys(scmGroups))
    state[group] = scmActive(group).every((p) => !!scmOperation(p.id).send);
  state.plan = Object.keys(scmGroups).every(
    (group) => !!state.scm.assignments[group],
  );
  state.incident = scmIssues(null, true).some(
    (issue) => scmPartner(issue.partner)?.group === "sew",
  );
}
function scmStatus(id) {
  const op = scmOperation(id);
  if (scmIssues(id, true).length) return "Incidencia abierta";
  return op.send
    ? "Enviado"
    : op.execute
      ? "Ejecución completada"
      : op.receive
        ? "En ejecución"
        : "Pendiente de recepción";
}
function scmGlobalOverview() {
  const count = traceModel().count;
  return panel(
    "Estado global del pedido",
    `<div class="scm-overview-head"><p class="legend">Zara Central · Arteixo coordina la red. Selecciona una fase para supervisar a sus agentes.</p><strong>${count} / 8 hitos</strong></div><div class="trace-progress" role="progressbar" aria-label="Avance global del pedido" aria-valuemin="0" aria-valuemax="8" aria-valuenow="${count}"><i style="transform:scaleX(${count / 8})"></i></div><ol class="scm-phase-list">${traceStages
      .map((stage, i) => {
        const completed = stage.done();
        const running =
          scmGroups[stage.key] &&
          scmActive(stage.key).some(
            (p) => Object.keys(scmOperation(p.id)).length,
          );
        return `<li class="${completed ? "done" : i === traceModel().current ? "current" : ""}"><div><strong>${String(i + 1).padStart(2, "0")} · ${stage.title}</strong><p class="legend">${stage.owner}</p><p class="legend">Prevista: ${stage.date} 2026<br>Realizada: ${scmActual(stage.key)}</p></div><div>${pill(completed ? "✓ Confirmado" : running ? "En ejecución" : i === traceModel().current ? "Siguiente fase" : "Pendiente", "neutral")}<button data-scm-stage="${i}">Ver ${scmGroups[stage.key] ? "agentes" : stage.key === "delivered" ? "tienda" : "detalle"} →</button></div></li>`;
      })
      .join(
        "",
      )}</ol><div class="actionrow"><button data-open="timeline">Ver trazabilidad completa</button><span class="legend">Fechas realizadas del caso simulado. Las confirmaciones se registran por separado.</span></div>`,
  );
}
function scmAssignmentPanel() {
  const group = scmAssignmentTab,
    meta = scmGroups[group],
    confirmed = state.scm.assignments[group];
  return panel(
    "Decidir y asignar socios",
    `<nav class="scm-sections" aria-label="Tipo de asignación">${Object.entries(
      scmGroups,
    )
      .map(
        ([key, g]) =>
          `<button data-scm-assignment="${key}" aria-pressed="${group === key}">${g.title}${state.scm.assignments[key] ? " ✓" : ""}</button>`,
      )
      .join(
        "",
      )}</nav><p class="legend">Responsable: ${meta.decision}. Se confirma ${meta.prior ? "después de asignar " + scmGroups[meta.prior].title.toLowerCase() : "al aceptar el pedido"} y antes de comenzar sus operaciones.</p><div class="note">${meta.criteria} Las tres asignaciones son secuenciales; las dos rutas de cada tipo se reservan juntas.</div><form id="scm-assignment-form" data-group="${group}" novalidate>${table(
      [
        "Seleccionar / socio",
        "Disponibilidad en la ventana",
        "Capacidad / stock",
        "Calidad y coste",
        "Motivo de decisión",
      ],
      scmPartners
        .filter((p) => p.group === group)
        .map((p) => [
          `<label class="scm-choice"><input type="checkbox" name="partner" value="${p.id}" ${p.eligible && (!confirmed || confirmed.selected.includes(p.id)) ? "checked" : ""} ${!p.eligible || confirmed ? "disabled" : ""}>${p.name}</label>`,
          p.availability,
          p.daily,
          `${p.quality}<small>${p.cost}</small>`,
          `${p.reason}${p.qty ? `<small>Propuesta: ${units(p.qty)} ${meta.unit}</small>` : ""}`,
        ]),
    )}<div class="actionrow"><label class="field">Fecha de asignación del caso<input type="date" name="date" value="${confirmed?.date || "2026-10-26"}" min="2026-10-26" max="${
      scmActive(group)
        .map((p) => p.receive)
        .sort()[0]
    }" ${confirmed ? "disabled" : ""} required></label><button class="primary" type="submit" ${confirmed ? "disabled" : ""}>${confirmed ? "Asignación confirmada ✓" : "Confirmar " + meta.title.toLowerCase()}</button></div><p class="legend">Cobertura requerida: ${units(meta.target)} ${meta.unit}. ${confirmed ? `Confirmada por ${meta.decision} · ${confirmed.date ? scmDate(confirmed.date) : "asignación previa sin fecha registrada"}.` : "Revisa los criterios y la cobertura antes de confirmar."}</p><p class="scm-form-feedback" role="status" aria-live="polite"></p></form>`,
  );
}
function scmSupervision(group) {
  const meta = scmGroups[group];
  return (
    metrics([
      ["Socios de la fase", "2", "Rutas A y B"],
      [
        state.scm.assignments[group] ? "Volumen asignado" : "Volumen a asignar",
        `${units(meta.target)} ${meta.unit}`,
        state.scm.assignments[group]
          ? "Asignación confirmada"
          : "Pendiente de asignación",
      ],
      [
        "Envíos completados",
        `${scmActive(group).filter((p) => scmOperation(p.id).send).length} / 2`,
        "Estados comunicados por los agentes",
      ],
      [
        "Incidencias abiertas",
        String(
          scmActive(group).reduce(
            (n, p) => n + scmIssues(p.id, true).length,
            0,
          ),
        ),
        "Seguimiento desde Central",
      ],
    ]) +
    panel(
      "Seguimiento de los socios",
      table(
        ["Socio / lote", "Recepción", "Ejecución", "Envío", "Estado / detalle"],
        scmActive(group).map((p) => {
          const op = scmOperation(p.id);
          return [
            `${p.name}<small>${p.lot} · ${units(p.qty)} ${meta.unit}</small>`,
            ...["receive", "execute", "send"].map((key) =>
              op[key]
                ? `✓ ${op[key].date ? scmDate(op[key].date) : "Confirmado sin fecha"}`
                : "Pendiente",
            ),
            `${scmStatus(p.id)}<br><button data-scm-partner="${p.id}">Ver sistema del agente →</button>`,
          ];
        }),
      ),
    ) +
    panel(
      "Información que Central recibe",
      `<p class="legend">Cantidades recibidas, avance, fecha real de envío e incidencias de cada socio. Las confirmaciones de recepción, ejecución y envío se realizan en el sistema de cada empresa.</p><div class="actionrow"><button data-scm-show-assignment="${group}">Revisar decisión de asignación</button></div>`,
    ) +
    scmConversationPanel(group, null)
  );
}
function scmContext(group) {
  return `<section class="panel scm-context" aria-label="Perspectiva del sistema"><div class="scm-sections"><button data-scm-perspective="central" aria-pressed="${scmPerspective === "central"}">Supervisión de Central</button><button data-scm-perspective="agent" aria-pressed="${scmPerspective === "agent"}">Sistema del agente</button></div>${
    group !== "store" && scmPerspective === "agent"
      ? `<label class="field">Empresa que utiliza el sistema<select id="scm-partner-select">${scmActive(
          group,
        )
          .map(
            (p) =>
              `<option value="${p.id}" ${scmSelected[group] === p.id ? "selected" : ""}>${p.name} · ${p.lot}</option>`,
          )
          .join("")}</select></label>`
      : ""
  }<p class="legend">${scmPerspective === "central" ? "Usuario: Zara Central · Arteixo. Consulta estados y coordina la red." : group === "store" ? "Usuario: Yukiko Tanaka · Tienda Tokio." : "Usuario: " + scmPartner(scmSelected[group]).name + ". Solo confirma las operaciones de su lote."}</p></section>`;
}
function agentWorkspace(group) {
  const partner = scmPartner(scmSelected[group]);
  return (
    scmContext(group) +
    (scmPerspective === "central"
      ? scmSupervision(group)
      : scmAgentView(partner))
  );
}
function scmLifecycle(partner) {
  const op = scmOperation(partner.id),
    meta = scmGroups[partner.group];
  const actions = [
    ["receive", "Recepción", partner.input || meta.input],
    ["execute", meta.execution, "Cantidad conforme y controles del lote"],
    ["send", "Envío", meta.output + " → " + partner.destination],
  ];
  const next = actions.find(([key]) => !op[key]);
  let blocked = "";
  if (!state.scm.assignments[partner.group])
    blocked = "Central debe confirmar la asignación de esta fase.";
  else if (
    next?.[0] === "receive" &&
    partner.upstream &&
    !scmOperation(partner.upstream).send
  )
    blocked = `Pendiente del envío de ${scmPartner(partner.upstream).name}.`;
  else if (scmRouteIssues(partner.id).length)
    blocked =
      "Resuelve las incidencias de este lote o de su ruta de origen antes de continuar.";
  return panel(
    "Recepción → ejecución → envío",
    `<p class="legend">${partner.name} · ${partner.lot} · ${scmStatus(partner.id)}</p><ol class="scm-lifecycle">${actions.map(([key, title, desc]) => `<li><strong>${op[key] ? "✓ " : ""}${title}</strong><p>${desc}</p><span class="legend">Prevista: ${scmDate(partner[key])}<br>Realizada: ${op[key] ? (op[key].date ? scmDate(op[key].date) : "Confirmada · sin fecha registrada") : "Pendiente"}</span></li>`).join("")}</ol>${next ? `${blocked ? `<div class="note">${blocked}</div>` : ""}<form id="scm-lifecycle-form" data-partner="${partner.id}" data-step="${next[0]}" novalidate><div class="actionrow"><label class="field">Fecha realizada del caso simulado<input type="date" name="date" value="${partner[next[0]]}" min="2026-10-26" required></label><label class="field">${next[0] === "receive" ? "Cantidad recibida" : next[0] === "execute" ? "Cantidad conforme" : "Cantidad a enviar"} · ${meta.unit}<input type="number" name="qty" value="${partner.qty}" min="0" max="${partner.qty}" step="1" required></label></div>${next[0] === "execute" ? `<label class="row"><span>${partner.group === "cut" ? "Patrones y marcadas verificados; juegos completos y etiquetados" : partner.group === "fabric" ? "Composición, color, ancho y calidad conformes" : "Costuras, medidas y distribución por talla conformes"}</span><input type="checkbox" name="quality" required></label>` : ""}<button class="primary full" type="submit" ${blocked ? "disabled" : ""}>Confirmar ${next[1].toLowerCase()}</button><p class="scm-form-feedback" role="status" aria-live="polite"></p></form>` : '<div class="note">Lote enviado. Zara Central y el siguiente agente ven esta confirmación.</div>'}`,
  );
}
function scmAgentView(partner) {
  const meta = scmGroups[partner.group],
    values = workshopCurves()[partner.route];
  let details = "";
  if (partner.group === "fabric")
    details =
      panel(
        "Especificación y lote de suministro",
        row("Lote", partner.lot) +
          row("Destino", partner.destination) +
          row("Reserva", `${units(partner.qty)} m²`) +
          row("Longitud · ancho útil 1,50 m", `${units(partner.qty / 1.5)} m`) +
          row("Composición", "100 % algodón") +
          row("Gramaje", "220 g/m²") +
          row("Color", "Azul noche · AN-026") +
          row("Encogimiento máximo", "3 %") +
          row("Calidad exigida", "Sin defectos críticos"),
      ) + confirmedCurveCard();
  if (partner.group === "cut")
    details = panel(
      "Patrones y marcadas · CP-026",
      `<p class="legend">Patrón CP-026 v1.3 · tolerancia ± 2 mm · juego de 12 piezas.</p><div class="pattern"><svg viewBox="0 0 620 155" role="img" aria-label="Esquema conceptual de las piezas del patrón"><path d="M15 12h65l5 35-12 12-7 79H20zM102 12h65l7 126h-47l-7-79-15-12zM195 12h73l8 126h-53l-9-80-18-12zM295 12h73l-1 34-18 12-9 80h-53zM405 14h47v48l-24 17-23-17zM462 14h47v48l-24 17-23-17zM405 92h104v18H405zM405 121h104v18H405zM534 18h26v105h-26zM574 18h26v105h-26z"/></svg></div><div class="note">2 delanteros + 2 traseros + 4 piezas de bolsillo + 2 de cinturilla + 2 de bragueta. Esquema conceptual, no patrón industrial a escala.</div>${cuttingCurve()}<h3 class="scm-section-title">Juegos de esta ruta</h3>${sizes(values)}${row("Tejido de entrada", `${units(partner.qty * 1.5)} m²`)}${row("Piezas de salida", units(partner.qty * 12))}<p class="legend">Cada juego conserva talla, color y lote. Las instrucciones del patrón acompañan el envío a ${partner.destination}.</p>`,
    );
  if (partner.group === "sew")
    details =
      panel(
        "Lote de confección y tallas",
        `<p class="legend">${partner.lot} · reparto equilibrado de ${units(partner.qty)} prendas</p>${sizes(values)}${row("Capacidad reservada", partner.daily)}${row("Coste del lote", euro(partner.qty * 3.8))}<div class="flow">${["Preparar bolsillos", "Cerrar perneras", "Cinturilla y cierre", "Rematar e inspeccionar"].map((s, i) => `<div><small>FASE ${i + 1}</small><strong>${s}</strong></div>`).join("")}</div><div class="note">31 oct, 02 y 03 nov: tres jornadas productivas. 01 nov: sin actividad. El lote cosido pasa a Inditex para acabado, planchado y etiquetado.</div>`,
      ) +
      panel(
        "Calidad y componentes",
        row("Cierres", units(partner.qty)) +
          row("Botones", units(partner.qty)) +
          row("Ficha de costura / medida", "CP-026 v1.3") +
          row("Defectos críticos", "0 admitidos") +
          row("Etiquetado final", "En Inditex · 04 nov"),
      );
  return (
    metrics([
      ["Empresa", partner.name, "Sistema del agente"],
      [
        state.scm.assignments[partner.group]
          ? "Lote asignado"
          : "Lote previsto",
        `${units(partner.qty)} ${meta.unit}`,
        partner.lot,
      ],
      ["Estado", scmStatus(partner.id), "Comunicado a Zara Central"],
      ["Destino", partner.destination, "Siguiente agente de la ruta"],
    ]) +
    `<div class="columns"><div>${scmLifecycle(partner)}${scmConversationPanel(partner.group, partner.id)}</div><div>${details}</div></div>`
  );
}
function scmIssueName(id) {
  return id === "store" ? "Tienda Tokio" : scmPartner(id)?.name || id;
}
function scmConversationPanel(group, partnerId) {
  const partners =
    group === "store"
      ? [{ id: "store", name: "Tienda Tokio" }]
      : scmActive(group);
  const issues = state.scm.issues.filter((issue) =>
    partnerId
      ? issue.partner === partnerId
      : partners.some((p) => p.id === issue.partner),
  );
  const sender =
    scmPerspective === "central"
      ? "Zara Central"
      : scmIssueName(partnerId || "store");
  return panel(
    "Incidencias y conversación",
    `<p class="legend">Mensajes del prototipo entre ${sender === "Zara Central" ? "Central y los agentes de esta fase" : sender + " y Zara Central"}. Se conservan en este navegador.</p>${issues.length ? issues.map((issue) => `<article class="scm-issue" data-scm-thread="${issue.id}"><div class="scm-issue-heading"><h3>${scmEscape(issue.id)} · ${scmEscape(issue.subject)}</h3>${pill(issue.status === "open" ? "Abierta" : "Resuelta", "neutral")}</div><p class="legend">Lote / agente: ${scmIssueName(issue.partner)} · Responsable de coordinación: Zara Central</p><ol class="scm-messages">${issue.messages.map((message) => `<li><strong>${scmEscape(message.sender)}</strong><time datetime="${message.at}">${scmEscape(new Date(message.at).toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" }))}</time><p>${scmEscape(message.text)}</p></li>`).join("")}</ol>${issue.status === "open" ? `<form class="scm-message-form" data-issue="${issue.id}" data-sender="${scmEscape(sender)}" novalidate><label class="field" for="message-${issue.id}">Respuesta o explicación de la resolución<textarea id="message-${issue.id}" name="message" rows="2" maxlength="1000" required></textarea></label><div class="actionrow"><button type="submit" name="intent" value="reply">Añadir respuesta</button><button type="submit" name="intent" value="resolve">Confirmar resolución</button></div><p class="scm-form-feedback" role="status" aria-live="polite"></p></form>` : '<p class="legend">Resolución comunicada a ambos extremos.</p>'}</article>`).join("") : '<p class="legend scm-empty">Sin incidencias registradas en esta fase.</p>'}<details class="scm-new-issue"><summary>Registrar una incidencia</summary><form id="scm-issue-form" data-sender="${scmEscape(sender)}" novalidate>${partnerId ? `<input type="hidden" name="partner" value="${partnerId}">` : `<label class="field">Agente afectado<select name="partner">${partners.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}</select></label>`}<label class="field">Motivo y efecto en el lote<textarea name="subject" rows="2" maxlength="500" required></textarea></label><button type="submit" class="full">Registrar y comunicar incidencia</button><p class="scm-form-feedback" role="status" aria-live="polite"></p></form></details>`,
  );
}
function scmCentralIssues() {
  const issues = scmIssues(null, true);
  return panel(
    "Incidencias de la red",
    issues.length
      ? table(
          ["Incidencia / agente", "Efecto", "Seguimiento"],
          issues.map((issue) => [
            `${scmEscape(issue.id)} · ${scmIssueName(issue.partner)}`,
            `${scmEscape(issue.subject)}<small>Bloquea el siguiente avance del lote afectado.</small>`,
            `<button data-scm-issue-open="${issue.partner}" data-scm-thread-open="${issue.id}">Ver conversación →</button>`,
          ]),
        )
      : '<p class="legend">Sin incidencias abiertas. Los avisos de proveedores, fábricas, talleres y tienda aparecerán aquí.</p>',
  );
}
function storeWorkspace() {
  const received = state.scm.events.delivered;
  const summary = panel(
    "Tienda solicitante · Tokio",
    row("Responsable", "Yukiko Tanaka") +
      row("Pedido", "JP-TKO-261026") +
      row("Entrega prevista", "09 nov 2026") +
      row("Recepción realizada", scmActual("delivered")) +
      row(
        "Cantidad comunicada",
        `${units(state.scm.storeQty || (state.delivered ? 1200 : 0))} / 1.200 prendas`,
      ) +
      `<h3 class="scm-section-title">Distribución confirmada</h3>${sizes()}<div class="note">La tienda consulta el seguimiento, comunica diferencias y confirma la recepción. Zara Central coordina el pedido desde Arteixo.</div>`,
  );
  const canReceive = state.hubReceived && !scmIssues("store", true).length;
  const reception =
    scmPerspective === "agent"
      ? panel(
          "Recepción de la expedición",
          received
            ? '<p class="legend">✓ Recepción completa confirmada y comunicada a Zara Central.</p>'
            : `<p class="legend">${state.hubReceived ? "Expedición disponible para reparto desde el hub de Japón." : "Pendiente de llegada al hub de Japón."}</p><form id="scm-store-form" novalidate><div class="actionrow"><label class="field">Prendas recibidas<input type="number" name="qty" value="${state.scm.storeQty ?? 1200}" min="0" max="1200" step="1" required></label><label class="field">Fecha de recepción del caso<input type="date" name="date" value="2026-11-09" min="2026-10-26" required></label></div><button class="primary full" type="submit" ${canReceive ? "" : "disabled"}>Confirmar recepción en Tokio</button>${scmIssues("store", true).length ? '<p class="legend">Primero resuelve la incidencia de recepción.</p>' : ""}<p class="scm-form-feedback" role="status" aria-live="polite"></p></form>`,
        )
      : panel(
          "Supervisión de la recepción",
          `<p class="legend">La recepción se confirma desde el sistema de la tienda. Central recibe cantidades, fecha e incidencias.</p><button class="full" data-scm-perspective="agent">Ver sistema de Tienda Tokio →</button>`,
        );
  return (
    scmContext("store") +
    `<div class="columns"><div>${summary}${reception}</div><div>${scmConversationPanel("store", scmPerspective === "agent" ? "store" : null)}</div></div>`
  );
}
function scmSharedInformation() {
  return panel(
    "Qué comparte cada agente para planificar",
    table(
      ["Agente", "Información que aporta", "Qué recibe / decisión futura"],
      [
        [
          "Tienda Tokio",
          "Ventas por talla, demanda no satisfecha y diferencias de recepción",
          "Curva recomendada y previsión de reposición.",
        ],
        [
          "Proveedores",
          "Disponibilidad futura de algodón, calidad y plazos de suministro",
          "Previsión agregada y especificación para preparar stock.",
        ],
        [
          "Fábricas de corte",
          "Aprovechamiento de marcadas, tiempos y capacidad en las fechas necesarias",
          "Mix de tallas para preparar patrones y marcadas.",
        ],
        [
          "Talleres",
          "Calidad, retrabajo y capacidad reservable por ventana de producción",
          "Volumen y mix previstos para organizar turnos.",
        ],
        [
          "Zara Central",
          "Previsión consolidada y asignaciones confirmadas",
          "Cruza señales de la red y coordina futuras reservas.",
        ],
      ],
    ) +
      `<p class="legend">Previsiones ilustrativas: no constituyen pedidos firmes ni reservas automáticas.</p>`,
  );
}
function scmFormError(form, message) {
  form.querySelector(".scm-form-feedback").textContent = message;
}
function scmCommit(message) {
  const form = document.activeElement?.closest("form");
  const nextFormId = form?.id;
  const issueId = form?.dataset.issue;
  scmSync();
  save();
  render();
  const target =
    (nextFormId ? document.getElementById(nextFormId) : null) ||
    (issueId ? document.querySelector(`[data-issue="${issueId}"]`) : null);
  const field = target?.querySelector(
    "input:not([type=hidden]):not(:disabled), textarea, select, button:not(:disabled)",
  );
  if (field) field.focus({ preventScroll: true });
  else if (form) {
    $("#content").setAttribute("tabindex", "-1");
    $("#content").focus({ preventScroll: true });
  }
  notify(message);
}
function scmEventDate(form, minimum = "2026-10-26") {
  const date = new FormData(form).get("date");
  if (!scmDateValid(date) || date < minimum) {
    scmFormError(
      form,
      `Introduce una fecha válida, igual o posterior al ${scmDate(minimum)}.`,
    );
    form.querySelector('[name="date"]')?.focus();
    return null;
  }
  return date;
}
function scmAddIssue(partner, subject, sender) {
  state.scm.issueSequence++;
  const issue = {
    id: "INC-026-" + String(state.scm.issueSequence).padStart(2, "0"),
    partner,
    subject,
    status: "open",
    createdAt: scmNow(),
    messages: [{ sender, text: subject, at: scmNow() }],
  };
  state.scm.issues.push(issue);
  return issue;
}
function scmHandleSubmit(event) {
  const form = event.target;
  if (
    ![
      "scm-assignment-form",
      "scm-lifecycle-form",
      "scm-issue-form",
      "scm-store-form",
    ].includes(form.id) &&
    !form.matches(".scm-message-form")
  )
    return false;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id === "scm-assignment-form") {
    const group = form.dataset.group,
      meta = scmGroups[group];
    if (
      scmPerspective !== "central" ||
      role !== "central" ||
      state.scm.assignments[group]
    )
      return true;
    if (meta.prior && !state.scm.assignments[meta.prior]) {
      scmFormError(
        form,
        "Confirma primero la asignación de " +
          scmGroups[meta.prior].title.toLowerCase() +
          ".",
      );
      return true;
    }
    const selected = data.getAll("partner"),
      valid = scmActive(group).every((p) => selected.includes(p.id));
    if (!valid || selected.length !== 2) {
      scmFormError(
        form,
        `La selección debe cubrir ${units(meta.target)} ${meta.unit} con las dos rutas aptas. Revisa capacidad, homologación y fechas.`,
      );
      return true;
    }
    const date = scmEventDate(
      form,
      meta.prior
        ? state.scm.assignments[meta.prior].date || "2026-10-26"
        : "2026-10-26",
    );
    if (!date) return true;
    if (
      date >
      scmActive(group)
        .map((p) => p.receive)
        .sort()[0]
    ) {
      scmFormError(
        form,
        "La asignación debe realizarse antes del comienzo previsto de esta fase.",
      );
      return true;
    }
    state.scm.assignments[group] = {
      selected,
      date,
      recordedAt: scmNow(),
      owner: meta.decision,
    };
    scmCommit(
      "Asignación de " + meta.title.toLowerCase() + " confirmada por Central.",
    );
    return true;
  }
  if (form.id === "scm-lifecycle-form") {
    const partner = scmPartner(form.dataset.partner),
      step = form.dataset.step,
      op = scmOperation(partner.id);
    if (
      scmPerspective !== "agent" ||
      role !== partner.group ||
      scmSelected[role] !== partner.id ||
      !state.scm.assignments[partner.group] ||
      scmRouteIssues(partner.id).length
    )
      return true;
    const sequence = ["receive", "execute", "send"],
      index = sequence.indexOf(step);
    if (
      index < 0 ||
      op[step] ||
      (index > 0 && !op[sequence[index - 1]]) ||
      (step === "receive" &&
        partner.upstream &&
        !scmOperation(partner.upstream).send)
    )
      return true;
    const minimum =
      step === "receive"
        ? partner.upstream
          ? [
              scmOperation(partner.upstream).send?.date,
              state.scm.assignments[partner.group].date,
            ]
              .filter(Boolean)
              .sort()
              .at(-1)
          : state.scm.assignments[partner.group].date
        : op[sequence[index - 1]].date;
    const date = scmEventDate(form, minimum || "2026-10-26");
    if (!date) return true;
    const raw = String(data.get("qty") ?? ""),
      qty = Number(raw);
    if (!raw.trim() || !Number.isInteger(qty) || qty !== partner.qty) {
      scmFormError(
        form,
        `Se requieren ${units(partner.qty)} ${scmGroups[partner.group].unit} conformes para cerrar este paso. Registra una incidencia si hay diferencias.`,
      );
      return true;
    }
    if (step === "execute" && !data.has("quality")) {
      scmFormError(
        form,
        "Confirma los controles de calidad del lote antes de cerrar la ejecución.",
      );
      return true;
    }
    state.scm.operations[partner.id] ||= {};
    state.scm.operations[partner.id][step] = {
      date,
      qty,
      recordedAt: scmNow(),
      actor: partner.name,
    };
    scmCommit(
      `${partner.name}: ${step === "receive" ? "recepción" : step === "execute" ? "ejecución" : "envío"} confirmado. Central y el siguiente agente ven el nuevo estado.`,
    );
    return true;
  }
  if (form.id === "scm-issue-form") {
    const partner = String(data.get("partner")),
      subject = String(data.get("subject") || "").trim();
    if (!subject || subject.length > 500) {
      scmFormError(
        form,
        "Describe el motivo y su efecto en el lote (máximo 500 caracteres).",
      );
      return true;
    }
    if (partner !== "store" && !scmPartner(partner)?.eligible) return true;
    scmAddIssue(partner, subject, form.dataset.sender);
    scmCommit(
      "Incidencia comunicada. El siguiente avance del lote queda pendiente de resolución.",
    );
    return true;
  }
  if (form.matches(".scm-message-form")) {
    const issue = state.scm.issues.find((i) => i.id === form.dataset.issue),
      message = String(data.get("message") || "").trim();
    if (!issue || issue.status !== "open") return true;
    if (!message || message.length > 1000) {
      scmFormError(
        form,
        "Escribe una respuesta o explica cómo se ha resuelto la incidencia (máximo 1.000 caracteres).",
      );
      return true;
    }
    issue.messages.push({
      sender: form.dataset.sender,
      text: message,
      at: scmNow(),
    });
    if (event.submitter?.value === "resolve") {
      issue.status = "resolved";
      issue.resolvedAt = scmNow();
    }
    scmCommit(
      issue.status === "resolved"
        ? "Resolución comunicada a ambos agentes."
        : "Respuesta añadida a la conversación.",
    );
    return true;
  }
  if (form.id === "scm-store-form") {
    if (
      role !== "store" ||
      scmPerspective !== "agent" ||
      !state.hubReceived ||
      state.delivered ||
      scmIssues("store", true).length
    )
      return true;
    const date = scmEventDate(form, scmPreviousDate("hubReceived"));
    if (!date) return true;
    const raw = String(data.get("qty") || ""),
      qty = Number(raw);
    if (!raw.trim() || !Number.isInteger(qty) || qty < 0 || qty > 1200) {
      scmFormError(
        form,
        "Introduce entre 0 y 1.200 prendas recibidas, en unidades enteras.",
      );
      return true;
    }
    state.scm.storeQty = qty;
    if (qty !== 1200) {
      scmAddIssue(
        "store",
        `Diferencia de recepción: ${units(qty)} de 1.200 prendas recibidas el ${scmDate(date)}.`,
        "Tienda Tokio · Yukiko Tanaka",
      );
      scmCommit(
        "Diferencia comunicada a Central. La entrega completa sigue pendiente.",
      );
      return true;
    }
    state.delivered = true;
    state.scm.events.delivered = {
      date,
      qty,
      recordedAt: scmNow(),
      actor: "Tienda Tokio · Yukiko Tanaka",
    };
    scmCommit("Tokio confirma la recepción completa de 1.200 prendas.");
    return true;
  }
  return true;
}
function scmHandleClick(button) {
  if (button.dataset.scmPerspective) {
    scmPerspective = button.dataset.scmPerspective;
    render();
    document
      .querySelector(`.scm-context [data-scm-perspective="${scmPerspective}"]`)
      ?.focus({ preventScroll: true });
    return true;
  }
  if (button.dataset.scmAssignment) {
    scmAssignmentTab = button.dataset.scmAssignment;
    render();
    document
      .querySelector(`[data-scm-assignment="${scmAssignmentTab}"]`)
      ?.focus({ preventScroll: true });
    return true;
  }
  if (button.dataset.scmShowAssignment) {
    scmAssignmentTab = button.dataset.scmShowAssignment;
    role = "central";
    scmPerspective = "central";
    openView();
    $("#scm-assignment-form")
      ?.closest(".panel")
      .scrollIntoView({ block: "start", behavior: "instant" });
    return true;
  }
  if (button.dataset.scmPartner) {
    const p = scmPartner(button.dataset.scmPartner);
    role = p.group;
    scmSelected[p.group] = p.id;
    scmPerspective = "agent";
    openView();
    return true;
  }
  if (button.dataset.scmIssueOpen) {
    const id = button.dataset.scmIssueOpen;
    role = id === "store" ? "store" : scmPartner(id).group;
    scmPerspective = "central";
    openView();
    document
      .querySelector(`[data-scm-thread="${button.dataset.scmThreadOpen}"]`)
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    return true;
  }
  if (button.dataset.scmStage !== undefined) {
    const i = Number(button.dataset.scmStage),
      key = traceStages[i].key;
    if (scmGroups[key]) {
      role = key;
      tab = "operation";
      scmPerspective = "central";
    } else if (key === "delivered") {
      role = "store";
      tab = "operation";
      scmPerspective = "central";
    } else {
      tab = "timeline";
      traceSelected = i;
    }
    openView();
    return true;
  }
  return false;
}
function scmLogisticsControl(stage) {
  const mapping = {
    finished: { prior: "sew", date: "2026-11-04" },
    shipped: { prior: "finished", date: "2026-11-05" },
    hubReceived: { prior: "shipped", date: "2026-11-08" },
  };
  if (stage.key === "delivered")
    return '<button class="primary trace-primary" data-scm-partner-store>Ir al sistema de Tienda Tokio →</button>';
  if (!mapping[stage.key]) return "";
  return `<label class="field scm-logistics-date">Fecha realizada del caso simulado<input id="scm-logistics-date" type="date" min="2026-10-26" value="${mapping[stage.key].date}" required></label><p class="legend">Confirmación de Central para ${stage.owner}. El registro conserva además la fecha de esta acción.</p>`;
}
function scmConfirmLogistics(action) {
  const map = {
    finish: ["finished", "sew"],
    ship: ["shipped", "finished"],
    hub: ["hubReceived", "shipped"],
  };
  if (!map[action]) return false;
  const [key, previous] = map[action];
  if (!state[previous]) {
    notify("Completa la fase anterior antes de confirmar este hito.");
    return true;
  }
  if (state[key]) return true;
  if (scmIssues(null, true).length) {
    notify(
      "Resuelve las incidencias abiertas antes de continuar la expedición.",
    );
    return true;
  }
  const date = $("#scm-logistics-date")?.value;
  if (!scmDateValid(date) || date < scmPreviousDate(previous)) {
    notify(
      "La fecha realizada debe ser válida e igual o posterior al hito anterior.",
    );
    $("#scm-logistics-date")?.focus();
    return true;
  }
  state[key] = true;
  state.scm.events[key] = {
    date,
    recordedAt: scmNow(),
    actor: "Zara Central · " + key,
  };
  traceSelected = null;
  scmCommit("Hito confirmado con fecha realizada: " + scmDate(date) + ".");
  return true;
}
