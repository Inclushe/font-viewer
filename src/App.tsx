import React from "react";
import opentype from "opentype.js";
import "./App.css";
import FontControlProvider from "./components/FontControlProvider";
import Font from "./components/Font";
import FontGroup from "./components/FontGroup";
import TextInput from "./components/TextInput";
import DropZone from "./components/DropZone";
import {
	requestDirectoryFS,
	convertFilesToFontObjects,
} from "./helpers/fileHelpers";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import { createStore } from "tinybase";
import { useRow, useTable } from "tinybase/ui-react";

const SUPPORTED_FILE_TYPES = ["ttf", "otf", "woff", "woff2"];

/*
- [x] Handle some fonts not loading
	- opentype.js can render fonts that are not supported by the browser somehow
	- https://opentype.js.org/font-inspector.html
	- window.font.draw (canvas)
- [x] Fold font names
- [x] Sort by alphabetical order
- [x] Input custom text
- Fix typescript errors
- Have it work without File System Access API anyway?
	- Add notice that it doesn't work in Firefox
- Fallback to canvas opentype.js rendering for fonts that don't load correctly?
	- https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API
*/

const store = createStore().setTables({ fonts: null });
const persister = createIndexedDbPersister(store, "fonts");

function App() {
	const [fontFiles, setFontFiles] = React.useState([]);
	const fontFilesTable = useTable("fonts", store);
	// Group fonts by family name under font.opentype.names.fontFamily
	let fontFilesByGroup = new Map();
	for (const fontFile of fontFiles) {
		const fontFamily = fontFile.opentype?.names?.fontFamily?.en;
		if (!fontFilesByGroup.has(fontFamily)) {
			fontFilesByGroup.set(fontFamily, []);
		}
		fontFilesByGroup.get(fontFamily).push(fontFile);
	}
	const [fontStyleElement, setFontStyleElement] =
		React.useState<HTMLStyleElement | null>(null);

	React.useEffect(() => {
		let styleElement = fontStyleElement;
		if (fontStyleElement === null) {
			styleElement = document.createElement("style");
			styleElement.setAttribute("data-react-font-viewer", "");
			document.head.appendChild(styleElement);
			setFontStyleElement(styleElement);
		}
		let fontStyleString = "";
		for (const fontFile of fontFiles) {
			const fontFileName = fontFile.name;
			const fontFileUrl = URL.createObjectURL(fontFile.file);
			fontStyleString += `@font-face {
				font-family: "${fontFileName}";
				src: url("${fontFileUrl}");
			}`;
		}
		styleElement.innerHTML = fontStyleString;
	}, [fontFiles]);

	React.useEffect(() => {
		// Install woff2 dependency
		const loadScript = (src) => {
			return new Promise((onload) => {
				console.log(src);
				document.body.append(
					Object.assign(document.createElement("script"), { src, onload }),
				);
			});
		};
		console.log("hello");
		async function installWOFF2Dependency() {
			console.log(window.Module);
			if (!window.Module) {
				const path =
					"https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js";
				const init = new Promise(
					(done) => (window.Module = { onRuntimeInitialized: done }),
				);
				await loadScript(path)
					.then(() => init)
					.then(() => {
						console.log("WOFF2 decompression loaded");
						loadFromPersistent();
					})
					.catch((err) => {
						console.error(err);
					});
			}
		}
		async function loadFromPersistent() {
			await persister.load();
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
			console.log(currentFontFile.file);
			const fileBase64 = await toBase64(currentFontFile.file);
			console.log(fileBase64);
			store.transaction(() => {
				const fontID = crypto.randomUUID();
				store.setCell("fonts", fontID, "fileBase64", fileBase64);
				store.setCell("fonts", fontID, "name", currentFontFile.name);
				store.setCell("fonts", fontID, "fontType", currentFontFile.file.type);
			});
		}
		const tableIds = store.getRowIds("fonts");
		console.log(store.getRow("fonts", tableIds[0]));
		// const fileBlob = store.getCell("fonts", tableIds[0], "fileBlob");
		// const fileName = store.getCell("fonts", tableIds[0], "name");
		// const response = await fetch()
		// const newFile = new File([await (await fetch(fileBlob)).blob()], fileName);
		// console.log(newFile);
		await persister.save();
		setFontFiles(currentFontFiles);
	}

	// console.log(fontFilesByGroup.keys());

	return (
		<FontControlProvider>
			<div className="p-4 relative bg-gray-900 text-white">
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
