import * as React from "react";

export const FontControlContext = React.createContext(null);

function FontControlProvider({ children }) {
	const [sampleText, setSampleText] = React.useState("");

	return (
		<FontControlContext.Provider value={{ sampleText, setSampleText }}>
			{children}
		</FontControlContext.Provider>
	);
}

export default FontControlProvider;
