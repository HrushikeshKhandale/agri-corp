import { Section } from './section';

export interface Category {
  id: number;
  name: string;
  section: Section;
}

export interface CreateCategoryRequest {
  name: string;
  section: { id: number };
}

export interface UpdateCategoryRequest {
  name: string;
}