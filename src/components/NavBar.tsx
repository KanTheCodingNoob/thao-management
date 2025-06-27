import {useNavigate} from "react-router-dom";

export default function NavBar(){
	const navigate = useNavigate();

	return (
		<nav className="bg-white shadow-md fixed w-full z-10 px-6 py-4 flex justify-between items-center">
			<div className="font-bold text-xl cursor-pointer" onClick={() => navigate("/")}>
				Thảo
			</div>
			<button
				className="bg-green-300 font-semibold px-4 py-2 rounded shadow-lg shadow-green-400/50 hover:bg-green-500 transition duration-300 cursor-pointer"
				onClick={() => navigate("/import")}
			>
				+ Tạo bảng
			</button>
		</nav>
	)
}