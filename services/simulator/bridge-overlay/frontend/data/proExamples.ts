// EngUvers does not ship extra example projects through this seam — same
// as the OSS default (frontend/src/__pro_stub__/data/proExamples.ts).
// Kept identical so `@pro/data/proExamples`, statically imported by
// `data/examples.ts`, resolves to the same empty list our overlay doesn't
// intend to change.
import type { ExampleProject } from '@velxio/data/examples';

export const proExamples: ExampleProject[] = [];
