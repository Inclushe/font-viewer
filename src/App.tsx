import React from "react";
import opentype from "opentype.js";
import "./App.css";

const SUPPORTED_FILE_TYPES = ["ttf", "otf", "woff", "woff2"];

/*
- Handle some fonts not loading
- Skip ones that throw errors
- Fold font names
- Sort by alphabetical order
- Input custom text
- Fix typescript errors
- Have it work without File System Access API anyway?
*/

async function findFilesInSystemDirectory(dir: FileSystemDirectoryHandle) {
	const files: FileSystemFileHandle[] = [];
	for await (const entry of dir.values()) {
		if (entry.kind === "file") {
			files.push(entry);
		} else if (entry.kind === "directory") {
			const currentDir: FileSystemDirectoryHandle = entry;
			const filesInDir = await findFilesInSystemDirectory(currentDir);
			files.push(...filesInDir);
		}
	}
	return files;
}

function App() {
	const [fontFiles, setFontFiles] = React.useState([]);
	const [fontStyleElement, setFontStyleElement] =
		React.useState<HTMLStyleElement | null>(null);
	React.useEffect(() => {
		let styleElement = fontStyleElement;
		if (fontStyleElement === null) {
			styleElement = document.createElement("style");
			styleElement.setAttribute("data-react-font-viewer", "");
			document.head.appendChild(styleElement);
			setFontStyleElement(styleElement);
			console.log(styleElement);
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
					console.log(init);
					init;
				});
			}
		}
		installWOFF2Dependency();
	}, []);

	async function requestDirectory() {
		const directoryHandle = await window.showDirectoryPicker();
		const currentFontFileHandles =
			await findFilesInSystemDirectory(directoryHandle);
		const currentFontFiles = [];
		for (const fontFileHandle of currentFontFileHandles) {
			// If file type is not supported, skip
			const fileType = fontFileHandle.name
				.split(".")
				.pop()
				?.toLocaleLowerCase();
			if (!SUPPORTED_FILE_TYPES.includes(fileType)) {
				continue;
			}
			// Get font info from opentype.js
			const fontFile = await fontFileHandle.getFile();
			console.log(fontFile);
			let font = null;
			if (fileType === "woff2") {
				const fileBuffer = await fontFile.arrayBuffer();
				console.log(fileBuffer);
				// console.log(Module.decompress(fileBuffer));
				font = opentype.parse(
					Uint8Array.from(Module.decompress(fileBuffer)).buffer,
				);
			} else {
				font = opentype.parse(await fontFile.arrayBuffer());
			}
			console.log(fontFile.name, font);
			currentFontFiles.push({
				file: fontFile,
				name: fontFile.name,
				opentype: font,
			});
		}
		setFontFiles(currentFontFiles);
		console.log(directoryHandle);
		console.log("files", currentFontFileHandles);
	}

	return (
		<div className="p-4">
			<button
				onClick={requestDirectory}
				className="bg-gray-200 p-4 rounded-lg border border-gray-400"
				type="button"
			>
				Open Font Directory
			</button>
			{fontFiles.map((fontFile) => (
				<p
					key={fontFile.name}
					style={{
						fontFamily: `"${fontFile.name}", sans-serif`,
					}}
				>
					{console.log(fontFile)}
					{fontFile.opentype?.names?.fullName?.en} - {fontFile.name}
				</p>
			))}
		</div>
	);
}

export default App;
