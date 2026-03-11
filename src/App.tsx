import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHospitals, setUserLocation } from './store/slices/hospitalSlice';
import type { AppDispatch, RootState } from './store';
import HospitalList from './components/HospitalList';
import HospitalMap from './components/HospitalMap';
import HospitalDetail from './components/HospitalDetail';

/**
 * @description 애플리케이션의 최상위 루트 레이아웃 (Layout Container)
 * - Full-Bleed Layout: 브라우저의 모든 틈새와 여백을 제거하는 강제 리셋(m-0 p-0 box-border)
 * - Flexbox Layout: 좌측 고정 패널(400px, flex-shrink-0)과 우측 가변 지도(flex-grow) 구조 확립
 * - 단일 진입점: 앱 초기 로드 시 Geolocation API 및 MSW 팩토리 연동 지점
 */
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
    <div className="flex w-full h-screen overflow-hidden m-0 p-0 box-border gap-0 text-gray-900">
      {/* 
        왼쪽 패널: 상세 정보가 열렸을 땐 HospitalDetail, 평소엔 HospitalList 노출.
      */}
      <aside className="w-[400px] flex-shrink-0 h-full border-r border-gray-200 shadow-md z-20 overflow-hidden flex flex-col bg-white">
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
      <main className="flex-grow h-full relative z-10 bg-gray-100">
        <HospitalMap />
      </main>
    </div>
  );
};

export default App;
