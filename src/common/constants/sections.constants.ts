/**
 * 시스템 기본 섹션 설정
 */
export const DEFAULT_SECTIONS = [
  { title: 'Everyday', isFixed: true },
  { title: 'To Do', isFixed: true },
];

/**
 * 기본 섹션 제목 리스트 (검증용)
 */
export const DEFAULT_SECTION_TITLES = DEFAULT_SECTIONS.map((s) => s.title);
