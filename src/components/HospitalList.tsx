import React, { useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setSelectedHospitalId, setFilter, fetchHospitals } from '../store/slices/hospitalSlice';
import { getDistanceInMeters } from '../utils/distance';

const DEPARTMENT_MAP: Record<string, string> = {
    INTERNAL: '내과',
    ORTHOPEDIC: '정형외과',
    PEDIATRIC: '소아과',
    OPHTHALMOLOGY: '안과',
    DERMATOLOGY: '피부과',
    DENTAL: '치과',
    GENERAL: '일반의원'
};

/**
 * 전역 상태에서 병원 목록을 가져와 렌더링하고, 진료과목 필터링 기능을 제공하는 리스트 컴포넌트.
 * 선택된 병원 항목을 지도와 동기화하여 강조 표시(Highlight) 합니다.
 */
const HospitalList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    // 스토어에서 상태 가져오기
    const { hospitals, selectedHospitalId, filter, status, userLocation } = useSelector(
        (state: RootState) => state.hospital
    );

    // 사용자 위치가 없을 경우 서울 시청을 기본값으로 사용
    const centerLat = userLocation ? userLocation.lat : 37.5666805;
    const centerLng = userLocation ? userLocation.lng : 126.9784147;

    // 병원 진료 과목 고유 목록 추출 (원래 영어 데이터 유지)
    const rawDepartments = useMemo(() => {
        const list = new Set(hospitals.map((h) => h.department));
        return Array.from(list);
    }, [hospitals]);

    /**
     * 진료 과목 필터를 적용한 병원 목록 연산 (성능 최적화를 위해 useMemo 사용)
     * 뷰에 렌더링될 실제 목록입니다.
     */
    const filteredHospitals = useMemo(() => {
        let result = hospitals;
        if (filter !== '진료 과목 전체') {
            result = hospitals.filter((h) => h.department === filter);
        }

        // 사용자 위치(혹은 기본 좌표) 기준으로 거리순 정렬 배치
        return [...result].sort((a, b) => {
            const distA = getDistanceInMeters(centerLat, centerLng, Number(a.lat), Number(a.lng));
            const distB = getDistanceInMeters(centerLat, centerLng, Number(b.lat), Number(b.lng));
            return distA - distB;
        });
    }, [hospitals, filter, centerLat, centerLng]);

    // 필터 변경 핸들러
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(setFilter(e.target.value));
    };

    // 리스트 아이템 DOM 요소를 추적하기 위한 Ref (scrollIntoView 용도)
    const itemRefs = useRef<{ [key: number]: HTMLLIElement | null }>({});

    // 외부(예: 지도 마커)에서 selectedHospitalId가 변경되면 해당 리스트 아이템으로 스크롤 이동
    useEffect(() => {
        if (selectedHospitalId !== null && itemRefs.current[selectedHospitalId]) {
            itemRefs.current[selectedHospitalId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selectedHospitalId]);

    // 병원 선택 클릭 핸들러
    const handleSelectHospital = (id: number) => {
        dispatch(setSelectedHospitalId(id));
    };

    if (status === 'loading') {
        return (
            <div className="flex flex-col h-full bg-white shadow-lg overflow-hidden border-r border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex-none animate-pulse">
                    <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded mb-2 w-full"></div>
                </div>
                {/* 실감나는 Skeleton UI */}
                <div className="flex-1 p-4 space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="p-5 rounded-xl border border-gray-100 animate-pulse flex flex-col space-y-3 bg-white shadow-sm">
                            <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                                <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                                <div className="h-3 bg-gray-200 rounded w-10"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white h-full shadow-lg border-r border-gray-200 text-center">
                <svg className="w-16 h-16 text-red-400 mb-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-800 mb-2">데이터를 불러오지 못했습니다.</h3>
                <p className="text-gray-500 mb-6 text-sm">네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.</p>
                <button
                    onClick={() => dispatch(fetchHospitals())}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* 고정된 헤더 영역 */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex-none">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-3">
                    근처 병원 목록
                </h2>

                {/* 진료과목 필터링 Select */}
                <select
                    value={filter}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="진료 과목 전체">진료 과목 전체</option>
                    {rawDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                            {DEPARTMENT_MAP[dept?.toUpperCase()] || dept}
                        </option>
                    ))}
                </select>
                <div className="text-sm text-gray-500 mt-2 text-right">
                    총 {filteredHospitals.length}개의 결과
                </div>
            </div>

            {/* 스크롤 가능한 리스트 영역 (여백/패딩 최소화) */}
            <ul className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredHospitals.map((hospital) => {
                    // 상태 관리에서 선택된 ID와 현재 아이템이 일치하면 하이라이트 CSS 적용
                    const isSelected = selectedHospitalId === hospital.id;

                    return (
                        <li
                            key={hospital.id}
                            ref={(el) => { itemRefs.current[hospital.id] = el; }}
                            onClick={() => handleSelectHospital(hospital.id)}
                            className={`p-3 cursor-pointer transition-colors duration-150 border-b ${isSelected
                                ? 'bg-[#e8f0fe] border-l-4 border-l-[#4285F4] border-b-gray-200'
                                : 'bg-white border-gray-200 border-l-4 border-l-transparent hover:bg-gray-50'
                                }`}
                        >
                            <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-[#4285F4]' : 'text-gray-900'}`}>
                                {hospital.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2 truncate" title={hospital.address}>
                                {hospital.address}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 tracking-wider">
                                    {DEPARTMENT_MAP[hospital.department?.toUpperCase()] || hospital.department}
                                </div>
                                <span className="text-xs font-medium text-gray-500">
                                    거리: {(getDistanceInMeters(centerLat, centerLng, Number(hospital.lat), Number(hospital.lng)) / 1000).toFixed(1)}km
                                </span>
                            </div>
                        </li>
                    );
                })}
                {filteredHospitals.length === 0 && (
                    <li className="p-12 flex flex-col items-center justify-center text-center h-full">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-bold text-gray-600">주변에 해당 진료과 병원이 없습니다.</p>
                        <p className="text-sm text-gray-400 mt-2">다른 진료 과목을 선택하거나 검색 범위를 넓혀보세요.</p>
                    </li>
                )}
            </ul>
        </div>
    );
};

const MemoizedHospitalList = React.memo(HospitalList);
export default MemoizedHospitalList;
