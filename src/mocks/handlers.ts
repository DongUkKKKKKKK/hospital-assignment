import { http, HttpResponse, delay } from 'msw';
import hospitalData from './hospital.json';

// MSW 가상 API 라우트 핸들러 설정
export const handlers = [
    /**
     * 병원 목록 조회 API 모킹
     * 실제 네트워크 환경처럼 보이기 위해 500ms 지연 시간을 추가하고,
     * 10% 확률로 에러를 발생시킵니다. (데이터 통신 실패 디버깅용)
     */
    http.get('/api/hospitals', async () => {
        // 500ms 지연 (요구사항)
        await delay(500);

        // 10% 확률로 명시적 에러 발생 로직 추가
        const isError = Math.random() < 0.1;
        if (isError) {
            return new HttpResponse(null, {
                status: 500,
                statusText: 'Internal Server Error (Simulated)',
            });
        }

        // 정상 JSON 데이터 반환
        return HttpResponse.json(hospitalData);
    }),
];
