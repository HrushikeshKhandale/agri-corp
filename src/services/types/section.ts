export interface Section {
  id: number;
  name: string;
}

export interface CreateSectionRequest {
  name: string;
}

export interface UpdateSectionRequest {
  name: string;
}