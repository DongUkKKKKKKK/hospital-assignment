import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * 브라우저 환경에서 동작하는 MSW 워커 인스턴스를 생성합니다.
 * 정의된 모의 핸들러(handlers)를 바탕으로 네트워크 요청을 가로챕니다.
 */
export const worker = setupWorker(...handlers);
