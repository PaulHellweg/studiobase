import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../lib/i18n";

type Language = "de" | "en";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-md"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-base font-semibold mb-2" style={{ color: "#f87171" }}>
          {t("settings.confirmDelete")}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>
          {t("settings.confirmDeleteHint")}
        </p>
        <p className="text-xs mb-2" style={{ color: "var(--text2)" }}>
          Gib <strong style={{ color: "var(--text)" }}>LÖSCHEN</strong> ein um zu bestätigen:
        </p>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm mb-4 outline-none"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="LÖSCHEN"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--surface2)", color: "var(--text2)" }}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== "LÖSCHEN"}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: "#ef4444" }}
          >
            {t("settings.deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState<Language>(
    (i18n.language as Language) ?? "de"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "done">("idle");
  const [langSaved, setLangSaved] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    void i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  const handleExport = () => {
    setExportStatus("loading");
    // Build a mock export payload; in production this calls trpc.users.exportData
    const exportData = {
      exportedAt: new Date().toISOString(),
      language: currentLang,
      note: "StudioBase data export",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studiobase-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("done");
    setTimeout(() => setExportStatus("idle"), 3000);
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // UI present; full implementation requires backend endpoint
    alert(`Import: ${file.name} (Funktion noch nicht vollständig implementiert)`);
    e.target.value = "";
  };

  const handleDeleteConfirm = () => {
    // In production: trpc.users.requestDeletion.mutate()
    setShowDeleteModal(false);
    alert("Löschanfrage wird verarbeitet…");
  };

  const inputStyle = {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="p-8 max-w-2xl">
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
          {t("settings.title")}
        </h1>
        <p className="text-sm" style={{ color: "var(--text2)" }}>
          Studio-Konfiguration und Kontoeinstellungen
        </p>
      </div>

      {/* Language */}
      <SectionCard title={t("settings.language")}>
        <div className="flex gap-3">
          {(["de", "en"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                currentLang === lang
                  ? { background: "var(--accent)", color: "white" }
                  : { ...inputStyle, color: "var(--text2)" }
              }
            >
              <span className="text-base">{lang === "de" ? "🇩🇪" : "🇬🇧"}</span>
              {lang === "de" ? t("settings.german") : t("settings.english")}
            </button>
          ))}
        </div>
        {langSaved && (
          <p className="text-xs mt-3" style={{ color: "#34d399" }}>
            {t("common.success")} — Sprache gespeichert
          </p>
        )}
      </SectionCard>

      {/* Data export / import */}
      <SectionCard title="Daten">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {t("settings.export")}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
                Alle Daten als JSON herunterladen
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportStatus === "loading"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ background: "var(--surface2)", color: "var(--text2)" }}
            >
              {exportStatus === "loading" ? (
                "…"
              ) : exportStatus === "done" ? (
                t("common.success")
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {t("settings.export")}
                </>
              )}
            </button>
          </div>

          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {t("settings.import")}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
                {t("settings.importHint")}
              </p>
            </div>
            <label
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
              style={{ background: "var(--surface2)", color: "var(--text2)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {t("settings.import")}
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportChange}
              />
            </label>
          </div>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--surface)", border: "1px solid #7f1d1d" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#f87171" }}>
          {t("settings.dangerZone")}
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {t("settings.deleteAccount")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
              {t("settings.deleteWarning")}
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80"
            style={{ background: "#ef4444" }}
          >
            {t("settings.deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
