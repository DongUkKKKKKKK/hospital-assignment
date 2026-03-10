import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchHospitals } from './store/slices/hospitalSlice';
import type { AppDispatch } from './store';
import HospitalList from './components/HospitalList';
import HospitalMap from './components/HospitalMap';
import './App.css'; // Vite 기본 CSS 임시 유지

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // 애플리케이션 최상단에서 최초 마운트 시 데이터 fetch 실행
  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  return (
    <div className="w-screen h-screen flex flex-row overflow-hidden bg-white text-gray-800 font-sans">
      {/* 왼쪽: 병원 목록 (고정 너비 또는 반응형 비율) */}
      <div className="w-full md:w-[350px] lg:w-[400px] h-full shadow-lg z-10">
        <HospitalList />
      </div>

      {/* 오른쪽: 네이버 지도 */}
      <div className="flex-1 h-full relative">
        <HospitalMap />
      </div>
    </div>
  );
};

export default App;
