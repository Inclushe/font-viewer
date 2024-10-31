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
	requestFilesFromDropzone,
} from "./helpers/fileHelpers";

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

function App() {
	const [fontFiles, setFontFiles] = React.useState([]);
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
		const loadScript = (src) =>
			new Promise((onload) =>
				document.documentElement.append(
					Object.assign(document.createElement("script"), { src, onload }),
				),
			);
		async function installWOFF2Dependency() {
			if (!window.Module) {
				const path =
					"https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js";
				const init = new Promise(
					(done) => (window.Module = { onRuntimeInitialized: done }),
				);
				await loadScript(path).then(() => {
					init;
				});
			}
		}
		installWOFF2Dependency();
	}, []);

	async function requestDirectory() {
		const currentFontFiles = await requestDirectoryFS();
		setFontFiles(currentFontFiles);
	}

	async function dropZoneCallback(acceptedFiles) {
		const currentFontFiles = await requestFilesFromDropzone(acceptedFiles);
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
