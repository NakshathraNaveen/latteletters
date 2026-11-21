"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { createPost, getUploadUrls, updatePost, type FormState } from "@/app/actions/posts";
import { DRINKS, DRINK_IDS } from "@/lib/drinks";
import type { Post, PostKind } from "@/lib/posts";
import { shrinkPhoto } from "@/lib/resize";
import { uploadToSignedUrl } from "@/lib/supabase/browser";
import { photoUrl } from "@/lib/supabase/public";
import { VIBES, type VibeId } from "@/lib/vibes";
import { btn, FormMessage, input, label } from "./ui";

const MAX = { review: 2000, note: 280 };
const VIBE_IDS = Object.keys(VIBES) as VibeId[];

type NewPhoto = { file: File; preview: string };

/**
 * Write (or edit) a review or a love note.
 * Photos are shrunk in the browser, uploaded to signed storage URLs, and only
 * then is the post itself sent to the server action.
 */
type Props = {
  cafeId: string;
  /** lock the form to one kind (always the case when editing) */
  kind?: PostKind;
  initial?: Post;
  /** false once this person has already reviewed the cafe */
  canReview?: boolean;
  onDone?: () => void;
};

export function PostForm(props: Props) {
  const editing = !!props.initial;
  const [state, dispatch, pending] = useActionState<FormState, FormData>(editing ? updatePost : createPost, {});
  const { onDone } = props;

  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state.at]); // eslint-disable-line react-hooks/exhaustive-deps

  // a successful new post remounts the fields, which clears them
  return <Fields key={!editing && state.ok ? state.at : "form"} {...props} state={state} dispatch={dispatch} pending={pending} />;
}

function Fields({
  cafeId,
  kind: fixedKind,
  initial,
  canReview = true,
  onDone,
  state,
  dispatch,
  pending,
}: Props & { state: FormState; dispatch: (fd: FormData) => void; pending: boolean }) {
  const editing = !!initial;
  const [kind, setKind] = useState<PostKind>(fixedKind ?? (canReview ? "review" : "note"));
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [body, setBody] = useState(initial?.body ?? "");
  const [kept, setKept] = useState<string[]>(initial?.photos ?? []);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  const [localError, setLocalError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const id = useId();

  const photoCount = kept.length + added.length;

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = 3 - photoCount;
    const picked = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    setAdded((a) => [...a, ...picked.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    if (files.length > room) setLocalError("Up to 3 photos per review.");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(undefined);
    const fd = new FormData(e.currentTarget);
    fd.delete("photo-input");
    if (kind === "review") {
      if (!rating) return setLocalError("Tap the stars to give a rating.");
      fd.set("rating", String(rating));
      for (const p of kept) fd.append("photos", p);
      if (added.length) {
        setUploading(true);
        try {
          const blobs = await Promise.all(added.map((p) => shrinkPhoto(p.file)));
          const slots = await getUploadUrls(blobs.map((b) => b.type));
          if ("error" in slots) throw new Error(slots.error);
          await Promise.all(
            slots.map(async (slot, i) => {
              const { error } = await uploadToSignedUrl(slot.path, slot.token, blobs[i]);
              if (error) throw new Error("A photo didn't upload. Check your connection and try again.");
            }),
          );
          for (const s of slots) fd.append("photos", s.path);
          // uploaded: keep them if the post itself fails, so we don't upload twice
          setKept((k) => [...k, ...slots.map((s) => s.path)]);
          setAdded((a) => (a.forEach((p) => URL.revokeObjectURL(p.preview)), []));
        } catch (err) {
          setUploading(false);
          return setLocalError(err instanceof Error ? err.message : "A photo didn't upload.");
        }
        setUploading(false);
      }
    }
    startTransition(() => dispatch(fd));
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={submit} className="space-y-5" aria-describedby={`${id}-rules`}>
      {editing && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="cafeId" value={cafeId} />
      <input type="hidden" name="kind" value={kind} />

      {!fixedKind && (
        <div role="radiogroup" aria-label="What are you pinning?" className="flex flex-wrap gap-2">
          {(["review", "note"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              disabled={k === "review" && !canReview}
              onClick={() => setKind(k)}
              className={`rounded-full border-2 border-cola px-4 py-1.5 font-display transition disabled:opacity-50 ${
                kind === k ? "bg-cola text-cotton" : "bg-lemon hover:bg-hotpink"
              }`}
            >
              {k === "review" ? "★ write a review" : "✎ pin a love note"}
            </button>
          ))}
          {!canReview && <p className="w-full text-sm text-cola/75">You&rsquo;ve reviewed this cafe. Edit it from your review card!</p>}
        </div>
      )}

      {kind === "review" && (
        <>
          <fieldset>
            <legend className={label}>your rating</legend>
            <div className="mt-1 flex gap-1" onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") setRating((r) => Math.min(5, r + 1));
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") setRating((r) => Math.max(1, r - 1));
            }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={rating === n}
                  onClick={() => setRating(n)}
                  className={`text-4xl leading-none transition hover:scale-110 ${n <= rating ? "text-hotpink [text-shadow:1px_1px_0_var(--color-cola)]" : "text-cola/25"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor={`${id}-drink`} className={label}>
                what did you order? <span className="normal-case tracking-normal text-cola/60">(optional)</span>
              </label>
              <input
                id={`${id}-drink`}
                name="drink"
                list={`${id}-drinks`}
                maxLength={60}
                defaultValue={initial?.drink ? (DRINKS[initial.drink as keyof typeof DRINKS]?.name ?? initial.drink) : ""}
                placeholder="iced lavender latte"
                className={input}
              />
              <datalist id={`${id}-drinks`}>
                {DRINK_IDS.map((d) => (
                  <option key={d} value={DRINKS[d].name} />
                ))}
              </datalist>
            </div>
          </div>

          <fieldset>
            <legend className={label}>
              the vibe <span className="normal-case tracking-normal text-cola/60">(pick any)</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {VIBE_IDS.map((v) => (
                <label
                  key={v}
                  className="cursor-pointer rounded-full border-2 border-cola bg-lemon px-3 py-1 text-sm font-semibold transition has-[:checked]:bg-lime has-[:checked]:shadow-[2px_2px_0_var(--color-cola)] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-hotpink/60"
                >
                  <input type="checkbox" name="vibes" value={v} defaultChecked={initial?.vibes.includes(v)} className="sr-only" />
                  <span aria-hidden>{VIBES[v].emoji}</span> {VIBES[v].label}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <div className="space-y-1.5">
        <label htmlFor={`${id}-body`} className={label}>
          {kind === "review" ? "your review" : "your love note"}
        </label>
        <textarea
          id={`${id}-body`}
          name="body"
          required
          maxLength={MAX[kind]}
          rows={kind === "review" ? 5 : 3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={kind === "review" ? "How was the drink? The seating? Would you come back?" : "dear cafe, your oat cortado got me through finals ♡"}
          className={`${input} ${kind === "note" ? "font-note text-xl" : ""}`}
        />
        <p className="text-right text-xs text-cola/70" aria-live="polite">
          {body.length}/{MAX[kind]}
        </p>
      </div>

      {kind === "review" && (
        <div className="space-y-2">
          <p className={label}>
            photos <span className="normal-case tracking-normal text-cola/60">(up to 3, optional)</span>
          </p>
          <ul className="flex flex-wrap gap-3">
            {kept.map((p) => (
              <Thumb key={p} src={photoUrl(p)} onRemove={() => setKept((k) => k.filter((x) => x !== p))} />
            ))}
            {added.map((p) => (
              <Thumb
                key={p.preview}
                src={p.preview}
                onRemove={() => {
                  URL.revokeObjectURL(p.preview);
                  setAdded((a) => a.filter((x) => x !== p));
                }}
              />
            ))}
            {photoCount < 3 && (
              <li>
                <label className="grid size-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-cola bg-lemon/70 text-center text-sm font-semibold transition hover:bg-lemon has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-hotpink/60">
                  <span>+ add photo</span>
                  <input
                    name="photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addPhotos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </li>
            )}
          </ul>
          <p className="text-xs text-cola/70">Only post photos you took. We shrink them and remove hidden location data before uploading.</p>
        </div>
      )}

      <FormMessage error={localError ?? state.error} ok={!editing && state.ok && (state.kind === "review" ? "Review pinned ✦" : "Love note pinned ✦")} />

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className={btn}>
          {uploading ? "uploading photos…" : pending ? "pinning…" : editing ? "save changes" : kind === "review" ? "pin my review" : "pin my note"}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className="font-semibold underline underline-offset-4">
            cancel
          </button>
        )}
      </div>
      <p id={`${id}-rules`} className="text-xs text-cola/70">
        Keep it kind and honest. Posts are public and follow our{" "}
        <a href="/privacy#guidelines" className="underline underline-offset-2">
          community guidelines
        </a>
        .
      </p>
    </form>
  );
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <li className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews can't go through next/image */}
      <img src={src} alt="" className="size-24 rounded-xl border-2 border-cola object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border-2 border-cola bg-hotpink text-sm font-bold"
      >
        ×
      </button>
    </li>
  );
}
