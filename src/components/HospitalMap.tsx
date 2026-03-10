/// <reference types="navermaps" />
import React, { useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setSelectedHospitalId } from '../store/slices/hospitalSlice';
import { useNaverMap } from '../hooks/useNaverMap';

/**
 * 네이버 지도를 렌더링하고, 스토어의 병원 목록(filtered)을 바탕으로 마커와 클러스터링을 그리는 컴포넌트입니다.
 */
const HospitalMap: React.FC = () => {
    const mapElement = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch<AppDispatch>();

    const { hospitals, filter, userLocation, selectedHospitalId } = useSelector(
        (state: RootState) => state.hospital
    );

    // 커스텀 훅을 통해 네이버 지도 인스턴스를 가져옵니다. (초기 중심을 사용자 위치로 지정)
    const map = useNaverMap(mapElement, userLocation || undefined);

    // 마커 인스턴스 배열과 클러스터러, 인포윈도우 관리용 Ref
    const markersRef = useRef<naver.maps.Marker[]>([]);
    const clustererRef = useRef<any>(null); // MarkerClustering
    const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

    // 필터링된 배열 도출
    const filteredHospitals = useMemo(() => {
        if (filter === '전체') return hospitals;
        return hospitals.filter((h) => h.department === filter);
    }, [hospitals, filter]);

    /**
     * 지도가 준비되면, 인포윈도우를 1번만 초기화해둡니다. (마커 클릭 시 재사용)
     */
    useEffect(() => {
        if (!map) return;
        infoWindowRef.current = new window.naver.maps.InfoWindow({
            content: '', // 초기에는 빈 내용
            borderWidth: 0,
            disableAnchor: true,
            backgroundColor: 'transparent',
            pixelOffset: new window.naver.maps.Point(0, -10),
        });
    }, [map]);


    /**
     * 필터링 된 병원 목록(filteredHospitals)이 변경되거나 
     * 지도 객체(map)가 준비되었을 때 마커와 클러스터링을 렌더링합니다.
     */
    useEffect(() => {
        // map, naver 객체, MarkerClustering 라이브러리가 완전히 로드되지 않았다면 렌더링을 방어합니다.
        if (!map || !window.naver || !window.naver.maps || !window.MarkerClustering) {
            return;
        }

        // 기존 마커 및 클러스터러 제거 (초기화)
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        if (clustererRef.current) {
            clustererRef.current.setMap(null);
            clustererRef.current = null;
        }

        // 만약 인포윈도우가 열려있다면 닫기
        if (infoWindowRef.current) {
            infoWindowRef.current.close();
        }

        // 새 마커들을 생성합니다.
        const newMarkers: naver.maps.Marker[] = [];

        filteredHospitals.forEach((hospital) => {
            const position = new window.naver.maps.LatLng(hospital.lat, hospital.lng);

            const marker = new window.naver.maps.Marker({
                position,
                map,
                // icon 등 필요에 따라 커스터마이징 가능
            });

            // 마커 클래스/객체에 병원 고유 id 임시 저장 (인포윈도우, 클릭 식별용)
            marker.set('id', hospital.id);

            // 마커 클릭 이벤트 핸들러: 스토어에 selectedHospitalId 업데이트 및 인포윈도우 표시
            window.naver.maps.Event.addListener(marker, 'click', () => {
                dispatch(setSelectedHospitalId(hospital.id));

                // 인포윈도우 UI 생성 (dangerouslySetInnerHTML 없이 안전한 DOM 문자열 구성)
                const infoContent = `
          <div style="padding: 16px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); min-width: 200px; border: 1px solid #e5e7eb;">
            <h4 style="font-weight: 700; font-size: 16px; margin: 0 0 8px 0; color: #1f2937;">${hospital.name}</h4>
            <p style="font-size: 13px; color: #4b5563; margin: 0 0 6px 0;">${hospital.address}</p>
            <span style="display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1e40af; border-radius: 9999px;">${hospital.department}</span>
          </div>
        `;

                if (infoWindowRef.current) {
                    infoWindowRef.current.setContent(infoContent);
                    infoWindowRef.current.open(map, marker);
                }

                // 클릭 시 마커를 화면 중심으로 부드럽게 이동
                map.panTo(position);
            });

            newMarkers.push(marker);
        });

        markersRef.current = newMarkers;

        /**
         * MarkerClustering 초기화 (대량 마커 최적화 처리)
         * htmlIcon1 등은 클러스터 노출 시의 UI를 정의합니다.
         */
        const htmlMarker1 = {
            content: `
            <div style="cursor:pointer;width:40px;height:40px;line-height:42px;background:rgba(59, 130, 246, 0.9);color:white;text-align:center;border-radius:50%;font-weight:bold;box-shadow:0 0 10px rgba(0,0,0,0.2); border: 2px solid white;"></div>
        `,
            // 의존성 방어: 120번 라인 근처에서 발생하는 null의 원인은 window.naver.maps.Size 호출 때문입니다. 
            // 위에서 return으로 방어하고 있으므로 여기서는 안전하지만 재차 확인합니다.
            size: new window.naver.maps.Size(40, 40),
            anchor: new window.naver.maps.Point(20, 20)
        };

        // 오픈소스 MarkerClustering 외부 라이브러리 활용
        if (newMarkers.length > 0) {
            clustererRef.current = new window.MarkerClustering({
                minClusterSize: 2,           // 2개 이상 모이면 클러스터 생성
                maxZoom: 14,                 // 줌 레벨 14 이상이면 클러스터 해제
                map: map,                    // 적용할 대상 맵
                markers: newMarkers,         // 대상 마커들
                disableClickZoom: false,     // 클릭 시 줌 동작 허용
                gridSize: 120,               // 클러스터를 묶을 격자 크기
                icons: [htmlMarker1],        // 클러스터 아이콘 배열 (여기선 1개로 통일)
                indexGenerator: [10, 100, 200, 500, 1000],
                stylingFunction: (clusterMarker: any, count: number) => {
                    // HTMLElement 내부 텍스트로 안전하게 마커 개수 삽입
                    const element = clusterMarker.getElement();
                    if (element && element.firstElementChild) {
                        element.firstElementChild.textContent = count.toString();
                        // 클릭 이벤트가 마커로 전파되도록 스타일 추가
                        element.style.pointerEvents = 'auto';
                    }
                }
            });
        }
    }, [map, filteredHospitals, dispatch]);


    /**
     * 스토어의 selectedHospitalId가 리스트(외부)에서 변경되었을 때,
     * 맵 상의 해당 정보와 연동하는 이펙트입니다.
     */
    useEffect(() => {
        if (!map || !infoWindowRef.current || selectedHospitalId === null) return;

        // 현재 렌더링 된 마커 중 동일한 ID를 가진 마커 찾기
        const targetMarker = markersRef.current.find(
            (marker) => marker.get('id') === selectedHospitalId
        );
        const targetHospital = filteredHospitals.find(h => h.id === selectedHospitalId);

        if (targetMarker && targetHospital) {
            // 인포윈도우 열기 및 중심점 이동
            const infoContent = `
        <div style="padding: 16px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); min-width: 200px; border: 1px solid #e5e7eb;">
          <h4 style="font-weight: 700; font-size: 16px; margin: 0 0 8px 0; color: #1f2937;">${targetHospital.name}</h4>
          <p style="font-size: 13px; color: #4b5563; margin: 0 0 6px 0;">${targetHospital.address}</p>
          <span style="display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1e40af; border-radius: 9999px;">${targetHospital.department}</span>
        </div>
      `;
            infoWindowRef.current.setContent(infoContent);
            infoWindowRef.current.open(map, targetMarker);
            map.panTo(targetMarker.getPosition());
        } else {
            // ID 매칭 마커가 없으면 인포윈도우 숨김 (다른 탭이나 상태 클리어 시)
            infoWindowRef.current.close();
        }
    }, [map, selectedHospitalId, filteredHospitals]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-gray-100">
            {/* 지도가 표시될 빈 DOM 엘리먼트 (useNaverMap에서 접근) */}
            <div ref={mapElement} className="absolute inset-0 w-full h-full" id="map-container" />

            {/* 지도 로딩 전 임시 문구 처리 등 추가 가능 */}
            {!map && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10 backdrop-blur-sm">
                    <div className="text-gray-500 font-medium">지도를 초기화하는 중입니다...</div>
                </div>
            )}
        </div>
    );
};

const MemoizedHospitalMap = React.memo(HospitalMap);
export default MemoizedHospitalMap;
