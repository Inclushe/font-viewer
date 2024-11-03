import * as React from "react";

export const FontStoreContext = React.createContext(null);

import { createStore } from "tinybase";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import { useCreateStore, useCreatePersister } from "tinybase/ui-react";

import opentype from "opentype.js";

export const SUPPORTED_FILE_TYPES = ["ttf", "otf", "woff", "woff2"];

function FontStoreProvider({ children }) {
	const store = useCreateStore(() => {
		return createStore().setTables({ fonts: null });
	});
	const [opentypeDefinitions, setOpentypeDefinitions] = React.useState({});

	async function createOpentypeDefinition(id, file) {
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
		setOpentypeDefinitions((prevState) => ({
			...prevState,
			[id]: font,
		}));
		return font;
	}

	useCreatePersister(
		store,
		(store) => {
			return createIndexedDbPersister(store, "fonts");
		},
		[],
		async (persister) => {
			await persister.startAutoLoad();
			await persister.startAutoSave();
		},
	);

	const value = React.useMemo(
		() => ({ store, opentypeDefinitions, createOpentypeDefinition }),
		[store, opentypeDefinitions],
	);

	return (
		<FontStoreContext.Provider value={value}>
			{children}
		</FontStoreContext.Provider>
	);
}

export default FontStoreProvider;
