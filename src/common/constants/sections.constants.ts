/**
 * 시스템 기본 섹션 설정
 */
export const EVERYDAY_SECTION_TITLE = 'Everyday';
export const TODO_SECTION_TITLE = 'To Do';

export const DEFAULT_SECTIONS = [
  { title: EVERYDAY_SECTION_TITLE, isFixed: true },
  { title: TODO_SECTION_TITLE, isFixed: true },
];

/**
 * 기본 섹션 제목 리스트 (검증용)
 */
export const DEFAULT_SECTION_TITLES = DEFAULT_SECTIONS.map((s) => s.title);
