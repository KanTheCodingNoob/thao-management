import NavBar from "../components/NavBar.tsx";
import {useState} from "react";
import {read, utils, WorkSheet} from "xlsx"
import {Item} from "../type/type.ts";
import {invoke} from "@tauri-apps/api/core";

export default function Import(){
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isReading, setIsReading] = useState<boolean>(false);
	const [sheet, setSheet] = useState<WorkSheet>(utils.aoa_to_sheet([]));
	const [labelList, setLabelList] = useState<string[]>([]);
	const [tableName, setTableName] = useState<string>("")
	const [idLabel, setIdLabel] = useState<string>("");
	const [nameLabel, setNameLabel] = useState<string>("");
	const [priceLabel, setPriceLabel] = useState<string>("");
	const [inventoryLabel, setInventoryLabel] = useState<string>("");
	const [warning, setWarning] = useState<{ show: boolean; message: string }>({
		show: false,
		message: "",
	});
	const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
	const [addInventory, setAddInventory] = useState<boolean>(false);

	// Load Excel sheet, then extract headers to list
	async function loadExcelSheet() {
		if (!selectedFile) return;
		setIsReading(true);

		// Read file as ArrayBuffer
		const data = await selectedFile.arrayBuffer();
		const workbook = read(data, { type: "array" });

		const firstSheetName = workbook.SheetNames[0];
		const firstSheet = workbook.Sheets[firstSheetName];
		setSheet(firstSheet)

		// Extract header row (first row)
		const headerRow = utils.sheet_to_json(firstSheet, { header: 1 })[0] as string[];
		setLabelList(headerRow);
		setIsReading(false);
	}

	// Handle submit
	async function handleSelect() {
		// Set the load animation on the submit button
		setLoadingStatus(true);
		// Return a warning if not all fields are filled
		if (tableName === "" || idLabel === "" || nameLabel === "" || priceLabel === "" || inventoryLabel === "") {
			setWarning({
				show: true,
				message: "Làm ơn nhập hết dữ liệu"
			});
			setLoadingStatus(false);
			return;
		}

		// Extract and then reorganise the data to send to the backend
		const rawData = utils.sheet_to_json<Record<string, any>>(sheet);

		// Validate data types
		for (let i = 0; i < rawData.length; i++) {
			const row = rawData[i];

			const id = row[idLabel];
			const name = row[nameLabel];
			const price = row[priceLabel];
			const inventory = row[inventoryLabel];

			if (typeof id !== 'string' && typeof id !== 'number') {
				setWarning({ show: true, message: `Dòng ${i + 2}: ID không hợp lệ` });
				setLoadingStatus(false);
				return;
			}
			if (typeof name !== 'string') {
				setWarning({ show: true, message: `Dòng ${i + 2}: Tên không hợp lệ` });
				setLoadingStatus(false);
				return;
			}
			if (typeof price !== 'number' || isNaN(price)) {
				setWarning({ show: true, message: `Dòng ${i + 2}: Giá không hợp lệ` });
				setLoadingStatus(false);
				return;
			}
			if (typeof inventory !== 'number' || isNaN(inventory)) {
				setWarning({ show: true, message: `Dòng ${i + 2}: Tồn kho không hợp lệ` });
				setLoadingStatus(false);
				return;
			}
		}

		const packagedData: Item[] = rawData.map(row => {
			return {
				id: row[idLabel],
				name: row[nameLabel],
				price: Math.round(row[priceLabel]),
				inventory: Math.round(row[inventoryLabel]),
				brand: tableName
			}
		})
		console.log(packagedData)
		// Call backend to create table into the database
		try {
			const response = await invoke<string>('create_table', {tableName: tableName, rows: packagedData, import: addInventory});
			console.log(response)
			setWarning({
				show: true,
				message: "Tạo / nhập bảng đã thành công"
			});
		} catch (error: any) {
			console.log(error)
			setWarning({
				show: true,
				message: error
			});
		}
		setLoadingStatus(false);
	}

	// Reset all input
	function handleCancel() {
		setTableName("");
		setIdLabel("");
		setInventoryLabel("");
		setNameLabel("");
		setPriceLabel("");
		setWarning({
			show: false,
			message: ""
		});
	}

	return (
		<main className="bg-yellow-100 w-full h-screen">
			<NavBar />
			<div className="relative h-screen w-full flex items-center justify-center">
				<div className="bg-white shadow-md rounded-xl p-4">
					<label htmlFor="table" className="font-bold">Nhập bảng Excel vào</label>
					<br/>
					<input
						type="file"
						id="table"
						name="table"
						className="file:bg-blue-600 file:text-white file:px-4 file:py-1 file:rounded file:border-0 file:cursor-pointer block"
						accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
						onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
					/>
					<button type="submit"
					        className="bg-green-600 rounded px-2 py-0.5 cursor-pointer mt-1"
					        onClick={() => loadExcelSheet()}>Đọc</button>
					{
						(labelList.length > 0 || isReading) && (
							<div className="mt-4">
								<h2 className="font-bold">Nhập thông tin bạn muốn lưu</h2>
								<label>
									Cập nhật tồn kho
									<input type="checkbox" className="ml-1" checked={addInventory} onChange={()=> setAddInventory(!addInventory)}/>
								</label>
								{
									isReading ? (
										<div className="animate-pulse">
											<div>
												<div className="block">Đặt tên bảng: </div>
												<div className="h-8 rounded px-2 py-1 w-60 bg-gray-300"></div>
											</div>
											<div>
												<div className="block">ID:</div>
												<div className="h-8 rounded px-2 py-1 w-60 bg-gray-300"></div>
											</div>
											<div>
												<div className="block">Tên:</div>
												<div className="h-8 rounded px-2 py-1 w-60 bg-gray-300"></div>
											</div>
											<div>
												<div className="block">Giá:</div>
												<div className="h-8 rounded px-2 py-1 w-60 bg-gray-300"></div>
											</div>
											<div>
												<div className="block">Tồn kho:</div>
												<div className="h-8 rounded px-2 py-1 w-60 bg-gray-300"></div>
											</div>
											<div className="flex space-x-2 pt-2">
												<div className="h-8 w-24 bg-gray-300 rounded"></div>
												<div className="h-8 w-16 bg-gray-300 rounded"></div>
											</div>
										</div>
									) : (
										<>
											<div>
												<label className="block">Đặt tên bảng: </label>
												<input type="text"
												       value={tableName}
												       className="border rounded px-2 py-1 w-60"
												       required
												       pattern="^[a-zA-Z0-9 _-]+$"
												       title="Chỉ có chữ số, dấu cách, ký tự '_' và '-' mới được cho phép"
												       onChange={(e)=>setTableName(e.target.value)}
												/>
											</div>
											<div>
												<label className="block">ID:</label>
												<select
													value={idLabel}
													onChange={(e) => setIdLabel(e.target.value)}
													className="border rounded px-2 py-1 w-60"
												>
													<option value="">-- Chọn cột ID --</option>
													{labelList.map((label) => (
														<option key={label} value={label}>
															{label}
														</option>
													))}
												</select>
											</div>

											<div>
												<label className="block">Tên:</label>
												<select
													value={nameLabel}
													onChange={(e) => setNameLabel(e.target.value)}
													className="border rounded px-2 py-1 w-60"
												>
													<option value="">-- Chọn cột Tên --</option>
													{labelList.map((label) => (
														<option key={label} value={label}>
															{label}
														</option>
													))}
												</select>
											</div>

											<div>
												<label className="block">Giá:</label>
												<select
													value={priceLabel}
													onChange={(e) => setPriceLabel(e.target.value)}
													className="border rounded px-2 py-1 w-60"
												>
													<option value="">-- Chọn cột Giá --</option>
													{labelList.map((label) => (
														<option key={label} value={label}>
															{label}
														</option>
													))}
												</select>
											</div>

											<div>
												<label className="block">Tồn kho:</label>
												<select
													value={inventoryLabel}
													onChange={(e) => setInventoryLabel(e.target.value)}
													className="border rounded px-2 py-1 w-60"
												>
													<option value="">-- Chọn cột Tồn kho --</option>
													{labelList.map((label) => (
														<option key={label} value={label}>
															{label}
														</option>
													))}
												</select>
											</div>

											<div className="flex space-x-2 pt-2">
												{
													loadingStatus ? (
														<button disabled
														        className="bg-blue-200 text-white px-4 py-1 rounded">
															<span className="flex items-center gap-2">
															    <span className="w-4 h-4 border-4 border-t-transparent border-white rounded-full animate-spin"></span>
															    Đang xử lý...
															</span>
														</button>
													) : (
														<button
															onClick={() => handleSelect()}
															className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 cursor-pointer"
														>
														Xác nhận
														</button>
													)
												}
												<button
													onClick={()=>handleCancel()}
													className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500 cursor-pointer"
												>
													Hủy
												</button>
											</div>

											<div>
												{warning.show ? (
													<h1 className="font-bold">{warning.message}</h1>
												) : (
													<></>
												)}
											</div>
										</>
									)
								}
							</div>
						)
					}
				</div>
			</div>
		</main>
	)
}