/// <reference types="navermaps" />
import { useEffect, useRef, useState } from 'react';

// 마커 클러스터링 라이브러리는 전역 공간에 `MarkerClustering`으로 로드됨을 가정합니다.
declare global {
    interface Window {
        naver: any;
        MarkerClustering: any;
    }
}

/**
 * 네이버 지도를 렌더링하고 관리하는 커스텀 훅입니다.
 * 
 * @param mapElement 지도 리액트 요소의 Ref (div 객체)
 * @param initialCenter 지도의 초기 중심 좌표 (위도, 경도)
 * @returns 로드된 지도 인스턴스 (네이버 Map 객체)
 */
export const useNaverMap = (
    mapElement: React.RefObject<HTMLDivElement | null>,
    initialCenter?: { lat: number; lng: number }
) => {
    const [map, setMap] = useState<naver.maps.Map | null>(null);

    // 지도가 한 번만 초기화되도록 플래그 설정
    const initialized = useRef(false);

    useEffect(() => {
        const initMap = () => {
            // 지도 객체를 담을 DOM 요소가 없거나 기본 객체가 로드되지 않은 상태라면 중지
            if (!mapElement.current || !window.naver || !window.naver.maps) {
                return;
            }

            // 이미 지도가 초기화되었다면 중복 초기화를 막음
            if (initialized.current) return;

            // 초기 중심 좌표 설정: 전달받은 파라미터가 없으면 서울 시청 등 기본값 사용
            const centerLatLng = initialCenter
                ? new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng)
                : new window.naver.maps.LatLng(37.5666805, 126.9784147); // 서울 시청

            // 지도 옵션 설정 (줌 컨트롤 등)
            const mapOptions: naver.maps.MapOptions = {
                center: centerLatLng,
                zoom: 13,
                minZoom: 7,
                zoomControl: true,
                zoomControlOptions: {
                    position: window.naver.maps.Position.TOP_RIGHT,
                },
            };

            // 네이버 지도 객체 생성 및 상태 저장
            const createdMap = new window.naver.maps.Map(mapElement.current, mapOptions);
            setMap(createdMap);
            initialized.current = true;
        };

        // 스크립트가 로드되었는지 체크하고 초기화
        if (window.naver && window.naver.maps) {
            initMap();
        } else {
            // 네이버 지도 스크립트가 로드 완료될 때까지 대기
            const mapScript = document.getElementById('naver-map-script');
            if (mapScript) {
                mapScript.addEventListener('load', initMap);
            } else {
                // 스크립트 태그가 명시적 ID가 없는 경우 폴링 방식으로 대기
                const checkNaverMaps = setInterval(() => {
                    if (window.naver && window.naver.maps) {
                        clearInterval(checkNaverMaps);
                        initMap();
                    }
                }, 100);

                // 메모리 릭 방지를 위한 타임아웃
                setTimeout(() => clearInterval(checkNaverMaps), 10000);
            }
        }

    }, [mapElement, initialCenter]);

    return map;
};
