import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHospitals, setUserLocation } from './store/slices/hospitalSlice';
import type { AppDispatch, RootState } from './store';
import HospitalList from './components/HospitalList';
import HospitalMap from './components/HospitalMap';
import HospitalDetail from './components/HospitalDetail';
import './App.css'; // Vite 기본 CSS 임시 유지

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // 애플리케이션 최상단에서 최초 마운트 시 데이터 fetch 실행 및 위치 권한 요청
  useEffect(() => {
    // 위치 권한 및 사용자 위경도 확인
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          console.warn("Geolocation Error:", error);
          alert('위치 권한이 차단되었거나 위치를 가져올 수 없습니다.\n기본 위치(서울시청)를 기준으로 거리 정렬을 시작합니다.');
        }
      );
    } else {
      alert('현재 사용 중인 브라우저가 위치 기반 서비스를 지원하지 않습니다.\n기본 위치(서울시청)를 사용합니다.');
    }

    dispatch(fetchHospitals());
  }, [dispatch]);

  // 선택된 병원 상태 관찰
  const selectedHospitalId = useSelector((state: RootState) => state.hospital.selectedHospitalId);

  return (
    <div className="w-screen h-screen flex flex-row overflow-hidden bg-white text-gray-800 font-sans">
      {/* 왼쪽: 병원 목록 (고정 너비 또는 반응형 비율) */}
      <div className="relative w-full md:w-[350px] lg:w-[400px] h-full shadow-lg z-10 overflow-hidden">
        {/* 선택 여부에 따라 슬라이드 애니메이션 처리 가능하도록 구조 개선 */}
        <div className={`absolute inset-0 transition-transform duration-300 ${selectedHospitalId ? '-translate-x-full' : 'translate-x-0'}`}>
          <HospitalList />
        </div>
        <div className={`absolute inset-0 transition-transform duration-300 shadow-2xl z-20 ${selectedHospitalId ? 'translate-x-0' : 'translate-x-full'}`}>
          <HospitalDetail />
        </div>
      </div>

      {/* 오른쪽: 네이버 지도 */}
      <div className="flex-1 h-full relative">
        <HospitalMap />
      </div>
    </div>
  );
};

export default App;
