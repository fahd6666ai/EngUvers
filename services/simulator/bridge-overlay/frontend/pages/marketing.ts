// EngUvers doesn't use Velxio's SSR marketing pages — same no-op as the
// OSS default (`__pro_stub__/pages/marketing.ts`). Kept so a dynamic
// `import('@pro/pages/marketing')` from entry-server.tsx resolves, in the
// unlikely event our build path ever reaches SSR rendering.
import type React from 'react';

export const MARKETING_ROUTE_COMPONENTS: Record<string, React.FC> = {};
