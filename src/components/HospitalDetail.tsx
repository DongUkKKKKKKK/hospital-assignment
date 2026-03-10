import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setSelectedHospitalId } from '../store/slices/hospitalSlice';
import { getDistanceInMeters } from '../utils/distance';

const HospitalDetail: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    // 가져올 핵심 상태들
    const { hospitals, selectedHospitalId, userLocation } = useSelector(
        (state: RootState) => state.hospital
    );

    // 기본 위경도 값 설정 (서울 시청)
    const centerLat = userLocation ? userLocation.lat : 37.5666805;
    const centerLng = userLocation ? userLocation.lng : 126.9784147;

    // 현재 선택된 병원 찾기
    const hospital = useMemo(() => {
        if (selectedHospitalId === null) return null;
        return hospitals.find(h => h.id === selectedHospitalId) || null;
    }, [hospitals, selectedHospitalId]);

    // 닫기 핸들러
    const handleClose = () => {
        dispatch(setSelectedHospitalId(null));
    };

    if (!hospital) {
        return null;
    }

    const distance = (getDistanceInMeters(centerLat, centerLng, Number(hospital.lat), Number(hospital.lng)) / 1000).toFixed(1);

    return (
        <div className="w-full h-full bg-white flex flex-col">
            {/* Header: 뒤로가기 버튼 */}
            <div className="p-3 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-full py-3 text-gray-700 hover:text-blue-700 hover:bg-blue-50 bg-gray-50 rounded-lg font-bold text-lg transition-all border border-gray-200"
                >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    리스트로 뒤로가기
                </button>
            </div>

            {/* Body: 상세 정보 영역 */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                        {hospital.name}
                    </h2>
                    <span className="inline-block px-3 py-1.5 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                        {hospital.department}
                    </span>
                </div>

                <div className="space-y-6">
                    {/* 주소 섹션 */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">상세 주소</h3>
                        <p className="text-gray-800 text-base leading-relaxed">{hospital.address}</p>
                    </div>

                    {/* 거리 및 좌표 섹션 */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">현재 위치로부터</h3>
                            <p className="text-xl font-bold text-blue-600">{distance} km</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">좌표</h3>
                            <p className="text-xs text-gray-400 font-mono">{Number(hospital.lat).toFixed(4)}<br />{Number(hospital.lng).toFixed(4)}</p>
                        </div>
                    </div>

                    {/* 전화번호 섹션 (목업 제공 데이터엔 없으나 명세에 있으므로 임의 추가 처리 가능하게 구성) */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">전화번호</h3>
                        <p className="text-gray-800 font-medium tracking-wide">
                            {/* json에 전화번호가 없으면 안내문구, 있으면 전화번호 표시 (요구사항 방어) */}
                            {(hospital as any).phone || "등록된 번호가 없습니다."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer 액션 영역 */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                    onClick={() => alert('길찾기 및 예약 기능은 준비중입니다.')}>
                    방문 접수 / 예약
                </button>
            </div>
        </div>
    );
};

export default HospitalDetail;
