# Taller 14.2 · ZARA Supply network

Abre index.html en un navegador. Prototipo estático sin instalación ni backend. El estado de la simulación se guarda en el navegador y se reinicia desde Trazabilidad.

## Qué contiene cada archivo

| Archivo           | Para qué sirve                                                                     |
| ----------------- | ---------------------------------------------------------------------------------- |
| `index.html`      | Estructura de la página y contenedores de las vistas.                              |
| `app.js`          | Datos del caso, pantallas, confirmaciones y guardado del progreso.                 |
| `scm.js`          | Coordinación de Central, asignaciones, estados por socio, tienda y conversaciones. |
| `PLAN_MEJORAS.md` | Plan y criterios de verificación de las mejoras del profesor.                      |
| `styles.css`      | Aspecto visual, componentes y adaptación a pantallas pequeñas.                     |

Para entender el código, empieza por `index.html`. `app.js` contiene la vista global, la trazabilidad, la curva de tallas, la calculadora y el renderizado. `scm.js` contiene las empresas, las decisiones de asignación y los sistemas de cada agente. Ambos utilizan el mismo estado local persistente.

## Cómo abrir el prototipo

Puedes abrir `index.html` directamente en el navegador. El proyecto funciona con HTML, CSS y JavaScript, sin instalar dependencias ni compilar.

Para ejecutarlo con un servidor local, abre una terminal y ejecuta:

```bash
cd /Users/joan/Documents/ZARA_SCM
python3 -m http.server 8000 --bind 127.0.0.1
```

Después entra en [http://localhost:8000](http://localhost:8000). Para detener el servidor, pulsa **Ctrl + C** en la terminal. Si modificas los archivos, recarga la página para ver los cambios.

## Recorrido para presentar al profesor

1. En **Trazabilidad**, revisar el avance de los ocho hitos y sus fechas previstas y realizadas. El seguimiento global se concentra en esta pestaña.
2. En **Decidir y asignar socios**, comparar los criterios y confirmar, en este orden, proveedores, fábricas de corte y talleres. Cada tipo tiene alternativas ilustrativas, motivos de selección o exclusión, responsable y fecha de decisión.
3. Abrir **Proveedores de telas**. La **Supervisión de Central** resume ambas empresas. Cambiar a **Sistema del agente**, seleccionar Textil Minho y confirmar recepción, ejecución con control de calidad y envío. Repetir con Algodón Galicia.
4. Repetir en **Fábricas de corte**, seleccionando Corte Atlántico y Corte Norte. Cada fábrica recibe únicamente después del envío de su proveedor. Confirmar patrones, marcadas y juegos etiquetados.
5. Repetir en **Talleres de confección**, seleccionando Taller Miño y Taller Lima. Cada taller recibe después del envío de su fábrica; sus lotes conservan el reparto por tallas.
6. Para demostrar una incidencia, registrarla desde el sistema de un agente. Cambiar a **Supervisión de Central**, responder y volver al agente para confirmar la resolución con una explicación. La incidencia bloquea el avance pendiente de su ruta.
7. En **Trazabilidad**, confirmar acabado, salida logística y llegada al hub, indicando la fecha realizada del caso simulado. Las fechas no pueden ser anteriores al hito precedente.
8. En **Tienda Tokio → Sistema del agente**, confirmar la recepción. Una cantidad inferior a 1.200 genera una incidencia y deja la entrega pendiente. Tras resolverla, confirmar la recepción completa.
9. En **Inteligencia compartida**, decidir la curva de tallas y simular una reposición. La curva se refleja en las empresas y sus lotes; la simulación no amplía el pedido firme.

Las dos rutas pueden avanzar de forma independiente: un taller puede estar ejecutando mientras el otro sigue pendiente de recepción. El hito global de una fase se completa cuando las dos empresas han enviado.

Para empezar desde cero, usar **Reiniciar simulación** en Trazabilidad. Las confirmaciones previas sin fecha se conservan como «sin fecha registrada»; no se les asignan fechas inventadas.

## Fechas y centralización

Las fechas realizadas pertenecen al caso académico y las introduce quien confirma la operación. Cada confirmación guarda además el instante de registro. Las conversaciones usan la fecha de registro y la zona horaria Europe/Madrid.

Central supervisa y asigna; cada socio confirma las operaciones de su propio lote. El selector de perspectivas simula esos sistemas; no es autenticación. Todos comparten el estado del navegador, sin servidor de sincronización entre dispositivos.

## Supuestos del ejercicio

### Alcance

Todos los socios, datos económicos y operativos son ficticios, creados para el ejercicio. No es una herramienta oficial de Zara. La solicitud de diseño ya está aceptada; no se incluye ese flujo previo. Tampoco se amplía la red a proveedores de segundo nivel.

### Pedido y calendario

Pedido JP-TKO-261026: 1.200 pantalones pirata 100 % algodón, azul noche. Aceptación 26/10/2026 y entrega 09/11/2026: escenario de 14 días. Fechas de producción: suministro 27–28 octubre, llegada 29; corte 29–30; confección 31 octubre, 2 y 3 noviembre (1 noviembre sin actividad, calendario supuesto); control 4, consolidación 5 y transporte internacional 6–9 noviembre. El modelo presupone capacidad y tejido disponibles y transporte aéreo; no afirma un plazo universal de Zara.

### Balance de tejido

| Concepto        | Cálculo o cantidad                   |
| --------------- | ------------------------------------ |
| Área neta       | 1.200 prendas × 1,20 m² = 1.440 m²   |
| Aprovechamiento | 80 %                                 |
| Compra bruta    | 1.440 m² / 0,80 = 1.800 m²           |
| Ancho útil      | 1,50 m                               |
| Longitud total  | 1.800 m² / 1,50 m = 1.200 m lineales |
| Merma           | 1.800 − 1.440 = 360 m²               |
| Ruta A          | 1.080 m² para 720 prendas            |
| Ruta B          | 720 m² para 480 prendas              |

### Piezas y tallas

Un juego por prenda: 2 delanteros + 2 traseros + 4 piezas de bolsillo + 2 piezas de cinturilla + 2 de bragueta = 12 piezas. Son 14.400 piezas (8.640 + 5.760). El esquema es conceptual y no un patrón de fabricación.

### Costes

| Partida             |        Coste |
| ------------------- | -----------: |
| Tejido              |      7.200 € |
| Corte               |      1.440 € |
| Confección          |      4.560 € |
| Acabado y control   |      1.800 € |
| Logística y aduanas |      2.400 € |
| **Total**           | **17.400 €** |
| **Por prenda**      |  **14,50 €** |

Los componentes auxiliares están incluidos en acabado. La alternativa de tejido de 3,70 €/m² ahorra 540 €, pero llega fuera de plazo.

### Distribución por talla

|  XS |   S |   M |   L |  XL | Total |
| --: | --: | --: | --: | --: | ----: |
| 120 | 300 | 420 | 240 | 120 | 1.200 |

Rutas 60/40 con idéntica proporción por talla.

### Previsiones, permisos e incidencias

Los datos de previsión son independientes del pedido firme. La vista compartida ilustra las políticas de permisos; el selector de roles no implementa autenticación real. La incidencia de costura es una demostración local; cerrar producción exige confirmar el total conforme tras retrabajo.

## Diseño

Paleta: azul tinta #172c43, azul operativo #224eb0, fondo #f3f5f8, blanco #ffffff, verde #226248 y ámbar #805711. Manrope para títulos, DM Sans para lectura; fuentes de sistema como alternativa. Retícula de aplicación con barra lateral, contenido y panel contextual. Elemento distintivo: transformación de tejido en juegos de patrones con unidades consistentes entre agentes.
