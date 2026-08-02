/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Page } from 'puppeteer';

export interface CallOfferOptions {
  isVideo?: boolean;
}

export interface IncomingCallAudioChunk {
  mimeType: string;
  data: string;
  sequence: number;
  timestamp: number;
}

export interface IncomingAudioCaptureOptions {
  timesliceMs?: number;
}

export interface BrowserIncomingCall {
  id: string;
  peerJid: string;
  offerTime: number;
  isVideo: boolean;
  isGroup: boolean;
  outgoing: boolean;
}

const AUDIO_CHUNK_CALLBACK = '__wppconnectIncomingCallAudioChunk';
const AUDIO_ENDED_CALLBACK = '__wppconnectIncomingCallAudioEnded';
const INCOMING_CALL_CALLBACK = '__wppconnectIncomingCallDetected';
const incomingAudioHandlers = new WeakMap<
  Page,
  Set<(chunk: IncomingCallAudioChunk) => void | Promise<void>>
>();
const incomingAudioEndedHandlers = new WeakMap<
  Page,
  Set<() => void | Promise<void>>
>();
const incomingCallHandlers = new WeakMap<
  Page,
  (call: BrowserIncomingCall) => void | Promise<void>
>();

/**
 * Watches the modern WhatsApp CallStore directly. The legacy WAPI
 * onIncomingCall hook no longer fires reliably on recent WhatsApp Web builds.
 */
export async function installIncomingCallWatcher(
  page: Page,
  onCall: (call: BrowserIncomingCall) => void | Promise<void>
): Promise<void> {
  incomingCallHandlers.set(page, onCall);
  try {
    await page.exposeFunction(
      INCOMING_CALL_CALLBACK,
      async (call: BrowserIncomingCall) => {
        const handler = incomingCallHandlers.get(page);
        if (handler) await handler(call);
      }
    );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('already exists')
    ) {
      throw error;
    }
  }

  await page.evaluate(
    ({ callbackName }) => {
      const scope = globalThis as any;
      if (scope.__wppconnectIncomingCallWatcherInstalled) return;
      const store = scope.WPP?.whatsapp?.CallStore;
      if (!store) throw new Error('WhatsApp CallStore is not available');
      let ongoingStore: any;
      try {
        const module =
          scope.importNamespace?.('WAWebVoipOngoingCallCollection') ||
          scope.require?.('WAWebVoipOngoingCallCollection');
        ongoingStore = module?.WAWebVoipOngoingCallCollection;
      } catch {
        ongoingStore = undefined;
      }

      scope.__wppconnectIncomingCallWatcherInstalled = true;
      const seen = new Set<string>();
      const serialize = (call: any): BrowserIncomingCall => ({
        id: String(call.id || call.callId || call.getCallId?.() || ''),
        peerJid:
          call.peerJid?.toString?.() ||
          call.peerWid?.toString?.() ||
          call.chatId?.toString?.() ||
          String(call.peerJid || call.peerWid || call.chatId || ''),
        offerTime: Number(call.offerTime || 0),
        isVideo: Boolean(call.isVideo),
        isGroup: Boolean(call.isGroup),
        outgoing: Boolean(call.outgoing),
      });
      const emit = async (call: any) => {
        const value = serialize(call);
        if (!value.id || value.outgoing || seen.has(value.id)) return;
        seen.add(value.id);
        await scope[callbackName](value);
      };

      store.on('add', (call: any) => void emit(call));
      store.on('change', (call: any) => void emit(call));
      ongoingStore?.on?.('add', (call: any) => void emit(call));
      ongoingStore?.on?.('change', (call: any) => void emit(call));
      const modelsOf = (collection: any): any[] => {
        if (!collection) return [];
        if (typeof collection.getModelsArray === 'function') {
          return collection.getModelsArray();
        }
        if (Array.isArray(collection.models)) return collection.models;
        const models = collection._models;
        if (models instanceof Map) return [...models.values()];
        if (Array.isArray(models)) return models;
        return models && typeof models === 'object'
          ? Object.values(models)
          : [];
      };
      const scan = () => {
        const nowSeconds = Date.now() / 1000;
        store.getModelsArray().forEach((call: any) => {
          if (Number(call.offerTime || 0) >= nowSeconds - 120) void emit(call);
        });
        modelsOf(ongoingStore).forEach((call: any) => void emit(call));

        // The native VoIP UI is the authoritative incoming-call surface on
        // current WhatsApp Web builds. Some offers are rendered there without
        // being mirrored to either exported call collection.
        const nativeAnswerVisible = [
          ...document.querySelectorAll<HTMLElement>('button, [role="button"]'),
        ].some((element) => {
          const label = [
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
            element.textContent,
          ]
            .filter(Boolean)
            .join(' ');
          return (
            /\b(atender|aceitar|answer|accept)\b/i.test(label) &&
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden'
          );
        });
        if (nativeAnswerVisible && !scope.__wppconnectNativeIncomingVisible) {
          scope.__wppconnectNativeIncomingVisible = true;
          void emit({
            id: `native-ui-${Date.now()}`,
            peerJid: '',
            offerTime: Date.now() / 1000,
            isVideo: false,
            isGroup: false,
            outgoing: false,
          });
        } else if (!nativeAnswerVisible) {
          scope.__wppconnectNativeIncomingVisible = false;
        }
      };
      scan();

      // Recent WhatsApp Web builds update CallStore without reliably emitting
      // the Backbone-style add/change events. Keep a lightweight fallback scan
      // so an incoming call cannot be missed; `seen` keeps delivery idempotent.
      scope.__wppconnectIncomingCallWatcherTimer = setInterval(scan, 500);
    },
    { callbackName: INCOMING_CALL_CALLBACK }
  );
}

export function normalizeCallDestination(phone: string): string {
  const trimmed = phone.trim();

  if (/^\d+@(c|lid)\.us$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    throw new Error('Parameter phone must contain a WhatsApp number');
  }

  return `${digits}@c.us`;
}

export async function enableCallInterface(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const scope = globalThis as any;
    const activation = (
      globalThis as typeof globalThis & { WPP: any }
    ).WPP.call.enableCallInterface();

    // On current WhatsApp Web builds WA-JS applies the call interface but its
    // promise may remain pending indefinitely. Do not block the HTTP request
    // (and consequently auto-answer) after the activation was dispatched.
    await Promise.race([
      Promise.resolve(activation),
      new Promise<void>((resolve) => setTimeout(resolve, 3_000)),
    ]);

    // WA-JS currently discovers Meta modules by their exported function
    // shape. Recent WhatsApp builds register the VoIP modules by stable Meta
    // identifiers but wrap their exports, so the shape lookup can remain
    // unresolved. Fall back to the official module identifiers and initialize
    // the backend explicitly.
    const importModule = (id: string) => {
      try {
        return scope.importNamespace?.(id) || scope.require?.(id);
      } catch {
        return undefined;
      }
    };
    const loadable = importModule('WAWebVoipBackendLoadable');
    const requireBackend =
      loadable?.requireVoipJsBackend ||
      loadable?.default?.requireVoipJsBackend ||
      (typeof loadable?.default === 'function' ? loadable.default : undefined);
    let backend: any;
    if (typeof requireBackend === 'function') {
      backend = await requireBackend();
    }
    const initModule = backend?.WAWebVoipInit || importModule('WAWebVoipInit');
    const initialize =
      initModule?.initWAWebVoip || initModule?.default?.initWAWebVoip;
    if (typeof initialize === 'function') {
      await initialize();
    }
    const ensureModule = importModule('WAWebEnsureVoipInited');
    const ensureInitialized =
      ensureModule?.ensureVoipInitialized ||
      ensureModule?.default?.ensureVoipInitialized;
    if (typeof ensureInitialized === 'function') {
      await ensureInitialized();
    }
  });
}

export async function getCallInterfaceDiagnostics(
  page: Page
): Promise<unknown> {
  return page.evaluate(async () => {
    const scope = globalThis as any;
    const whatsapp = scope.WPP?.whatsapp;
    let backend: any;
    let backendError: string | undefined;
    let stack: any;
    let stackError: string | undefined;
    let matchingModuleIds: string[] = [];
    const directModules: Record<string, unknown> = {};
    let recentOngoingCalls: unknown[] = [];
    let voipInitState: unknown;
    const functionKeys = (value: any) =>
      value
        ? Object.keys(value)
            .filter((key) => typeof value[key] === 'function')
            .sort()
        : [];
    try {
      const modulesMap = scope.require?.('__debug')?.modulesMap || {};
      matchingModuleIds = Object.keys(modulesMap)
        .filter((id) => /voip|call/i.test(id))
        .sort();
      for (const id of [
        'WAWebVoipBackendLoadable',
        'WAWebVoipInit',
        'WAWebEnsureVoipInited',
        'WAWebVoipStackInterface',
        'WAWebVoipStackInterfaceImpl',
        'WAWebVoipOngoingCallCollection',
        'WAWebVoipLocalCallStateStore',
        'WAWebVoipInitEventEmitter',
        'WAWebCallNotificationBus',
        'WAWebVoipHandleNativeCallEvent',
        'WAWebNotificationsCallNotification',
      ]) {
        try {
          const module = scope.importNamespace?.(id) || scope.require?.(id);
          directModules[id] = {
            keys: module ? Object.keys(module).sort() : [],
            functionKeys: functionKeys(module),
            exports: module
              ? Object.fromEntries(
                  Object.entries(module).map(([key, value]) => [
                    key,
                    {
                      type: typeof value,
                      keys:
                        value && typeof value === 'object'
                          ? Object.keys(value).sort()
                          : [],
                      prototypeMethods:
                        value &&
                        (typeof value === 'object' ||
                          typeof value === 'function')
                          ? Object.getOwnPropertyNames(
                              Object.getPrototypeOf(value) || {}
                            )
                              .filter(
                                (name) =>
                                  name !== 'constructor' &&
                                  typeof (value as any)[name] === 'function'
                              )
                              .sort()
                          : [],
                    },
                  ])
                )
              : {},
          };
        } catch (error) {
          directModules[id] = {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
      try {
        const ongoingModule =
          scope.importNamespace?.('WAWebVoipOngoingCallCollection') ||
          scope.require?.('WAWebVoipOngoingCallCollection');
        const collection = ongoingModule?.WAWebVoipOngoingCallCollection;
        const rawModels = collection?._models;
        const models =
          typeof collection?.getModelsArray === 'function'
            ? collection.getModelsArray()
            : rawModels instanceof Map
            ? [...rawModels.values()]
            : Array.isArray(rawModels)
            ? rawModels
            : rawModels && typeof rawModels === 'object'
            ? Object.values(rawModels)
            : [];
        recentOngoingCalls = models.slice(-10).map((model: any) => ({
          keys: Object.keys(model).sort(),
          primitiveFields: Object.fromEntries(
            Object.entries(model).filter(
              ([, value]) =>
                value == null ||
                ['string', 'number', 'boolean'].includes(typeof value)
            )
          ),
          id: String(model.id || model.callId || model.getCallId?.() || ''),
          peerJid:
            model.peerJid?.toString?.() ||
            model.peerWid?.toString?.() ||
            model.chatId?.toString?.() ||
            '',
        }));
      } catch {
        recentOngoingCalls = [];
      }
      try {
        const initEventModule =
          scope.importNamespace?.('WAWebVoipInitEventEmitter') ||
          scope.require?.('WAWebVoipInitEventEmitter');
        const emitter = initEventModule?.VoipInitEventEmitter;
        voipInitState = {
          initialized: emitter?.getIsVoipInited?.(),
          error: emitter?.getDidVoipInitError?.(),
          failureClass: emitter?.getVoipInitFailureClass?.(),
        };
      } catch (error) {
        voipInitState = {
          diagnosticError:
            error instanceof Error ? error.message : String(error),
        };
      }
    } catch {
      // The diagnostic remains useful on legacy webpack builds.
    }
    try {
      backend = await whatsapp?.requireVoipJsBackend?.();
    } catch (error) {
      backendError = error instanceof Error ? error.message : String(error);
    }
    try {
      stack = await whatsapp?.getVoipStackInterface?.();
    } catch (error) {
      stackError = error instanceof Error ? error.message : String(error);
    }
    return {
      crossOriginIsolated: scope.crossOriginIsolated,
      sharedArrayBuffer: typeof scope.SharedArrayBuffer === 'function',
      audioContext: typeof scope.AudioContext === 'function',
      rtcPeerConnection: typeof scope.RTCPeerConnection === 'function',
      mediaDevices: Boolean(scope.navigator?.mediaDevices),
      callStore: Boolean(whatsapp?.CallStore),
      recentCalls: whatsapp?.CallStore
        ? whatsapp.CallStore.getModelsArray()
            .slice(-10)
            .map((call: any) => ({
              id: String(call.id || ''),
              peerJid: call.peerJid?.toString?.() || String(call.peerJid || ''),
              offerTime: Number(call.offerTime || 0),
              state: call.getState?.(),
              outgoing: Boolean(call.outgoing),
              wasEverConnected: Boolean(call.wasEverConnected),
            }))
        : [],
      recentOngoingCalls,
      voipInitState,
      whatsappVoipKeys: whatsapp
        ? Object.keys(whatsapp)
            .filter((key) => /voip|call/i.test(key))
            .sort()
        : [],
      matchingModuleIds,
      directModules,
      callingEnabled: whatsapp?.isCallingEnabled?.(),
      unsupportedBrowser: whatsapp?.isUnsupportedBrowserForWebCalling?.(),
      voipDownloadEnabled: whatsapp?.isVoipDownloadEnabled?.(),
      backendError,
      backendKeys: backend ? Object.keys(backend).sort() : [],
      backendFunctionKeys: functionKeys(backend),
      backendModuleFunctionKeys: backend
        ? Object.fromEntries(
            Object.entries(backend)
              .filter(([, value]) => value && typeof value === 'object')
              .map(([key, value]) => [key, functionKeys(value)])
              .filter(([, keys]) => (keys as string[]).length)
          )
        : {},
      stackError,
      stackKeys: stack ? Object.keys(stack).sort() : [],
      stackFunctionKeys: functionKeys(stack),
    };
  });
}

export async function acceptCall(
  page: Page,
  callId?: string
): Promise<boolean> {
  return page.evaluate(
    async ({ callId }) => {
      const scope = globalThis as typeof globalThis & { WPP: any };
      const nativeAnswerAvailable = [
        ...document.querySelectorAll<HTMLElement>('button, [role="button"]'),
      ].some((element) => {
        const label = [
          element.getAttribute('aria-label'),
          element.getAttribute('title'),
          element.textContent,
        ]
          .filter(Boolean)
          .join(' ');
        return (
          /\b(atender|aceitar|answer|accept)\b/i.test(label) &&
          element.getClientRects().length > 0
        );
      });
      const call = nativeAnswerAvailable
        ? undefined
        : callId
        ? scope.WPP.whatsapp.CallStore.get(callId)
        : scope.WPP.whatsapp.CallStore.getModelsArray().find(
            (item: any) => item.getState?.() === 3 && !item.outgoing
          );
      const waitForPeerConnection = async (timeoutMs = 8_000) =>
        new Promise<boolean>((resolve) => {
          const deadline = Date.now() + timeoutMs;
          const inspect = () => {
            const peerConnections = [
              ...((scope as any).__wppconnectCallPeerConnections || []),
            ];
            const connected = peerConnections.some(
              (connection: RTCPeerConnection) =>
                connection.connectionState === 'connected' ||
                connection.iceConnectionState === 'connected' ||
                connection.iceConnectionState === 'completed'
            );
            if (connected) resolve(true);
            else if (Date.now() >= deadline) resolve(false);
            else setTimeout(inspect, 100);
          };
          inspect();
        });

      if (!call) {
        const elements = [
          ...document.querySelectorAll<HTMLElement>('button, [role="button"]'),
        ];
        const labelOf = (element: HTMLElement) =>
          [
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
            element.getAttribute('data-testid'),
            element.textContent,
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        const answerPattern = /\b(atender|aceitar|answer|accept)\b/i;
        const rejectPattern = /\b(rejeitar|recusar|decline|reject|ignore)\b/i;
        const answerButton = elements.find((element) => {
          const label = labelOf(element);
          const style = getComputedStyle(element);
          return (
            answerPattern.test(label) &&
            !rejectPattern.test(label) &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            element.getClientRects().length > 0
          );
        });
        if (!answerButton) {
          const visibleLabels = elements
            .filter((element) => element.getClientRects().length > 0)
            .map(labelOf)
            .filter(Boolean)
            .slice(0, 100);
          throw new Error(
            `Native WhatsApp answer button not found; visible controls=${JSON.stringify(
              visibleLabels
            )}`
          );
        }
        answerButton.click();
        if (!(await waitForPeerConnection())) {
          throw new Error(
            `Native WhatsApp answer button was clicked but WebRTC did not connect (control=${labelOf(
              answerButton
            )})`
          );
        }
        return true;
      }

      const state = call.getState?.();
      const peerJid = call.peerJid;
      const isLid = peerJid?.toString?.().endsWith('@lid');
      if (state !== 3 && !isLid) return scope.WPP.call.accept(callId);

      // WA-JS 4.4.3 still compares the current numeric incoming-ring state with
      // the legacy string and its E2E preflight cannot process a LID. The call
      // offer has already established the LID session, so adapt only for the
      // duration of accept and restore both methods immediately afterwards.
      const originalGetState = call.getState;
      const originalIsGroupCall = peerJid?.isGroupCall;
      const originalToString = peerJid?.toString;
      let phoneNumber: string | undefined;
      if (isLid) {
        const entry = await scope.WPP.contact.getPnLidEntry(peerJid);
        phoneNumber = entry?.phoneNumber?._serialized;
      }
      if (state === 3) call.getState = () => 'INCOMING_RING';
      if (isLid && originalIsGroupCall) peerJid.isGroupCall = () => true;
      if (phoneNumber && originalToString) {
        peerJid.toString = () => phoneNumber;
      }
      try {
        await Promise.race([
          scope.WPP.call.accept(callId || String(call.id)),
          new Promise<void>((_, reject) =>
            setTimeout(
              () => reject(new Error('Timed out sending the call acceptance')),
              3_000
            )
          ),
        ]);

        const connected =
          call.wasEverConnected === true || (await waitForPeerConnection());
        if (!connected) {
          throw new Error(
            `WhatsApp did not confirm call connection (state=${String(
              call.getState?.()
            )}, wasEverConnected=${String(call.wasEverConnected)})`
          );
        }
        return true;
      } finally {
        call.getState = originalGetState;
        if (isLid && originalIsGroupCall) {
          peerJid.isGroupCall = originalIsGroupCall;
        }
        if (phoneNumber && originalToString) {
          peerJid.toString = originalToString;
        }
      }
    },
    { callId }
  );
}

export async function endCall(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    (globalThis as typeof globalThis & { WPP: any }).WPP.call.end()
  );
}

/**
 * Sends WhatsApp's call signalling offer. WA-JS does not attach or transport
 * audio/video media tracks through this method.
 */
export async function offerCall(
  page: Page,
  phone: string,
  options: CallOfferOptions = {}
): Promise<unknown> {
  const to = normalizeCallDestination(phone);
  return page.evaluate(
    ({ to, isVideo }) =>
      (globalThis as typeof globalThis & { WPP: any }).WPP.call.offer(to, {
        isVideo,
      }),
    { to, isVideo: Boolean(options.isVideo) }
  );
}

/**
 * Experimental incoming WebRTC audio capture. It must be installed before the
 * call peer connection receives its remote track.
 */
export async function installIncomingAudioCapture(
  page: Page,
  onChunk?: (chunk: IncomingCallAudioChunk) => void | Promise<void>,
  options: IncomingAudioCaptureOptions = {},
  onEnded?: () => void | Promise<void>
): Promise<void> {
  let handlers = incomingAudioHandlers.get(page);
  if (!handlers) {
    handlers = new Set();
    incomingAudioHandlers.set(page, handlers);
    const dispatch = async (chunk: IncomingCallAudioChunk) => {
      const activeHandlers = incomingAudioHandlers.get(page);
      if (!activeHandlers) return;
      await Promise.allSettled(
        [...activeHandlers].map((handler) => handler(chunk))
      );
    };
    try {
      await page.exposeFunction(AUDIO_CHUNK_CALLBACK, dispatch);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('already exists')
      ) {
        throw error;
      }
    }
    const dispatchEnded = async () => {
      const activeHandlers = incomingAudioEndedHandlers.get(page);
      if (!activeHandlers) return;
      await Promise.allSettled([...activeHandlers].map((handler) => handler()));
    };
    try {
      await page.exposeFunction(AUDIO_ENDED_CALLBACK, dispatchEnded);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('already exists')
      ) {
        throw error;
      }
    }
  }
  if (onChunk) handlers.add(onChunk);
  let endedHandlers = incomingAudioEndedHandlers.get(page);
  if (!endedHandlers) {
    endedHandlers = new Set();
    incomingAudioEndedHandlers.set(page, endedHandlers);
  }
  if (onEnded) endedHandlers.add(onEnded);

  const timesliceMs = Math.max(100, options.timesliceMs ?? 250);
  await page.evaluate(
    ({ callbackName, endedCallbackName, timesliceMs }) => {
      const scope = globalThis as any;
      if (scope.__wppconnectCallAudioCaptureInstalled) return;

      scope.__wppconnectCallAudioCaptureInstalled = true;
      scope.__wppconnectCallAudioCaptures = new Set<AudioContext>();
      scope.__wppconnectCallPeerConnections = new Set<RTCPeerConnection>();
      scope.__wppconnectCallAudioCaptureDiagnostics = {
        callbackErrors: [],
        dataEvents: 0,
      };
      let sequence = 0;

      const captureTrack = (track: MediaStreamTrack) => {
        if (track.kind !== 'audio') return;

        const stream = new MediaStream([track]);
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const processor = context.createScriptProcessor(2048, 1, 1);
        const silentSink = context.createGain();
        silentSink.gain.value = 0;
        const samples: number[] = [];
        const targetSamples = Math.round(
          context.sampleRate * (timesliceMs / 1000)
        );
        scope.__wppconnectCallAudioCaptures.add(context);
        let ended = false;
        const notifyEnded = async () => {
          if (ended) return;
          ended = true;
          try {
            await scope[endedCallbackName]();
          } catch (error) {
            scope.__wppconnectCallAudioCaptureDiagnostics.callbackErrors.push(
              String(error)
            );
          }
        };

        processor.onaudioprocess = async (event) => {
          scope.__wppconnectCallAudioCaptureDiagnostics.dataEvents++;
          const input = event.inputBuffer.getChannelData(0);
          for (const sample of input) samples.push(sample);
          if (samples.length < targetSamples) return;

          const chunk = samples.splice(0, targetSamples);
          const pcm = new Int16Array(chunk.length);
          for (let index = 0; index < pcm.length; index++) {
            const sample = Math.max(-1, Math.min(1, chunk[index]));
            pcm[index] = sample < 0 ? sample * 32768 : sample * 32767;
          }
          const bytes = new Uint8Array(pcm.buffer);
          let binary = '';
          for (const byte of bytes) binary += String.fromCharCode(byte);
          try {
            await scope[callbackName]({
              mimeType: `audio/pcm;rate=${context.sampleRate};encoding=signed-integer;bits=16`,
              data: btoa(binary),
              sequence: sequence++,
              timestamp: Date.now(),
            });
          } catch (error) {
            scope.__wppconnectCallAudioCaptureDiagnostics.callbackErrors.push(
              String(error)
            );
          }
        };
        source.connect(processor);
        processor.connect(silentSink).connect(context.destination);
        void context.resume();
        track.addEventListener(
          'ended',
          () => {
            processor.disconnect();
            source.disconnect();
            void context.close();
            scope.__wppconnectCallAudioCaptures.delete(context);
            void notifyEnded();
          },
          { once: true }
        );
      };

      const originalAddTrack = RTCPeerConnection.prototype.addEventListener;
      const instrument = (connection: RTCPeerConnection) => {
        if ((connection as any).__wppconnectAudioCaptureAttached) return;
        (connection as any).__wppconnectAudioCaptureAttached = true;
        scope.__wppconnectCallPeerConnections.add(connection);
        connection.addEventListener('connectionstatechange', () => {
          if (connection.connectionState === 'closed') {
            scope.__wppconnectCallPeerConnections.delete(connection);
          }
        });
        originalAddTrack.call(connection, 'track', (event: Event) => {
          captureTrack((event as RTCTrackEvent).track);
        });
      };

      const originalSetRemoteDescription =
        RTCPeerConnection.prototype.setRemoteDescription;
      RTCPeerConnection.prototype.setRemoteDescription = function (...args) {
        instrument(this);
        return originalSetRemoteDescription.apply(this, args as any);
      };
    },
    {
      callbackName: AUDIO_CHUNK_CALLBACK,
      endedCallbackName: AUDIO_ENDED_CALLBACK,
      timesliceMs,
    }
  );
}

export async function stopIncomingAudioCapture(page: Page): Promise<void> {
  incomingAudioHandlers.delete(page);
  incomingAudioEndedHandlers.delete(page);
  await page.evaluate(() => {
    const scope = globalThis as any;
    const captures = scope.__wppconnectCallAudioCaptures as
      | Set<AudioContext>
      | undefined;
    captures?.forEach((context) => {
      void context.close();
    });
    captures?.clear();
  });
}

export async function stopOutgoingAudio(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const scope = globalThis as any;
    const bridge = scope.__wppconnectOutgoingAudio;
    if (!bridge) return;
    if (bridge.kind === 'generator') {
      await bridge.writer.close();
      bridge.track.stop();
    } else {
      bridge.queue.length = 0;
      bridge.clock.stop();
      await bridge.context.close();
    }
    delete scope.__wppconnectOutgoingAudio;
  });
}

export async function pushOutgoingPcm16(
  page: Page,
  base64Data: string,
  sampleRate = 48_000
): Promise<boolean> {
  if (!base64Data) throw new Error('Audio data is required');
  if (base64Data.length > 350_000) {
    throw new Error('Audio chunk exceeds the 256 KiB limit');
  }
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate < 8_000 ||
    sampleRate > 48_000
  ) {
    throw new Error('sampleRate must be between 8000 and 48000');
  }

  return page.evaluate(
    async ({ base64Data, sampleRate }) => {
      const scope = globalThis as any;
      const connections = scope.__wppconnectCallPeerConnections as
        | Set<RTCPeerConnection>
        | undefined;
      const candidates = connections ? [...connections] : [];
      const audioSenderFor = (item: RTCPeerConnection) =>
        item.getSenders().find((sender) => sender.track?.kind === 'audio') ||
        item
          .getTransceivers()
          .find(
            (transceiver) =>
              transceiver.receiver.track?.kind === 'audio' ||
              transceiver.sender.track?.kind === 'audio'
          )?.sender;
      const connection =
        candidates.find(
          (item) =>
            (item.connectionState === 'connected' ||
              item.iceConnectionState === 'connected' ||
              item.iceConnectionState === 'completed') &&
            audioSenderFor(item)
        ) ||
        candidates.find(
          (item) => item.connectionState !== 'closed' && audioSenderFor(item)
        );
      if (!connection) return false;
      const sender = audioSenderFor(connection);
      if (!sender) return false;

      if (
        !scope.__wppconnectOutgoingAudio &&
        scope.MediaStreamTrackGenerator &&
        scope.AudioData
      ) {
        const track = new scope.MediaStreamTrackGenerator({ kind: 'audio' });
        scope.__wppconnectOutgoingAudio = {
          framesWritten: 0,
          kind: 'generator',
          lastPeak: 0,
          nextTimestamp: 0,
          sampleRate,
          track,
          writer: track.writable.getWriter(),
        };
      }

      if (!scope.__wppconnectOutgoingAudio) {
        const context = new AudioContext({ sampleRate });
        const source = context.createScriptProcessor(2048, 1, 1);
        const destination = context.createMediaStreamDestination();
        const clock = context.createConstantSource();
        clock.offset.value = 0;
        const queue: number[] = [];
        let offset = 0;
        source.onaudioprocess = (event) => {
          const output = event.outputBuffer.getChannelData(0);
          for (let index = 0; index < output.length; index++) {
            output[index] = queue[offset++] ?? 0;
          }
          if (offset > 8_192) {
            queue.splice(0, offset);
            offset = 0;
          }
        };
        clock.connect(source);
        source.connect(destination);
        clock.start();
        await context.resume();
        scope.__wppconnectOutgoingAudio = {
          kind: 'web-audio',
          context,
          clock,
          destination,
          sampleRate,
          get offset() {
            return offset;
          },
          queue,
        };
      }

      const bridge = scope.__wppconnectOutgoingAudio;
      if (bridge.sampleRate !== sampleRate) {
        throw new Error(
          `Cannot change sampleRate from ${bridge.sampleRate} to ${sampleRate} during a call`
        );
      }
      const binary = atob(base64Data);
      let track: MediaStreamTrack;
      if (bridge.kind === 'generator') {
        const samples = new Int16Array(Math.floor(binary.length / 2));
        let peak = 0;
        for (let index = 0; index < samples.length; index++) {
          const offset = index * 2;
          const value =
            binary.charCodeAt(offset) | (binary.charCodeAt(offset + 1) << 8);
          samples[index] = value > 32767 ? value - 65536 : value;
          peak = Math.max(peak, Math.abs(samples[index]));
        }
        bridge.lastPeak = peak;
        track = bridge.track;
        if (sender.track !== track) await sender.replaceTrack(track);

        const frameSize = Math.max(1, Math.round(sampleRate / 50));
        for (let offset = 0; offset < samples.length; offset += frameSize) {
          const frame = samples.subarray(
            offset,
            Math.min(offset + frameSize, samples.length)
          );
          const audioData = new scope.AudioData({
            data: frame,
            format: 's16',
            numberOfChannels: 1,
            numberOfFrames: frame.length,
            sampleRate,
            timestamp: bridge.nextTimestamp,
          });
          bridge.nextTimestamp += Math.round(
            (frame.length * 1_000_000) / sampleRate
          );
          try {
            await bridge.writer.write(audioData);
            bridge.framesWritten += frame.length;
          } finally {
            audioData.close();
          }
          if (offset + frameSize < samples.length) {
            await new Promise((resolve) =>
              setTimeout(resolve, (frame.length * 1_000) / sampleRate)
            );
          }
        }
      } else {
        for (let index = 0; index + 1 < binary.length; index += 2) {
          const value =
            binary.charCodeAt(index) | (binary.charCodeAt(index + 1) << 8);
          bridge.queue.push((value > 32767 ? value - 65536 : value) / 32768);
        }
        const bufferedSamples = bridge.queue.length - bridge.offset;
        if (bufferedSamples > sampleRate * 5) {
          bridge.queue.splice(bridge.offset, bufferedSamples - sampleRate * 5);
        }
        track = bridge.destination.stream.getAudioTracks()[0];
      }

      if (sender.track !== track) await sender.replaceTrack(track);
      return true;
    },
    { base64Data, sampleRate }
  );
}
