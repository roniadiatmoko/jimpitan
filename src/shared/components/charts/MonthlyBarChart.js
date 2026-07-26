import { useRef, useState } from "react";
import { rupiahFormat } from "../../helpers/MoneyHeper";

const COLOR_A = "#2563EB";
const COLOR_B = "#eb6834";

const GRID_COLOR = "#E2E8F0";
const AXIS_TEXT_COLOR = "#64748B";
const INK_COLOR = "#0F172A";

function niceMax(value) {
  if (!value || value <= 0) return 100000;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * 10 ** exponent;
}

function trimNum(n) {
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}

function formatCompact(n) {
  if (n >= 1_000_000) return `${trimNum(n / 1_000_000)}jt`;
  if (n >= 1_000) return `${trimNum(n / 1_000)}rb`;
  return String(Math.round(n));
}

function topRoundedRectPath(x, y, width, height, radius) {
  if (height <= 0) return "";
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${
    x + width - r
  },${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${
    y + height
  } Z`;
}

const VIEW_W = 760;
const VIEW_H = 300;
const MARGIN = { top: 16, right: 12, bottom: 28, left: 52 };
const PLOT_W = VIEW_W - MARGIN.left - MARGIN.right;
const PLOT_H = VIEW_H - MARGIN.top - MARGIN.bottom;
const BAR_WIDTH = 10;
const BAR_GAP = 2;

export default function MonthlyBarChart({
  data,
  seriesAKey,
  seriesBKey,
  seriesALabel,
  seriesBLabel,
}) {
  const wrapperRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const rawMax = Math.max(
    0,
    ...data.map((d) => Math.max(d[seriesAKey] || 0, d[seriesBKey] || 0))
  );
  const maxValue = niceMax(rawMax);
  const groupWidth = PLOT_W / data.length;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const showTooltip = (event, monthLabel, series, value) => {
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    const markRect = event.currentTarget.getBoundingClientRect();
    if (!wrapperRect) return;
    setTooltip({
      x: markRect.left - wrapperRect.left + markRect.width / 2,
      y: markRect.top - wrapperRect.top,
      monthLabel,
      series,
      value,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_A }}
            />
            <span className="text-sm text-ink">{seriesALabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_B }}
            />
            <span className="text-sm text-ink">{seriesBLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="text-xs font-semibold text-accent hover:underline"
        >
          {showTable ? "Lihat sebagai grafik" : "Lihat sebagai tabel"}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Bulan</th>
                <th className="px-3 py-2">{seriesALabel}</th>
                <th className="px-3 py-2">{seriesBLabel}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr
                  key={d.label}
                  className="border-t border-line odd:bg-white even:bg-surface"
                >
                  <td className="px-3 py-2 text-center">{d.label}</td>
                  <td className="px-3 py-2 text-right">
                    {rupiahFormat(d[seriesAKey] || 0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {rupiahFormat(d[seriesBKey] || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapperRef} className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full"
            role="img"
            aria-label={`Grafik ${seriesALabel} dan ${seriesBLabel} per bulan`}
          >
            {ticks.map((t) => {
              const y = MARGIN.top + PLOT_H - t * PLOT_H;
              return (
                <g key={t}>
                  <line
                    x1={MARGIN.left}
                    x2={VIEW_W - MARGIN.right}
                    y1={y}
                    y2={y}
                    stroke={GRID_COLOR}
                    strokeWidth={1}
                  />
                  <text
                    x={MARGIN.left - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    fill={AXIS_TEXT_COLOR}
                  >
                    {formatCompact(t * maxValue)}
                  </text>
                </g>
              );
            })}

            {data.map((d, i) => {
              const groupX = MARGIN.left + i * groupWidth;
              const pairWidth = BAR_WIDTH * 2 + BAR_GAP;
              const pairStart = groupX + (groupWidth - pairWidth) / 2;
              const heightA =
                ((d[seriesAKey] || 0) / maxValue) * PLOT_H;
              const heightB =
                ((d[seriesBKey] || 0) / maxValue) * PLOT_H;
              const baseY = MARGIN.top + PLOT_H;

              return (
                <g key={d.label}>
                  <path
                    d={topRoundedRectPath(
                      pairStart,
                      baseY - heightA,
                      BAR_WIDTH,
                      heightA,
                      4
                    )}
                    fill={COLOR_A}
                    tabIndex={0}
                    style={{ cursor: "pointer", outline: "none" }}
                    onMouseEnter={(e) =>
                      showTooltip(e, d.label, seriesALabel, d[seriesAKey] || 0)
                    }
                    onFocus={(e) =>
                      showTooltip(e, d.label, seriesALabel, d[seriesAKey] || 0)
                    }
                    onMouseLeave={hideTooltip}
                    onBlur={hideTooltip}
                  />
                  <path
                    d={topRoundedRectPath(
                      pairStart + BAR_WIDTH + BAR_GAP,
                      baseY - heightB,
                      BAR_WIDTH,
                      heightB,
                      4
                    )}
                    fill={COLOR_B}
                    tabIndex={0}
                    style={{ cursor: "pointer", outline: "none" }}
                    onMouseEnter={(e) =>
                      showTooltip(e, d.label, seriesBLabel, d[seriesBKey] || 0)
                    }
                    onFocus={(e) =>
                      showTooltip(e, d.label, seriesBLabel, d[seriesBKey] || 0)
                    }
                    onMouseLeave={hideTooltip}
                    onBlur={hideTooltip}
                  />
                  <text
                    x={groupX + groupWidth / 2}
                    y={VIEW_H - MARGIN.bottom + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill={AXIS_TEXT_COLOR}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs shadow-lg"
              style={{ left: tooltip.x, top: tooltip.y - 6 }}
            >
              <div className="font-semibold" style={{ color: INK_COLOR }}>
                {rupiahFormat(tooltip.value)}
              </div>
              <div className="text-muted">
                {tooltip.series} &middot; {tooltip.monthLabel}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
