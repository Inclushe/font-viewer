import React from "react";
import "./App.css";
import FontControlProvider from "./components/FontControlProvider";
import { FontStoreContext } from "./components/FontStoreProvider";
import FontGroup from "./components/FontGroup";
import TextInput from "./components/TextInput";
import DropZone from "./components/DropZone";
import { convertFilesToFontObjects } from "./helpers/fileHelpers";

function App() {
	const [fontFiles, setFontFiles] = React.useState([]);
	const { store } = React.useContext(FontStoreContext);
	// Group fonts by family name under font.opentype.names.fontFamily
	let fontFilesByGroup = new Map();
	for (const fontFile of fontFiles) {
		const fontFamily = fontFile.opentype?.names?.fontFamily?.en;
		if (!fontFilesByGroup.has(fontFamily)) {
			fontFilesByGroup.set(fontFamily, []);
		}
		fontFilesByGroup.get(fontFamily).push(fontFile);
	}

	React.useEffect(() => {
		// Install woff2 dependency
		const loadScript = (src) => {
			return new Promise((onload) => {
				document.body.append(
					Object.assign(document.createElement("script"), { src, onload }),
				);
			});
		};
		async function installWOFF2Dependency() {
			if (!window.Module) {
				const path =
					"https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js";
				const init = new Promise(
					(done) => (window.Module = { onRuntimeInitialized: done }),
				);
				await loadScript(path)
					.then(() => init)
					.then(() => {
						console.log("WOFF2 decompression library loaded");
						loadFromPersistent();
					})
					.catch((err) => {
						console.error(err);
					});
			}
		}
		async function loadFromPersistent() {
			console.log(store.getTables());
			let fonts = [];
			for (const rowID of store.getRowIds("fonts")) {
				const fileBase64 = store.getCell("fonts", rowID, "fileBase64");
				const fileName = store.getCell("fonts", rowID, "name");
				const fileType = store.getCell("fonts", rowID, "fontType");
				const res = await fetch(fileBase64);
				const blob = await res.blob();
				const file = new File([blob], fileName, { type: fileType });
				fonts.push(file);
			}
			const currentFontFiles = await convertFilesToFontObjects(fonts);
			setFontFiles(currentFontFiles);
		}
		installWOFF2Dependency();
	}, []);

	const toBase64 = (file) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
		});

	async function dropZoneCallback(acceptedFiles) {
		const currentFontFiles = await convertFilesToFontObjects(acceptedFiles);
		for (const currentFontFile of currentFontFiles) {
			const fileBase64 = await toBase64(currentFontFile.file);
			store.transaction(() => {
				const fontID = crypto.randomUUID();
				store.setCell("fonts", fontID, "fileBase64", fileBase64);
				store.setCell("fonts", fontID, "name", currentFontFile.name);
				store.setCell("fonts", fontID, "fontType", currentFontFile.file.type);
				store.setCell(
					"fonts",
					fontID,
					"fontFamily",
					currentFontFile.opentype?.names?.fontFamily?.en,
				);
				store.setCell(
					"fonts",
					fontID,
					"fontSubfamily",
					currentFontFile.opentype?.names?.fontSubfamily?.en,
				);
			});
		}
		setFontFiles(currentFontFiles);
	}

	// console.log(fontFilesByGroup.keys());

	return (
		<FontControlProvider>
			<div className="p-4 relative text-white">
				<DropZone
					callback={dropZoneCallback}
					className="rounded-3xl border border-dashed p-4 py-10 text-center border-gray-700 bg-gray-800"
				>
					Drag and drop your font folder here or click here to select your font
					folder.
				</DropZone>
				<div className="sticky top-0">
					<TextInput />
				</div>
				{[...fontFilesByGroup.keys()]
					.sort((a, b) => String(a[0]).localeCompare(b[0]))
					.map((fontFamily) => (
						<FontGroup
							fontName={fontFamily}
							fontFiles={fontFilesByGroup.get(fontFamily)}
							key={fontFamily}
						/>
					))}
			</div>
		</FontControlProvider>
	);
}

export default App;
