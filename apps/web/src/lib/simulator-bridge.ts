/**
 * postMessage contract with the embedded Circuit Lab (Velxio) iframe.
 * The other side of this contract lives in
 * services/simulator/bridge-overlay/frontend/index.ts — keep both in
 * sync when the message shapes change.
 */
export type InboundToSimulator =
  | { type: 'LOAD_PROJECT'; project: unknown }
  | { type: 'REQUEST_EXPORT' }
  | { type: 'SET_LOCALE'; locale: string }
  | { type: 'SET_READONLY'; readOnly: boolean }
  | { type: 'SET_ALLOWED_BOARDS'; boards: string[] };

export type OutboundFromSimulator =
  | { type: 'READY' }
  | { type: 'PROJECT_DATA'; payload: unknown }
  | { type: 'PROJECT_CHANGED'; payload: unknown }
  | { type: 'COMPILE_RESULT'; success: boolean }
  | { type: 'SIM_STATE'; running: boolean }
  | { type: 'SERIAL_OUTPUT'; output: string };

export function sendToSimulator(
  iframe: HTMLIFrameElement | null,
  simulatorOrigin: string,
  message: InboundToSimulator,
): void {
  iframe?.contentWindow?.postMessage(message, simulatorOrigin);
}

export function isSimulatorMessage(
  event: MessageEvent,
  simulatorOrigin: string,
): event is MessageEvent<OutboundFromSimulator> {
  return event.origin === simulatorOrigin && !!(event.data as { type?: string })?.type;
}
