/**
 * Default project a new Circuit Lab workspace starts from — Blink on an
 * Arduino Uno, matching Velxio's own default sketch (see
 * services/simulator/velxio/frontend/src/store/useEditorStore.ts's
 * DEFAULT_INO_CONTENT) and Phase 2's manual test target.
 *
 * Shape matches Velxio's own `.vlx` format (see
 * services/simulator/velxio/frontend/src/utils/vlxFile.ts) — the same
 * JSON this service stores in CircuitProject.vlxContent and sends over
 * the bridge as LOAD_PROJECT.
 *
 * Board id: Velxio's own `addBoard()` derives a board's file-group id as
 * `group-${boardId}`. Using `'arduino-uno'` as the board id (rather than
 * an arbitrary id like `'uno-1'`) matches the id it would assign to the
 * first board of this kind itself, so `activeFileGroupId` and the
 * `fileGroups` key below line up with what `loadProjectState` actually
 * creates — a mismatch here silently orphans the file content (the
 * board loads with an empty/default file group instead of this one).
 */
export function buildStarterVlxContent(name: string) {
  return {
    format: 'velxio-project',
    version: 1,
    exportedAt: new Date().toISOString(),
    name,
    boards: [
      {
        id: 'arduino-uno',
        boardKind: 'arduino-uno',
        x: 100,
        y: 100,
        activeFileGroupId: 'group-arduino-uno',
      },
    ],
    fileGroups: {
      'group-arduino-uno': [
        {
          name: 'sketch.ino',
          content: `// Arduino Blink Example
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}`,
        },
      ],
    },
    components: [],
    wires: [],
    activeBoardId: 'arduino-uno',
  };
}
