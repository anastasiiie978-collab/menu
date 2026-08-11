export type Category = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export type Dish = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string | null;
  photoUrl: string | null;
  soldOut: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MenuData = {
  categories: Category[];
  dishes: Dish[];
};
