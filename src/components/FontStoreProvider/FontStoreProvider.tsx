import * as React from "react";

import { createStore } from "tinybase";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import { useCreateStore, useCreatePersister } from "tinybase/ui-react";
import {
	createOpentypeObjectFromFile,
	installWOFF2Dependency,
	loadFileFromBase64,
} from "../../helpers/fileHelpers";

export const FontStoreContext = React.createContext(null);

import opentype from "opentype.js";

export const SUPPORTED_FILE_TYPES = ["ttf", "otf", "woff", "woff2"];

function FontStoreProvider({ children }) {
	const store = useCreateStore<Store>(() => {
		return createStore().setTables({ fonts: null });
	});
	const [opentypeDefinitions, setOpentypeDefinitions] = React.useState({});

	// Load WOFF2 dependency first and only once
	const WOFF2Dependency = React.useMemo(() => {
		return installWOFF2Dependency();
	}, []);

	async function createOpentypeDefinition(id) {
		const base64 = store.getCell("fonts", id, "fileBase64");
		const name = store.getCell("fonts", id, "name");
		const type = store.getCell("fonts", id, "fontType");
		const file = await loadFileFromBase64({ base64, name, type });
		return await createOpentypeDefinitionFromFile(file, id);
	}

	async function createOpentypeDefinitionFromFile(file: File, id: string) {
		const opentypeDefinition = await createOpentypeObjectFromFile(file);
		setOpentypeDefinitions((prevState) => ({
			...prevState,
			[id]: opentypeDefinition,
		}));
		return opentypeDefinition;
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
		() => ({
			store,
			opentypeDefinitions,
			createOpentypeDefinition,
			createOpentypeDefinitionFromFile,
		}),
		[store, opentypeDefinitions],
	);

	return (
		<FontStoreContext.Provider value={value}>
			{children}
		</FontStoreContext.Provider>
	);
}

export default FontStoreProvider;
