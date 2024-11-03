import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import FontStoreProvider from "./components/FontStoreProvider";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<FontStoreProvider>
			<App />
		</FontStoreProvider>
	</StrictMode>,
);
