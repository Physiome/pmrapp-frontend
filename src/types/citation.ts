export interface Author {
  family: string;
  given?: string;
  other?: string;
}

export interface Citation {
  id?: string;
  authors?: Author[];
  issued?: string;
  title?: string;
  journal?: string;
  volume?: string;
  first_page?: string;
  last_page?: string;
  publisher?: string;
  url?: string;
}
