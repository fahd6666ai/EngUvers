# Licensing — Velxio (Circuit Lab) separation

## Summary

[Velxio](https://github.com/davidmonterocrespo24/velxio) is dual-licensed:
**AGPLv3** (free, copyleft) or a paid **Commercial License** (proprietary
use without the copyleft source-disclosure obligation) — see its own
`LICENSE` and `COMMERCIAL_LICENSE.md`. EngUvers uses the AGPLv3 path.

The Phase 0 plan assumed we'd need our own **fork** of Velxio to build the
integration ("the Bridge"). Reading Velxio's actual build system while
implementing Phase 2 turned up something better: **Velxio ships an
official, zero-modification extension mechanism** — the same one its own
author uses to build the closed-source `velxio-prod` commercial product.
Using it means:

- **No fork.** `services/simulator/velxio` is a git submodule pointing
  directly at `davidmonterocrespo24/velxio`, pinned to one commit SHA
  (currently `c4bbb08569e7f4089abfc631714f9dea40bb328e`), completely
  unmodified.
- **The entire Bridge lives in `services/simulator/bridge-overlay/`**, in
  *this* repo, and is only ever injected at Docker build time — never
  committed into, or modified within, the Velxio checkout itself.

## How the zero-modification mechanism works

**Frontend**: `frontend/vite.config.ts` aliases `@pro` to a no-op stub
directory by default, or to whatever `PRO_OVERLAY_PATH` points at when
`VITE_PRO_BUILD=true` is set at build time. `frontend/src/main.tsx`
dynamically `import('@pro/index')` and calls its exported `mountPro()`.
Our overlay (`bridge-overlay/frontend/`) mirrors the stub's file layout
(`index.ts`, plus the handful of other files something in the OSS tree
statically imports — `data/proExamples.ts`, `desktop_index.ts`,
`pages/marketing.ts`, `i18n/register.ts`) and implements `mountPro()` for
real. A stable `@velxio` alias (→ `frontend/src`) lets our overlay import
OSS stores/utilities (`useSimulatorStore`, `useEditorStore`,
`proSaveAction`, `vlxFile`) without any relative-path coupling to how the
overlay happens to be laid out on disk.

**Backend**: `backend/app/main.py` already does, unconditionally, on
every boot:

```python
try:
    from app.pro import register_pro
    register_pro(app)
except ImportError:
    pass
```

If no `backend/app/pro/` package exists (the normal OSS case), this is a
silent no-op. Our Docker build `COPY`s `bridge-overlay/backend/pro/` into
that exact path in the image, and `register_pro(app)` wires our hooks
into `app.core.hooks` (the OSS/pro seam documented in Velxio's own
`CLAUDE.md`) — `get_current_user_id` and `record_compile` for now (see
`services/simulator/README.md` for what's implemented vs. deferred).

Net effect: **the diff against upstream Velxio is zero files.** This is
stronger than the Phase 0 plan's "keep the diff small" goal, not a
shortcut around it — it's Velxio's own documented, author-endorsed
extension path.

## Why this doesn't need AGPL copyleft on the Bridge itself

AGPLv3's obligation (§13) is to make the *Corresponding Source of the
version you're running, including any modifications you've made*
available to users who interact with it over a network. We are not
distributing a modified Velxio — the checkout is byte-for-byte upstream
at a pinned commit; our code never enters it, before or after the build.
It's loaded through an extension point Velxio's own author built
specifically so a commercial, closed-source product (`velxio-prod`) can
exist alongside the AGPL core without that product itself being AGPL —
strong evidence the intended reading of "modification" here doesn't reach
code loaded this way. We're using the identical mechanism for the same
purpose.

This is a reasonable, defensible position — not a settled legal fact. If
it's ever seriously contested, the clean fallback is already documented:
buy Velxio's Commercial License (`COMMERCIAL_LICENSE.md`,
davidmonterocrespo24@gmail.com), which removes the question entirely.

## What AGPL still requires of us

Even running Velxio completely unmodified, §13 still applies to **Velxio
itself**: anyone interacting with our embedded instance over the network
must be able to get its Corresponding Source. Since we run it unmodified,
this is simple — the Circuit Lab page shows a visible "Source Code" link
to `https://github.com/davidmonterocrespo24/velxio` at the exact pinned
commit we run. No fork-specific link is needed because there is no fork.

## Rules (binding for Phase 2 and after)

1. **Never commit anything into `services/simulator/velxio`.** It is a
   read-only pinned submodule. A version bump is a deliberate, reviewed
   change to the pinned SHA — never an in-place edit.
2. **The Bridge is overlay-only.** Everything EngUvers-specific
   (`bridge-overlay/frontend`, `bridge-overlay/backend/pro`) lives in
   *this* repo and is injected solely via `VITE_PRO_BUILD` +
   `PRO_OVERLAY_PATH` (frontend) and a Docker `COPY` into
   `backend/app/pro/` (backend) — both at image build time, never by
   patching the submodule.
3. **The Circuit Lab page must show the AGPL source-code link** (pinned
   commit) for as long as we run Velxio under AGPLv3.
4. If a feature ever genuinely requires modifying Velxio's own source
   (not just extending it through `app.core.hooks` /
   `proSaveAction`/`proSession`/`proRoutes` / the `@pro` alias), that is a
   deliberate escalation: fork it for real, keep `LICENSE` + attribution,
   add the fork's own "Source Code" link, and update this document —
   don't quietly patch the submodule in place.
