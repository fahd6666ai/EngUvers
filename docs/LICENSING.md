# Licensing — Velxio (Circuit Lab) separation

**Status: stub — filled in properly at the start of Phase 2**, once the
fork actually exists. This placeholder records the rules already decided
in the approved Phase 0 plan so they aren't lost between phases.

## Why this document exists

[Velxio](https://github.com/davidmonterocrespo24/velxio) is dual-licensed:
**AGPLv3** (free, copyleft) or a paid **Commercial License** (proprietary
use without the copyleft source-disclosure obligation) — see its own
`LICENSE` and `COMMERCIAL_LICENSE.md`. EngUvers uses the AGPLv3 path.
AGPLv3 §13 requires that if we modify Velxio and let users interact with
it over a network, we must offer those users the modified source.

## Rules (binding for Phase 2 and after)

1. **No Velxio code is ever copied into `apps/web` or `apps/api`.** It runs
   as a fully separate service (`services/simulator`), its own container,
   its own origin — never imported into EngUvers' own bundles or process.
2. **Any change to Velxio lives in our own fork**, not a patch queued
   against upstream. The fork keeps Velxio's `LICENSE`, its author
   attribution, and adds a visible "Source Code" link in the simulator's
   own UI pointing at our fork's repository (the AGPL §13 network-use
   disclosure).
3. **`services/simulator/velxio` is a git submodule pinned to one reviewed
   commit SHA** of our fork — never tracking a moving branch — so an
   upgrade is a deliberate, reviewed action.
4. **The Bridge is an overlay, not a core patch.** It is built entirely on
   extension seams Velxio already ships for this purpose:
   `backend/app/core/hooks.py` (`get_current_user_id`, `record_compile`,
   `compile_admission`, `compile_priority`, `iot_gateway_gate`, WS
   lifecycle hooks), `frontend/src/lib/proSaveAction.ts`, `proSession.ts`,
   `proRoutes.ts`. The diff against upstream should be small and mostly
   additive.
5. If deeper integration is ever needed than the overlay pattern supports,
   the Commercial License from Velxio's author
   (davidmonterocrespo24@gmail.com, see `COMMERCIAL_LICENSE.md` in the
   fork) is the documented path to drop the AGPL obligations above — not
   a reason to bypass them silently.

Full technical detail (postMessage contract, auth token flow, quota
enforcement) is in the approved Phase 0 plan's §4 and will move into
`services/simulator/README.md`'s real implementation notes once Phase 2
starts.
