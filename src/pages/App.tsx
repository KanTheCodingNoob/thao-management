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

async function retrieveBrandName(): Promise<string[]> {
	try {
		return await invoke<string[]>('get_table_name')
	} catch (error) {
		return [];
	}
}

function App() {
	const [success, setSuccess] = useState<boolean|null>(null);
	const [allowEdit, setAllowEdit] = useState<boolean>(false);
	const [brands, setBrands] = useState<string[]>([]);
	const [entries, setEntries] = useState<Item[]>([]);
	const [showOptions, setShowOptions] = useState<boolean>(false);

	useEffect(() => {
		createAppFolder().then(setSuccess);
		retrieveBrandName().then(setBrands);
	}, []);

	function retrieveEntries() {

	}

	return (
		<div className="bg-yellow-100">
			<NavBar />
			<main className="relative h-screen w-full flex items-center justify-center">
				{success === true && <div className="w-full flex flex-row justify-around">
					<div className="bg-white p-4 rounded-xl">
						<label>
							Chỉnh sửa
							<input type="checkbox"
							       checked={allowEdit}
							       onChange={(e)=> setAllowEdit(e.target.checked)}/>
						</label>
						<label className="block">Hãng</label>
						<select>
							{
								brands.map((brand)=>(
									<option key={brand} value={brand}>
										{brand}
									</option>
								))
							}
						</select>
						<button className="ml-4 px-1 cursor-pointer bg-gray-400 rounded-md">Tìm</button>
						<label className="block">Mã</label>
						<input type="text" className="border"/>
						<label className="block">Tên</label>
						<input type="text" className="border"/>
					</div>
					<div className="bg-white p-4 rounded-xl">
						<table className="border border-collapse">
							<tbody>
								<tr>
									<th className="border">Mã</th>
									<th className="border">Tên</th>
									<th className="border">Giá</th>
									<th className="border">Kho</th>
								</tr>
								{
									entries.map((entry) => (
										<tr>
											<td className="border">{entry.id}</td>
											<td className="border">{entry.name}</td>
											<td className="border">{entry.price}</td>
											<td className="border">{entry.inventory}</td>
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
