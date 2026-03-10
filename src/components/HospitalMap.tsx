import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoogleMap, useJsApiLoader, InfoWindow, Marker } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { RootState, AppDispatch } from '../store';
import { setSelectedHospitalId } from '../store/slices/hospitalSlice';
import { getDistanceInMeters } from '../utils/distance';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 37.5665, lng: 126.978 }; // 서울시청 Fallback

/**
 * @description Google Maps 기반 병원 지도 컴포넌트
 * - @react-google-maps/api: React 기반 선언적 맵 렌더링
 * - @googlemaps/markerclusterer: 바닐라 JS 기반 고성능 클러스터링(3천 건 마커 최적화)
 */
const HospitalMap: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const { hospitals, filter, userLocation, selectedHospitalId, status } = useSelector(
        (state: RootState) => state.hospital
    );

    // Google Maps 스크립트 비동기 로드
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko', // 한국어 지원
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const [infoWindowData, setInfoWindowData] = useState<{ position: google.maps.LatLngLiteral; content: any } | null>(null);

    // 렌더링 최적화를 위한 병원 리스트 필터링 메모이제이션
    const filteredHospitals = useMemo(() => {
        if (filter === '진료 과목 전체') return hospitals;
        return hospitals.filter((h) => h.department === filter);
    }, [hospitals, filter]);

    // Map 객체 라이프사이클 관리 (useCallback으로 참조 안정성 확보)
    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    /**
     * @description 마커 및 클러스터링 동기화 로직
     * 필터가 변경될 때마다 기존 마커/클러스터를 지우고 새로 렌더링
     */
    useEffect(() => {
        if (!map || status !== 'succeeded') return;

        // 클린업 루틴: 기존 클러스터 및 마커 제거
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current = null;
        } else {
            markersRef.current.forEach((m) => m.setMap(null));
        }
        markersRef.current = [];

        // 새로운 구글 마커 인스턴스 배열 생성
        const newMarkers = filteredHospitals.map((hospital) => {
            const marker = new window.google.maps.Marker({
                position: { lat: Number(hospital.lat), lng: Number(hospital.lng) },
            });
            // 식별용 커스텀 속성 할당
            marker.set('id', hospital.id);

            // 마커 클릭 시 스토어 선택 상태 업데이트 및 지도 이동
            marker.addListener('click', () => {
                dispatch(setSelectedHospitalId(hospital.id));
                map.panTo(marker.getPosition() as google.maps.LatLng);
            });

            return marker;
        });

        markersRef.current = newMarkers;

        // 3,000건 대량 렌더링 최적화를 위한 MarkerClusterer 적용 
        if (newMarkers.length > 0) {
            clustererRef.current = new MarkerClusterer({
                map,
                markers: newMarkers,
            });
        }
    }, [map, filteredHospitals, status, dispatch]);

    /**
     * @description 외부 상태(리스트 선택 등)와 지도 위 InfoWindow 동기화 처리
     */
    useEffect(() => {
        if (!map || selectedHospitalId === null) {
            setInfoWindowData(null);
            return;
        }

        const targetHospital = filteredHospitals.find(h => h.id === selectedHospitalId);
        if (targetHospital) {
            const position = { lat: Number(targetHospital.lat), lng: Number(targetHospital.lng) };
            setInfoWindowData({ position, content: targetHospital });
            map.panTo(position);
        } else {
            setInfoWindowData(null);
        }
    }, [map, selectedHospitalId, filteredHospitals]);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-red-50 relative">
                <p className="text-red-500 font-bold mb-2">Google Maps 로드 에러</p>
                <p className="text-sm text-red-400">API Key 및 네트워크 상태를 확인하세요.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-gray-100">
            {/* 로딩 표시 UI */}
            {!isLoaded || status !== 'succeeded' ? (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <div className="text-gray-600 font-medium">지도를 준비하는 중입니다...</div>
                    </div>
                </div>
            ) : (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={userLocation || defaultCenter}
                    zoom={13}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                >
                    {/* 내 위치 마커 (특수 아이콘) */}
                    {userLocation && (
                        <Marker
                            position={{ lat: userLocation.lat, lng: userLocation.lng }}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: '#3b82f6',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            }}
                            title="내 위치"
                        />
                    )}

                    {/* 선택 시 나타나는 정보 창 (Info Window) */}
                    {infoWindowData && (
                        <InfoWindow
                            position={infoWindowData.position}
                            onCloseClick={() => dispatch(setSelectedHospitalId(null))}
                            options={{ pixelOffset: new window.google.maps.Size(0, -30) }}
                        >
                            <div className="p-3 bg-white rounded-lg min-w-[200px] text-center">
                                <h4 className="font-bold text-gray-800 text-sm mb-1">{infoWindowData.content.name}</h4>
                                <span className="inline-block px-2 py-1 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded-full mb-1">
                                    {infoWindowData.content.department}
                                </span>
                                <p className="text-[11px] text-gray-500 font-medium">
                                    현재 위치에서 {(getDistanceInMeters(
                                        userLocation?.lat || defaultCenter.lat,
                                        userLocation?.lng || defaultCenter.lng,
                                        Number(infoWindowData.content.lat),
                                        Number(infoWindowData.content.lng)
                                    ) / 1000).toFixed(1)}km
                                </p>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            )}

            {/* 플로팅 내 위치로 이동 버튼 (대형/명시적 UX 개선) */}
            {isLoaded && status === 'succeeded' && userLocation && (
                <button
                    onClick={() => {
                        if (map) {
                            map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
                            map.setZoom(15);
                        }
                    }}
                    className="absolute bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-full shadow-2xl border-2 border-white hover:scale-105 transition-all duration-300 z-10 flex items-center justify-center space-x-2 font-bold group"
                    title="내 위치로 바로가기"
                >
                    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>내 위치 찾기</span>
                </button>
            )}
        </div>
    );
};

export default React.memo(HospitalMap);
