import {createBrowserRouter} from "react-router-dom";
import App from "./pages/App.tsx";
import Import from "./pages/Import.tsx";

const route = createBrowserRouter([
	{
		path: "/",
		element: <App />
	},
	{
		path: "/import",
		element: <Import />
	}
]);

export default route;