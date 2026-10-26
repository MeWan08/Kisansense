import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";

import type { Observation } from "../../hooks/useWorkspace";
import { useFormat } from "../../hooks/useFormat";
export default function SessionCharts({
  observations,
}: {
  observations: Observation[];
}) {
  const { t } = useTranslation("monitoring");
  const { t: c } = useTranslation();
  const format = useFormat();
  const latency = observations.map((o, i) => ({
    index: i + 1,
    latency: o.latency,
  }));
  const bins = [0, 0.25, 0.5, 0.75].map((start) => ({
    label: `${format.percent(start)}–${format.percent(start + 0.25)}`,
    count: observations.filter(
      (o) =>
        o.confidence >= start &&
        (start === 0.75 ? o.confidence <= 1 : o.confidence < start + 0.25),
    ).length,
  }));
  return (
    <div className="chart-grid">
      <section className="chart-panel">
        <h2>{t("latencyTitle")}</h2>
        <div className="chart-canvas" role="img" aria-label={t("latencyTitle")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={latency}
              margin={{ top: 15, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid stroke="hsl(var(--line))" vertical={false} />
              <XAxis
                dataKey="index"
                stroke="hsl(var(--muted))"
                tickLine={false}
                axisLine={false}
                tickFormatter={(n) => format.number(Number(n))}
              />
              <YAxis
                stroke="hsl(var(--muted))"
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(n) => format.number(Number(n))}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--line))",
                  borderRadius: 8,
                  color: "hsl(var(--ink))",
                }}
                formatter={(v) => [
                  `${format.number(Number(v))} ${c("ms")}`,
                  t("latency"),
                ]}
                labelFormatter={(v) =>
                  `${t("requests")} ${format.number(Number(v))}`
                }
              />
              <Line
                dataKey="latency"
                type="monotone"
                stroke="hsl(var(--accent))"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="sr-only">
          <table>
            <caption>{t("latencyTitle")}</caption>
            <tbody>
              {latency.map((o) => (
                <tr key={o.index}>
                  <th>{format.number(o.index)}</th>
                  <td>
                    {format.number(o.latency)} {c("ms")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="chart-panel">
        <h2>{t("confidenceTitle")}</h2>
        <div
          className="chart-canvas"
          role="img"
          aria-label={t("confidenceTitle")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bins}
              margin={{ top: 15, right: 15, bottom: 5, left: 0 }}
            >
              <CartesianGrid stroke="hsl(var(--line))" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted))"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                allowDecimals={false}
                stroke="hsl(var(--muted))"
                width={35}
                tickLine={false}
                axisLine={false}
                tickFormatter={(n) => format.number(Number(n))}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--soft))" }}
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--line))",
                  borderRadius: 8,
                  color: "hsl(var(--ink))",
                }}
                formatter={(v) => [format.number(Number(v)), t("requests")]}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
                animationDuration={250}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="sr-only">
          <table>
            <caption>{t("confidenceTitle")}</caption>
            <tbody>
              {bins.map((b) => (
                <tr key={b.label}>
                  <th>{b.label}</th>
                  <td>{format.number(b.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
