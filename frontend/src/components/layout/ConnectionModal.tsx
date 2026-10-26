import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../ui/Modal";
import { Button, Input } from "../ui";
import { useWorkspace } from "../../hooks/useWorkspace";
import { normalizeUrl } from "../../lib/api";
import { useToast } from "../ui/Toast";
export function ConnectionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { connection, setConnection } = useWorkspace();
  const [url, setUrl] = useState(connection.baseUrl);
  const [key, setKey] = useState(connection.apiKey);
  const [error, setError] = useState("");
  const toast = useToast();
  function save(e: React.FormEvent) {
    e.preventDefault();
    let baseUrl: string;
    try {
      baseUrl = normalizeUrl(url);
    } catch {
      setError("urlError");
      return;
    }
    if (!key.trim() && !connection.mock) {
      setError("keyError");
      return;
    }
    setConnection({ ...connection, baseUrl, apiKey: key });
    toast(t("saved"));
    onClose();
  }
  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={t("settings")}
      description={t("settingsHint")}
    >
      <form onSubmit={save} className="stack mt-6" noValidate>
        <label htmlFor="api-url">{t("apiUrl")}</label>
        <Input
          id="api-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoComplete="url"
        />
        <label htmlFor="api-key">{t("apiKey")}</label>
        <Input
          id="api-key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
        />
        <p className="text-sm muted">{t("keyHint")}</p>
        {error && (
          <p className="field-error" role="alert">
            {t(error)}
          </p>
        )}
        <Button type="submit">{t("save")}</Button>
      </form>
    </Modal>
  );
}
