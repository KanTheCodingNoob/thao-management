import {invoke} from "@tauri-apps/api/core";
import {useEffect, useState} from "react";
import NavBar from "../components/NavBar.tsx";
import {Item, PaginatedResult} from "../type/type.ts";

/*
	Call the function that create a folder in Appdata,
	return boolean to tell the UI is the folder available.
*/
async function createAppFolder(): Promise<boolean> {
	try {
		const message = await invoke<string>('init_app_folder');
		console.log('✅ Success:', message);
		return true;
	} catch (error) {
		console.error('❌ Failed to create folder:', error);
		return false;
	}
}

function App() {
	const [success, setSuccess] = useState<boolean|null>(null);
	const [results, setResults] = useState<Item[]>([]);
	const [totalPage, setTotalPage] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchParams, setSearchParams] = useState({id: "", name: "", brand: "" });
	const [filters, setFilters] = useState({id: "", name: "", brand: "" });
	const page_size: number = 10;

	useEffect(() => {
		createAppFolder().then(setSuccess);
	}, []);

	// Get the rows to display to the tab;e
	async function retrieveResults(page: number, params = searchParams) {
		const response = await invoke<PaginatedResult>('get_requested_data', {tableName: params.brand, id: params.id, name: params.name, page: page, pageSize: page_size});
		setTotalPage(response.total_pages);
		setResults(response.data);
	}

	// Set a new search parameters based on the inputted filter, set the page to 1 and call the
	// "retrieveResult" function
	async function handleSearch() {
		const newParams = { ...filters };

		setSearchParams(newParams);
		setCurrentPage(1);
		await retrieveResults(currentPage, newParams);
	}

	// Use the existing search parameters, set the page to the current page plus one and call the
	// "retrieveResult" function
	async function handlePagination() {
		const nextPage = currentPage + 1;
		setCurrentPage(nextPage);
		await retrieveResults(nextPage, searchParams);
	}

	// Increment the count at the backend and refresh the page
	async function handleIncrement(id: string, tableName: string) {
		await invoke("increment_item_inventory", {id: id, tableName: tableName})
			.then(()=>retrieveResults(currentPage, searchParams))
	}

	// Increment the count at the backend and refresh the page
	async function handleDecrement(id: string, tableName: string) {
		await invoke("decrement_item_inventory", {id: id, tableName: tableName})
			.then(()=>retrieveResults(currentPage, searchParams))
	}

	return (
		<div className="bg-yellow-100">
			<NavBar />
			<main className="relative h-screen w-full flex items-center justify-center">
				{success === true && <div className="w-full flex flex-row justify-around">
					<div className="bg-white p-4 rounded-xl flex flex-col items-center gap-2 shadow-md">
						<label className="block">Hãng</label>
						<input type="text" className="border px-2" value={filters.brand} onChange={(e)=>setFilters(prev => ({ ...prev, brand: e.target.value }))}/>
						<label className="block">Mã</label>
						<input type="text" className="border px-2" value={filters.id} onChange={(e)=> setFilters(prev => ({ ...prev, id: e.target.value }))}/>
						<label className="block">Tên</label>
						<input type="text" className="border px-2" value={filters.name} onChange={(e)=> setFilters(prev => ({ ...prev, name: e.target.value }))}/>
						<button
							className="px-3 py-1 cursor-pointer bg-gray-300 hover:bg-gray-400 rounded-md transition duration-300"
							onClick={()=> handleSearch()}>
							Tìm kiếm
						</button>
					</div>
					<div className="bg-white p-4 rounded-xl shadow-md">
						<table className="border border-collapse min-w-100 px-3">
							<tbody>
								<tr>
									<th className="border">Mã</th>
									<th className="border">Tên</th>
									<th className="border">Giá</th>
									<th className="border">Hãng</th>
									<th className="border">Kho</th>
								</tr>
								{
									results.map((result) => (
										<tr>
											<td className="border px-2">{result.id}</td>
											<td className="border px-2">{result.name}</td>
											<td className="border px-2">{result.price}</td>
											<td className="border px-2">{result.brand}</td>
											<td className="border px-2">
												<div className="grid grid-cols-3 items-center text-center">
													<button
														className="text-xl hover:text-red-600 cursor-pointer"
														onClick={() => handleDecrement(result.id, result.brand)}
													>−</button>
													<span>{result.inventory}</span>
													<button
														className="text-xl hover:text-green-600 cursor-pointer"
														onClick={() => handleIncrement(result.id, result.brand)}
													>+</button>
												</div>
											</td>
										</tr>
									))
								}
							</tbody>
						</table>
						{
							totalPage !== 0 &&
								<div className="flex justify-center gap-4 mt-4">
									<button
										disabled={currentPage <= 1}
										onClick={async () => {
											const prevPage = currentPage - 1;
											setCurrentPage(prevPage);
											await retrieveResults(prevPage, searchParams);
										}}
										className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50 cursor-pointer hover:bg-gray-400 transition duration-300"
									>
										← Trước
									</button>

									<span>Trang {currentPage} / {totalPage}</span>

									<button
										disabled={currentPage >= totalPage}
										onClick={handlePagination}
										className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50 cursor-pointer hover:bg-gray-400 transition duration-300"
									>
										Sau →
									</button>
								</div>
						}
					</div>
				</div>}
				{success === false && <p>Lỗi đã sảy ra, làm ơn liên lạc với tổng đài...</p>}
				{success === null && <p>Loading...</p>}
			</main>
		</div>
	);
}

export default App;
