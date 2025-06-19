import {invoke} from "@tauri-apps/api/core";
import {useEffect, useState} from "react";

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

	useEffect(() => {
		createAppFolder().then(setSuccess)
	}, []);

	return (
		<main className="relative h-screen w-full flex items-center justify-center">
			{success === true && <div className="flex">
				<button className="absolute top-4 right-4 p-2 bg-green-400 rounded cursor-pointer">
					+ Tạo bảng
				</button>
					<div className="text-center max-w-md">
						<p>Placeholder</p>
					</div>
			</div>}
			{success === false && <p>Lỗi đã sảy ra, làm ơn liên lạc với tổng đài...</p>}
			{success === null && <p>Loading...</p>}
		</main>
	);
}

export default App;
