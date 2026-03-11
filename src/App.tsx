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
    <div className="flex w-full h-screen overflow-hidden text-gray-900">
      {/* 
        왼쪽 패널: 상세 정보가 열렸을 땐 HospitalDetail, 평소엔 HospitalList 노출.
      */}
      <aside className="relative w-[350px] md:w-[400px] h-full shadow-md z-20 overflow-hidden flex flex-col bg-white">
        {selectedHospitalId ? (
          <div className="w-full h-full animate-slideInLeft">
            <HospitalDetail />
          </div>
        ) : (
          <div className="w-full h-full animate-fadeIn">
            <HospitalList />
          </div>
        )}
      </aside>

      {/* 오른쪽 패널: 구글 지도 (나머지 영역 전체 차지) gap 0 */}
      <main className="flex-1 h-full relative z-10 bg-gray-100">
        <HospitalMap />
      </main>
    </div>
  );
};

export default App;
