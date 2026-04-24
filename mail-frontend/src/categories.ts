export interface Category {
  value: string;
  label: string;
}

// scatch.ssu.ac.kr/공지사항/ 카테고리 필터 값 기준.
// 변경 시 mail-worker/src/scraper.ts 와 동기화 필요.
export const CATEGORIES: Category[] = [
  { value: '전체', label: '전체' },
  { value: '학사', label: '학사' },
  { value: '장학', label: '장학' },
  { value: '국제교류', label: '국제교류' },
  { value: '외국인유학생', label: '외국인유학생' },
  { value: '채용', label: '채용' },
  { value: '비교과·행사', label: '비교과·행사' },
  { value: '교원채용', label: '교원채용' },
  { value: '교직', label: '교직' },
  { value: '봉사', label: '봉사' },
  { value: '기타', label: '기타' },
];
