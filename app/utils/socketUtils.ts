import { WebSocketRequest } from 'app/domain/WebSocket';
import { CallBack } from 'app/service/websocket/EventInterface';
import { TimeoutError } from 'rxjs';

const withTimeout = (
  onSuccess: { apply: (thisArg: undefined, arg1: unknown[]) => void },
  onTimeout: () => void,
  timeout: number
) => {
  let called = false;

  const timer = setTimeout(() => {
    if (called) return;
    called = true;
    onTimeout();
  }, timeout);

  return (...args: unknown[]) => {
    if (called) return;
    called = true;
    clearTimeout(timer);
    onSuccess.apply(this, args);
  };
};

export default withTimeout;

export const socketCallback = <T, R>(
  e: string,
  r: WebSocketRequest<T>,
  cb: CallBack<R>
) => {
  const cbWithTimeout = withTimeout(
    cb,
    () => {
      throw new TimeoutError();
    },
    // 5秒超时
    5000
  );
  window.socketRef.emit(e, r, cbWithTimeout);
};
