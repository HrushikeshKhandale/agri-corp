export interface SubCategory {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
}

export interface CreateSubCategoryRequest {
  name: string;
  category: {
    id: number;
  };
}

export interface UpdateSubCategoryRequest {
  name: string;
}