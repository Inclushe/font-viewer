import React from "react";
import "./App.css";
import FontControlProvider from "./components/FontControlProvider";
import { FontStoreContext } from "./components/FontStoreProvider";
import FontGroup from "./components/FontGroup";
import TextInput from "./components/TextInput";
import DropZone from "./components/DropZone";
import {
	convertFilesToFontObjects,
	installWOFF2Dependency,
	SUPPORTED_FILE_TYPES,
} from "./helpers/fileHelpers";
import { useRowIds } from "tinybase/ui-react";

function App() {
	const { store, createOpentypeDefinition, createOpentypeDefinitionFromFile } =
		React.useContext(FontStoreContext);
	const rowIds = useRowIds("fonts", store);

	// Load WOFF2 dependency first and only once
	const WOFF2Dependency = React.useMemo(() => {
		return installWOFF2Dependency();
	}, []);

	// Group fonts by family name under font.opentype.names.fontFamily
	let fontFilesByGroup = new Map();
	for (const rowID of rowIds) {
		const fontFamily = store.getCell("fonts", rowID, "fontFamily");
		if (!fontFilesByGroup.has(fontFamily)) {
			fontFilesByGroup.set(fontFamily, []);
		}
		fontFilesByGroup.get(fontFamily).push(rowID);
	}
	console.log(fontFilesByGroup);

	const toBase64 = (file: File) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
		});

	async function dropZoneCallback(acceptedFiles: File[]) {
		const fonts = {};
		for (const file of acceptedFiles) {
			const fileExtension = file.name.split(".").pop()?.toLocaleLowerCase();
			if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
				continue;
			}
			const fontID = crypto.randomUUID();
			const opentypeDefinition = await createOpentypeDefinitionFromFile(
				file,
				fontID,
			);
			const fileBase64 = await toBase64(file);
			fonts[fontID] = {
				fileBase64,
				name: file.name,
				type: file.type,
				opentypeDefinition,
			};
		}
		store.transaction(() => {
			for (const [fontID, currentFont] of Object.entries(fonts)) {
				store.transaction(() => {
					store.setCell("fonts", fontID, "fileBase64", currentFont.fileBase64);
					store.setCell("fonts", fontID, "name", currentFont.name);
					store.setCell("fonts", fontID, "fontType", currentFont.type);
					store.setCell(
						"fonts",
						fontID,
						"fontFamily",
						currentFont.opentypeDefinition?.names?.fontFamily?.en,
					);
					store.setCell(
						"fonts",
						fontID,
						"fontSubfamily",
						currentFont.opentypeDefinition?.names?.fontSubfamily?.en,
					);
				});
			}
		});
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
							ids={fontFilesByGroup.get(fontFamily)}
							key={`${fontFamily}-${fontFilesByGroup.get(fontFamily)[0]}`}
						/>
					))}
			</div>
		</FontControlProvider>
	);
}

export default App;
