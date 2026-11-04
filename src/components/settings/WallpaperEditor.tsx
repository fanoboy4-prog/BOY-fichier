import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { readImageAsDataUrl } from '@/lib/imageFile';
import { wallpaperLayerStyle } from '@/lib/appSettings';
import type { Wallpaper } from '@/lib/appSettings';
import { ToggleRow } from '@/components/settings/SettingsUi';

interface WallpaperEditorProps {
  wallpaper: Wallpaper | null;
  onSave: (wallpaper: Wallpaper | null) => boolean;
  onCancel: () => void;
}

const DEFAULT_OPACITY = 60;

export function WallpaperEditor({ wallpaper, onSave, onCancel }: WallpaperEditorProps) {
  const [draft, setDraft] = useState<Wallpaper | null>(wallpaper);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file, 1280, 0.8);
      setDraft({
        dataUrl,
        opacity: draft?.opacity ?? DEFAULT_OPACITY,
        blur: draft?.blur ?? false,
      });
      setError(null);
    } catch {
      setError('That image could not be used. Try another one.');
    }
  };

  const handleSave = () => {
    if (!onSave(draft)) {
      setError('This image is too large to store on this device. Try a smaller photo.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative h-40 rounded-xl overflow-hidden bg-[#E5DDD5]">
        {draft && <div aria-hidden className="absolute inset-0 pointer-events-none" style={wallpaperLayerStyle(draft)} />}
        <div className="absolute right-3 top-3 max-w-[70%] bg-[#25D366] text-white text-xs rounded-lg rounded-tr-none px-3 py-2 shadow">
          Preview message
        </div>
      </div>

      <div className="flex gap-2">
        <label className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors">
          {draft ? 'Replace image' : 'Choose image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        {draft && (
          <button
            onClick={() => setDraft(null)}
            className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {draft && (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-800">Opacity</span>
              <span className="text-xs text-gray-500">{draft.opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={draft.opacity}
              onChange={(e) => setDraft({ ...draft, opacity: Number(e.target.value) })}
              className="w-full accent-[#075E54]"
            />
          </div>
          <div className="-mx-4 border-t border-gray-100">
            <ToggleRow
              label="Blur"
              description="Soften the image behind messages"
              checked={draft.blur}
              onChange={(blur) => setDraft({ ...draft, blur })}
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-[#075E54] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Save wallpaper
        </button>
      </div>
    </div>
  );
}
