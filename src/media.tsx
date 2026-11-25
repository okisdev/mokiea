import {
  Camera,
  ChevronDown,
  Check,
  Maximize,
  Minimize,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Button, IconButton } from './button';
import { Spinner } from './display';
import { Menu, type PopoverTrigger } from './overlay';

const gatherTimeoutMs = 4000;
/** A connection that carries no decodable frame this long after connecting means the browser cannot decode the codec. */
const frameTimeoutMs = 12_000;
const switchTimeoutMs = 30_000;
const idleMs = 3000;
/** Hidden tabs release the camera session and relay allocation after this long, and reconnect when shown again. */
const hiddenMs = 60_000;

export interface VideoLevel<L extends string = string> {
  value: L;
  label: string;
}

type Phase =
  | { kind: 'connecting' }
  | { kind: 'playing' }
  | { kind: 'paused' }
  | { kind: 'failed'; message: string };

interface Session {
  ready: Promise<void>;
  close: () => void;
}

function gathered(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, gatherTimeoutMs);
    function done() {
      clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    }
    function check() {
      if (pc.iceGatheringState === 'complete') done();
    }
    pc.addEventListener('icegatheringstatechange', check);
  });
}

function reason(error: unknown) {
  return error instanceof Error && error.message ? error.message : '连接失败';
}

/** Opens one receive-only connection into `element`; `ready` settles on its first decoded frame. */
function connect(
  element: HTMLVideoElement,
  iceServers: () => Promise<RTCIceServer[]>,
  negotiate: (offer: string) => Promise<string>,
  onDrop: () => void,
): Session {
  let pc: RTCPeerConnection | undefined;
  let closed = false;
  let framed = false;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const ready = new Promise<void>((resolve, reject) => {
    const fail = (message: string) => {
      if (!framed && !closed) reject(new Error(message));
    };
    const frame = () => {
      framed = true;
      clearTimeout(watchdog);
      resolve();
    };
    element.requestVideoFrameCallback(frame);
    (async () => {
      const servers = await iceServers();
      if (closed) return;
      const peer = new RTCPeerConnection({ iceServers: servers });
      pc = peer;
      peer.addTransceiver('video', { direction: 'recvonly' });
      peer.addTransceiver('audio', { direction: 'recvonly' });
      peer.addEventListener('track', (event) => {
        if (event.streams[0] && element.srcObject !== event.streams[0])
          element.srcObject = event.streams[0];
      });
      peer.addEventListener('connectionstatechange', () => {
        if (closed) return;
        if (peer.connectionState === 'connected' && !framed)
          watchdog = setTimeout(
            () => fail('画面无法解码，请换用 Chrome 或 Safari'),
            frameTimeoutMs,
          );
        if (peer.connectionState === 'failed') {
          if (framed) onDrop();
          else fail('无法建立画面连接');
        }
      });
      await peer.setLocalDescription(await peer.createOffer());
      await gathered(peer);
      const answer = await negotiate(peer.localDescription!.sdp);
      if (!closed) await peer.setRemoteDescription({ type: 'answer', sdp: answer });
    })().catch((error: unknown) => fail(reason(error)));
  });
  ready.catch(() => undefined);
  return {
    ready,
    close() {
      closed = true;
      clearTimeout(watchdog);
      pc?.close();
      element.srcObject = null;
    },
  };
}

function levelTrigger({ open, toggle }: PopoverTrigger, label: string | undefined) {
  return (
    <Button
      variant="ghost"
      size="sm"
      iconRight={<ChevronDown size={14} />}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={`清晰度：${label ?? ''}`}
      onClick={toggle}
    >
      {label}
    </Button>
  );
}

function stamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Plays a live WebRTC stream negotiated in one offer and answer, with every ICE candidate inside the SDP.
 * `levels` lists the qualities best first; switching keeps the current picture until the new one has a frame.
 */
export function LiveVideo<L extends string = string>({
  label,
  iceServers,
  negotiate,
  levels,
  defaultLevel,
  onLevelChange,
}: {
  /** Names what is shown; it labels the video and the saved snapshot. */
  label: string;
  iceServers: () => Promise<RTCIceServer[]>;
  negotiate: (offer: string, level?: L) => Promise<string>;
  levels?: VideoLevel<L>[];
  defaultLevel?: string;
  onLevelChange?: (value: L) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const videos = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);
  const initial =
    levels?.find((entry) => entry.value === defaultLevel)?.value ?? levels?.[0]?.value;
  const [chosen, setLevel] = useState<L | undefined>(initial);
  const level = chosen ?? initial;
  const [target, setTarget] = useState<L | undefined>();
  const [active, setActive] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<Phase>({ kind: 'connecting' });
  const [attempt, setAttempt] = useState(0);
  const [muted, setMuted] = useState(true);
  const [full, setFull] = useState<false | 'native' | 'page'>(false);
  const [idle, setIdle] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  const sessions = useRef<[Session | undefined, Session | undefined]>([undefined, undefined]);
  const generation = useRef(0);
  const live = useRef({ iceServers, negotiate, onLevelChange, level, active, phase });
  live.current = { iceServers, negotiate, onLevelChange, level, active, phase };
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const closeAll = () => {
    generation.current += 1;
    sessions.current.forEach((session) => session?.close());
    sessions.current = [undefined, undefined];
    setTarget(undefined);
  };

  useEffect(() => {
    const { iceServers, negotiate, level, active } = live.current;
    const element = videos.current[active];
    if (!element) return;
    closeAll();
    const run = generation.current;
    setPhase({ kind: 'connecting' });
    const session = connect(
      element,
      iceServers,
      (offer) => negotiate(offer, level),
      () => {
        if (sessions.current[live.current.active] === session)
          setPhase({ kind: 'failed', message: '画面连接已断开' });
      },
    );
    sessions.current[active] = session;
    session.ready.then(
      () => run === generation.current && setPhase({ kind: 'playing' }),
      (error: unknown) =>
        run === generation.current && setPhase({ kind: 'failed', message: reason(error) }),
    );
    return closeAll;
  }, [attempt]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onVisibility = () => {
      clearTimeout(timer);
      if (document.hidden)
        timer = setTimeout(() => {
          closeAll();
          setPhase({ kind: 'paused' });
        }, hiddenMs);
      else if (live.current.phase.kind === 'paused') setAttempt((n) => n + 1);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current ? 'native' : false);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (full !== 'page') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFull(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [full]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(undefined), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), idleMs);
  };

  const choose = (value: L) => {
    const { iceServers, negotiate, onLevelChange, level, active, phase } = live.current;
    if (value === level || value === target) return;
    if (phase.kind !== 'playing') {
      setLevel(value);
      live.current.level = value;
      onLevelChange?.(value);
      setAttempt((n) => n + 1);
      return;
    }
    const next = active === 0 ? 1 : 0;
    const element = videos.current[next];
    if (!element) return;
    sessions.current[next]?.close();
    const run = generation.current;
    setTarget(value);
    const session = connect(
      element,
      iceServers,
      (offer) => negotiate(offer, value),
      () => {
        if (sessions.current[live.current.active] === session)
          setPhase({ kind: 'failed', message: '画面连接已断开' });
      },
    );
    sessions.current[next] = session;
    let timer: ReturnType<typeof setTimeout> | undefined;
    Promise.race([
      session.ready,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), switchTimeoutMs);
      }),
    ]).then(
      () => {
        clearTimeout(timer);
        if (run !== generation.current) return;
        sessions.current[active]?.close();
        sessions.current[active] = undefined;
        setActive(next);
        setLevel(value);
        setTarget(undefined);
        onLevelChange?.(value);
      },
      () => {
        clearTimeout(timer);
        if (run !== generation.current) return;
        session.close();
        sessions.current[next] = undefined;
        setTarget(undefined);
        setNotice('切换失败');
      },
    );
  };

  const toggleFull = () => {
    const element = root.current;
    if (!element) return;
    if (full === 'native') return void document.exitFullscreen();
    if (full === 'page') return setFull(false);
    if (document.fullscreenEnabled && element.requestFullscreen)
      element.requestFullscreen().catch(() => setFull('page'));
    else setFull('page');
  };

  const capture = () => {
    const video = videos.current[active];
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${label} ${stamp()}.jpg`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      },
      'image/jpeg',
      0.92,
    );
  };

  const playing = phase.kind === 'playing';
  const current = levels?.find((entry) => entry.value === level);
  const lightest = levels && levels.length > 1 ? levels[levels.length - 1] : undefined;
  const status = notice ?? (target ? '切换中' : '直播');

  return (
    <div
      ref={root}
      class={`ui-video${full === 'page' ? ' ui-video-page' : ''}`}
      data-idle={playing && idle ? '' : undefined}
      onPointerMove={(event) => {
        if (event.pointerType === 'mouse') wake();
      }}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse') return wake();
        if (!idle && !(event.target as HTMLElement).closest('.ui-video-bar')) {
          clearTimeout(idleTimer.current);
          setIdle(true);
        } else wake();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse' && playing) {
          clearTimeout(idleTimer.current);
          setIdle(true);
        }
      }}
    >
      {([0, 1] as const).map((index) => (
        <video
          key={index}
          ref={(element) => {
            videos.current[index] = element;
          }}
          aria-label={`${label} 实时画面`}
          aria-hidden={index !== active || undefined}
          data-active={index === active ? '' : undefined}
          autoplay
          playsinline
          muted={index !== active || muted}
        />
      ))}
      {(phase.kind === 'connecting' || phase.kind === 'paused') && (
        <div class="ui-video-overlay">
          <Spinner label="正在连接画面" />
        </div>
      )}
      {phase.kind === 'failed' && (
        <div class="ui-video-overlay" role="alert">
          <span class="ui-text ui-text-xs">{phase.message}</span>
          <div class="ui-video-actions">
            <Button
              size="sm"
              icon={<RotateCw size={14} />}
              onClick={() => setAttempt((n) => n + 1)}
            >
              重试
            </Button>
            {lightest && level !== lightest.value && (
              <Button size="sm" onClick={() => choose(lightest.value)}>
                切换到{lightest.label}
              </Button>
            )}
          </div>
        </div>
      )}
      {playing && (
        <div class="ui-video-bar">
          <span class="ui-video-status" data-state={notice ? 'error' : target ? 'busy' : 'live'}>
            {target && !notice ? <Spinner size={12} label="切换中" /> : null}
            {status}
          </span>
          <span class="ui-video-tools">
            {levels && levels.length > 1 && (
              <Menu
                label="清晰度"
                placement="top-end"
                items={levels.map((entry) => ({
                  label: entry.label,
                  icon:
                    entry.value === (target ?? level) ? <Check size={14} /> : <span aria-hidden />,
                  onSelect: () => choose(entry.value),
                }))}
                trigger={(state) => levelTrigger(state, current?.label)}
              />
            )}
            <IconButton
              size="sm"
              label={muted ? '打开声音' : '静音'}
              icon={muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              onClick={() => setMuted(!muted)}
            />
            <IconButton size="sm" label="保存截图" icon={<Camera size={16} />} onClick={capture} />
            <IconButton
              size="sm"
              label={full ? '退出全屏' : '全屏'}
              icon={full ? <Minimize size={16} /> : <Maximize size={16} />}
              onClick={toggleFull}
            />
          </span>
        </div>
      )}
    </div>
  );
}
