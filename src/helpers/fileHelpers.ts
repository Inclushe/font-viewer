import opentype from "opentype.js";

export const SUPPORTED_FILE_TYPES = ["ttf", "otf", "woff", "woff2"];

export async function findFilesInSystemDirectory(dir: FileSystemDirectoryHandle) {
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

export async function createFontObjectFromFile(file : File) {
	// If file type is not supported, skip
	const fileType = file.name.split(".").pop()?.toLocaleLowerCase();
	if (!SUPPORTED_FILE_TYPES.includes(fileType)) {
		return null;
	}
	let font = null;
	if (fileType === "woff2") {
		const fileBuffer = await file.arrayBuffer();
		font = opentype.parse(
			Uint8Array.from(Module.decompress(fileBuffer)).buffer,
		);
	} else {
		font = opentype.parse(await file.arrayBuffer());
	}
	return {
		file,
		name: file.name,
		opentype: font
	};
}

export async function requestFilesFromDropzone(files : File[]) {
	const currentFontFiles = [];
	for (const file of files) {
		const currentFontFileObject = await createFontObjectFromFile(file);
		if (currentFontFileObject === null) continue;
		currentFontFiles.push(currentFontFileObject);
	}
	return currentFontFiles;
}

// For browsers with the File System Access API
export async function requestDirectoryFS() {
	const directoryHandle = await window.showDirectoryPicker();
	const currentFontFileHandles =
		await findFilesInSystemDirectory(directoryHandle);
	const currentFontFiles = [];
	for (const fontFileHandle of currentFontFileHandles) {
		const currentFontFile = await fontFileHandle.getFile();
		const currentFontFileObject = await createFontObjectFromFile(currentFontFile);
		if (currentFontFileObject === null) continue;
		currentFontFiles.push(currentFontFileObject);
	}
	return currentFontFiles;
}
