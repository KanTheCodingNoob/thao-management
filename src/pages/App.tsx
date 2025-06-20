import {invoke} from "@tauri-apps/api/core";
import {useEffect, useState} from "react";
import NavBar from "../components/NavBar.tsx";

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
	const [search, setSearch] = useState<string>("")

	useEffect(() => {
		createAppFolder().then(setSuccess)
	}, []);

	return (
		<>
			<NavBar />
			<main className="relative h-screen w-full flex items-center justify-center">
				{success === true && <div className="flex">
					<div className="text-center max-w-md">
						<form className="flex items-center space-x-2">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Tìm kiếm..."
								className="w-60 px-4 py-1 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-green-600"
							/>
							<button
								type="submit"
								className="px-3 py-1 bg-white rounded-md shadow hover:bg-green-100 transition"
							>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
									<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
								</svg>
							</button>
						</form>
					</div>
				</div>}
				{success === false && <p>Lỗi đã sảy ra, làm ơn liên lạc với tổng đài...</p>}
				{success === null && <p>Loading...</p>}
			</main>
		</>
	);
}

export default App;
