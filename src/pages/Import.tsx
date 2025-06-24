import NavBar from "../components/NavBar.tsx";
import {useState} from "react";
import {read, utils, WorkSheet} from "xlsx"
import {Item} from "../type/type.ts";

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
	const [warningLabel, setWarningLabel] = useState<boolean>(false)

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
	function handleSelect() {
		if (tableName === "" || idLabel === "" || nameLabel === "" || priceLabel === "" || inventoryLabel === ""){
			setWarningLabel(true);
			return;
		}

		// Extract and then reorganise the data to send to the backend
		const rawData = utils.sheet_to_json<Record<string, any>>(sheet);
		const packagedData: Item[] = rawData.map(row => {
			return {
				id: row[idLabel],
				name: row[nameLabel],
				price: row[priceLabel],
				inventory: row[inventoryLabel]
			}
		})

		console.log(packagedData);
		setWarningLabel(false)
	}

	// Reset all input
	function handleCancel() {
		setTableName("");
		setIdLabel("");
		setInventoryLabel("");
		setNameLabel("");
		setPriceLabel("");
		setWarningLabel(false);
	}

	return (
		<div>
			<NavBar />
			<div className="pt-20 px-6">
				<label htmlFor="table">Nhập bảng excel vào</label>
				<br/>
				<input
					type="file"
					id="table"
					name="table"
					className="block cursor-pointer"
					accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
				/>
				<button type="submit"
				        className="bg-green-400 rounded-md px-2 py-0.5 cursor-pointer"
				        onClick={() => loadExcelSheet()}>Đọc</button>
				{
					(labelList.length > 0 || isReading) && (
						<div className="mt-4">
							<h2 className="font-bold">Nhập thông tin bạn muốn lưu</h2>
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
											<button
												onClick={()=>handleSelect()}
												className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
											>
												Xác nhận
											</button>
											<button
												onClick={()=>handleCancel()}
												className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
											>
												Hủy
											</button>
										</div>

										<div>
											{warningLabel ? (
												<h1 className="font-bold">Làm ơn nhập hết dữ liệu giùm</h1>
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
	)
}