import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Layers3,
  CloudSun,
  RotateCcw,
  Radio,
  FlaskConical,
  Info,
} from "lucide-react";
import {
  fields,
  presets,
  readingSchema,
  type Readings,
} from "../../lib/fields";
import { api, ApiError } from "../../lib/api";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useHealth } from "../../hooks/useTelemetry";
import { Badge, Button, ErrorNotice, Tabs } from "../../components/ui";
import { ParameterInput } from "./ParameterInput";
import { PresetSelector } from "./PresetSelector";
import { RecommendationResults } from "./RecommendationResults";
function RecommendationWorkspace() {
  const { t } = useTranslation("recommend");
  const { t: c } = useTranslation();
  const { connection, record } = useWorkspace();
  const query = useQueryClient();
  const active = useRef<AbortController>();
  const [snapshot, setSnapshot] = useState<Readings>();
  const [latency, setLatency] = useState<number>();
  const form = useForm<Readings>({
    resolver: zodResolver(readingSchema),
    defaultValues: { ...presets[0].values },
    mode: "onChange",
  });
  const values = useWatch({ control: form.control }) as Readings;
  const mutation = useMutation({
    mutationFn: async (input: Readings) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      const start = performance.now();
      const result = await api.predict(connection, input, controller.signal);
      if (controller.signal.aborted)
        throw new DOMException("Aborted", "AbortError");
      return { result, elapsed: Math.round(performance.now() - start), input };
    },
    onSuccess: ({ result, elapsed, input }) => {
      setSnapshot(input);
      setLatency(elapsed);
      record({
        at: Date.now(),
        latency: elapsed,
        confidence: result.recommendations[0].confidence,
      });
      void query.invalidateQueries({ queryKey: ["drift"] });
    },
  });
  useEffect(() => () => active.current?.abort(), []);
  const stale =
    !!snapshot && fields.some((f) => snapshot[f.key] !== values[f.key]);
  return (
    <>
      <PresetSelector
        values={values}
        onSelect={(v) => form.reset(v)}
        disabled={mutation.isPending}
      />
      <div className="recommend-grid">
        <form
          className="form-panel"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          noValidate
        >
          {(["soil", "climate"] as const).map((group, i) => {
            const Icon = group === "soil" ? Layers3 : CloudSun;
            return (
              <section className="field-section" key={group}>
                <div className="field-section-heading">
                  <span className="section-number">0{i + 1}</span>
                  <div>
                    <h2>
                      <Icon size={21} />
                      {t(group)}
                    </h2>
                    <p>{t(`${group}Hint`)}</p>
                  </div>
                </div>
                <div className={`parameter-grid ${group}`}>
                  {fields
                    .filter((f) => f.group === group)
                    .map((f) => (
                      <ParameterInput
                        definition={f}
                        key={f.key}
                        control={form.control}
                        disabled={mutation.isPending}
                      />
                    ))}
                </div>
              </section>
            );
          })}
          <div className="form-action">
            {mutation.isError && (
              <ErrorNotice
                message={c(
                  mutation.error instanceof ApiError
                    ? mutation.error.key
                    : "networkError",
                )}
              />
            )}
            <Button
              type="submit"
              busy={mutation.isPending}
              disabled={mutation.isPending || !form.formState.isValid}
            >
              {t(mutation.isPending ? "working" : "submit")}
              {!mutation.isPending && <ArrowRight size={18} />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={mutation.isPending}
              onClick={() => {
                form.reset({ ...presets[0].values });
                mutation.reset();
                setSnapshot(undefined);
              }}
            >
              <RotateCcw size={15} />
              {t("reset")}
            </Button>
            <p className="text-sm muted">
              <Info size={14} />
              {t("readingHint")}
            </p>
          </div>
        </form>
        <RecommendationResults
          result={mutation.data?.result}
          loading={mutation.isPending}
          stale={stale}
          latency={latency}
        />
      </div>
    </>
  );
}
export default function RecommendPage() {
  const { t } = useTranslation("recommend");
  const { t: c } = useTranslation();
  const { connection, setConnection, revision } = useWorkspace();
  const health = useHealth();
  return (
    <div className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <div className="source-controls">
          <Tabs
            label={c("mode")}
            value={connection.mock ? "demo" : "live"}
            onChange={(v) =>
              setConnection({ ...connection, mock: v === "demo" })
            }
            items={[
              { id: "live", label: c("live") },
              { id: "demo", label: c("demo") },
            ]}
          />
          <Badge
            tone={
              connection.mock
                ? "warning"
                : health.isError
                  ? "danger"
                  : health.data
                    ? "success"
                    : "neutral"
            }
          >
            {connection.mock ? <FlaskConical size={13} /> : <Radio size={13} />}{" "}
            {c(
              connection.mock
                ? "demo"
                : health.isError
                  ? "offline"
                  : health.data
                    ? "connected"
                    : "checking",
            )}
          </Badge>
        </div>
      </div>
      <RecommendationWorkspace key={revision} />
    </div>
  );
}
