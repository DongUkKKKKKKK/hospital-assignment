/**
 * 병원 데이터 객체의 구조를 정의하는 인터페이스입니다.
 * 제공된 hospital.json 데이터의 각 항목과 1:1로 매핑됩니다.
 */
export interface Hospital {
    /** 
     * 병원의 고유 식별자 (ID)
     */
    id: number;

    /** 
     * 병원 이름 (예: "수원시 튼튼병원 1호점")
     */
    name: string;

    /** 
     * 위도 (Latitude) - 지구 상의 세로선 좌표
     */
    lat: number;

    /** 
     * 경도 (Longitude) - 지구 상의 가로선 좌표
     */
    lng: number;

    /** 
     * 진료 과목 (예: "dermatology", "ophthalmology", "internal", "dental", "orthopedic", "pediatric")
     */
    department: string;

    /** 
     * 병원의 상세 주소
     */
    address: string;
}
