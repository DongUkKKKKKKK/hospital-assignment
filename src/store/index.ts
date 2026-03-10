import { configureStore } from '@reduxjs/toolkit';
import hospitalReducer from './slices/hospitalSlice';

/**
 * 전역 상태를 통합하여 관리하는 Redux 스토어입니다.
 * hospital 관련된 상태를 관리하는 reducer를 등록합니다.
 */
export const store = configureStore({
    reducer: {
        hospital: hospitalReducer,
    },
});

// RootState와 AppDispatch 타입 추론을 위한 내보내기
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
