import {invoke} from "@tauri-apps/api/core";
import {useEffect, useState} from "react";
import NavBar from "../components/NavBar.tsx";
import {Item} from "../type/type.ts";

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
	const [allowEdit, setAllowEdit] = useState<boolean>(false);
	const [results, setResults] = useState<Item[]>([]);
	const [totalPage, setTotalPage] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchParams, setSearchParams] = useState({id: "", name: "", brand: "" });
	const [filters, setFilters] = useState({id: "", name: "", brand: "" });
	const page_size: number = 10;

	useEffect(() => {
		createAppFolder().then(setSuccess);
	}, []);

	async function retrieveResults(page: number, params = searchParams) {
		const response = await invoke<Item[]>('get_requested_data', {tableName: params.brand, id: params.id, name: params.name, page: page, pageSize: page_size});
		setResults(response);
	}

	async function handleSearch() {
		setSearchParams({id: filters.id, brand: filters.brand, name: filters.name})
		setCurrentPage(1);
		await retrieveResults(currentPage, searchParams);
	}

	async function handlePagination() {
		setCurrentPage(currentPage + 1);
		await retrieveResults(currentPage, searchParams);
	}

	return (
		<div className="bg-yellow-100">
			<NavBar />
			<main className="relative h-screen w-full flex items-center justify-center">
				{success === true && <div className="w-full flex flex-row justify-around">
					<div className="bg-white p-4 rounded-xl flex flex-col items-center gap-2 shadow-md">
						<label>
							Chỉnh sửa
							<input type="checkbox"
							       checked={allowEdit}
							       onChange={(e)=> setAllowEdit(e.target.checked)}/>
						</label>
						<label className="block">Hãng</label>
						<input type="text" className="border px-2" value={filters.brand} onChange={(e)=>setFilters(prev => ({ ...prev, brand: e.target.value }))}/>
						<label className="block">Mã</label>
						<input type="text" className="border px-2" value={filters.id} onChange={(e)=> setFilters(prev => ({ ...prev, id: e.target.value }))}/>
						<label className="block">Tên</label>
						<input type="text" className="border px-2" value={filters.name} onChange={(e)=> setFilters(prev => ({ ...prev, name: e.target.value }))}/>
						<button
							className="px-1 border cursor-pointer bg-gray-400 hover:bg-gray-600 rounded-md transition duration-300"
							onClick={()=> handleSearch()}>
							Tìm kiếm
						</button>
					</div>
					<div className="bg-white p-4 rounded-xl shadow-md">
						<table className="border border-collapse">
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
											<td className="border">{result.id}</td>
											<td className="border">{result.name}</td>
											<td className="border">{result.price}</td>
											<td className="border">{result.brand}</td>
											<td className="border">{result.inventory}</td>
										</tr>
									))
								}
							</tbody>
						</table>
					</div>
				</div>}
				{success === false && <p>Lỗi đã sảy ra, làm ơn liên lạc với tổng đài...</p>}
				{success === null && <p>Loading...</p>}
			</main>
		</div>
	);
}

export default App;
