/**
 * @description 애플리케이션 전역에서 사용되는 상수 집합
 */

/**
 * 영문 진료과목을 사용자 친화적인 한글로 변환하는 매핑 객체.
 * XSS 및 예외적인 데이터 노출 방어를 위해 컴포넌트 내부가 아닌
 * 순수 상수 파일에서 격리 관리합니다.
 */
export const DEPARTMENT_MAP: Record<string, string> = {
    INTERNAL: '내과',
    ORTHOPEDIC: '정형외과',
    PEDIATRIC: '소아과',
    OPHTHALMOLOGY: '안과',
    DERMATOLOGY: '피부과',
    DENTAL: '치과',
    GENERAL: '일반의원'
};
