import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Hospital } from '../../types/hospital';

// 사용자 위치 정보 타입 정의
export interface UserLocation {
    lat: number;
    lng: number;
}

// 스토어 슬라이스의 초기 상태 타입 정의
export interface HospitalState {
    /** 사용자의 현재 GPS 좌표 및 지도 중심점 (위도, 경도) */
    userLocation: UserLocation | null;
    /** 서버로부터 불러온 전체 병원 목록 */
    hospitals: Hospital[];
    /** 사용자가 현재 선택한 병원의 ID */
    selectedHospitalId: number | null;
    /** 병원 목록을 필터링하기 위한 진료 과목 필터링 값 */
    filter: string;
    /** 비동기 데이터 통신의 현재 상태 (대기, 로딩중, 성공, 실패) */
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

// 스토어의 초기 상태 선언
const initialState: HospitalState = {
    userLocation: null,
    hospitals: [],
    selectedHospitalId: null,
    filter: '전체',
    status: 'idle',
};

/**
 * 비동기 통신을 통해 병원 목록 데이터를 가져오는 Thunk 액션입니다.
 * 앞서 설정한 MSW 모킹 서버('/api/hospitals')로 요청을 보냅니다.
 */
export const fetchHospitals = createAsyncThunk(
    'hospital/fetchHospitals',
    async () => {
        // 백엔드 API, 또는 MSW가 모킹하는 엔드포인트로 GET 요청
        const response = await fetch('/api/hospitals');
        if (!response.ok) {
            throw new Error('네트워크 응답이 올바르지 않습니다.');
        }
        const data: Hospital[] = await response.json();
        return data;
    }
);

export const hospitalSlice = createSlice({
    name: 'hospital',
    initialState,
    reducers: {
        /**
         * 사용자의 현재 위치를 스토어에 업데이트하는 핸들러.
         * @param state 현재 스토어 상태
         * @param action 업데이트할 위치 좌표 Payload
         */
        setUserLocation: (state, action: PayloadAction<UserLocation>) => {
            state.userLocation = action.payload;
        },
        /**
         * 사용자가 특정 병원을 선택했을 때 ID를 업데이트하는 핸들러.
         * @param state 현재 스토어 상태
         * @param action 선택된 병원 ID Payload
         */
        setSelectedHospitalId: (state, action: PayloadAction<number | null>) => {
            state.selectedHospitalId = action.payload;
        },
        /**
         * 진료 과목 필터를 변경하는 핸들러.
         * @param state 현재 스토어 상태
         * @param action 변경할 필터 문자열 (예: "전체", "dermatology" 등)
         */
        setFilter: (state, action: PayloadAction<string>) => {
            state.filter = action.payload;
        },
    },
    // 비동기 액션 처리
    extraReducers: (builder) => {
        builder
            // 통신 시작 시 상태를 로딩중으로 변경
            .addCase(fetchHospitals.pending, (state) => {
                state.status = 'loading';
            })
            // 통신 성공 시 상태를 변경하고 데이터를 스토어에 보관
            .addCase(fetchHospitals.fulfilled, (state, action: PayloadAction<Hospital[]>) => {
                state.status = 'succeeded';
                state.hospitals = action.payload;
            })
            // 통신 실패 시 상태를 실패로 변경
            .addCase(fetchHospitals.rejected, (state) => {
                state.status = 'failed';
            });
    },
});

export const { setUserLocation, setSelectedHospitalId, setFilter } = hospitalSlice.actions;

export default hospitalSlice.reducer;
