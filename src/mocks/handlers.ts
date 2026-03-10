import { http, HttpResponse, delay } from 'msw';
import hospitalData from './hospital.json';

// MSW 가상 API 라우트 핸들러 설정
export const handlers = [
    /**
     * 병원 목록 조회 API 모킹
     * 실제 네트워크 환경처럼 보이기 위해 1초(1000ms)의 지연 시간을 추가하고,
     * 정적 JSON 데이터를 반환합니다.
     */
    http.get('/api/hospitals', async () => {
        // 1초 지연 (실제 서버 응답 시간을 모사)
        await delay(1000);

        // JSON 데이터 반환
        return HttpResponse.json(hospitalData);
    }),
];
