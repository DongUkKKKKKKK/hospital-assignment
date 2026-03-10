/**
 * 두 GPS 좌표 (위도, 경도) 사이의 거리를 계산하는 유틸리티 함수입니다.
 * 하버사인(Haversine) 공식을 사용하여 두 점 사이의 최단 거리를 미터(m) 단위로 반환합니다.
 * 
 * @param lat1 첫 번째 지점의 위도
 * @param lon1 첫 번째 지점의 경도
 * @param lat2 두 번째 지점의 위도
 * @param lon2 두 번째 지점의 경도
 * @returns 두 좌표 사이의 거리 (미터)
 */
export const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // 수치 상수 (지구의 반경, 단위: 미터)
    const toRadian = (angle: number) => (angle * Math.PI) / 180;

    const dLat = toRadian(lat2 - lat1);
    const dLon = toRadian(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 결과는 미터(m) 단위의 거리
};
