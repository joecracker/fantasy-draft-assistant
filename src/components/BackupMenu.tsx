import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { DraftSetup } from '../types';
import {
  driveConfigured,
  isDriveConnected,
  connectBackup,
  saveBackup,
  restoreBackup,
  disconnectDrive,
} from '../lib/backup';

interface BackupPayload {
  savedSetups: DraftSetup[];
  exportedAt: string;
}

interface BackupMenuProps {
  savedSetups: DraftSetup[];
  onRestore: (setups: DraftSetup[]) => void;
}

export function BackupMenu({ savedSetups, onRestore }: BackupMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(isDriveConnected());
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildPayload = (): BackupPayload => ({
    savedSetups,
    exportedAt: new Date().toISOString(),
  });

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fantasy-draft-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported JSON file.');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<BackupPayload>;
      if (!Array.isArray(parsed.savedSetups)) {
        setStatus('That file does not look like a Fantasy Draft Assistant backup.');
        return;
      }
      setPendingConfirm({
        message: 'Import this backup? It will replace your saved draft setups.',
        onConfirm: () => {
          onRestore(parsed.savedSetups);
          setStatus('Imported from file.');
        },
      });
    } catch (err) {
      setStatus(err instanceof Error ? `Import failed: ${err.message}` : 'Import failed.');
    }
  };

  const handleConnect = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await connectBackup();
      setConnected(true);
      setStatus('Connected to Google Drive.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not connect to Google Drive.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveToDrive = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await saveBackup(buildPayload());
      setConnected(true);
      setStatus('Saved to Google Drive.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save to Drive failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const data = await restoreBackup<BackupPayload>();
      if (!data) {
        setStatus('No backup found in Drive yet — save one first.');
        return;
      }
      setPendingConfirm({
        message: 'Restore from Drive? This will replace your saved draft setups.',
        onConfirm: () => {
          onRestore(data.savedSetups);
          setConnected(true);
          setStatus('Restored from Google Drive.');
        },
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Restore from Drive failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    disconnectDrive();
    setConnected(false);
    setStatus('Disconnected from Google Drive.');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      {open && (
        <div className="mb-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-2xl text-slate-100">
          <div className="text-xs font-bold uppercase tracking-wide text-teal-400 mb-2">Backup</div>

          <div className="flex flex-col gap-1.5 mb-3">
            {driveConfigured ? (
              connected ? (
                <>
                  <button
                    disabled={busy}
                    onClick={handleSaveToDrive}
                    className="text-left text-sm px-2 py-1.5 rounded-md bg-teal-500/15 hover:bg-teal-500/25 disabled:opacity-50"
                  >
                    Save to Google Drive
                  </button>
                  <button
                    disabled={busy}
                    onClick={handleRestoreFromDrive}
                    className="text-left text-sm px-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Restore from Google Drive
                  </button>
                  <button
                    disabled={busy}
                    onClick={handleDisconnect}
                    className="text-left text-xs px-2 py-1 text-slate-400 hover:text-slate-200"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  disabled={busy}
                  onClick={handleConnect}
                  className="text-left text-sm px-2 py-1.5 rounded-md bg-teal-500/15 hover:bg-teal-500/25 disabled:opacity-50"
                >
                  Connect Google Drive
                </button>
              )
            ) : (
              <div className="text-xs text-slate-400">
                Google Drive backup isn't configured yet (missing Client ID). See GOOGLE_DRIVE_SETUP.md.
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-2 flex flex-col gap-1.5">
            <button
              onClick={handleExportJSON}
              className="text-left text-sm px-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700"
            >
              Export JSON file
            </button>
            <button
              onClick={handleImportClick}
              className="text-left text-sm px-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700"
            >
              Import JSON file
            </button>
          </div>

          {status && <div className="mt-2 text-xs text-slate-400">{status}</div>}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm px-4 py-2 shadow-lg"
      >
        ☁ Backup
      </button>

      {pendingConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 flex flex-col gap-4 shadow-2xl">
            <p className="text-xs text-slate-300 leading-relaxed">{pendingConfirm.message}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingConfirm(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = pendingConfirm.onConfirm;
                  setPendingConfirm(null);
                  action();
                }}
                className="rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
