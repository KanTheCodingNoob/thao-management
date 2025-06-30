export type Item = {
	id: string;
	name: string;
	price: number;
	inventory: number;
	brand: string
};

export type PaginatedResult = {
	data: Item[];
	total_pages: number;
}