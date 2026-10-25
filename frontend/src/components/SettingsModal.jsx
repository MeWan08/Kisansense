import { useEffect, useRef, useState } from "react";
import { X, Globe, KeyRound, Eye, EyeOff, Settings2 } from "lucide-react";
import { normalizeBaseUrl } from "../api";
export default function SettingsModal({ settings, onSave, onClose }) {
  const dialog = useRef(null);
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => el.close();
  }, []);
  function submit(e) {
    e.preventDefault();
    try {
      const baseUrl = normalizeBaseUrl(draft.baseUrl);
      if (!draft.apiKey.trim()) throw new Error("Enter an API key.");
      onSave({ ...draft, baseUrl });
    } catch (e) {
      setError(e.message || "Enter a valid URL.");
    }
  }
  return (
    <dialog
      ref={dialog}
      className="settings-modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="settings-title"
    >
      <form onSubmit={submit}>
        <div className="modal-top">
          <span className="heading-icon">
            <Settings2 size={20} />
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="settings-title">Connection settings</h2>
        <p>Connect your KisanSense inference service.</p>
        <label className="settings-label" htmlFor="base-url">
          <Globe size={15} /> Backend URL
        </label>
        <input
          autoFocus
          id="base-url"
          type="url"
          required
          value={draft.baseUrl}
          onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
        />
        <small>
          Default: http://127.0.0.1:8000 · use HTTPS for a hosted API.
        </small>
        <label className="settings-label" htmlFor="api-key">
          <KeyRound size={15} /> API key
        </label>
        <div className="secret-input">
          <input
            id="api-key"
            type={show ? "text" : "password"}
            required
            autoComplete="off"
            value={draft.apiKey}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
          />
          <button
            type="button"
            className="icon-button"
            aria-label={show ? "Hide API key" : "Show API key"}
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <small>The key stays in memory and is cleared when you reload.</small>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="primary-button">
          Save connection
        </button>
      </form>
    </dialog>
  );
}
