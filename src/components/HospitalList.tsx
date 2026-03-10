import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setSelectedHospitalId, setFilter } from '../store/slices/hospitalSlice';
import { getDistanceInMeters } from '../utils/distance';

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

    // 병원 진료 과목 고유 목록 추출 (필터 드롭다운용)
    const departments = useMemo(() => {
        const list = new Set(hospitals.map((h) => h.department));
        return ['전체', ...Array.from(list)];
    }, [hospitals]);

    /**
     * 진료 과목 필터를 적용한 병원 목록 연산 (성능 최적화를 위해 useMemo 사용)
     * 뷰에 렌더링될 실제 목록입니다.
     */
    const filteredHospitals = useMemo(() => {
        let result = hospitals;
        if (filter !== '전체') {
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

    // 병원 선택 클릭 핸들러
    const handleSelectHospital = (id: number) => {
        dispatch(setSelectedHospitalId(id));
    };

    if (status === 'loading') {
        return <div className="p-4 bg-white h-full shadow-md text-gray-500">데이터를 불러오는 중입니다...</div>;
    }

    if (status === 'failed') {
        return <div className="p-4 bg-white h-full shadow-md text-red-500">데이터를 불러오지 못했습니다.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-white shadow-lg overflow-hidden border-r border-gray-200">
            {/* 고정된 헤더 영역 */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex-none">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-3">
                    근처 병원 목록
                </h2>

                {/* 진료과목 필터링 Select */}
                <select
                    value={filter}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    {departments.map((dept) => (
                        <option key={dept} value={dept}>
                            {dept === '전체' ? '진료 과목 전체' : dept}
                        </option>
                    ))}
                </select>
                <div className="text-sm text-gray-500 mt-2 text-right">
                    총 {filteredHospitals.length}개의 결과
                </div>
            </div>

            {/* 스크롤 가능한 리스트 영역 */}
            <ul className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {filteredHospitals.map((hospital) => {
                    // 상태 관리에서 선택된 ID와 현재 아이템이 일치하면 하이라이트 CSS 적용
                    const isSelected = selectedHospitalId === hospital.id;

                    return (
                        <li
                            key={hospital.id}
                            onClick={() => handleSelectHospital(hospital.id)}
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected
                                ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
                                }`}
                        >
                            <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                {hospital.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2 truncate" title={hospital.address}>
                                {hospital.address}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                                    {hospital.department}
                                </div>
                                <span className="text-xs font-medium text-gray-500">
                                    거리: {(getDistanceInMeters(centerLat, centerLng, Number(hospital.lat), Number(hospital.lng)) / 1000).toFixed(1)}km
                                </span>
                            </div>
                        </li>
                    );
                })}
                {filteredHospitals.length === 0 && (
                    <li className="p-8 text-center text-gray-500">
                        조건에 맞는 병원이 없습니다.
                    </li>
                )}
            </ul>
        </div>
    );
};

const MemoizedHospitalList = React.memo(HospitalList);
export default MemoizedHospitalList;
